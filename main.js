const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

let mainWindow;
let backendProcess;

const isDev = !app.isPackaged;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        title: "AMS Solution",
        icon: path.join(__dirname, 'frontend/public/logo.svg'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    if (isDev) {
        mainWindow.loadURL('http://localhost:5173');
    } else {
        mainWindow.loadFile(path.join(__dirname, 'frontend/dist/index.html'));
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

function startBackend() {
    // Resolve paths
    const appRoot = isDev ? __dirname : path.dirname(app.getPath("exe"));
    const backendPath = isDev
        ? path.join(__dirname, 'backend')
        : path.join(__dirname, 'backend').replace('app.asar', 'app.asar.unpacked');

    const serverScript = path.join(backendPath, 'server.js');
    const settingsPath = path.join(appRoot, "settings.json");

    // Pass environment to backend
    const env = {
        ...process.env,
        SETTINGS_PATH: settingsPath,
        ELECTRON_RUN_AS_NODE: "1",
        PORT: 5000
    };

    console.log(`[Main] Launching backend: ${serverScript}`);
    console.log(`[Main] Settings path: ${settingsPath}`);

    try {
        backendProcess = spawn(process.execPath, [serverScript], {
            env,
            cwd: backendPath
        });

        backendProcess.stdout.on('data', (data) => console.log(`[Backend STDOUT]: ${data}`));
        backendProcess.stderr.on('data', (data) => console.error(`[Backend STDERR]: ${data}`));

        backendProcess.on('error', (err) => console.error(`[Backend Spawn Error]:`, err));
        backendProcess.on('close', (code) => console.log(`[Backend Exit] code: ${code}`));
    } catch (err) {
        console.error("[Main] Failed to spawn backend:", err);
    }
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
