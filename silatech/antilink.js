const { cmd } = global;
const config = require('../config');
const { fkontak, getContextInfo } = require('../lib/functions');
const { getAntiLinkStatus, setAntiLinkStatus, containsLink } = require('../lib/antifunctions');

cmd({
    pattern: "antilink",
    alias: ["antilink"],
    desc: "Toggle anti-link feature in group",
    category: "group",
    react: "🔗",
    filename: __filename
}, async (conn, mek, m, { from, sender, args, isGroup, isOwner, prefix }) => {
    try {
        // Check if in group
        if (!isGroup) {
            return await conn.sendMessage(from, {
                text: `❌ *This command can only be used in groups!*\n\n${config.BOT_FOOTER}`,
                contextInfo: getContextInfo({ sender: sender })
            }, { quoted: fkontak });
        }

        // Check if user is admin or owner
        const groupMetadata = await conn.groupMetadata(from);
        const isAdmin = groupMetadata.participants.find(p => p.id === sender)?.admin === 'admin' || 
                       groupMetadata.participants.find(p => p.id === sender)?.admin === 'superadmin';
        
        if (!isAdmin && !isOwner) {
            return await conn.sendMessage(from, {
                text: `❌ *Only group admins can use this command!*\n\n${config.BOT_FOOTER}`,
                contextInfo: getContextInfo({ sender: sender })
            }, { quoted: fkontak });
        }

        // Get current status
        const currentStatus = getAntiLinkStatus(from);
        const action = args[0]?.toLowerCase();

        // If no args, show buttons
        if (!action) {
            const buttons = [
                { 
                    buttonId: `${prefix}antilink on`, 
                    buttonText: { displayText: '✅ ON' }, 
                    type: 1 
                },
                { 
                    buttonId: `${prefix}antilink off`, 
                    buttonText: { displayText: '❌ OFF' }, 
                    type: 1 
                }
            ];

            const caption = `🔗 *ANTI-LINK SETTINGS*\n\n` +
                           `Current Status: ${currentStatus ? '✅ ON' : '❌ OFF'}\n\n` +
                           `Choose option below:\n\n` +
                           `${config.BOT_FOOTER}`;

            await conn.sendMessage(from, { 
                text: caption, 
                footer: config.BOT_FOOTER,
                buttons: buttons,
                headerType: 1,
                contextInfo: getContextInfo({ sender: sender })
            }, { quoted: fkontak });
            return;
        }

        // Handle on/off
        let newStatus;
        let statusText;

        if (action === 'on') {
            newStatus = true;
            statusText = '𝙴𝙽𝙰𝙱𝙻𝙴𝙳 ✅';
        } else if (action === 'off') {
            newStatus = false;
            statusText = '𝙳𝙸𝚂𝙰𝙱𝙻𝙴𝙳 ❌';
        } else {
            return await conn.sendMessage(from, {
                text: `❌ *Invalid option! Use on/off*\n\n${config.BOT_FOOTER}`,
                contextInfo: getContextInfo({ sender: sender })
            }, { quoted: fkontak });
        }

        // Save status
        setAntiLinkStatus(from, newStatus);

        await conn.sendMessage(from, {
            text: `🔗 *ANTI-LINK UPDATED*\n\n` +
                  `Status: ${statusText}\n` +
                  `Group: ${groupMetadata.subject}\n` +
                  `By: @${sender.split('@')[0]}\n\n` +
                  `${config.BOT_FOOTER}`,
            contextInfo: getContextInfo({ sender: sender, mentionedJid: [sender] })
        }, { quoted: fkontak });

        await conn.sendMessage(from, {
            react: { text: newStatus ? '✅' : '❌', key: mek.key }
        });

    } catch (error) {
        console.error('Antilink command error:', error);
        await conn.sendMessage(from, {
            text: `❌ *Error:* ${error.message}\n\n${config.BOT_FOOTER}`,
            contextInfo: getContextInfo({ sender: sender })
        }, { quoted: fkontak });
    }
});
