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
        if (!mek.quoted) {
            return await conn.sendMessage(from, {
                text: `👁️ How to use viewonce command:\n\n` +
                      `1️⃣ Reply to a view-once message\n` +
                      `   ${prefix}${command}\n\n` +
                      `2️⃣ Example:\n` +
                      `   Reply to a view-once image/video/audio and type .vv\n\n` +
                      `⚠️ Note: This works only for view-once media!`,
                contextInfo: getContextInfo({ sender: sender })
            }, { quoted: fkontak });
        }

        const quotedMsg = mek.quoted;
        const quotedMessage = quotedMsg.message || {};
        
        let mediaMessage = null;
        let mediaType = null;
        let viewOnce = false;

        if (quotedMessage.viewOnceMessageV2) {
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
            mediaMessage = quotedMessage.imageMessage;
            mediaType = 'image';
            viewOnce = true;
        }
        else if (quotedMessage.videoMessage?.viewOnce) {
            mediaMessage = quotedMessage.videoMessage;
            mediaType = 'video';
            viewOnce = true;
        }
        else if (quotedMessage.audioMessage?.viewOnce) {
            mediaMessage = quotedMessage.audioMessage;
            mediaType = 'audio';
            viewOnce = true;
        }

        if (!viewOnce || !mediaMessage) {
            return await conn.sendMessage(from, {
                text: `❌ This is not a view-once message!\n\nPlease reply to a valid view-once image, video, or audio.`,
                contextInfo: getContextInfo({ sender: sender })
            }, { quoted: fkontak });
        }

        await conn.sendMessage(from, {
            text: `┏╾─────────── VIEW ONCE ───────────╼
╿
├⟐ Detected: ${mediaType.toUpperCase()}
├⟐ Processing...
╽
┗╾───────────`,
            contextInfo: getContextInfo({ sender: sender })
        }, { quoted: fkontak });

        let mediaBuffer;
        let mediaPath;
        
        try {
            if (quotedMessage.viewOnceMessageV2 || quotedMessage.viewOnceMessage) {
                const realMsg = {
                    key: quotedMsg.key,
                    message: mediaMessage
                };
                mediaBuffer = await downloadMediaMessage(realMsg, 'buffer');
                mediaPath = await downloadMediaMessage(realMsg, `viewonce_${Date.now()}`, true);
            } else {
                mediaBuffer = await downloadMediaMessage(quotedMsg, 'buffer');
                mediaPath = await downloadMediaMessage(quotedMsg, `viewonce_${Date.now()}`, true);
            }
        } catch (downloadError) {
            console.error('Download error:', downloadError);
            
            try {
                const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
                const stream = await downloadContentFromMessage(mediaMessage, mediaType);
                let buffer = Buffer.from([]);
                for await (const chunk of stream) {
                    buffer = Buffer.concat([buffer, chunk]);
                }
                mediaBuffer = buffer;
                
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

        const caption = mediaMessage.caption || '';

        const successMessage = `┏╾─────────── REVEALED ───────────╼
╿
├⟐ Type: ${mediaType.toUpperCase()}
├⟐ Size: ${(mediaBuffer.length / 1024 / 1024).toFixed(2)} MB
╿
├⟐ Caption: ${caption || 'No caption'}
╿
├⟐ Revealed by: @${sender.split('@')[0]}
╽
┗╾───────────

> ${config.BOT_FOOTER}`;

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
            
            await conn.sendMessage(from, {
                text: successMessage,
                mentions: [sender],
                contextInfo: getContextInfo({ sender: sender, mentionedJid: [sender] })
            }, { quoted: fkontak });
        }

        if (args.includes('--doc') || args.includes('--document')) {
            const ext = mediaType === 'image' ? 'jpg' : mediaType === 'video' ? 'mp4' : 'mp3';
            const filename = `viewonce_${Date.now()}.${ext}`;
            
            await conn.sendMessage(from, {
                document: mediaBuffer,
                mimetype: mediaType === 'image' ? 'image/jpeg' : mediaType === 'video' ? 'video/mp4' : 'audio/mpeg',
                fileName: filename,
                caption: `📁 Saved ${mediaType.toUpperCase()}\n\n${caption}`,
                contextInfo: getContextInfo({ sender: sender })
            }, { quoted: fkontak });
        }

        await conn.sendMessage(from, {
            react: { text: '✅', key: mek.key }
        });

        if (mediaPath && fs.existsSync(mediaPath)) {
            fs.unlinkSync(mediaPath);
        }

    } catch (error) {
        console.error('Viewonce command error:', error);
        
        if (mediaPath && fs.existsSync(mediaPath)) {
            fs.unlinkSync(mediaPath);
        }

        let errorMessage = error.message;
        if (error.message.includes('decrypt')) {
            errorMessage = 'Failed to decrypt the message. It may have expired.';
        } else if (error.message.includes('size')) {
            errorMessage = 'File is too large to process.';
        }

        await conn.sendMessage(from, {
            text: `❌ Failed to reveal view-once message:\n\n${errorMessage}`,
            contextInfo: getContextInfo({ sender: sender })
        }, { quoted: fkontak });

        await conn.sendMessage(from, {
            react: { text: '❌', key: mek.key }
        });
    }
});

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
                text: "🚫 Owner-only command!",
                contextInfo: getContextInfo({ sender: sender })
            }, { quoted: fkontak });
        }

        await conn.sendMessage(from, {
            text: "🔍 Searching for view-once messages...",
            contextInfo: getContextInfo({ sender: sender })
        }, { quoted: fkontak });

        await conn.sendMessage(from, {
            text: "✅ Feature coming soon!",
            contextInfo: getContextInfo({ sender: sender })
        }, { quoted: fkontak });

    } catch (error) {
        console.error('Viewonce all error:', error);
        await conn.sendMessage(from, {
            text: `❌ Error: ${error.message}`,
            contextInfo: getContextInfo({ sender: sender })
        }, { quoted: fkontak });
    }
});

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
                text: "🚫 Owner-only command!",
                contextInfo: getContextInfo({ sender: sender })
            }, { quoted: fkontak });
        }

        const action = args[0]?.toLowerCase();
        let status = '';

        if (action === 'on') {
            config.AUTO_VIEWONCE = true;
            status = '✅ Enabled';
        } else if (action === 'off') {
            config.AUTO_VIEWONCE = false;
            status = '❌ Disabled';
        } else {
            status = config.AUTO_VIEWONCE ? '✅ Enabled' : '❌ Disabled';
        }

        await conn.sendMessage(from, {
            text: `┏╾─────────── AUTO VIEW ───────────╼
╿
├⟐ Auto Reveal: ${status}
╿
├⟐ Usage:
├⟐ .autoview on  - Enable
├⟐ .autoview off - Disable
╽
┗╾───────────

> ${config.BOT_FOOTER}`,
            contextInfo: getContextInfo({ sender: sender })
        }, { quoted: fkontak });

    } catch (error) {
        console.error('Autoview error:', error);
        await conn.sendMessage(from, {
            text: `❌ Error: ${error.message}`,
            contextInfo: getContextInfo({ sender: sender })
        }, { quoted: fkontak });
    }
});