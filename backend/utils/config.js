const fs = require('fs');
const path = require('path');

// Helper to find the settings file
function getSettingsPath() {
    // Priority 1: Next to EXE (Portable Mode)
    const portableDir = process.env.PORTABLE_EXECUTABLE_DIR;
    if (portableDir) {
        const portablePath = path.join(portableDir, "settings.json");
        if (fs.existsSync(portablePath)) return portablePath;
    }

    // Priority 2: Persistent User Data
    const userDataPath = process.env.USER_DATA_PATH;
    if (userDataPath) {
        const persistentPath = path.join(userDataPath, "settings.json");
        if (fs.existsSync(persistentPath)) return persistentPath;
    }

    // Priority 3: Fallback to local/resources
    const appRoot = process.env.PORTABLE_EXECUTABLE_DIR || path.dirname(process.execPath);
    const possibleSettings = [
        path.join(appRoot, "settings.json"),
        path.join(appRoot, "resources", "settings.json"),
        process.resourcesPath ? path.join(process.resourcesPath, "settings.json") : null,
        path.join(__dirname, "../../../settings.json"), // Multi-level up dev
        path.join(__dirname, "../../settings.json"),
        path.join(process.cwd(), "settings.json")
    ].filter(Boolean);
    ...
}

let lastLoggedDataPath = null;

function loadSettings() {
    const settingsPath = getSettingsPath();
    if (!settingsPath) return {};

    try {
        const content = fs.readFileSync(settingsPath, "utf-8");
        return JSON.parse(content);
    } catch (err) {
        console.error("[Config] Error reading settings.json:", err);
        return {};
    }
}

// Function to resolve data directory
function getDataDir() {
    const settings = loadSettings();
    const settingsPath = getSettingsPath();
    const appRoot = process.env.PORTABLE_EXECUTABLE_DIR || path.dirname(process.execPath);

    // Default to "data" folder in the app root
    let dataPath = path.join(appRoot, "data");

    if (settings.dataFolderPath && settingsPath) {
        if (path.isAbsolute(settings.dataFolderPath)) {
            dataPath = settings.dataFolderPath;
        } else {
            dataPath = path.resolve(path.dirname(settingsPath), settings.dataFolderPath);
        }
    }

    if (dataPath !== lastLoggedDataPath) {
        console.log(`[Config] Data Path active: ${dataPath}`);
        lastLoggedDataPath = dataPath;
    }

    // Ensure data directory exists
    if (!fs.existsSync(dataPath)) {
        fs.mkdirSync(dataPath, { recursive: true });
    }

    // Initialize default users if users.json is missing or empty
    const usersPath = path.join(dataPath, 'users.json');
    if (!fs.existsSync(usersPath)) {
        const defaultUsers = [
            { user_id: 1, user_name: 'admin', password: '123', role: 'ADMIN', full_name: 'Administrator' },
            { user_id: 2, user_name: 'supervisor', password: '123', role: 'SUPERVISOR', full_name: 'Supervisor' },
            { user_id: 3, user_name: 'process', password: '123', role: 'PROCESS', full_name: 'Process Team' },
            { user_id: 4, user_name: 'manager', password: '123', role: 'MANAGER', full_name: 'Plant Manager' }
        ];
        fs.writeFileSync(usersPath, JSON.stringify(defaultUsers, null, 2));
        console.log(`[Config] Initialized default users at ${usersPath}`);
    }

    return dataPath;
}

function getMachineName() {
    const settings = loadSettings();
    return settings.machineName || "";
}

module.exports = {
    getDataDir,
    getMachineName,
    loadSettings
};
