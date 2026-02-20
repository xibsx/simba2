const { cmd } = global;
const config = require('../config');
const { fkontak, getContextInfo } = require('../lib/functions');
const { updateUserSettings } = require('../lib/database');

cmd({
    pattern: "setprefix",
    alias: ["prefix"],
    desc: "Change bot prefix (use 'none' for no prefix)",
    category: "owner",
    react: "⚙️",
    filename: __filename
}, async (conn, mek, m, { from, sender, args, isOwner }) => {
    try {
        if (!isOwner) {
            return await conn.sendMessage(from, {
                text: "🚫 Owner-only command!",
                contextInfo: getContextInfo({ sender: sender })
            }, { quoted: fkontak });
        }

        const newPrefix = args[0]?.toLowerCase() || '';
        
        if (!newPrefix) {
            return await conn.sendMessage(from, {
                text: `📌 Current Prefix: ${config.PREFIX}\n\nUsage: .setprefix <new prefix>\nExample: .setprefix !\nOr: .setprefix none (for no prefix)`,
                contextInfo: getContextInfo({ sender: sender })
            }, { quoted: fkontak });
        }

        if (newPrefix === 'none') {
            config.PREFIX = '';
            config.NO_PREFIX = 'true';
        } else {
            config.PREFIX = newPrefix;
            config.NO_PREFIX = 'false';
        }

        await updateUserSettings(sender.split('@')[0], {
            prefix: config.PREFIX,
            no_prefix: config.NO_PREFIX
        });

        await conn.sendMessage(from, {
            text: `✅ Prefix updated!\n\nNew Prefix: ${config.PREFIX || 'No Prefix'}\nNo Prefix Mode: ${config.NO_PREFIX === 'true' ? '✅ Enabled' : '❌ Disabled'}\n\n> ${config.BOT_FOOTER}`,
            contextInfo: getContextInfo({ sender: sender })
        }, { quoted: fkontak });

    } catch (error) {
        console.error('Setprefix error:', error);
        await conn.sendMessage(from, {
            text: `❌ Error: ${error.message}`,
            contextInfo: getContextInfo({ sender: sender })
        }, { quoted: fkontak });
    }
});