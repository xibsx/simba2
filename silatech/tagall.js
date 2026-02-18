const { cmd } = global;
const config = require('../config');
const { fkontak, getContextInfo } = require('../lib/functions');

cmd({
    pattern: "tagall",
    alias: ["tag", "everyone", "all", "hidetag", "htag"],
    desc: "Tag all group members (normal or hidetag)",
    category: "group",
    react: "📢",
    filename: __filename
}, async (conn, mek, m, { from, sender, args, isGroup, isOwner, command, prefix }) => {
    try {
        // Check if in group
        if (!isGroup) {
            return await conn.sendMessage(from, {
                text: "❌ *𝚃𝚑𝚒𝚜 𝚌𝚘𝚖𝚖𝚊𝚗𝚍 𝚌𝚊𝚗 𝚘𝚗𝚕𝚢 𝚋𝚎 𝚞𝚜𝚎𝚍 𝚒𝚗 𝚐𝚛𝚘𝚞𝚙𝚜!*",
                contextInfo: getContextInfo({ sender: sender })
            }, { quoted: fkontak });
        }

        // Check if user is admin or owner
        const isAdmin = await isGroupAdmin(conn, from, sender);
        if (!isAdmin && !isOwner) {
            return await conn.sendMessage(from, {
                text: "🚫 *𝙾𝚗𝚕𝚢 𝚐𝚛𝚘𝚞𝚙 𝚊𝚍𝚖𝚒𝚗𝚜 𝚘𝚛 𝚋𝚘𝚝 𝚘𝚠𝚗𝚎𝚛 𝚌𝚊𝚗 𝚞𝚜𝚎 𝚝𝚊𝚐 𝚌𝚘𝚖𝚖𝚊𝚗𝚍𝚜!*",
                contextInfo: getContextInfo({ sender: sender })
            }, { quoted: fkontak });
        }

        // Get group metadata
        const groupMetadata = await conn.groupMetadata(from);
        const participants = groupMetadata.participants;
        const groupName = groupMetadata.subject;
        const adminCount = participants.filter(p => p.admin).length;
        const userCount = participants.length - adminCount;

        // Get message text
        let messageText = args.join(' ') || '';
        let isHidetag = command === 'hidetag' || command === 'htag' || args.includes('--hide');

        // Check if replying to someone
        if (mek.quoted) {
            // If replying to a message, use that message as content
            const quotedMsg = mek.quoted.message?.conversation || 
                             mek.quoted.message?.extendedTextMessage?.text ||
                             mek.quoted.message?.imageMessage?.caption ||
                             mek.quoted.message?.videoMessage?.caption || '';
            
            messageText = messageText || quotedMsg || '📢 𝙼𝚎𝚜𝚜𝚊𝚐𝚎 𝚏𝚛𝚘𝚖 𝚊𝚍𝚖𝚒𝚗';
            
            // Get the quoted user
            const quotedUser = mek.quoted.participant || mek.quoted.sender;
            
            // For hidetag with reply
            if (isHidetag) {
                return await handleHidetagReply(conn, from, sender, mek, quotedUser, messageText, participants);
            }
        }

        // Prepare mentions list
        const mentions = participants.map(p => p.id);

        if (isHidetag) {
            // ============================================
            // 📌 HIDETAG MODE (Invisible tagging)
            // ============================================
            const hidetagMessage = messageText || `📢 *𝙰𝚗𝚗𝚘𝚞𝚗𝚌𝚎𝚖𝚎𝚗𝚝 𝚏𝚛𝚘𝚖 𝙰𝚍𝚖𝚒𝚗*`;

            await conn.sendMessage(from, {
                text: hidetagMessage,
                mentions: mentions,
                contextInfo: {
                    mentionedJid: mentions,
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: config.NEWSLETTER_JIDS[0] || '120363402325089913@newsletter',
                        newsletterName: `© ${config.BOT_NAME}`,
                        serverMessageId: 143,
                    }
                }
            }, { quoted: fkontak });

        } else {
            // ============================================
            // 📌 NORMAL TAG MODE (With header)
            // ============================================
            
            // Create mentions text
            let mentionsText = '';
            participants.forEach((p, index) => {
                mentionsText += `${index + 1}. @${p.id.split('@')[0]}\n`;
            });

            const tagMessage = `*╭━━━〔 📢 𝚃𝙰𝙶 𝙰𝙻𝙻 〕━━━┈⊷*
*┃🐢│*
*┃🐢│ 👥 𝙶𝚛𝚘𝚞𝚙: ${groupName}*
*┃🐢│ 📊 𝚃𝚘𝚝𝚊𝚕: ${participants.length} 𝚖𝚎𝚖𝚋𝚎𝚛𝚜*
*┃🐢│ 👑 𝙰𝚍𝚖𝚒𝚗𝚜: ${adminCount}*
*┃🐢│ 👤 𝚄𝚜𝚎𝚛𝚜: ${userCount}*
*┃🐢│*
*┃🐢│ 📝 𝙼𝚎𝚜𝚜𝚊𝚐𝚎: ${messageText || '𝙽𝚘 𝚖𝚎𝚜𝚜𝚊𝚐𝚎'}*
*┃🐢│*
*┃🐢│ ━━━━━━━━━━━━━*
*┃🐢│ 𝚃𝚊𝚐𝚐𝚎𝚍 𝚋𝚢: @${sender.split('@')[0]}*
*┃🐢│*
*╰━━━━━━━━━━━━━━━┈⊷*

*📋 𝙼𝚎𝚖𝚋𝚎𝚛 𝙻𝚒𝚜𝚝:*
${mentionsText}

> ${config.BOT_FOOTER}`;

            await conn.sendMessage(from, {
                image: { url: config.IMAGE_PATH },
                caption: tagMessage,
                mentions: [sender, ...mentions],
                contextInfo: getContextInfo({ sender: sender, mentionedJid: [sender, ...mentions] })
            }, { quoted: fkontak });
        }

        // Send reaction
        await conn.sendMessage(from, {
            react: { text: isHidetag ? '🤫' : '📢', key: mek.key }
        });

    } catch (error) {
        console.error('Tagall command error:', error);
        await conn.sendMessage(from, {
            text: `❌ *𝙴𝚛𝚛𝚘𝚛:* ${error.message}`,
            contextInfo: getContextInfo({ sender: sender })
        }, { quoted: fkontak });
    }
});

// ============================================
// 📌 HANDLE HIDETAG WITH REPLY
// ============================================
async function handleHidetagReply(conn, from, sender, mek, quotedUser, messageText, participants) {
    try {
        const mentions = participants.map(p => p.id);
        const quotedName = quotedUser.split('@')[0];
        
        // Get the original quoted message content
        let originalContent = '';
        if (mek.quoted.message?.conversation) {
            originalContent = mek.quoted.message.conversation;
        } else if (mek.quoted.message?.extendedTextMessage?.text) {
            originalContent = mek.quoted.message.extendedTextMessage.text;
        } else if (mek.quoted.message?.imageMessage?.caption) {
            originalContent = mek.quoted.message.imageMessage.caption;
        } else if (mek.quoted.message?.videoMessage?.caption) {
            originalContent = mek.quoted.message.videoMessage.caption;
        }

        const replyMessage = `*╭━━━〔 🤫 𝙷𝙸𝙳𝙴𝚃𝙰𝙶 𝚁𝙴𝙿𝙻𝚈 〕━━━┈⊷*
*┃🐢│*
*┃🐢│ 📝 𝚁𝚎𝚙𝚕𝚢𝚒𝚗𝚐 𝚝𝚘: @${quotedName}*
*┃🐢│*
*┃🐢│ 𝚃𝚑𝚎𝚒𝚛 𝚖𝚎𝚜𝚜𝚊𝚐𝚎:*
*┃🐢│ "${originalContent || '𝙼𝚎𝚍𝚒𝚊 𝚖𝚎𝚜𝚜𝚊𝚐𝚎'}"*
*┃🐢│*
*┃🐢│ 𝚈𝚘𝚞𝚛 𝚖𝚎𝚜𝚜𝚊𝚐𝚎:*
*┃🐢│ ${messageText}*
*┃🐢│*
*┃🐢│ ━━━━━━━━━━━━━*
*┃🐢│ 𝚁𝚎𝚙𝚕𝚒𝚎𝚍 𝚋𝚢: @${sender.split('@')[0]}*
*┃🐢│*
*╰━━━━━━━━━━━━━━━┈⊷*

> ${config.BOT_FOOTER}`;

        // Send as hidetag
        await conn.sendMessage(from, {
            text: replyMessage,
            mentions: mentions,
            contextInfo: {
                mentionedJid: mentions,
                quoted: {
                    key: mek.quoted.key,
                    message: mek.quoted.message
                },
                forwardingScore: 999,
                isForwarded: true
            }
        }, { quoted: fkontak });

        // Also send a copy to the quoted user in DM (optional)
        if (config.NOTIFY_ON_TAG === 'true') {
            await conn.sendMessage(quotedUser, {
                text: `👋 @${sender.split('@')[0]} 𝚖𝚎𝚗𝚝𝚒𝚘𝚗𝚎𝚍 𝚢𝚘𝚞 𝚒𝚗 𝚐𝚛𝚘𝚞𝚙:\n\n"${messageText}"`,
                mentions: [sender],
                contextInfo: getContextInfo({ sender: sender })
            });
        }

    } catch (error) {
        console.error('Hidetag reply error:', error);
        throw error;
    }
}

// ============================================
// 📌 HELPER: TAG SPECIFIC USER
// ============================================
cmd({
    pattern: "tag",
    alias: ["mention", "at"],
    desc: "Tag a specific user",
    category: "group",
    react: "👤",
    filename: __filename
}, async (conn, mek, m, { from, sender, args, isGroup, isOwner }) => {
    try {
        if (!isGroup) {
            return await conn.sendMessage(from, {
                text: "❌ *𝚃𝚑𝚒𝚜 𝚌𝚘𝚖𝚖𝚊𝚗𝚍 𝚌𝚊𝚗 𝚘𝚗𝚕𝚢 𝚋𝚎 𝚞𝚜𝚎𝚍 𝚒𝚗 𝚐𝚛𝚘𝚞𝚙𝚜!*",
                contextInfo: getContextInfo({ sender: sender })
            }, { quoted: fkontak });
        }

        const isAdmin = await isGroupAdmin(conn, from, sender);
        if (!isAdmin && !isOwner) {
            return await conn.sendMessage(from, {
                text: "🚫 *𝙾𝚗𝚕𝚢 𝚐𝚛𝚘𝚞𝚙 𝚊𝚍𝚖𝚒𝚗𝚜 𝚌𝚊𝚗 𝚞𝚜𝚎 𝚝𝚑𝚒𝚜!*",
                contextInfo: getContextInfo({ sender: sender })
            }, { quoted: fkontak });
        }

        let targetUser;
        let messageText = args.join(' ');

        // Check if replying to someone
        if (mek.quoted) {
            targetUser = mek.quoted.participant || mek.quoted.sender;
            messageText = messageText || '📢 𝚈𝚘𝚞 𝚠𝚎𝚛𝚎 𝚖𝚎𝚗𝚝𝚒𝚘𝚗𝚎𝚍';
        } 
        // Check if mentioning via number
        else if (args[0]?.match(/^\+?[0-9]+$/)) {
            targetUser = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
            messageText = args.slice(1).join(' ') || '📢 𝙼𝚎𝚗𝚝𝚒𝚘𝚗𝚎𝚍 𝚢𝚘𝚞';
        }
        // Check if mentioning via @
        else if (args[0]?.startsWith('@')) {
            const mentionedJid = mek.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
            if (mentionedJid) {
                targetUser = mentionedJid;
                messageText = args.slice(1).join(' ') || '📢 𝙼𝚎𝚗𝚝𝚒𝚘𝚗𝚎𝚍 𝚢𝚘𝚞';
            }
        }

        if (!targetUser) {
            return await conn.sendMessage(from, {
                text: `📌 *𝚄𝚜𝚊𝚐𝚎:*\n\n` +
                      `1️⃣ *𝚁𝚎𝚙𝚕𝚢 𝚝𝚘 𝚞𝚜𝚎𝚛*\n` +
                      `   .𝚝𝚊𝚐 <𝚖𝚎𝚜𝚜𝚊𝚐𝚎>\n\n` +
                      `2️⃣ *𝙱𝚢 𝚗𝚞𝚖𝚋𝚎𝚛*\n` +
                      `   .𝚝𝚊𝚐 255612491554 <𝚖𝚎𝚜𝚜𝚊𝚐𝚎>\n\n` +
                      `3️⃣ *𝙱𝚢 @𝚖𝚎𝚗𝚝𝚒𝚘𝚗*\n` +
                      `   .𝚝𝚊𝚐 @user <𝚖𝚎𝚜𝚜𝚊𝚐𝚎>`,
                contextInfo: getContextInfo({ sender: sender })
            }, { quoted: fkontak });
        }

        await conn.sendMessage(from, {
            text: `👤 @${targetUser.split('@')[0]}\n\n${messageText}`,
            mentions: [targetUser],
            contextInfo: getContextInfo({ sender: sender, mentionedJid: [targetUser] })
        }, { quoted: fkontak });

    } catch (error) {
        console.error('Tag user error:', error);
        await conn.sendMessage(from, {
            text: `❌ *𝙴𝚛𝚛𝚘𝚛:* ${error.message}`,
            contextInfo: getContextInfo({ sender: sender })
        }, { quoted: fkontak });
    }
});

// ============================================
// 📌 HELPER FUNCTION: Check Group Admin
// ============================================
async function isGroupAdmin(conn, groupJid, userJid) {
    try {
        const groupMetadata = await conn.groupMetadata(groupJid);
        const participant = groupMetadata.participants.find(p => p.id === userJid);
        return participant?.admin === 'admin' || participant?.admin === 'superadmin';
    } catch {
        return false;
    }
}
