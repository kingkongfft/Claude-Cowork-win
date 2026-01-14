import { app, BrowserWindow, ipcMain, dialog } from "electron"
import { ipcMainHandle, isDev, DEV_PORT } from "./util.js";
import { getPreloadPath, getUIPath, getIconPath } from "./pathResolver.js";
import { getStaticData, pollResources } from "./test.js";
import { handleClientEvent, sessions } from "./ipc-handlers.js";
import { generateSessionTitle } from "./libs/util.js";
import type { ClientEvent } from "./types.js";
import "./libs/claude-settings.js";

console.log("Electron app starting...");
console.log("Environment:", process.env.NODE_ENV);

app.on("ready", () => {
    console.log("App ready event fired");
    const mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 900,
        minHeight: 600,
        webPreferences: {
            preload: getPreloadPath(),
        },
        icon: getIconPath(),
        titleBarStyle: "hiddenInset",
        backgroundColor: "#FAF9F6",
        trafficLightPosition: { x: 15, y: 18 }
    });

    if (isDev()) {
        mainWindow.loadURL(`http://localhost:${DEV_PORT}`);
    } else {
        mainWindow.loadFile(getUIPath());
    }

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
