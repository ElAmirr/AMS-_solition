const fs = require('fs');
const path = require('path');
const { getDataDir } = require('./config');

function getLockPath() {
    return path.join(getDataDir(), "file.lock");
}

async function acquireLock(maxRetries = 100, retryWait = 100) {
    const lockPath = getLockPath();
    const STALE_TIMEOUT = 30 * 1000; // 30 seconds
    let retries = 0;

    while (retries < maxRetries) {
        try {
            if (!fs.existsSync(getDataDir())) {
                fs.mkdirSync(getDataDir(), { recursive: true });
            }
            // mkdir is atomic
            fs.mkdirSync(lockPath);
            return true;
        } catch (err) {
            if (err.code === "EEXIST") {
                try {
                    const stats = fs.statSync(lockPath);
                    const age = Date.now() - stats.mtimeMs;

                    if (age > STALE_TIMEOUT) {
                        console.warn(`[Lock] detected stale lock (age: ${Math.round(age / 1000)}s). Forcing release.`);
                        fs.rmdirSync(lockPath);
                        continue;
                    }
                } catch (statErr) {
                    // ignore stat errors
                }

                retries++;
                await new Promise(resolve => setTimeout(resolve, retryWait));
            } else {
                throw err;
            }
        }
    }
    throw new Error("Could not acquire file lock: Timeout");
}

function releaseLock() {
    const lockPath = getLockPath();
    try {
        if (fs.existsSync(lockPath)) {
            fs.rmdirSync(lockPath);
        }
    } catch (err) {
        console.error("Error releasing lock:", err);
    }
}

module.exports = {
    acquireLock,
    releaseLock
};
