const { cmd } = global;
const config = require('../config');
const { fkontak, getContextInfo } = require('../lib/functions');

// ============================================
// 📌 COMMAND: JID - Get JID (Short Version)
// ============================================
cmd({
    pattern: "jid",
    alias: ["id", "getid"],
    desc: "Get JID/ID of user, group, or channel",
    category: "info",
    react: "🆔",
    filename: __filename
},
async (conn, mek, m, { from, sender, args, pushName, isGroup, isOwner }) => {
    try {
        // ============================================
        // CHANNEL ID (Owner Only)
        // ============================================
        if (args[0] && args[0].startsWith('https://whatsapp.com/channel/')) {
            if (!isOwner) {
                return await conn.sendMessage(from, {
                    text: "🚫 *Owner only*",
                    contextInfo: getContextInfo({ sender: sender })
                }, { quoted: fkontak });
            }

            const match = args[0].match(/https:\/\/whatsapp\.com\/channel\/([a-zA-Z0-9_-]+)/i);
            if (!match) {
                return await conn.sendMessage(from, {
                    text: "❌ *Invalid channel URL*",
                    contextInfo: getContextInfo({ sender: sender })
                }, { quoted: fkontak });
            }

            const channelId = match[1];
            
            try {
                const channelMeta = await conn.newsletterMetadata("invite", channelId);
                
                await conn.sendMessage(from, {
                    text: `📢 *Channel ID*\n\n` +
                          `ID: ${channelMeta.id}\n` +
                          `Name: ${channelMeta.name || 'Unknown'}\n\n` +
                          `${config.BOT_FOOTER}`,
                    contextInfo: getContextInfo({ sender: sender })
                }, { quoted: fkontak });
                
            } catch (error) {
                await conn.sendMessage(from, {
                    text: "❌ *Channel not found*",
                    contextInfo: getContextInfo({ sender: sender })
                }, { quoted: fkontak });
            }
            return;
        }

        // ============================================
        // REGULAR JID (User/Group)
        // ============================================
        let targetJid, targetName, type;
        
        // Check if reply to user
        if (mek.message?.extendedTextMessage?.contextInfo?.participant) {
            targetJid = mek.message.extendedTextMessage.contextInfo.participant;
            targetName = 'Replied User';
            type = '👤 User';
        }
        // Group
        else if (isGroup) {
            targetJid = sender;
            targetName = pushName || 'Group Member';
            type = '👥 Group Member';
        }
        // Private
        else {
            targetJid = sender;
            targetName = pushName || 'You';
            type = '👤 User';
        }

        const rawJid = targetJid.split('@')[0];
        
        // Build simple response
        let response = `🆔 *JID Info*\n\n`;
        
        if (isGroup) {
            const groupId = from;
            response += `📌 *Group*\n`;
            response += `ID: ${groupId.split('@')[0]}\n\n`;
        }
        
        response += `${type}\n`;
        response += `Name: ${targetName}\n`;
        response += `ID: ${rawJid}\n\n`;
        response += `${config.BOT_FOOTER}`;

        await conn.sendMessage(from, {
            text: response,
            contextInfo: getContextInfo({ sender: sender })
        }, { quoted: fkontak });

    } catch (error) {
        console.error("JID error:", error);
        await conn.sendMessage(from, {
            text: "❌ *Failed to get JID*",
            contextInfo: getContextInfo({ sender: sender })
        }, { quoted: fkontak });
    }
});
