const fs = require('fs');
const path = require('path');

// Helper to find the settings file
function getSettingsPath() {
    // Priority 1: Persistent User Data (Sync'd from Electron)
    const userDataPath = process.env.USER_DATA_PATH;
    if (userDataPath) {
        const persistentPath = path.join(userDataPath, "settings.json");

        // If persistent version doesn't exist yet, try to migrate from legacy/resources
        if (!fs.existsSync(persistentPath)) {
            const legacyPath = getLegacySettingsPath();
            if (legacyPath) {
                try {
                    console.log(`[Config] Migrating settings from ${legacyPath} to ${persistentPath}`);
                    if (!fs.existsSync(userDataPath)) {
                        fs.mkdirSync(userDataPath, { recursive: true });
                    }
                    fs.copyFileSync(legacyPath, persistentPath);
                } catch (err) {
                    console.error("[Config] Migration failed:", err);
                }
            }
        }

        // If it exists now, return it
        if (fs.existsSync(persistentPath)) return persistentPath;
    }

    // Priority 2: Fallback to local/resources
    return getLegacySettingsPath();
}

function getLegacySettingsPath() {
    const appRoot = process.env.PORTABLE_EXECUTABLE_DIR || path.dirname(process.execPath);

    const possibleSettings = [
        path.join(appRoot, "settings.json"), // Next to .exe
        path.join(appRoot, "resources", "settings.json"), // In resources
        process.resourcesPath ? path.join(process.resourcesPath, "settings.json") : null,
        path.join(__dirname, "../../settings.json"), // Dev
        path.join(process.cwd(), "settings.json")
    ].filter(Boolean);

    for (const p of possibleSettings) {
        if (fs.existsSync(p)) return p;
    }
    return null;
}

let lastLoggedDataPath = null;

function loadSettings() {
    const settingsPath = getSettingsPath();
    if (!settingsPath) {
        return {};
    }

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

    // Default to internal data folder if no settings found
    let dataPath = path.join(__dirname, "../../data");

    if (settings.dataFolderPath && settingsPath) {
        // If path is absolute, use it. If relative, resolve relative to settings file.
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
