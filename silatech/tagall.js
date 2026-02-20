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
        if (!isGroup) {
            return await conn.sendMessage(from, {
                text: "❌ This command can only be used in groups!",
                contextInfo: getContextInfo({ sender: sender })
            }, { quoted: fkontak });
        }

        const isAdmin = await isGroupAdmin(conn, from, sender);
        if (!isAdmin && !isOwner) {
            return await conn.sendMessage(from, {
                text: "🚫 Only group admins or owner can use this command!",
                contextInfo: getContextInfo({ sender: sender })
            }, { quoted: fkontak });
        }

        const groupMetadata = await conn.groupMetadata(from);
        const participants = groupMetadata.participants;
        const groupName = groupMetadata.subject;
        const adminCount = participants.filter(p => p.admin).length;
        const userCount = participants.length - adminCount;

        let messageText = args.join(' ') || '';
        let isHidetag = command === 'hidetag' || command === 'htag' || args.includes('--hide');

        if (mek.quoted) {
            const quotedMsg = mek.quoted.message?.conversation || 
                             mek.quoted.message?.extendedTextMessage?.text ||
                             mek.quoted.message?.imageMessage?.caption ||
                             mek.quoted.message?.videoMessage?.caption || '';
            
            messageText = messageText || quotedMsg || '📢 Message from admin';
            
            const quotedUser = mek.quoted.participant || mek.quoted.sender;
            
            if (isHidetag) {
                return await handleHidetagReply(conn, from, sender, mek, quotedUser, messageText, participants);
            }
        }

        const mentions = participants.map(p => p.id);

        if (isHidetag) {
            const hidetagMessage = messageText || `📢 Announcement`;

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
            let mentionsText = '';
            participants.forEach((p, index) => {
                mentionsText += `${index + 1}. @${p.id.split('@')[0]}\n`;
            });

            const tagMessage = `┏╾─────────── TAG ALL ───────────╼
╿
├⟐ Group: ${groupName}
├⟐ Total: ${participants.length} members
├⟐ Admins: ${adminCount}
├⟐ Users: ${userCount}
╿
├⟐ Message: ${messageText || 'No message'}
╿
├⟐ Tagged by: @${sender.split('@')[0]}
╽
┗╾───────────

📋 Member list:
${mentionsText}

> ${config.BOT_FOOTER}`;

            await conn.sendMessage(from, {
                image: { url: config.IMAGE_PATH },
                caption: tagMessage,
                mentions: [sender, ...mentions],
                contextInfo: getContextInfo({ sender: sender, mentionedJid: [sender, ...mentions] })
            }, { quoted: fkontak });
        }

        await conn.sendMessage(from, {
            react: { text: isHidetag ? '🤫' : '📢', key: mek.key }
        });

    } catch (error) {
        console.error('Tagall command error:', error);
        await conn.sendMessage(from, {
            text: `❌ Error: ${error.message}`,
            contextInfo: getContextInfo({ sender: sender })
        }, { quoted: fkontak });
    }
});

async function handleHidetagReply(conn, from, sender, mek, quotedUser, messageText, participants) {
    try {
        const mentions = participants.map(p => p.id);
        const quotedName = quotedUser.split('@')[0];
        
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

        const replyMessage = `┏╾─────────── HIDETAG REPLY ───────────╼
╿
├⟐ Replying to: @${quotedName}
╿
├⟐ Original message:
├⟐ "${originalContent || 'Original message'}"
╿
├⟐ Your message:
├⟐ ${messageText}
╿
├⟐ Tagged by: @${sender.split('@')[0]}
╽
┗╾───────────

> ${config.BOT_FOOTER}`;

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

        if (config.NOTIFY_ON_TAG === 'true') {
            await conn.sendMessage(quotedUser, {
                text: `👋 @${sender.split('@')[0]} mentioned you in group:\n\n"${messageText}"`,
                mentions: [sender],
                contextInfo: getContextInfo({ sender: sender })
            });
        }

    } catch (error) {
        console.error('Hidetag reply error:', error);
        throw error;
    }
}

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
                text: "❌ This command can only be used in groups!",
                contextInfo: getContextInfo({ sender: sender })
            }, { quoted: fkontak });
        }

        const isAdmin = await isGroupAdmin(conn, from, sender);
        if (!isAdmin && !isOwner) {
            return await conn.sendMessage(from, {
                text: "🚫 Only group admins can use this!",
                contextInfo: getContextInfo({ sender: sender })
            }, { quoted: fkontak });
        }

        let targetUser;
        let messageText = args.join(' ');

        if (mek.quoted) {
            targetUser = mek.quoted.participant || mek.quoted.sender;
            messageText = messageText || '📢 You were mentioned';
        } 
        else if (args[0]?.match(/^\+?[0-9]+$/)) {
            targetUser = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
            messageText = args.slice(1).join(' ') || '📢 You were mentioned';
        }
        else if (args[0]?.startsWith('@')) {
            const mentionedJid = mek.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
            if (mentionedJid) {
                targetUser = mentionedJid;
                messageText = args.slice(1).join(' ') || '📢 You were mentioned';
            }
        }

        if (!targetUser) {
            return await conn.sendMessage(from, {
                text: `📌 Usage:\n\n` +
                      `1️⃣ Reply to user\n` +
                      `   .tag <message>\n\n` +
                      `2️⃣ By number\n` +
                      `   .tag 255612491554 <message>\n\n` +
                      `3️⃣ By mention\n` +
                      `   .tag @user <message>`,
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
            text: `❌ Error: ${error.message}`,
            contextInfo: getContextInfo({ sender: sender })
        }, { quoted: fkontak });
    }
});

async function isGroupAdmin(conn, groupJid, userJid) {
    try {
        const groupMetadata = await conn.groupMetadata(groupJid);
        const participant = groupMetadata.participants.find(p => p.id === userJid);
        return participant?.admin === 'admin' || participant?.admin === 'superadmin';
    } catch {
        return false;
    }
}