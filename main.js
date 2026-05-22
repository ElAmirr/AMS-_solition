const { app, BrowserWindow, ipcMain } = require('electron');
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

    // In production, load the built index.html
    // In development, you might want to load localhost:5173
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

function startBackend() {
    const backendPath = path.join(__dirname, 'backend/server.js');

    // Set USER_DATA_PATH for the backend to find settings.json
    const userDataPath = app.getPath('userData');

    backendProcess = fork(backendPath, [], {
        env: {
            ...process.env,
            USER_DATA_PATH: userDataPath,
            PORT: 5000 // Ensure it matches frontend API calls
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
