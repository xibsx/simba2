const { cmd } = global;
const config = require('../config');
const { fkontak, getContextInfo, downloadMediaMessage } = require('../lib/functions');
const fs = require('fs-extra');

cmd({
    pattern: "viewonce",
    alias: ["vv", "rvo", "readonce", "reveal", "viewoncemsg"],
    desc: "View and save view-once messages (images/videos/audio)",
    category: "general",
    react: "👁️",
    filename: __filename
}, async (conn, mek, m, { from, sender, args, isOwner, command, prefix }) => {
    try {
        // Check if user replied to a message
        if (!mek.quoted) {
            return await conn.sendMessage(from, {
                text: `👁️ *𝙷𝚘𝚠 𝚝𝚘 𝚞𝚜𝚎 𝚟𝚒𝚎𝚠𝚘𝚗𝚌𝚎 𝚌𝚘𝚖𝚖𝚊𝚗𝚍:*\n\n` +
                      `1️⃣ *𝚁𝚎𝚙𝚕𝚢 𝚝𝚘 𝚊 𝚟𝚒𝚎𝚠-𝚘𝚗𝚌𝚎 𝚖𝚎𝚜𝚜𝚊𝚐𝚎*\n` +
                      `   ${prefix}${command}\n\n` +
                      `2️⃣ *𝙴𝚡𝚊𝚖𝚙𝚕𝚎:*\n` +
                      `   𝚁𝚎𝚙𝚕𝚢 𝚝𝚘 𝚊 𝚟𝚒𝚎𝚠-𝚘𝚗𝚌𝚎 𝚒𝚖𝚊𝚐𝚎/𝚟𝚒𝚍𝚎𝚘/𝚊𝚞𝚍𝚒𝚘 𝚊𝚗𝚍 𝚝𝚢𝚙𝚎 .𝚟𝚟\n\n` +
                      `⚠️ *𝙽𝚘𝚝𝚎:* 𝚃𝚑𝚒𝚜 𝚠𝚘𝚛𝚔𝚜 𝚘𝚗𝚕𝚢 𝚏𝚘𝚛 𝚟𝚒𝚎𝚠-𝚘𝚗𝚌𝚎 𝚖𝚎𝚍𝚒𝚊!`,
                contextInfo: getContextInfo({ sender: sender })
            }, { quoted: fkontak });
        }

        // Get the quoted message
        const quotedMsg = mek.quoted;
        const quotedMessage = quotedMsg.message || {};
        
        // Check if it's a view-once message (various formats)
        let mediaMessage = null;
        let mediaType = null;
        let viewOnce = false;

        // Check for different view-once formats
        if (quotedMessage.viewOnceMessageV2) {
            // Format: viewOnceMessageV2
            const v2Msg = quotedMessage.viewOnceMessageV2.message;
            if (v2Msg.imageMessage) {
                mediaMessage = v2Msg.imageMessage;
                mediaType = 'image';
                viewOnce = true;
            } else if (v2Msg.videoMessage) {
                mediaMessage = v2Msg.videoMessage;
                mediaType = 'video';
                viewOnce = true;
            } else if (v2Msg.audioMessage) {
                mediaMessage = v2Msg.audioMessage;
                mediaType = 'audio';
                viewOnce = true;
            }
        } 
        else if (quotedMessage.viewOnceMessage) {
            // Format: viewOnceMessage
            const v1Msg = quotedMessage.viewOnceMessage.message;
            if (v1Msg.imageMessage) {
                mediaMessage = v1Msg.imageMessage;
                mediaType = 'image';
                viewOnce = true;
            } else if (v1Msg.videoMessage) {
                mediaMessage = v1Msg.videoMessage;
                mediaType = 'video';
                viewOnce = true;
            }
        }
        else if (quotedMessage.imageMessage?.viewOnce) {
            // Format: imageMessage with viewOnce flag
            mediaMessage = quotedMessage.imageMessage;
            mediaType = 'image';
            viewOnce = true;
        }
        else if (quotedMessage.videoMessage?.viewOnce) {
            // Format: videoMessage with viewOnce flag
            mediaMessage = quotedMessage.videoMessage;
            mediaType = 'video';
            viewOnce = true;
        }
        else if (quotedMessage.audioMessage?.viewOnce) {
            // Format: audioMessage with viewOnce flag
            mediaMessage = quotedMessage.audioMessage;
            mediaType = 'audio';
            viewOnce = true;
        }

        // If not a view-once message
        if (!viewOnce || !mediaMessage) {
            return await conn.sendMessage(from, {
                text: `❌ *𝚃𝚑𝚒𝚜 𝚒𝚜 𝚗𝚘𝚝 𝚊 𝚟𝚒𝚎𝚠-𝚘𝚗𝚌𝚎 𝚖𝚎𝚜𝚜𝚊𝚐𝚎!*\n\n` +
                      `𝙿𝚕𝚎𝚊𝚜𝚎 𝚛𝚎𝚙𝚕𝚢 𝚝𝚘 𝚊 𝚟𝚊𝚕𝚒𝚍 𝚟𝚒𝚎𝚠-𝚘𝚗𝚌𝚎 𝚒𝚖𝚊𝚐𝚎, 𝚟𝚒𝚍𝚎𝚘, 𝚘𝚛 𝚊𝚞𝚍𝚒𝚘.`,
                contextInfo: getContextInfo({ sender: sender })
            }, { quoted: fkontak });
        }

        // Send processing message
        await conn.sendMessage(from, {
            text: `*╭━━━〔 👁️ 𝚅𝙸𝙴𝚆 𝙾𝙽𝙲𝙴 〕━━━┈⊷*
*┃🐢│*
*┃🐢│ 🔍 𝙳𝚎𝚝𝚎𝚌𝚝𝚎𝚍: ${mediaType.toUpperCase()}*
*┃🐢│ ⏳ 𝙿𝚛𝚘𝚌𝚎𝚜𝚜𝚒𝚗𝚐...*
*┃🐢│*
*╰━━━━━━━━━━━━━━━┈⊷*`,
            contextInfo: getContextInfo({ sender: sender })
        }, { quoted: fkontak });

        // Download the media
        let mediaBuffer;
        let mediaPath;
        
        try {
            // Try to download using different methods
            if (quotedMessage.viewOnceMessageV2 || quotedMessage.viewOnceMessage) {
                // For viewOnce wrapper messages
                const realMsg = {
                    key: quotedMsg.key,
                    message: mediaMessage
                };
                mediaBuffer = await downloadMediaMessage(realMsg, 'buffer');
                mediaPath = await downloadMediaMessage(realMsg, `viewonce_${Date.now()}`, true);
            } else {
                // For direct messages
                mediaBuffer = await downloadMediaMessage(quotedMsg, 'buffer');
                mediaPath = await downloadMediaMessage(quotedMsg, `viewonce_${Date.now()}`, true);
            }
        } catch (downloadError) {
            console.error('Download error:', downloadError);
            
            // Try alternative download method
            try {
                const stream = await downloadContentFromMessage(mediaMessage, mediaType);
                let buffer = Buffer.from([]);
                for await (const chunk of stream) {
                    buffer = Buffer.concat([buffer, chunk]);
                }
                mediaBuffer = buffer;
                
                // Save to file
                const ext = mediaType === 'image' ? 'jpg' : mediaType === 'video' ? 'mp4' : 'mp3';
                mediaPath = `./temp/viewonce_${Date.now()}.${ext}`;
                fs.ensureDirSync('./temp');
                fs.writeFileSync(mediaPath, buffer);
            } catch (altError) {
                throw new Error('Failed to download media: ' + altError.message);
            }
        }

        if (!mediaBuffer || mediaBuffer.length === 0) {
            throw new Error('Downloaded media is empty');
        }

        // Get caption if any
        const caption = mediaMessage.caption || '';

        // Prepare message based on type
        const successMessage = `*╭━━━〔 ✅ 𝚁𝙴𝚅𝙴𝙰𝙻𝙴𝙳 〕━━━┈⊷*
*┃🐢│*
*┃🐢│ 📦 𝚃𝚢𝚙𝚎: ${mediaType.toUpperCase()}*
*┃🐢│ 📊 𝚂𝚒𝚣𝚎: ${(mediaBuffer.length / 1024 / 1024).toFixed(2)} MB*
*┃🐢│*
*┃🐢│ 📝 𝙲𝚊𝚙𝚝𝚒𝚘𝚗: ${caption || '𝙽𝚘 𝚌𝚊𝚙𝚝𝚒𝚘𝚗'}*
*┃🐢│*
*┃🐢│ ━━━━━━━━━━━━━*
*┃🐢│ 𝚁𝚎𝚟𝚎𝚊𝚕𝚎𝚍 𝚋𝚢: @${sender.split('@')[0]}*
*┃🐢│*
*╰━━━━━━━━━━━━━━━┈⊷*

> ${config.BOT_FOOTER}`;

        // Send the revealed media
        if (mediaType === 'image') {
            await conn.sendMessage(from, {
                image: mediaBuffer,
                caption: successMessage,
                mentions: [sender],
                contextInfo: getContextInfo({ sender: sender, mentionedJid: [sender] })
            }, { quoted: fkontak });
        } 
        else if (mediaType === 'video') {
            await conn.sendMessage(from, {
                video: mediaBuffer,
                caption: successMessage,
                mentions: [sender],
                contextInfo: getContextInfo({ sender: sender, mentionedJid: [sender] })
            }, { quoted: fkontak });
        } 
        else if (mediaType === 'audio') {
            await conn.sendMessage(from, {
                audio: mediaBuffer,
                mimetype: 'audio/mpeg',
                contextInfo: getContextInfo({ sender: sender })
            }, { quoted: fkontak });
            
            // Also send caption separately
            await conn.sendMessage(from, {
                text: successMessage,
                mentions: [sender],
                contextInfo: getContextInfo({ sender: sender, mentionedJid: [sender] })
            }, { quoted: fkontak });
        }

        // Also save as document option (if user wants)
        if (args.includes('--doc') || args.includes('--document')) {
            const ext = mediaType === 'image' ? 'jpg' : mediaType === 'video' ? 'mp4' : 'mp3';
            const filename = `viewonce_${Date.now()}.${ext}`;
            
            await conn.sendMessage(from, {
                document: mediaBuffer,
                mimetype: mediaType === 'image' ? 'image/jpeg' : mediaType === 'video' ? 'video/mp4' : 'audio/mpeg',
                fileName: filename,
                caption: `📁 *𝚂𝚊𝚟𝚎𝚍 ${mediaType.toUpperCase()}*\n\n${caption}`,
                contextInfo: getContextInfo({ sender: sender })
            }, { quoted: fkontak });
        }

        // Send success reaction
        await conn.sendMessage(from, {
            react: { text: '✅', key: mek.key }
        });

        // Clean up temp file
        if (mediaPath && fs.existsSync(mediaPath)) {
            fs.unlinkSync(mediaPath);
        }

    } catch (error) {
        console.error('Viewonce command error:', error);
        
        // Clean up temp file if exists
        if (mediaPath && fs.existsSync(mediaPath)) {
            fs.unlinkSync(mediaPath);
        }

        let errorMessage = error.message;
        if (error.message.includes('decrypt')) {
            errorMessage = '𝙵𝚊𝚒𝚕𝚎𝚍 𝚝𝚘 𝚍𝚎𝚌𝚛𝚢𝚙𝚝 𝚝𝚑𝚎 𝚖𝚎𝚜𝚜𝚊𝚐𝚎. 𝙸𝚝 𝚖𝚊𝚢 𝚑𝚊𝚟𝚎 𝚎𝚡𝚙𝚒𝚛𝚎𝚍.';
        } else if (error.message.includes('size')) {
            errorMessage = '𝙵𝚒𝚕𝚎 𝚒𝚜 𝚝𝚘𝚘 𝚕𝚊𝚛𝚐𝚎 𝚝𝚘 𝚙𝚛𝚘𝚌𝚎𝚜𝚜.';
        }

        await conn.sendMessage(from, {
            text: `❌ *𝙵𝚊𝚒𝚕𝚎𝚍 𝚝𝚘 𝚛𝚎𝚟𝚎𝚊𝚕 𝚟𝚒𝚎𝚠-𝚘𝚗𝚌𝚎 𝚖𝚎𝚜𝚜𝚊𝚐𝚎:*\n\n${errorMessage}`,
            contextInfo: getContextInfo({ sender: sender })
        }, { quoted: fkontak });

        await conn.sendMessage(from, {
            react: { text: '❌', key: mek.key }
        });
    }
});

// ============================================
// 📌 BATCH VIEWONCE (For multiple messages)
// ============================================
cmd({
    pattern: "viewonceall",
    alias: ["vva", "revealall"],
    desc: "Reveal all view-once messages in chat",
    category: "owner",
    react: "🔄",
    filename: __filename
}, async (conn, mek, m, { from, sender, isOwner }) => {
    try {
        if (!isOwner) {
            return await conn.sendMessage(from, {
                text: "🚫 *𝙾𝚠𝚗𝚎𝚛-𝚘𝚗𝚕𝚢 𝚌𝚘𝚖𝚖𝚊𝚗𝚍!*",
                contextInfo: getContextInfo({ sender: sender })
            }, { quoted: fkontak });
        }

        await conn.sendMessage(from, {
            text: "🔍 *𝚂𝚎𝚊𝚛𝚌𝚑𝚒𝚗𝚐 𝚏𝚘𝚛 𝚟𝚒𝚎𝚠-𝚘𝚗𝚌𝚎 𝚖𝚎𝚜𝚜𝚊𝚐𝚎𝚜...*",
            contextInfo: getContextInfo({ sender: sender })
        }, { quoted: fkontak });

        // This would require storing message history
        // Implementation depends on your store system
        await conn.sendMessage(from, {
            text: "✅ *𝙵𝚎𝚊𝚝𝚞𝚛𝚎 𝚌𝚘𝚖𝚒𝚗𝚐 𝚜𝚘𝚘𝚗!*",
            contextInfo: getContextInfo({ sender: sender })
        }, { quoted: fkontak });

    } catch (error) {
        console.error('Viewonce all error:', error);
        await conn.sendMessage(from, {
            text: `❌ *𝙴𝚛𝚛𝚘𝚛:* ${error.message}`,
            contextInfo: getContextInfo({ sender: sender })
        }, { quoted: fkontak });
    }
});

// ============================================
// 📌 AUTO VIEWONCE TOGGLE
// ============================================
cmd({
    pattern: "autoview",
    alias: ["autovv", "autoreveal"],
    desc: "Toggle auto-reveal view-once messages",
    category: "owner",
    react: "⚙️",
    filename: __filename
}, async (conn, mek, m, { from, sender, args, isOwner }) => {
    try {
        if (!isOwner) {
            return await conn.sendMessage(from, {
                text: "🚫 *𝙾𝚠𝚗𝚎𝚛-𝚘𝚗𝚕𝚢 𝚌𝚘𝚖𝚖𝚊𝚗𝚍!*",
                contextInfo: getContextInfo({ sender: sender })
            }, { quoted: fkontak });
        }

        const action = args[0]?.toLowerCase();
        let status = '';

        if (action === 'on') {
            config.AUTO_VIEWONCE = true;
            status = '✅ *𝙴𝚗𝚊𝚋𝚕𝚎𝚍*';
        } else if (action === 'off') {
            config.AUTO_VIEWONCE = false;
            status = '❌ *𝙳𝚒𝚜𝚊𝚋𝚕𝚎𝚍*';
        } else {
            status = config.AUTO_VIEWONCE ? '✅ *𝙴𝚗𝚊𝚋𝚕𝚎𝚍*' : '❌ *𝙳𝚒𝚜𝚊𝚋𝚕𝚎𝚍*';
        }

        await conn.sendMessage(from, {
            text: `*╭━━━〔 ⚙️ 𝙰𝚄𝚃𝙾 𝚅𝙸𝙴𝚆 〕━━━┈⊷*
*┃🐢│*
*┃🐢│ 𝙰𝚞𝚝𝚘 𝚁𝚎𝚟𝚎𝚊𝚕: ${status}*
*┃🐢│*
*┃🐢│ 𝚄𝚜𝚊𝚐𝚎:*
*┃🐢│ .𝚊𝚞𝚝𝚘𝚟𝚒𝚎𝚠 𝚘𝚗  - 𝙴𝚗𝚊𝚋𝚕𝚎*
*┃🐢│ .𝚊𝚞𝚝𝚘𝚟𝚒𝚎𝚠 𝚘𝚏𝚏 - 𝙳𝚒𝚜𝚊𝚋𝚕𝚎*
*┃🐢│*
*╰━━━━━━━━━━━━━━━┈⊷*

> ${config.BOT_FOOTER}`,
            contextInfo: getContextInfo({ sender: sender })
        }, { quoted: fkontak });

    } catch (error) {
        console.error('Autoview error:', error);
        await conn.sendMessage(from, {
            text: `❌ *𝙴𝚛𝚛𝚘𝚛:* ${error.message}`,
            contextInfo: getContextInfo({ sender: sender })
        }, { quoted: fkontak });
    }
});
