const { cmd } = global;
const config = require('../config');
const { fkontak, getContextInfo, sleep } = require('../lib/functions');
const { exec } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');

cmd({
    pattern: "restart",
    alias: ["reboot", "res"],
    desc: "Restart the bot",
    category: "owner",
    react: "🔄",
    filename: __filename
}, async (conn, mek, m, { from, sender, isOwner }) => {
    try {
        if (!isOwner) {
            return await conn.sendMessage(from, {
                text: "🚫 Owner-only command!",
                contextInfo: getContextInfo({ sender: sender })
            }, { quoted: fkontak });
        }

        await conn.sendMessage(from, {
            image: { url: config.IMAGE_PATH },
            caption: `┏╾─────────── RESTARTING ───────────╼
╿
├⟐ Restarting bot...
├⟐ Time: ${new Date().toLocaleString()}
╽
┗╾───────────

> ${config.BOT_FOOTER}`,
            contextInfo: getContextInfo({ sender: sender })
        }, { quoted: fkontak });

        await sleep(2000);

        const pm2Name = process.env.PM2_NAME || 'bot';
        
        exec(`pm2 restart ${pm2Name}`, (error, stdout, stderr) => {
            if (error) {
                exec('pm2 restart all', (err2) => {
                    if (err2) {
                        console.error('Failed to restart:', err2);
                        process.exit(1);
                    }
                });
            }
        });

    } catch (error) {
        console.error('Restart command error:', error);
        await conn.sendMessage(from, {
            text: `❌ Error: ${error.message}`,
            contextInfo: getContextInfo({ sender: sender })
        }, { quoted: fkontak });
    }
});

cmd({
    pattern: "update",
    alias: ["gitpull", "upgrade"],
    desc: "Update bot from GitHub repository",
    category: "owner",
    react: "📦",
    filename: __filename
}, async (conn, mek, m, { from, sender, args, isOwner }) => {
    try {
        if (!isOwner) {
            return await conn.sendMessage(from, {
                text: "🚫 Owner-only command!",
                contextInfo: getContextInfo({ sender: sender })
            }, { quoted: fkontak });
        }

        const option = args[0]?.toLowerCase() || 'check';
        
        const statusMsg = await conn.sendMessage(from, {
            text: `┏╾─────────── UPDATE ───────────╼
╿
├⟐ Checking for updates...
╽
┗╾───────────`,
            contextInfo: getContextInfo({ sender: sender })
        }, { quoted: fkontak });

        if (option === 'check' || option === 'status') {
            try {
                const packageJson = require('../../package.json');
                const currentVersion = packageJson.version || config.version;
                
                let latestVersion = currentVersion;
                let updateAvailable = false;
                let repoUrl = '';
                
                try {
                    const githubRepo = config.GITHUB_REPO || 'username/repo';
                    repoUrl = `https://api.github.com/repos/${githubRepo}/releases/latest`;
                    
                    const response = await axios.get(repoUrl, {
                        timeout: 5000,
                        headers: { 'User-Agent': 'BOT' }
                    });
                    
                    if (response.data && response.data.tag_name) {
                        latestVersion = response.data.tag_name.replace(/^v/, '');
                        updateAvailable = compareVersions(latestVersion, currentVersion) > 0;
                    }
                } catch (githubError) {
                    console.error('GitHub check error:', githubError.message);
                }

                const updateText = updateAvailable ? 
                    `🟢 Update available!` : 
                    `✅ Bot is up to date`;

                await conn.sendMessage(from, {
                    text: `┏╾─────────── UPDATE INFO ───────────╼
╿
├⟐ Current version: v${currentVersion}
├⟐ Latest version: v${latestVersion}
╿
├⟐ ${updateText}
╿
├⟐ To update, use:
├⟐ .update now
╽
┗╾───────────

> ${config.BOT_FOOTER}`,
                    contextInfo: getContextInfo({ sender: sender })
                }, { quoted: fkontak });

            } catch (error) {
                console.error('Version check error:', error);
                await conn.sendMessage(from, {
                    text: `❌ Failed to check updates: ${error.message}`,
                    contextInfo: getContextInfo({ sender: sender })
                }, { quoted: fkontak });
            }
        }
        else if (option === 'now' || option === 'force') {
            await conn.sendMessage(from, {
                text: `┏╾─────────── UPDATING ───────────╼
╿
├⟐ Downloading updates...
├⟐ Please wait
╽
┗╾───────────`,
                contextInfo: getContextInfo({ sender: sender })
            }, { quoted: fkontak });

            exec('git pull origin main', async (error, stdout, stderr) => {
                if (error) {
                    exec('git pull origin master', async (err2, stdout2, stderr2) => {
                        if (err2) {
                            return await conn.sendMessage(from, {
                                text: `❌ Git pull failed!\n\n${error.message}`,
                                contextInfo: getContextInfo({ sender: sender })
                            }, { quoted: fkontak });
                        }
                        
                        await handleSuccessfulUpdate(conn, from, sender, stdout2);
                    });
                } else {
                    await handleSuccessfulUpdate(conn, from, sender, stdout);
                }
            });
        }
        else {
            await conn.sendMessage(from, {
                text: `📌 Usage:\n\n` +
                      `.update check  - Check for updates\n` +
                      `.update now    - Perform update`,
                contextInfo: getContextInfo({ sender: sender })
            }, { quoted: fkontak });
        }

    } catch (error) {
        console.error('Update command error:', error);
        await conn.sendMessage(from, {
            text: `❌ Error: ${error.message}`,
            contextInfo: getContextInfo({ sender: sender })
        }, { quoted: fkontak });
    }
});

cmd({
    pattern: "npmupdate",
    alias: ["npmi", "installdeps"],
    desc: "Update npm dependencies",
    category: "owner",
    react: "📦",
    filename: __filename
}, async (conn, mek, m, { from, sender, isOwner }) => {
    try {
        if (!isOwner) {
            return await conn.sendMessage(from, {
                text: "🚫 Owner-only command!",
                contextInfo: getContextInfo({ sender: sender })
            }, { quoted: fkontak });
        }

        await conn.sendMessage(from, {
            text: `┏╾─────────── NPM UPDATE ───────────╼
╿
├⟐ Installing dependencies...
├⟐ This may take a few minutes
╽
┗╾───────────`,
            contextInfo: getContextInfo({ sender: sender })
        }, { quoted: fkontak });

        exec('npm install', async (error, stdout, stderr) => {
            if (error) {
                return await conn.sendMessage(from, {
                    text: `❌ NPM install failed!\n\n${error.message}`,
                    contextInfo: getContextInfo({ sender: sender })
                }, { quoted: fkontak });
            }

            await conn.sendMessage(from, {
                text: `✅ Dependencies installed successfully!\n\nRestart bot to apply changes.\n\n> ${config.BOT_FOOTER}`,
                contextInfo: getContextInfo({ sender: sender })
            }, { quoted: fkontak });
        });

    } catch (error) {
        console.error('NPM update error:', error);
        await conn.sendMessage(from, {
            text: `❌ Error: ${error.message}`,
            contextInfo: getContextInfo({ sender: sender })
        }, { quoted: fkontak });
    }
});

cmd({
    pattern: "sysinfo",
    alias: ["system", "stats"],
    desc: "View system information",
    category: "owner",
    react: "📊",
    filename: __filename
}, async (conn, mek, m, { from, sender, isOwner }) => {
    try {
        const os = require('os');
        
        const uptime = process.uptime();
        const hours = Math.floor(uptime / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = Math.floor(uptime % 60);
        
        const memory = process.memoryUsage();
        const totalMem = os.totalmem() / 1024 / 1024 / 1024;
        const freeMem = os.freemem() / 1024 / 1024 / 1024;
        const usedMem = totalMem - freeMem;
        
        const cpuInfo = os.cpus();
        const cpuModel = cpuInfo[0]?.model || 'Unknown';
        const cpuCores = cpuInfo.length;
        
        const packageJson = require('../../package.json');
        
        const infoText = `┏╾─────────── SYSTEM INFO ───────────╼
╿
├⟐ Bot Name: ${config.BOT_NAME}
├⟐ Version: v${packageJson.version || config.version}
╿
├⟐ Uptime: ${hours}h ${minutes}m ${seconds}s
╿
├⟐ Memory Usage:
├⟐   Heap Used: ${(memory.heapUsed / 1024 / 1024).toFixed(2)} MB
├⟐   Heap Total: ${(memory.heapTotal / 1024 / 1024).toFixed(2)} MB
├⟐   RSS: ${(memory.rss / 1024 / 1024).toFixed(2)} MB
╿
├⟐ System:
├⟐   OS: ${os.type()} ${os.release()}
├⟐   CPU: ${cpuModel} (${cpuCores} cores)
├⟐   RAM: ${usedMem.toFixed(2)}GB / ${totalMem.toFixed(2)}GB
╿
├⟐ Platform: ${os.platform()}
├⟐ Hostname: ${os.hostname()}
╽
┗╾───────────

> ${config.BOT_FOOTER}`;

        await conn.sendMessage(from, {
            image: { url: config.IMAGE_PATH },
            caption: infoText,
            contextInfo: getContextInfo({ sender: sender })
        }, { quoted: fkontak });

    } catch (error) {
        console.error('Sysinfo error:', error);
        await conn.sendMessage(from, {
            text: `❌ Error: ${error.message}`,
            contextInfo: getContextInfo({ sender: sender })
        }, { quoted: fkontak });
    }
});

async function handleSuccessfulUpdate(conn, from, sender, stdout) {
    const packageJson = require('../../package.json');
    
    await conn.sendMessage(from, {
        text: `┏╾─────────── UPDATE SUCCESS ───────────╼
╿
├⟐ Update completed!
├⟐ New version: v${packageJson.version || '?'}
╿
├⟐ Restarting bot...
╽
┗╾───────────

> ${config.BOT_FOOTER}`,
        contextInfo: getContextInfo({ sender: sender })
    }, { quoted: fkontak });

    await sleep(3000);
    
    const pm2Name = process.env.PM2_NAME || 'bot';
    exec(`pm2 restart ${pm2Name}`, (err) => {
        if (err) process.exit(1);
    });
}

function compareVersions(v1, v2) {
    const v1parts = v1.split('.').map(Number);
    const v2parts = v2.split('.').map(Number);
    
    for (let i = 0; i < Math.max(v1parts.length, v2parts.length); i++) {
        const v1part = v1parts[i] || 0;
        const v2part = v2parts[i] || 0;
        
        if (v1part > v2part) return 1;
        if (v1part < v2part) return -1;
    }
    
    return 0;
}