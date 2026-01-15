import { useAppStore } from "../store/useAppStore";
import { useMemo } from "react";
import type { FileItem, FileEvent } from "../types";

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function formatTime(mtime: number): string {
  const now = Date.now();
  const diff = now - mtime;
  
  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)} min ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} hr ago`;
  
  const date = new Date(mtime);
  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
}

function getEventBadge(events: FileEvent[], path: string): string | null {
  const event = events.find(e => e.path === path);
  if (!event) return null;
  
  switch (event.type) {
    case "add":
    case "addDir":
      return "added";
    case "change":
      return "modified";
    case "unlink":
    case "unlinkDir":
      return "deleted";
    default:
      return null;
  }
}

function getFileIcon(item: FileItem): string {
  if (item.isDir) return "📁";
  
  const ext = item.name.split(".").pop()?.toLowerCase() || "";
  
  const iconMap: Record<string, string> = {
    ts: "📘",
    tsx: "⚛️",
    js: "📒",
    jsx: "⚛️",
    json: "📋",
    md: "📝",
    css: "🎨",
    html: "🌐",
    py: "🐍",
    go: "🐹",
    rs: "🦀",
    java: "☕",
    c: "©️",
    cpp: "➕",
    h: "📄",
    sh: "🖥️",
    bat: "🖥️",
    ps1: "🖥️",
    yml: "⚙️",
    yaml: "⚙️",
    toml: "⚙️",
    lock: "🔒",
    png: "🖼️",
    jpg: "🖼️",
    jpeg: "🖼️",
    gif: "🖼️",
    svg: "🖼️",
    ico: "🖼️",
    txt: "📄",
    log: "📜",
  };
  
  return iconMap[ext] || "📄";
}

const EMPTY_ARRAY: FileItem[] = [];
const EMPTY_EVENTS: FileEvent[] = [];

async function handleOpenFile(path: string) {
  const error = await window.electron.openPath(path);
  if (error) {
    console.error("Failed to open file:", error);
  }
}

export function FilePanel() {
  const activeSessionId = useAppStore((s) => s.activeSessionId);
  const fileItemsMap = useAppStore((s) => s.fileItems);
  const recentEventsMap = useAppStore((s) => s.recentFileEvents);
  const sessions = useAppStore((s) => s.sessions);
  
  const fileItems = useMemo(() => 
    activeSessionId ? fileItemsMap[activeSessionId] || EMPTY_ARRAY : EMPTY_ARRAY,
    [activeSessionId, fileItemsMap]
  );
  
  const recentEvents = useMemo(() => 
    activeSessionId ? recentEventsMap[activeSessionId] || EMPTY_EVENTS : EMPTY_EVENTS,
    [activeSessionId, recentEventsMap]
  );
  
  const session = activeSessionId ? sessions[activeSessionId] : null;

  if (!activeSessionId || !session) {
    return (
      <div className="flex h-full items-center justify-center text-muted text-sm">
        <p>Select a session to view files</p>
      </div>
    );
  }

  if (fileItems.length === 0) {
    return (
      <div className="flex h-full flex-col">
        <div className="border-b border-ink-900/10 px-3 py-2">
          <h3 className="text-sm font-medium text-ink-700">File Explorer</h3>
          <p className="text-xs text-muted truncate" title={session.cwd}>{session.cwd || "No working directory"}</p>
        </div>
        <div className="flex flex-1 items-center justify-center text-muted text-sm">
          <p>No files</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-ink-900/10 px-3 py-2">
        <h3 className="text-sm font-medium text-ink-700">File Explorer</h3>
        <p className="text-xs text-muted truncate" title={session.cwd}>{session.cwd || "No working directory"}</p>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <ul className="divide-y divide-ink-900/5">
          {fileItems.map((item) => {
            const badge = getEventBadge(recentEvents, item.relativePath);
            const isRecent = !!badge;
            
            return (
              <li
                key={item.path}
                className={`px-3 py-2 hover:bg-surface-secondary transition-colors cursor-pointer ${
                  isRecent ? "bg-accent/5" : ""
                }`}
                title={item.relativePath}
                onClick={() => handleOpenFile(item.path)}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base flex-shrink-0">{getFileIcon(item)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-ink-800 truncate">{item.name}</span>
                      {badge && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                          badge === "added" ? "bg-green-100 text-green-700" :
                          badge === "modified" ? "bg-amber-100 text-amber-700" :
                          "bg-red-100 text-red-700"
                        }`}>
                          {badge}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-muted">
                      <span className="truncate">{item.relativePath}</span>
                      {!item.isDir && <span>·</span>}
                      {!item.isDir && <span className="flex-shrink-0">{formatFileSize(item.size)}</span>}
                    </div>
                  </div>
                  <span className="text-[11px] text-muted flex-shrink-0">{formatTime(item.mtime)}</span>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
      
      <div className="border-t border-ink-900/10 px-3 py-1.5">
        <p className="text-[11px] text-muted">{fileItems.length} files</p>
      </div>
    </div>
  );
}
