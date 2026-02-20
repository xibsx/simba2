const { cmd } = global;
const config = require('../config');
const { fkontak, getContextInfo } = require('../lib/functions');

cmd({
    pattern: "allmenu",
    alias: ["list", "cmds"],
    desc: "Show all commands in simple list",
    category: "general",
    react: "📋",
    filename: __filename
}, async (conn, mek, m, { from, sender, prefix }) => {
    try {
        const commands = global.commands ? Array.from(global.commands.values()) : [];
        const uniquePatterns = new Set();
        const commandList = [];
        
        // Get unique patterns
        commands.forEach(cmd => {
            if (cmd && cmd.pattern && !uniquePatterns.has(cmd.pattern)) {
                uniquePatterns.add(cmd.pattern);
                commandList.push({
                    pattern: cmd.pattern,
                    category: cmd.category || 'general'
                });
            }
        });
        
        // Group by category
        const categories = {};
        commandList.forEach(cmd => {
            if (!categories[cmd.category]) categories[cmd.category] = [];
            categories[cmd.category].push(cmd.pattern);
        });
        
        let menuText = `📋 *𝙰𝙻𝙻 𝙲𝙾𝙼𝙼𝙰𝙽𝙳𝚂*\n\n`;
        menuText += `𝙿𝚛𝚎𝚏𝚒𝚡: ${prefix || config.PREFIX || '.'}\n`;
        menuText += `𝚃𝚘𝚝𝚊𝚕: ${commandList.length}\n\n`;
        
        for (const [cat, cmds] of Object.entries(categories)) {
            menuText += `*${cat.toUpperCase()}:*\n`;
            cmds.sort().forEach(cmd => {
                menuText += `◉ ${cmd}\n`;
            });
            menuText += `\n`;
        }
        
        menuText += config.BOT_FOOTER;
        
        await conn.sendMessage(from, {
            text: menuText,
            contextInfo: getContextInfo({ sender: sender })
        }, { quoted: fkontak });
        
    } catch (error) {
        console.error('Allmenu error:', error);
        await conn.sendMessage(from, {
            text: `❌ Error: ${error.message}`,
            contextInfo: getContextInfo({ sender: sender })
        }, { quoted: fkontak });
    }
});
