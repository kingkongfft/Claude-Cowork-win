import * as chokidar from "chokidar";
import { statSync, readdirSync } from "fs";
import { join, relative } from "path";
import { BrowserWindow } from "electron";
import type { FileItem, FileEvent } from "../types.js";

// Ignored patterns
const IGNORED_PATTERNS = [
  "**/node_modules/**",
  "**/.git/**",
  "**/dist/**",
  "**/dist-electron/**",
  "**/dist-react/**",
  "**/.next/**",
  "**/build/**",
  "**/*.log",
  "**/*.tmp",
  "**/package-lock.json",
  "**/yarn.lock",
  "**/pnpm-lock.yaml",
];

// Max depth for watching
const MAX_DEPTH = 4;
// Max files to track
const MAX_FILES = 500;
// Debounce time for batch updates (ms)
const DEBOUNCE_MS = 300;

// Store watchers for each session
const watchers = new Map<string, chokidar.FSWatcher>();
// Store file lists for each session
const fileLists = new Map<string, Map<string, FileItem>>();
// Debounce timers
const debounceTimers = new Map<string, NodeJS.Timeout>();
// Pending events to batch
const pendingEvents = new Map<string, FileEvent[]>();

function getFileInfo(filePath: string, basePath: string): FileItem | null {
  try {
    const stats = statSync(filePath);
    return {
      path: filePath,
      relativePath: relative(basePath, filePath),
      name: filePath.split(/[/\\]/).pop() || "",
      isDir: stats.isDirectory(),
      size: stats.size,
      mtime: stats.mtimeMs,
    };
  } catch {
    return null;
  }
}

function scanDirectory(dirPath: string, depth: number = 0): FileItem[] {
  if (depth > MAX_DEPTH) return [];
  
  const items: FileItem[] = [];
  
  try {
    const entries = readdirSync(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      // Skip ignored patterns
      if (entry.name.startsWith(".") || entry.name === "node_modules") {
        continue;
      }
      
      const fullPath = join(dirPath, entry.name);
      const info = getFileInfo(fullPath, dirPath);
      
      if (info) {
        items.push(info);
        
        // Recurse into directories
        if (entry.isDirectory() && depth < MAX_DEPTH) {
          const subItems = scanDirectory(fullPath, depth + 1);
          items.push(...subItems.map(item => ({
            ...item,
            relativePath: join(entry.name, item.relativePath),
          })));
        }
      }
      
      if (items.length >= MAX_FILES) break;
    }
  } catch {
    // Directory might not exist or be inaccessible
  }
  
  return items;
}

function broadcast(sessionId: string, type: "file.list" | "file.updates", items: FileItem[], events?: FileEvent[]) {
  const windows = BrowserWindow.getAllWindows();
  const payload = JSON.stringify({
    type,
    payload: { sessionId, items, events },
  });
  
  for (const win of windows) {
    win.webContents.send("server-event", payload);
  }
}

function flushPendingEvents(sessionId: string) {
  const events = pendingEvents.get(sessionId) || [];
  const fileList = fileLists.get(sessionId);
  
  if (fileList && events.length > 0) {
    // Sort by mtime descending
    const items = Array.from(fileList.values())
      .sort((a, b) => b.mtime - a.mtime)
      .slice(0, MAX_FILES);
    
    broadcast(sessionId, "file.updates", items, events);
    pendingEvents.set(sessionId, []);
  }
}

function queueEvent(sessionId: string, event: FileEvent) {
  const events = pendingEvents.get(sessionId) || [];
  events.push(event);
  pendingEvents.set(sessionId, events);
  
  // Clear existing timer
  const existingTimer = debounceTimers.get(sessionId);
  if (existingTimer) {
    clearTimeout(existingTimer);
  }
  
  // Set new debounce timer
  const timer = setTimeout(() => {
    flushPendingEvents(sessionId);
    debounceTimers.delete(sessionId);
  }, DEBOUNCE_MS);
  
  debounceTimers.set(sessionId, timer);
}

export function startWatching(sessionId: string, cwd: string) {
  // Stop existing watcher if any
  stopWatching(sessionId);
  
  console.log(`[FileWatcher] Starting watch for session ${sessionId} at ${cwd}`);
  
  // Initialize file list with scan
  const initialItems = scanDirectory(cwd);
  const fileMap = new Map<string, FileItem>();
  
  for (const item of initialItems) {
    fileMap.set(item.path, item);
  }
  
  fileLists.set(sessionId, fileMap);
  pendingEvents.set(sessionId, []);
  
  // Send initial list (sorted by mtime)
  const sortedItems = initialItems.sort((a, b) => b.mtime - a.mtime).slice(0, MAX_FILES);
  broadcast(sessionId, "file.list", sortedItems);
  
  // Create watcher
  const watcher = chokidar.watch(cwd, {
    ignored: IGNORED_PATTERNS,
    persistent: true,
    ignoreInitial: true,
    depth: MAX_DEPTH,
    awaitWriteFinish: {
      stabilityThreshold: 200,
      pollInterval: 100,
    },
  });
  
  watcher.on("add", (path: string) => {
    const info = getFileInfo(path, cwd);
    if (info) {
      fileMap.set(path, info);
      queueEvent(sessionId, { type: "add", path: info.relativePath, item: info });
    }
  });
  
  watcher.on("change", (path: string) => {
    const info = getFileInfo(path, cwd);
    if (info) {
      fileMap.set(path, info);
      queueEvent(sessionId, { type: "change", path: info.relativePath, item: info });
    }
  });
  
  watcher.on("unlink", (path: string) => {
    const existing = fileMap.get(path);
    fileMap.delete(path);
    queueEvent(sessionId, { 
      type: "unlink", 
      path: existing?.relativePath || relative(cwd, path),
    });
  });
  
  watcher.on("addDir", (path: string) => {
    if (path === cwd) return;
    const info = getFileInfo(path, cwd);
    if (info) {
      fileMap.set(path, info);
      queueEvent(sessionId, { type: "addDir", path: info.relativePath, item: info });
    }
  });
  
  watcher.on("unlinkDir", (path: string) => {
    const existing = fileMap.get(path);
    fileMap.delete(path);
    queueEvent(sessionId, { 
      type: "unlinkDir", 
      path: existing?.relativePath || relative(cwd, path),
    });
  });
  
  watcher.on("error", (error: unknown) => {
    console.error(`[FileWatcher] Error for session ${sessionId}:`, error);
  });
  
  watchers.set(sessionId, watcher);
}

export function stopWatching(sessionId: string) {
  const watcher = watchers.get(sessionId);
  if (watcher) {
    console.log(`[FileWatcher] Stopping watch for session ${sessionId}`);
    watcher.close();
    watchers.delete(sessionId);
  }
  
  fileLists.delete(sessionId);
  pendingEvents.delete(sessionId);
  
  const timer = debounceTimers.get(sessionId);
  if (timer) {
    clearTimeout(timer);
    debounceTimers.delete(sessionId);
  }
}

export function stopAllWatchers() {
  for (const sessionId of watchers.keys()) {
    stopWatching(sessionId);
  }
}

export function refreshFileList(sessionId: string, cwd: string) {
  const items = scanDirectory(cwd);
  const sortedItems = items.sort((a, b) => b.mtime - a.mtime).slice(0, MAX_FILES);
  
  const fileMap = new Map<string, FileItem>();
  for (const item of items) {
    fileMap.set(item.path, item);
  }
  fileLists.set(sessionId, fileMap);
  
  broadcast(sessionId, "file.list", sortedItems);
}
