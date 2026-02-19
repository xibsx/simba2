const { cmd } = global;
const config = require('../config');
const { fkontak, getContextInfo, getTimestamp, formatBytes } = require('../lib/functions');
const os = require('os');

// Store main commands (without aliases)
const mainCommands = new Set();

// Register main commands (this will be populated when commands are loaded)
cmd({
    pattern: "menu",
    alias: ["help", "silamenu", "m"],
    desc: "Show all available commands",
    category: "general",
    react: "🐢",
    filename: __filename,
    mainCmd: true // Mark as main command
}, async (conn, mek, m, { from, sender, isOwner, prefix }) => {
    try {
        const totalCommands = global.commands.size;
        const uptime = process.uptime();
        const hours = Math.floor(uptime / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = Math.floor(uptime % 60);
        const memory = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
        
        // Group commands by category (using only main commands, not aliases)
        const categories = {};
        
        // Create a map of main commands (without aliases)
        const mainCmdMap = new Map();
        
        global.commands.forEach((cmd, name) => {
            // If this is the first time seeing this command's handler, store it
            // We identify commands by their handler function or filename
            const cmdKey = cmd.filename || cmd.handler.toString();
            
            if (!mainCmdMap.has(cmdKey)) {
                mainCmdMap.set(cmdKey, {
                    name: name,
                    category: cmd.category,
                    desc: cmd.desc
                });
            }
        });
        
        // Now organize by category using only main commands
        mainCmdMap.forEach((cmdInfo) => {
            if (!categories[cmdInfo.category]) {
                categories[cmdInfo.category] = [];
            }
            categories[cmdInfo.category].push(cmdInfo.name);
        });

        let menuText = `*╭━━━〔 🐢 ${config.BOT_NAME} 🐢 〕━━━┈⊷*\n`;
        menuText += `*┃🐢│ 𝚄𝚂𝙴𝚁: @${sender.split('@')[0]}*\n`;
        menuText += `*┃🐢│ 𝙿𝚁𝙴𝙵𝙸𝚇: ${prefix || config.PREFIX}*\n`;
        menuText += `*┃🐢│ 𝚄𝙿𝚃𝙸𝙼𝙴: ${hours}h ${minutes}m ${seconds}s*\n`;
        menuText += `*┃🐢│ 𝙼𝙴𝙼𝙾𝚁𝚈: ${memory}MB*\n`;
        menuText += `*┃🐢│ 𝙲𝙼𝙳𝚂: ${mainCmdMap.size}*\n`; // Show only main commands count
        menuText += `*╰━━━━━━━━━━━━━━━┈⊷*\n\n`;

        // Add categories
        for (const [category, cmds] of Object.entries(categories)) {
            menuText += `*╭━━━〔 🐢 ${category.toUpperCase()} 〕━━━┈⊷*\n`;
            cmds.sort().forEach(cmd => {
                menuText += `*┃🐢│ ❮✦❯ ${cmd}*\n`;
            });
            menuText += `*╰━━━━━━━━━━━━━━━┈⊷*\n\n`;
        }

        menuText += `> ${config.BOT_FOOTER}`;

        await conn.sendMessage(from, {
            image: { url: config.IMAGE_PATH },
            caption: menuText,
            contextInfo: getContextInfo({ sender: sender, mentionedJid: [sender] })
        }, { quoted: fkontak });
        
    } catch (error) {
        console.error('Menu command error:', error);
        await conn.sendMessage(from, {
            text: `❌ Error: ${error.message}`,
            contextInfo: getContextInfo({ sender: sender })
        }, { quoted: fkontak });
    }
});
