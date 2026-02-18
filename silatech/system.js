const { cmd } = global;
const config = require('../config');
const { fkontak, getContextInfo, sleep } = require('../lib/functions');
const { exec } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');

// ============================================
// 📌 RESTART BOT COMMAND
// ============================================
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
                text: "🚫 *𝙾𝚗𝚕𝚢 𝚋𝚘𝚝 𝚘𝚠𝚗𝚎𝚛 𝚌𝚊𝚗 𝚛𝚎𝚜𝚝𝚊𝚛𝚝 𝚝𝚑𝚎 𝚋𝚘𝚝!*",
                contextInfo: getContextInfo({ sender: sender })
            }, { quoted: fkontak });
        }

        // Send restart message
        await conn.sendMessage(from, {
            image: { url: config.IMAGE_PATH },
            caption: `*╭━━━〔 🐢 𝚂𝙸𝚂𝚃𝙴𝙼 〕━━━┈⊷*
*┃🐢│*
*┃🐢│ 🔄 *𝚁𝙴𝚂𝚃𝙰𝚁𝚃𝙸𝙽𝙶 𝙱𝙾𝚃...*
*┃🐢│*
*┃🐢│ ⏱️ 𝚃𝚒𝚖𝚎: ${new Date().toLocaleString()}*
*┃🐢│*
*╰━━━━━━━━━━━━━━━┈⊷*

> ${config.BOT_FOOTER}`,
            contextInfo: getContextInfo({ sender: sender })
        }, { quoted: fkontak });

        await sleep(2000);

        // Restart using PM2 or node
        const pm2Name = process.env.PM2_NAME || 'SILA-MD';
        
        exec(`pm2 restart ${pm2Name}`, (error, stdout, stderr) => {
            if (error) {
                // If PM2 fails, try node
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
            text: `❌ *𝙴𝚛𝚛𝚘𝚛:* ${error.message}`,
            contextInfo: getContextInfo({ sender: sender })
        }, { quoted: fkontak });
    }
});

// ============================================
// 📌 UPDATE BOT COMMAND (From GitHub)
// ============================================
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
                text: "🚫 *𝙾𝚗𝚕𝚢 𝚋𝚘𝚝 𝚘𝚠𝚗𝚎𝚛 𝚌𝚊𝚗 𝚞𝚙𝚍𝚊𝚝𝚎 𝚝𝚑𝚎 𝚋𝚘𝚝!*",
                contextInfo: getContextInfo({ sender: sender })
            }, { quoted: fkontak });
        }

        const option = args[0]?.toLowerCase() || 'check';
        
        // Send update status
        const statusMsg = await conn.sendMessage(from, {
            text: `*╭━━━〔 🐢 𝚄𝙿𝙳𝙰𝚃𝙴 〕━━━┈⊷*
*┃🐢│*
*┃🐢│ 🔍 𝙲𝚑𝚎𝚌𝚔𝚒𝚗𝚐 𝚏𝚘𝚛 𝚞𝚙𝚍𝚊𝚝𝚎𝚜...*
*┃🐢│*
*╰━━━━━━━━━━━━━━━┈⊷*`,
            contextInfo: getContextInfo({ sender: sender })
        }, { quoted: fkontak });

        if (option === 'check' || option === 'status') {
            // Check current version and latest version
            try {
                const packageJson = require('../../package.json');
                const currentVersion = packageJson.version || config.version;
                
                // Try to get latest version from GitHub
                let latestVersion = currentVersion;
                let updateAvailable = false;
                let repoUrl = '';
                
                try {
                    // You can set your repo URL in config
                    const githubRepo = config.GITHUB_REPO || 'Sila-Md/HAPA';
                    repoUrl = `https://api.github.com/repos/${githubRepo}/releases/latest`;
                    
                    const response = await axios.get(repoUrl, {
                        timeout: 5000,
                        headers: { 'User-Agent': 'SILA-MD-BOT' }
                    });
                    
                    if (response.data && response.data.tag_name) {
                        latestVersion = response.data.tag_name.replace(/^v/, '');
                        updateAvailable = compareVersions(latestVersion, currentVersion) > 0;
                    }
                } catch (githubError) {
                    console.error('GitHub check error:', githubError.message);
                }

                const updateText = updateAvailable ? 
                    `🟢 *𝚄𝚙𝚍𝚊𝚝𝚎 𝙰𝚟𝚊𝚒𝚕𝚊𝚋𝚕𝚎!*` : 
                    `✅ *𝙱𝚘𝚝 𝚒𝚜 𝚞𝚙 𝚝𝚘 𝚍𝚊𝚝𝚎*`;

                await conn.sendMessage(from, {
                    text: `*╭━━━〔 🐢 𝚄𝙿𝙳𝙰𝚃𝙴 𝙸𝙽𝙵𝙾 〕━━━┈⊷*
*┃🐢│*
*┃🐢│ 📦 𝙲𝚞𝚛𝚛𝚎𝚗𝚝 𝚅𝚎𝚛𝚜𝚒𝚘𝚗: v${currentVersion}*
*┃🐢│ 🔖 𝙻𝚊𝚝𝚎𝚜𝚝 𝚅𝚎𝚛𝚜𝚒𝚘𝚗: v${latestVersion}*
*┃🐢│*
*┃🐢│ ${updateText}*
*┃🐢│*
*┃🐢│ 𝚃𝚘 𝚞𝚙𝚍𝚊𝚝𝚎, 𝚞𝚜𝚎:*
*┃🐢│ .𝚞𝚙𝚍𝚊𝚝𝚎 𝚗𝚘𝚠*
*┃🐢│*
*╰━━━━━━━━━━━━━━━┈⊷*

> ${config.BOT_FOOTER}`,
                    contextInfo: getContextInfo({ sender: sender })
                }, { quoted: fkontak });

            } catch (error) {
                console.error('Version check error:', error);
                await conn.sendMessage(from, {
                    text: `❌ *𝙵𝚊𝚒𝚕𝚎𝚍 𝚝𝚘 𝚌𝚑𝚎𝚌𝚔 𝚞𝚙𝚍𝚊𝚝𝚎𝚜:* ${error.message}`,
                    contextInfo: getContextInfo({ sender: sender })
                }, { quoted: fkontak });
            }
        }
        else if (option === 'now' || option === 'force') {
            // Perform actual update
            await conn.sendMessage(from, {
                text: `*╭━━━〔 🐢 𝚄𝙿𝙳𝙰𝚃𝙸𝙽𝙶 〕━━━┈⊷*
*┃🐢│*
*┃🐢│ 📥 𝙳𝚘𝚠𝚗𝚕𝚘𝚊𝚍𝚒𝚗𝚐 𝚞𝚙𝚍𝚊𝚝𝚎𝚜...*
*┃🐢│ 🔄 𝙿𝚕𝚎𝚊𝚜𝚎 𝚠𝚊𝚒𝚝*
*┃🐢│*
*╰━━━━━━━━━━━━━━━┈⊷*`,
                contextInfo: getContextInfo({ sender: sender })
            }, { quoted: fkontak });

            // Git pull command
            exec('git pull origin main', async (error, stdout, stderr) => {
                if (error) {
                    console.error('Git pull error:', error);
                    
                    // Try with different branch
                    exec('git pull origin master', async (err2, stdout2, stderr2) => {
                        if (err2) {
                            return await conn.sendMessage(from, {
                                text: `❌ *𝙶𝚒𝚝 𝚞𝚙𝚍𝚊𝚝𝚎 𝚏𝚊𝚒𝚕𝚎𝚍!*\n\n${error.message}`,
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
                text: `📌 *𝚄𝚜𝚊𝚐𝚎:*\n\n` +
                      `.𝚞𝚙𝚍𝚊𝚝𝚎 𝚌𝚑𝚎𝚌𝚔  - 𝙲𝚑𝚎𝚌𝚔 𝚏𝚘𝚛 𝚞𝚙𝚍𝚊𝚝𝚎𝚜\n` +
                      `.𝚞𝚙𝚍𝚊𝚝𝚎 𝚗𝚘𝚠    - 𝙿𝚎𝚛𝚏𝚘𝚛𝚖 𝚞𝚙𝚍𝚊𝚝𝚎\n` +
                      `.𝚞𝚙𝚍𝚊𝚝𝚎 𝚏𝚘𝚛𝚌𝚎  - 𝙵𝚘𝚛𝚌𝚎 𝚞𝚙𝚍𝚊𝚝𝚎`,
                contextInfo: getContextInfo({ sender: sender })
            }, { quoted: fkontak });
        }

    } catch (error) {
        console.error('Update command error:', error);
        await conn.sendMessage(from, {
            text: `❌ *𝙴𝚛𝚛𝚘𝚛:* ${error.message}`,
            contextInfo: getContextInfo({ sender: sender })
        }, { quoted: fkontak });
    }
});

// ============================================
// 📌 UPDATE NPM DEPENDENCIES
// ============================================
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
                text: "🚫 *𝙾𝚠𝚗𝚎𝚛-𝚘𝚗𝚕𝚢 𝚌𝚘𝚖𝚖𝚊𝚗𝚍!*",
                contextInfo: getContextInfo({ sender: sender })
            }, { quoted: fkontak });
        }

        await conn.sendMessage(from, {
            text: `*╭━━━〔 🐢 𝙽𝙿𝙼 𝚄𝙿𝙳𝙰𝚃𝙴 〕━━━┈⊷*
*┃🐢│*
*┃🐢│ 📦 𝙸𝚗𝚜𝚝𝚊𝚕𝚕𝚒𝚗𝚐 𝚍𝚎𝚙𝚎𝚗𝚍𝚎𝚗𝚌𝚒𝚎𝚜...*
*┃🐢│ ⏳ 𝚃𝚑𝚒𝚜 𝚖𝚊𝚢 𝚝𝚊𝚔𝚎 𝚊 𝚏𝚎𝚠 𝚖𝚒𝚗𝚞𝚝𝚎𝚜*
*┃🐢│*
*╰━━━━━━━━━━━━━━━┈⊷*`,
            contextInfo: getContextInfo({ sender: sender })
        }, { quoted: fkontak });

        exec('npm install', async (error, stdout, stderr) => {
            if (error) {
                return await conn.sendMessage(from, {
                    text: `❌ *𝙽𝙿𝙼 𝚒𝚗𝚜𝚝𝚊𝚕𝚕 𝚏𝚊𝚒𝚕𝚎𝚍!*\n\n${error.message}`,
                    contextInfo: getContextInfo({ sender: sender })
                }, { quoted: fkontak });
            }

            await conn.sendMessage(from, {
                text: `✅ *𝙳𝚎𝚙𝚎𝚗𝚍𝚎𝚗𝚌𝚒𝚎𝚜 𝚞𝚙𝚍𝚊𝚝𝚎𝚍 𝚜𝚞𝚌𝚌𝚎𝚜𝚜𝚏𝚞𝚕𝚕𝚢!*\n\n𝚁𝚎𝚜𝚝𝚊𝚛𝚝 𝚋𝚘𝚝 𝚝𝚘 𝚊𝚙𝚙𝚕𝚢 𝚌𝚑𝚊𝚗𝚐𝚎𝚜.\n\n> ${config.BOT_FOOTER}`,
                contextInfo: getContextInfo({ sender: sender })
            }, { quoted: fkontak });
        });

    } catch (error) {
        console.error('NPM update error:', error);
        await conn.sendMessage(from, {
            text: `❌ *𝙴𝚛𝚛𝚘𝚛:* ${error.message}`,
            contextInfo: getContextInfo({ sender: sender })
        }, { quoted: fkontak });
    }
});

// ============================================
// 📌 VIEW SYSTEM INFO
// ============================================
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
        
        const infoText = `*╭━━━〔 🐢 𝚂𝚈𝚂𝚃𝙴𝙼 𝙸𝙽𝙵𝙾 〕━━━┈⊷*
*┃🐢│*
*┃🐢│ 🤖 𝙱𝚘𝚝 𝙽𝚊𝚖𝚎: ${config.BOT_NAME}*
*┃🐢│ 📦 𝚅𝚎𝚛𝚜𝚒𝚘𝚗: v${packageJson.version || config.version}*
*┃🐢│*
*┃🐢│ ⏱️ 𝚄𝚙𝚝𝚒𝚖𝚎: ${hours}h ${minutes}m ${seconds}s*
*┃🐢│*
*┃🐢│ 💾 𝙼𝚎𝚖𝚘𝚛𝚢:*
*┃🐢│   𝚄𝚜𝚎𝚍: ${(memory.heapUsed / 1024 / 1024).toFixed(2)} MB*
*┃🐢│   𝚃𝚘𝚝𝚊𝚕: ${(memory.heapTotal / 1024 / 1024).toFixed(2)} MB*
*┃🐢│   𝚁𝚂𝚂: ${(memory.rss / 1024 / 1024).toFixed(2)} MB*
*┃🐢│*
*┃🐢│ 🖥️ 𝚂𝚢𝚜𝚝𝚎𝚖:*
*┃🐢│   𝙾𝚂: ${os.type()} ${os.release()}*
*┃🐢│   𝙲𝙿𝚄: ${cpuModel} (${cpuCores} 𝙲𝚘𝚛𝚎𝚜)*
*┃🐢│   𝚁𝙰𝙼: ${usedMem.toFixed(2)}GB / ${totalMem.toFixed(2)}GB*
*┃🐢│*
*┃🐢│ 🌐 𝙿𝚕𝚊𝚝𝚏𝚘𝚛𝚖: ${os.platform()}*
*┃🐢│ 🏠 𝙷𝚘𝚜𝚝𝚗𝚊𝚖𝚎: ${os.hostname()}*
*┃🐢│*
*╰━━━━━━━━━━━━━━━┈⊷*

> ${config.BOT_FOOTER}`;

        await conn.sendMessage(from, {
            image: { url: config.IMAGE_PATH },
            caption: infoText,
            contextInfo: getContextInfo({ sender: sender })
        }, { quoted: fkontak });

    } catch (error) {
        console.error('Sysinfo error:', error);
        await conn.sendMessage(from, {
            text: `❌ *𝙴𝚛𝚛𝚘𝚛:* ${error.message}`,
            contextInfo: getContextInfo({ sender: sender })
        }, { quoted: fkontak });
    }
});

// ============================================
// 📌 HELPER FUNCTIONS
// ============================================
async function handleSuccessfulUpdate(conn, from, sender, stdout) {
    const packageJson = require('../../package.json');
    
    await conn.sendMessage(from, {
        text: `*╭━━━〔 🐢 𝚄𝙿𝙳𝙰𝚃𝙴 𝚂𝚄𝙲𝙲𝙴𝚂𝚂 〕━━━┈⊷*
*┃🐢│*
*┃🐢│ ✅ 𝚄𝚙𝚍𝚊𝚝𝚎 𝚌𝚘𝚖𝚙𝚕𝚎𝚝𝚎𝚍!*
*┃🐢│ 📦 𝙽𝚎𝚠 𝚅𝚎𝚛𝚜𝚒𝚘𝚗: v${packageJson.version || '?'}*
*┃🐢│*
*┃🐢│ 🔄 𝚁𝚎𝚜𝚝𝚊𝚛𝚝𝚒𝚗𝚐 𝚋𝚘𝚝...*
*┃🐢│*
*╰━━━━━━━━━━━━━━━┈⊷*

> ${config.BOT_FOOTER}`,
        contextInfo: getContextInfo({ sender: sender })
    }, { quoted: fkontak });

    await sleep(3000);
    
    // Restart after update
    const pm2Name = process.env.PM2_NAME || 'SILA-MD';
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
