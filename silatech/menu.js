const { cmd } = global;
const config = require('../config');
const { fkontak, getContextInfo, getTimestamp, formatBytes } = require('../lib/functions');
const os = require('os');

cmd({
    pattern: "menu",
    alias: ["help", "silamenu", "m"],
    desc: "Show all available commands",
    category: "general",
    react: "🤖",
    filename: __filename
}, async (conn, mek, m, { from, sender, isOwner, prefix }) => {
    try {
        const totalCommands = global.commands ? global.commands.size : 0;
        const uptime = process.uptime();
        const hours = Math.floor(uptime / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = Math.floor(uptime % 60);
        const memory = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
        
        // Group commands by category
        const categories = {};
        const commandNames = new Set(); // To track unique patterns
        
        // Collect all commands by their pattern (not alias)
        if (global.commands) {
            global.commands.forEach((cmd, name) => {
                // Only show the main pattern, not aliases
                if (!cmd) return;
                
                const category = cmd.category || 'general';
                if (!categories[category]) categories[category] = [];
                
                // Check if this command's pattern is already in the list
                const patternExists = categories[category].some(c => c.pattern === cmd.pattern);
                const nameExists = commandNames.has(cmd.pattern);
                
                if (!patternExists && !nameExists && cmd.pattern) {
                    commandNames.add(cmd.pattern);
                    categories[category].push({
                        pattern: cmd.pattern,
                        react: cmd.react || '✅',
                        desc: cmd.desc || ''
                    });
                }
            });
        }

        let menuText = `*╭━━━〔 🐢 ${config.BOT_NAME || '𝚂𝙸𝙻𝙰-𝙼𝙳'} 🐢 〕━━━┈⊷*\n`;
        menuText += `*┃🐢│ 𝚄𝚂𝙴𝚁: @${sender ? sender.split('@')[0] : 'Unknown'}*\n`;
        menuText += `*┃🐢│ 𝙿𝚁𝙴𝙵𝙸𝚇: ${prefix || config.PREFIX || '.'}*\n`;
        menuText += `*┃🐢│ 𝚄𝙿𝚃𝙸𝙼𝙴: ${hours}h ${minutes}m ${seconds}s*\n`;
        menuText += `*┃🐢│ 𝙼𝙴𝙼𝙾𝚁𝚈: ${memory}MB*\n`;
        menuText += `*┃🐢│ 𝙲𝙼𝙳𝚂: ${totalCommands}*\n`;
        menuText += `*╰━━━━━━━━━━━━━━━┈⊷*\n\n`;

        // Define category order
        const categoryOrder = ['general', 'group', 'owner', 'downloader', 'fun', 'ai', 'media'];
        
        // Add categories in order
        for (const cat of categoryOrder) {
            if (categories[cat] && categories[cat].length > 0) {
                menuText += `*╭━━━〔 🐢 ${cat.toUpperCase()} 〕━━━┈⊷*\n`;
                
                // Sort commands alphabetically (with safety check)
                if (categories[cat].length > 0) {
                    categories[cat].sort((a, b) => {
                        if (!a || !a.pattern) return 1;
                        if (!b || !b.pattern) return -1;
                        return a.pattern.localeCompare(b.pattern);
                    });
                    
                    categories[cat].forEach(cmd => {
                        if (cmd && cmd.pattern) {
                            menuText += `*┃🐢│ ${cmd.react || '✅'} ${cmd.pattern}*\n`;
                        }
                    });
                }
                menuText += `*╰━━━━━━━━━━━━━━━┈⊷*\n\n`;
            }
        }

        // Add any remaining categories not in order
        for (const [cat, cmds] of Object.entries(categories)) {
            if (!categoryOrder.includes(cat) && cmds && cmds.length > 0) {
                menuText += `*╭━━━〔 🐢 ${cat.toUpperCase()} 〕━━━┈⊷*\n`;
                
                // Sort commands alphabetically (with safety check)
                if (cmds.length > 0) {
                    cmds.sort((a, b) => {
                        if (!a || !a.pattern) return 1;
                        if (!b || !b.pattern) return -1;
                        return a.pattern.localeCompare(b.pattern);
                    });
                    
                    cmds.forEach(cmd => {
                        if (cmd && cmd.pattern) {
                            menuText += `*┃🐢│ ${cmd.react || '✅'} ${cmd.pattern}*\n`;
                        }
                    });
                }
                menuText += `*╰━━━━━━━━━━━━━━━┈⊷*\n\n`;
            }
        }

        menuText += `> ${config.BOT_FOOTER || '© 𝙿𝙾𝚆𝙴𝚁𝙳 𝙱𝚈🐢𝚂𝙸𝙻𝙰-𝙼𝙳'}`;

        await conn.sendMessage(from, {
            image: { url: config.IMAGE_PATH || 'https://files.catbox.moe/jwmx1j.jpg' },
            caption: menuText,
            contextInfo: getContextInfo({ sender: sender, mentionedJid: sender ? [sender] : [] })
        }, { quoted: fkontak });
        
    } catch (error) {
        console.error('Menu command error:', error);
        
        // Fallback simple menu if error occurs
        try {
            let fallbackText = `*╭━━━〔 🐢 ${config.BOT_NAME || '𝚂𝙸𝙻𝙰-𝙼𝙳'} 🐢 〕━━━┈⊷*\n`;
            fallbackText += `*┃🐢│ 𝙴𝚁𝚁𝙾𝚁: ${error.message}*\n`;
            fallbackText += `*┃🐢│ 𝚃𝚛𝚢 .𝚊𝚕𝚕𝚖𝚎𝚗𝚞*\n`;
            fallbackText += `*╰━━━━━━━━━━━━━━━┈⊷*\n\n`;
            fallbackText += `> ${config.BOT_FOOTER || '© 𝙿𝙾𝚆𝙴𝚁𝙳 𝙱𝚈🐢𝚂𝙸𝙻𝙰-𝙼𝙳'}`;
            
            await conn.sendMessage(from, {
                text: fallbackText,
                contextInfo: getContextInfo({ sender: sender })
            }, { quoted: fkontak });
        } catch (fallbackError) {
            console.error('Fallback menu error:', fallbackError);
        }
    }
});
