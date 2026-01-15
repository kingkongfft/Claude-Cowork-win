import { app, BrowserWindow, ipcMain, dialog, shell } from "electron"
import { ipcMainHandle, isDev, DEV_PORT } from "./util.js";
import { getPreloadPath, getUIPath, getIconPath } from "./pathResolver.js";
import { getStaticData, pollResources } from "./test.js";
import { handleClientEvent, sessions } from "./ipc-handlers.js";
import { generateSessionTitle } from "./libs/util.js";
import type { ClientEvent } from "./types.js";
import "./libs/claude-settings.js";

console.log("Electron app starting...");
console.log("Environment:", process.env.NODE_ENV);

// Catch uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

app.on('window-all-closed', () => {
    console.log('All windows closed');
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('before-quit', () => {
    console.log('App is about to quit');
});

app.on("ready", () => {
    console.log("App ready event fired");
    const isMac = process.platform === "darwin";
    const mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 900,
        minHeight: 600,
        show: true,
        webPreferences: {
            preload: getPreloadPath(),
        },
        icon: getIconPath(),
        backgroundColor: "#FAF9F6",
        ...(isMac ? {
            titleBarStyle: "hiddenInset",
            trafficLightPosition: { x: 15, y: 18 }
        } : {})
    });

    // Force window to show and focus
    mainWindow.once('ready-to-show', () => {
        console.log("Window ready-to-show event fired");
        mainWindow.show();
        mainWindow.focus();
    });

    if (isDev()) {
        mainWindow.loadURL(`http://localhost:${DEV_PORT}`);
    } else {
        mainWindow.loadFile(getUIPath());
    }

    // Log any load errors
    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
        console.error(`Failed to load: ${errorCode} - ${errorDescription}`);
    });

    // Log renderer console messages to main process
    mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
        const levelStr = ['verbose', 'info', 'warning', 'error'][level] || 'log';
        console.log(`[Renderer ${levelStr}] ${message}`);
    });

    console.log("Main window created and loading UI");
    pollResources(mainWindow);

    ipcMainHandle("getStaticData", () => {
        return getStaticData();
    });

    // Handle client events
    ipcMain.on("client-event", (_, event: ClientEvent) => {
        handleClientEvent(event);
    });

    // Handle session title generation
    ipcMainHandle("generate-session-title", async (_: any, userInput: string | null) => {
        return await generateSessionTitle(userInput);
    });

    // Handle recent cwds request
    ipcMainHandle("get-recent-cwds", (_: any, limit?: number) => {
        const boundedLimit = limit ? Math.min(Math.max(limit, 1), 20) : 8;
        return sessions.listRecentCwds(boundedLimit);
    });

    // Handle opening files/folders in system explorer
    ipcMainHandle("open-path", async (_: any, filePath: string) => {
        try {
            const result = await shell.openPath(filePath);
            return result === "" ? null : result; // empty string means success
        } catch (error) {
            console.error("Error opening path:", error);
            return String(error);
        }
    });

    // Handle directory selection
    ipcMainHandle("select-directory", async () => {
        console.log("select-directory IPC handler called");
        try {
            const focusedWindow = BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0];
            console.log("Focused window:", focusedWindow ? "found" : "not found");
            console.log("All windows count:", BrowserWindow.getAllWindows().length);
            
            if (!focusedWindow) {
                console.error("No window available for dialog");
                return null;
            }
            
            console.log("Opening dialog...");
            const result = await dialog.showOpenDialog(focusedWindow, {
                properties: ['openDirectory']
            });
            
            console.log("Dialog result:", result);
            
            if (result.canceled) {
                return null;
            }
            
            return result.filePaths[0];
        } catch (error) {
            console.error("Error in select-directory:", error);
            return null;
        }
    });
})
