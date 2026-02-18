const { cmd } = global;
const config = require('../config');
const { fkontak, getContextInfo, downloadMediaMessage, sleep } = require('../lib/functions');

cmd({
    pattern: "groupstatus",
    alias: ["gstatus", "gstat", "groupstat"],
    desc: "Post status/story to group",
    category: "group",
    react: "📢",
    filename: __filename
}, async (conn, mek, m, { from, sender, args, isGroup, isOwner }) => {
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
                text: "🚫 *𝙾𝚗𝚕𝚢 𝚐𝚛𝚘𝚞𝚙 𝚊𝚍𝚖𝚒𝚗𝚜 𝚘𝚛 𝚋𝚘𝚝 𝚘𝚠𝚗𝚎𝚛 𝚌𝚊𝚗 𝚙𝚘𝚜𝚝 𝚜𝚝𝚊𝚝𝚞𝚜!*",
                contextInfo: getContextInfo({ sender: sender })
            }, { quoted: fkontak });
        }

        // Get status type from args
        const type = args[0]?.toLowerCase() || 'text';
        
        // Get group metadata
        const groupMetadata = await conn.groupMetadata(from);
        const groupName = groupMetadata.subject;
        const groupDesc = groupMetadata.desc || 'No description';
        const participantCount = groupMetadata.participants.length;

        switch(type) {
            case 'text':
                await handleTextStatus(conn, from, sender, args, groupName, participantCount);
                break;
                
            case 'image':
            case 'img':
                await handleImageStatus(conn, from, sender, mek, groupName);
                break;
                
            case 'video':
            case 'vid':
                await handleVideoStatus(conn, from, sender, mek, groupName);
                break;
                
            case 'poll':
                await handlePollStatus(conn, from, sender, args, groupName);
                break;
                
            case 'link':
                await handleLinkStatus(conn, from, sender, args, groupName);
                break;
                
            case 'list':
                await showStatusTypes(conn, from, sender);
                break;
                
            default:
                await showStatusTypes(conn, from, sender);
        }

    } catch (error) {
        console.error('Group status command error:', error);
        await conn.sendMessage(from, {
            text: `❌ *𝙴𝚛𝚛𝚘𝚛:* ${error.message}`,
            contextInfo: getContextInfo({ sender: sender })
        }, { quoted: fkontak });
    }
});

// ============================================
// 📌 TEXT STATUS
// ============================================
async function handleTextStatus(conn, from, sender, args, groupName, memberCount) {
    const text = args.slice(1).join(' ');
    
    if (!text) {
        return await conn.sendMessage(from, {
            text: `📝 *𝚃𝚎𝚡𝚝 𝚂𝚝𝚊𝚝𝚞𝚜 𝚄𝚜𝚊𝚐𝚎:*\n\n` +
                  `.𝚐𝚛𝚘𝚞𝚙𝚜𝚝𝚊𝚝𝚞𝚜 𝚝𝚎𝚡𝚝 <𝚢𝚘𝚞𝚛 𝚖𝚎𝚜𝚜𝚊𝚐𝚎>\n\n` +
                  `𝙴𝚡𝚊𝚖𝚙𝚕𝚎:\n` +
                  `.𝚐𝚛𝚘𝚞𝚙𝚜𝚝𝚊𝚝𝚞𝚜 𝚝𝚎𝚡𝚝 𝙷𝚎𝚕𝚕𝚘 𝚎𝚟𝚎𝚛𝚢𝚘𝚗𝚎! 𝚃𝚘𝚍𝚊𝚢 𝚒𝚜 𝚊 𝚐𝚛𝚎𝚊𝚝 𝚍𝚊𝚢!`,
            contextInfo: getContextInfo({ sender: sender })
        }, { quoted: fkontak });
    }

    const statusMessage = `*╭━━━〔 📢 𝙶𝚁𝙾𝚄𝙿 𝚂𝚃𝙰𝚃𝚄𝚂 〕━━━┈⊷*
*┃🐢│*
*┃🐢│ 👥 𝙶𝚛𝚘𝚞𝚙: ${groupName}*
*┃🐢│ 📊 𝙼𝚎𝚖𝚋𝚎𝚛𝚜: ${memberCount}*
*┃🐢│ ⏰ 𝚃𝚒𝚖𝚎: ${new Date().toLocaleString()}*
*┃🐢│*
*┃🐢│ 📝 𝙼𝚎𝚜𝚜𝚊𝚐𝚎:*
*┃🐢│ ${text}*
*┃🐢│*
*┃🐢│ ━━━━━━━━━━━━━*
*┃🐢│ 𝙿𝚘𝚜𝚝𝚎𝚍 𝚋𝚢: @${sender.split('@')[0]}*
*┃🐢│*
*╰━━━━━━━━━━━━━━━┈⊷*

> ${config.BOT_FOOTER}`;

    // Send as view-once or normal?
    const isViewOnce = args.includes('--vo') || args.includes('--once');
    
    await conn.sendMessage(from, {
        text: statusMessage,
        mentions: [sender],
        ...(isViewOnce && { viewOnce: true }),
        contextInfo: getContextInfo({ sender: sender, mentionedJid: [sender] })
    }, { quoted: fkontak });

    // Send reaction
    await conn.sendMessage(from, {
        react: { text: '📢', key: { id: mek.key?.id, remoteJid: from } }
    });
}

// ============================================
// 📌 IMAGE STATUS
// ============================================
async function handleImageStatus(conn, from, sender, mek, groupName) {
    // Check if there's an image
    const quoted = mek.quoted || mek;
    const hasImage = quoted.message?.imageMessage || 
                     quoted.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;

    if (!hasImage) {
        return await conn.sendMessage(from, {
            text: `🖼️ *𝙸𝚖𝚊𝚐𝚎 𝚂𝚝𝚊𝚝𝚞𝚜 𝚄𝚜𝚊𝚐𝚎:*\n\n` +
                  `1. 𝚁𝚎𝚙𝚕𝚢 𝚝𝚘 𝚊𝚗 𝚒𝚖𝚊𝚐𝚎 𝚠𝚒𝚝𝚑: .𝚐𝚛𝚘𝚞𝚙𝚜𝚝𝚊𝚝𝚞𝚜 𝚒𝚖𝚊𝚐𝚎\n` +
                  `2. 𝙾𝚛 𝚜𝚎𝚗𝚍 𝚒𝚖𝚊𝚐𝚎 𝚠𝚒𝚝𝚑 𝚌𝚊𝚙𝚝𝚒𝚘𝚗: .𝚐𝚛𝚘𝚞𝚙𝚜𝚝𝚊𝚝𝚞𝚜 𝚒𝚖𝚊𝚐𝚎\n\n` +
                  `𝙰𝚍𝚍 𝚝𝚎𝚡𝚝 𝚊𝚏𝚝𝚎𝚛 𝚏𝚘𝚛 𝚌𝚊𝚙𝚝𝚒𝚘𝚗`,
            contextInfo: getContextInfo({ sender: sender })
        }, { quoted: fkontak });
    }

    // Get caption from args
    const args = mek.message?.conversation?.split(' ') || 
                 mek.message?.extendedTextMessage?.text?.split(' ') || [];
    const caption = args.slice(2).join(' ') || '';

    try {
        // Download the image
        const mediaPath = await downloadMediaMessage(quoted, `temp_status_${Date.now()}`, true);
        
        const statusCaption = `*╭━━━〔 📢 𝙶𝚁𝙾𝚄𝙿 𝚂𝚃𝙰𝚃𝚄𝚂 〕━━━┈⊷*
*┃🐢│*
*┃🐢│ 👥 𝙶𝚛𝚘𝚞𝚙: ${groupName}*
*┃🐢│ ⏰ 𝚃𝚒𝚖𝚎: ${new Date().toLocaleString()}*
*┃🐢│*
*┃🐢│ 📝 ${caption || '𝙽𝚘 𝚌𝚊𝚙𝚝𝚒𝚘𝚗'}*
*┃🐢│*
*┃🐢│ ━━━━━━━━━━━━━*
*┃🐢│ 𝙿𝚘𝚜𝚝𝚎𝚍 𝚋𝚢: @${sender.split('@')[0]}*
*┃🐢│*
*╰━━━━━━━━━━━━━━━┈⊷*

> ${config.BOT_FOOTER}`;

        // Send as image status
        await conn.sendMessage(from, {
            image: { url: mediaPath },
            caption: statusCaption,
            mentions: [sender],
            contextInfo: getContextInfo({ sender: sender, mentionedJid: [sender] })
        }, { quoted: fkontak });

        // Clean up temp file
        const fs = require('fs-extra');
        if (fs.existsSync(mediaPath)) {
            fs.unlinkSync(mediaPath);
        }

    } catch (error) {
        console.error('Image status error:', error);
        throw error;
    }
}

// ============================================
// 📌 VIDEO STATUS
// ============================================
async function handleVideoStatus(conn, from, sender, mek, groupName) {
    // Check if there's a video
    const quoted = mek.quoted || mek;
    const hasVideo = quoted.message?.videoMessage;

    if (!hasVideo) {
        return await conn.sendMessage(from, {
            text: `🎥 *𝚅𝚒𝚍𝚎𝚘 𝚂𝚝𝚊𝚝𝚞𝚜 𝚄𝚜𝚊𝚐𝚎:*\n\n` +
                  `𝚁𝚎𝚙𝚕𝚢 𝚝𝚘 𝚊 𝚟𝚒𝚍𝚎𝚘 𝚠𝚒𝚝𝚑: .𝚐𝚛𝚘𝚞𝚙𝚜𝚝𝚊𝚝𝚞𝚜 𝚟𝚒𝚍𝚎𝚘`,
            contextInfo: getContextInfo({ sender: sender })
        }, { quoted: fkontak });
    }

    const args = mek.message?.conversation?.split(' ') || 
                 mek.message?.extendedTextMessage?.text?.split(' ') || [];
    const caption = args.slice(2).join(' ') || '';

    try {
        const mediaPath = await downloadMediaMessage(quoted, `temp_status_vid_${Date.now()}`, true);
        
        const statusCaption = `*╭━━━〔 📢 𝙶𝚁𝙾𝚄𝙿 𝚂𝚃𝙰𝚃𝚄𝚂 〕━━━┈⊷*
*┃🐢│*
*┃🐢│ 👥 𝙶𝚛𝚘𝚞𝚙: ${groupName}*
*┃🐢│ ⏰ 𝚃𝚒𝚖𝚎: ${new Date().toLocaleString()}*
*┃🐢│*
*┃🐢│ 📝 ${caption || '𝙽𝚘 𝚌𝚊𝚙𝚝𝚒𝚘𝚗'}*
*┃🐢│*
*┃🐢│ ━━━━━━━━━━━━━*
*┃🐢│ 𝙿𝚘𝚜𝚝𝚎𝚍 𝚋𝚢: @${sender.split('@')[0]}*
*┃🐢│*
*╰━━━━━━━━━━━━━━━┈⊷*

> ${config.BOT_FOOTER}`;

        await conn.sendMessage(from, {
            video: { url: mediaPath },
            caption: statusCaption,
            mentions: [sender],
            contextInfo: getContextInfo({ sender: sender, mentionedJid: [sender] })
        }, { quoted: fkontak });

        const fs = require('fs-extra');
        if (fs.existsSync(mediaPath)) {
            fs.unlinkSync(mediaPath);
        }

    } catch (error) {
        console.error('Video status error:', error);
        throw error;
    }
}

// ============================================
// 📌 POLL STATUS
// ============================================
async function handlePollStatus(conn, from, sender, args, groupName) {
    const pollText = args.slice(2).join(' ');
    
    if (!pollText || !pollText.includes('|')) {
        return await conn.sendMessage(from, {
            text: `📊 *𝙿𝚘𝚕𝚕 𝚂𝚝𝚊𝚝𝚞𝚜 𝚄𝚜𝚊𝚐𝚎:*\n\n` +
                  `.𝚐𝚛𝚘𝚞𝚙𝚜𝚝𝚊𝚝𝚞𝚜 𝚙𝚘𝚕𝚕 𝙿𝚘𝚕𝚕 𝚀𝚞𝚎𝚜𝚝𝚒𝚘𝚗 | 𝙾𝚙𝚝𝚒𝚘𝚗𝟷 | 𝙾𝚙𝚝𝚒𝚘𝚗𝟸 | 𝙾𝚙𝚝𝚒𝚘𝚗𝟹\n\n` +
                  `𝙴𝚡𝚊𝚖𝚙𝚕𝚎:\n` +
                  `.𝚐𝚛𝚘𝚞𝚙𝚜𝚝𝚊𝚝𝚞𝚜 𝚙𝚘𝚕𝚕 𝚆𝚑𝚊𝚝'𝚜 𝚢𝚘𝚞𝚛 𝚏𝚊𝚟𝚘𝚛𝚒𝚝𝚎 𝚌𝚘𝚕𝚘𝚛? | 𝚁𝚎𝚍 | 𝙱𝚕𝚞𝚎 | 𝙶𝚛𝚎𝚎𝚗`,
            contextInfo: getContextInfo({ sender: sender })
        }, { quoted: fkontak });
    }

    const parts = pollText.split('|').map(p => p.trim());
    const question = parts[0];
    const options = parts.slice(1);

    if (options.length < 2) {
        return await conn.sendMessage(from, {
            text: "❌ *𝙰𝚝 𝚕𝚎𝚊𝚜𝚝 2 𝚘𝚙𝚝𝚒𝚘𝚗𝚜 𝚊𝚛𝚎 𝚛𝚎𝚚𝚞𝚒𝚛𝚎𝚍!*",
            contextInfo: getContextInfo({ sender: sender })
        }, { quoted: fkontak });
    }

    if (options.length > 10) {
        return await conn.sendMessage(from, {
            text: "❌ *𝙼𝚊𝚡𝚒𝚖𝚞𝚖 10 𝚘𝚙𝚝𝚒𝚘𝚗𝚜 𝚊𝚕𝚕𝚘𝚠𝚎𝚍!*",
            contextInfo: getContextInfo({ sender: sender })
        }, { quoted: fkontak });
    }

    const pollMessage = `*╭━━━〔 📊 𝙶𝚁𝙾𝚄𝙿 𝙿𝙾𝙻𝙻 〕━━━┈⊷*
*┃🐢│*
*┃🐢│ 👥 𝙶𝚛𝚘𝚞𝚙: ${groupName}*
*┃🐢│ 📋 𝚀𝚞𝚎𝚜𝚝𝚒𝚘𝚗: ${question}*
*┃🐢│*
*┃🐢│ ━━━━━━━━━━━━━*
*┃🐢│ 𝙿𝚘𝚜𝚝𝚎𝚍 𝚋𝚢: @${sender.split('@')[0]}*
*┃🐢│*
*╰━━━━━━━━━━━━━━━┈⊷*`;

    await conn.sendMessage(from, {
        text: pollMessage,
        mentions: [sender],
        contextInfo: getContextInfo({ sender: sender, mentionedJid: [sender] })
    }, { quoted: fkontak });

    // Send actual poll
    await conn.sendMessage(from, {
        poll: {
            name: question,
            values: options,
            selectableCount: 1
        }
    });
}

// ============================================
// 📌 LINK STATUS
// ============================================
async function handleLinkStatus(conn, from, sender, args, groupName) {
    const link = args[1];
    const linkText = args.slice(2).join(' ') || '𝙲𝚕𝚒𝚌𝚔 𝚑𝚎𝚛𝚎';

    if (!link || !link.match(/^https?:\/\//)) {
        return await conn.sendMessage(from, {
            text: `🔗 *𝙻𝚒𝚗𝚔 𝚂𝚝𝚊𝚝𝚞𝚜 𝚄𝚜𝚊𝚐𝚎:*\n\n` +
                  `.𝚐𝚛𝚘𝚞𝚙𝚜𝚝𝚊𝚝𝚞𝚜 𝚕𝚒𝚗𝚔 <𝚞𝚛𝚕> <𝚝𝚎𝚡𝚝>\n\n` +
                  `𝙴𝚡𝚊𝚖𝚙𝚕𝚎:\n` +
                  `.𝚐𝚛𝚘𝚞𝚙𝚜𝚝𝚊𝚝𝚞𝚜 𝚕𝚒𝚗𝚔 https://chat.whatsapp.com/xxxx 𝙹𝚘𝚒𝚗 𝚘𝚞𝚛 𝚌𝚑𝚊𝚗𝚗𝚎𝚕`,
            contextInfo: getContextInfo({ sender: sender })
        }, { quoted: fkontak });
    }

    const statusMessage = `*╭━━━〔 🔗 𝙶𝚁𝙾𝚄𝙿 𝙻𝙸𝙽𝙺 〕━━━┈⊷*
*┃🐢│*
*┃🐢│ 👥 𝙶𝚛𝚘𝚞𝚙: ${groupName}*
*┃🐢│ ⏰ 𝚃𝚒𝚖𝚎: ${new Date().toLocaleString()}*
*┃🐢│*
*┃🐢│ 🔗 ${linkText}:*
*┃🐢│ ${link}*
*┃🐢│*
*┃🐢│ ━━━━━━━━━━━━━*
*┃🐢│ 𝙿𝚘𝚜𝚝𝚎𝚍 𝚋𝚢: @${sender.split('@')[0]}*
*┃🐢│*
*╰━━━━━━━━━━━━━━━┈⊷*

> ${config.BOT_FOOTER}`;

    await conn.sendMessage(from, {
        text: statusMessage,
        mentions: [sender],
        contextInfo: getContextInfo({ sender: sender, mentionedJid: [sender] })
    }, { quoted: fkontak });
}

// ============================================
// 📌 SHOW STATUS TYPES
// ============================================
async function showStatusTypes(conn, from, sender) {
    const helpMessage = `*╭━━━〔 📢 𝙶𝚁𝙾𝚄𝙿 𝚂𝚃𝙰𝚃𝚄𝚂 𝙲𝙾𝙼𝙼𝙰𝙽𝙳𝚂 〕━━━┈⊷*
*┃🐢│*
*┃🐢│ 1️⃣ *𝚃𝚎𝚡𝚝 𝚂𝚝𝚊𝚝𝚞𝚜*
*┃🐢│    .𝚐𝚛𝚘𝚞𝚙𝚜𝚝𝚊𝚝𝚞𝚜 𝚝𝚎𝚡𝚝 <𝚖𝚎𝚜𝚜𝚊𝚐𝚎>*
*┃🐢│*
*┃🐢│ 2️⃣ *𝙸𝚖𝚊𝚐𝚎 𝚂𝚝𝚊𝚝𝚞𝚜*
*┃🐢│    .𝚐𝚛𝚘𝚞𝚙𝚜𝚝𝚊𝚝𝚞𝚜 𝚒𝚖𝚊𝚐𝚎 (𝚛𝚎𝚙𝚕𝚢 𝚝𝚘 𝚒𝚖𝚊𝚐𝚎)*
*┃🐢│*
*┃🐢│ 3️⃣ *𝚅𝚒𝚍𝚎𝚘 𝚂𝚝𝚊𝚝𝚞𝚜*
*┃🐢│    .𝚐𝚛𝚘𝚞𝚙𝚜𝚝𝚊𝚝𝚞𝚜 𝚟𝚒𝚍𝚎𝚘 (𝚛𝚎𝚙𝚕𝚢 𝚝𝚘 𝚟𝚒𝚍𝚎𝚘)*
*┃🐢│*
*┃🐢│ 4️⃣ *𝙿𝚘𝚕𝚕 𝚂𝚝𝚊𝚝𝚞𝚜*
*┃🐢│    .𝚐𝚛𝚘𝚞𝚙𝚜𝚝𝚊𝚝𝚞𝚜 𝚙𝚘𝚕𝚕 𝚀 | 𝙰 | 𝙱 | 𝙲*
*┃🐢│*
*┃🐢│ 5️⃣ *𝙻𝚒𝚗𝚔 𝚂𝚝𝚊𝚝𝚞𝚜*
*┃🐢│    .𝚐𝚛𝚘𝚞𝚙𝚜𝚝𝚊𝚝𝚞𝚜 𝚕𝚒𝚗𝚔 <𝚞𝚛𝚕> <𝚝𝚎𝚡𝚝>*
*┃🐢│*
*┃🐢│ 6️⃣ *𝚅𝚒𝚎𝚠 𝙾𝚗𝚌𝚎*
*┃🐢│    𝙰𝚍𝚍 --𝚟𝚘 𝚘𝚛 --𝚘𝚗𝚌𝚎 𝚊𝚝 𝚝𝚑𝚎 𝚎𝚗𝚍*
*┃🐢│*
*┃🐢│ 7️⃣ *𝚃𝚑𝚒𝚜 𝙻𝚒𝚜𝚝*
*┃🐢│    .𝚐𝚛𝚘𝚞𝚙𝚜𝚝𝚊𝚝𝚞𝚜 𝚕𝚒𝚜𝚝*
*┃🐢│*
*╰━━━━━━━━━━━━━━━┈⊷*

> ${config.BOT_FOOTER}`;

    await conn.sendMessage(from, {
        image: { url: config.IMAGE_PATH },
        caption: helpMessage,
        contextInfo: getContextInfo({ sender: sender })
    }, { quoted: fkontak });
}

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
