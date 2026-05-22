const { app, BrowserWindow } = require('electron');
const path = require('path');
const { fork } = require('child_process');
const fs = require('fs');

let mainWindow;
let backendProcess;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        title: "AMS Solution",
        icon: path.join(__dirname, 'frontend/public/logo.svg'),
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    const isDev = !app.isPackaged;

    if (isDev) {
        mainWindow.loadURL('http://localhost:5173');
    } else {
        mainWindow.loadFile(path.join(__dirname, 'frontend/dist/index.html'));
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

function ensureSettingsAndData() {
    // Determine portable directory (where .exe is)
    const appDir = process.env.PORTABLE_EXECUTABLE_DIR || path.dirname(process.execPath);
    const settingsPath = path.join(appDir, "settings.json");

    if (!fs.existsSync(settingsPath)) {
        // Copy default from resources if bundled
        const defaultSettingsPath = path.join(process.resourcesPath || __dirname, "settings.json");
        if (fs.existsSync(defaultSettingsPath)) {
            try {
                fs.copyFileSync(defaultSettingsPath, settingsPath);
                console.log(`[Main] Created default settings.json at ${settingsPath}`);
            } catch (err) {
                console.error("[Main] Failed to copy default settings:", err);
            }
        } else {
            // Create a minimal default
            const defaultSettings = {
                dataFolderPath: "./data",
                machineName: "AMS-STATION-01"
            };
            fs.writeFileSync(settingsPath, JSON.stringify(defaultSettings, null, 2));
            console.log(`[Main] Created fresh settings.json at ${settingsPath}`);
        }
    }

    return appDir;
}

function startBackend() {
    const appDir = ensureSettingsAndData();
    const backendPath = path.join(__dirname, 'backend/server.js');

    backendProcess = fork(backendPath, [], {
        env: {
            ...process.env,
            PORTABLE_EXECUTABLE_DIR: appDir,
            PORT: 5000
        }
    });

    backendProcess.on('message', (msg) => {
        console.log('Backend message:', msg);
    });
}

app.on('ready', () => {
    startBackend();
    createWindow();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('quit', () => {
    if (backendProcess) {
        backendProcess.kill();
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});
