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

        const type = args[0]?.toLowerCase() || 'text';
        
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
            text: `❌ Error: ${error.message}`,
            contextInfo: getContextInfo({ sender: sender })
        }, { quoted: fkontak });
    }
});

async function handleTextStatus(conn, from, sender, args, groupName, memberCount) {
    const text = args.slice(1).join(' ');
    
    if (!text) {
        return await conn.sendMessage(from, {
            text: `📝 Text Status Usage:\n\n` +
                  `.groupstatus text <your message>\n\n` +
                  `Example:\n` +
                  `.groupstatus text Hello everyone!`,
            contextInfo: getContextInfo({ sender: sender })
        }, { quoted: fkontak });
    }

    const statusMessage = `┏╾─────────── GROUP STATUS ───────────╼
╿
├⟐ Group: ${groupName}
├⟐ Members: ${memberCount}
├⟐ Time: ${new Date().toLocaleString()}
╿
├⟐ Message:
├⟐ ${text}
╿
├⟐ Posted by: @${sender.split('@')[0]}
╽
┗╾───────────

> ${config.BOT_FOOTER}`;

    const isViewOnce = args.includes('--vo') || args.includes('--once');
    
    await conn.sendMessage(from, {
        text: statusMessage,
        mentions: [sender],
        ...(isViewOnce && { viewOnce: true }),
        contextInfo: getContextInfo({ sender: sender, mentionedJid: [sender] })
    }, { quoted: fkontak });

    await conn.sendMessage(from, {
        react: { text: '📢', key: { id: mek.key?.id, remoteJid: from } }
    });
}

async function handleImageStatus(conn, from, sender, mek, groupName) {
    const quoted = mek.quoted || mek;
    const hasImage = quoted.message?.imageMessage || 
                     quoted.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;

    if (!hasImage) {
        return await conn.sendMessage(from, {
            text: `🖼️ Image Status Usage:\n\n` +
                  `Reply to an image with: .groupstatus image`,
            contextInfo: getContextInfo({ sender: sender })
        }, { quoted: fkontak });
    }

    const args = mek.message?.conversation?.split(' ') || 
                 mek.message?.extendedTextMessage?.text?.split(' ') || [];
    const caption = args.slice(2).join(' ') || '';

    try {
        const mediaPath = await downloadMediaMessage(quoted, `temp_status_${Date.now()}`, true);
        
        const statusCaption = `┏╾─────────── GROUP STATUS ───────────╼
╿
├⟐ Group: ${groupName}
├⟐ Time: ${new Date().toLocaleString()}
╿
├⟐ ${caption || 'No caption'}
╿
├⟐ Posted by: @${sender.split('@')[0]}
╽
┗╾───────────

> ${config.BOT_FOOTER}`;

        await conn.sendMessage(from, {
            image: { url: mediaPath },
            caption: statusCaption,
            mentions: [sender],
            contextInfo: getContextInfo({ sender: sender, mentionedJid: [sender] })
        }, { quoted: fkontak });

        const fs = require('fs-extra');
        if (fs.existsSync(mediaPath)) {
            fs.unlinkSync(mediaPath);
        }

    } catch (error) {
        console.error('Image status error:', error);
        throw error;
    }
}

async function handleVideoStatus(conn, from, sender, mek, groupName) {
    const quoted = mek.quoted || mek;
    const hasVideo = quoted.message?.videoMessage;

    if (!hasVideo) {
        return await conn.sendMessage(from, {
            text: `🎥 Video Status Usage:\n\n` +
                  `Reply to a video with: .groupstatus video`,
            contextInfo: getContextInfo({ sender: sender })
        }, { quoted: fkontak });
    }

    const args = mek.message?.conversation?.split(' ') || 
                 mek.message?.extendedTextMessage?.text?.split(' ') || [];
    const caption = args.slice(2).join(' ') || '';

    try {
        const mediaPath = await downloadMediaMessage(quoted, `temp_status_vid_${Date.now()}`, true);
        
        const statusCaption = `┏╾─────────── GROUP STATUS ───────────╼
╿
├⟐ Group: ${groupName}
├⟐ Time: ${new Date().toLocaleString()}
╿
├⟐ ${caption || 'No caption'}
╿
├⟐ Posted by: @${sender.split('@')[0]}
╽
┗╾───────────

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

async function handlePollStatus(conn, from, sender, args, groupName) {
    const pollText = args.slice(2).join(' ');
    
    if (!pollText || !pollText.includes('|')) {
        return await conn.sendMessage(from, {
            text: `📊 Poll Status Usage:\n\n` +
                  `.groupstatus poll Question | Option1 | Option2 | Option3\n\n` +
                  `Example:\n` +
                  `.groupstatus poll What's your favorite color? | Red | Blue | Green`,
            contextInfo: getContextInfo({ sender: sender })
        }, { quoted: fkontak });
    }

    const parts = pollText.split('|').map(p => p.trim());
    const question = parts[0];
    const options = parts.slice(1);

    if (options.length < 2) {
        return await conn.sendMessage(from, {
            text: "❌ At least 2 options are required!",
            contextInfo: getContextInfo({ sender: sender })
        }, { quoted: fkontak });
    }

    if (options.length > 10) {
        return await conn.sendMessage(from, {
            text: "❌ Maximum 10 options allowed!",
            contextInfo: getContextInfo({ sender: sender })
        }, { quoted: fkontak });
    }

    const pollMessage = `┏╾─────────── GROUP POLL ───────────╼
╿
├⟐ Group: ${groupName}
├⟐ Question: ${question}
╿
├⟐ Created by: @${sender.split('@')[0]}
╽
┗╾───────────`;

    await conn.sendMessage(from, {
        text: pollMessage,
        mentions: [sender],
        contextInfo: getContextInfo({ sender: sender, mentionedJid: [sender] })
    }, { quoted: fkontak });

    await conn.sendMessage(from, {
        poll: {
            name: question,
            values: options,
            selectableCount: 1
        }
    });
}

async function handleLinkStatus(conn, from, sender, args, groupName) {
    const link = args[1];
    const linkText = args.slice(2).join(' ') || 'Click here';

    if (!link || !link.match(/^https?:\/\//)) {
        return await conn.sendMessage(from, {
            text: `🔗 Link Status Usage:\n\n` +
                  `.groupstatus link <url> <text>\n\n` +
                  `Example:\n` +
                  `.groupstatus link https://chat.whatsapp.com/xxxx Join our group`,
            contextInfo: getContextInfo({ sender: sender })
        }, { quoted: fkontak });
    }

    const statusMessage = `┏╾─────────── GROUP LINK ───────────╼
╿
├⟐ Group: ${groupName}
├⟐ Time: ${new Date().toLocaleString()}
╿
├⟐ ${linkText}:
├⟐ ${link}
╿
├⟐ Posted by: @${sender.split('@')[0]}
╽
┗╾───────────

> ${config.BOT_FOOTER}`;

    await conn.sendMessage(from, {
        text: statusMessage,
        mentions: [sender],
        contextInfo: getContextInfo({ sender: sender, mentionedJid: [sender] })
    }, { quoted: fkontak });
}

async function showStatusTypes(conn, from, sender) {
    const helpMessage = `┏╾─────────── STATUS TYPES ───────────╼
╿
├⟐ 1. Text Status
├⟐    .groupstatus text <message>
╿
├⟐ 2. Image Status
├⟐    .groupstatus image (reply to image)
╿
├⟐ 3. Video Status
├⟐    .groupstatus video (reply to video)
╿
├⟐ 4. Poll Status
├⟐    .groupstatus poll Q | A | B | C
╿
├⟐ 5. Link Status
├⟐    .groupstatus link <url> <text>
╿
├⟐ 6. View Once
├⟐    Add --vo or --once to any status
╿
├⟐ 7. List Types
├⟐    .groupstatus list
╽
┗╾───────────

> ${config.BOT_FOOTER}`;

    await conn.sendMessage(from, {
        image: { url: config.IMAGE_PATH },
        caption: helpMessage,
        contextInfo: getContextInfo({ sender: sender })
    }, { quoted: fkontak });
}

async function isGroupAdmin(conn, groupJid, userJid) {
    try {
        const groupMetadata = await conn.groupMetadata(groupJid);
        const participant = groupMetadata.participants.find(p => p.id === userJid);
        return participant?.admin === 'admin' || participant?.admin === 'superadmin';
    } catch {
        return false;
    }
}