const fs = require('fs');
const path = require('path');

// Helper to find the settings file
function getSettingsPath() {
    // Priority 1: Environment variable from Electron
    if (process.env.SETTINGS_PATH && fs.existsSync(process.env.SETTINGS_PATH)) {
        return process.env.SETTINGS_PATH;
    }

    // Priority 2: Next to EXE
    const appRoot = path.dirname(process.execPath);
    const exeSettings = path.join(appRoot, "settings.json");
    if (fs.existsSync(exeSettings)) return exeSettings;

    // Priority 3: Fallback to local/resources
    const possibleSettings = [
        path.join(appRoot, "resources", "settings.json"),
        process.resourcesPath ? path.join(process.resourcesPath, "settings.json") : null,
        path.join(__dirname, "../../../settings.json"),
        path.join(__dirname, "../../settings.json"),
        path.join(process.cwd(), "settings.json")
    ].filter(Boolean);

    for (const p of possibleSettings) {
        if (fs.existsSync(p)) return p;
    }
    return null;
}

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
    const appRoot = path.dirname(process.execPath);

    // Default to "data" folder in app root
    let dataPath = path.join(appRoot, "data");

    if (settings.dataFolderPath && settingsPath) {
        if (path.isAbsolute(settings.dataFolderPath)) {
            dataPath = settings.dataFolderPath;
        } else {
            dataPath = path.resolve(path.dirname(settingsPath), settings.dataFolderPath);
        }
    }

    // Ensure data directory exists
    if (!fs.existsSync(dataPath)) {
        try {
            fs.mkdirSync(dataPath, { recursive: true });
        } catch (err) {
            console.error(`[Config] Failed to create data dir: ${err}`);
        }
    }

    // Initialize default users if missing
    const usersPath = path.join(dataPath, 'users.json');
    if (!fs.existsSync(usersPath)) {
        const defaultUsers = [
            { user_id: 1, user_name: 'admin', password: '123', role: 'ADMIN', full_name: 'Administrator' },
            { user_id: 2, user_name: 'supervisor', password: '123', role: 'SUPERVISOR', full_name: 'Supervisor' },
            { user_id: 3, user_name: 'process', password: '123', role: 'PROCESS', full_name: 'Process Team' }
        ];
        try {
            fs.writeFileSync(usersPath, JSON.stringify(defaultUsers, null, 2));
            console.log(`[Config] Initialized default users at ${usersPath}`);
        } catch (err) {
            console.error(`[Config] Failed to initialize users: ${err}`);
        }
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
