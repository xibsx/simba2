const { cmd } = global;
const config = require('../config');
const { fkontak, getContextInfo, downloadMediaMessage } = require('../lib/functions');
const fs = require('fs-extra');
const path = require('path');
const Jimp = require('jimp');

cmd({
    pattern: "setpp",
    alias: ["setprofile", "setpic", "setphoto"],
    desc: "Set profile picture (bot/user/group)",
    category: "owner",
    react: "🖼️",
    filename: __filename
}, async (conn, mek, m, { from, sender, args, isOwner, isGroup }) => {
    try {
        if (!mek.quoted && !mek.message?.imageMessage) {
            return await conn.sendMessage(from, {
                text: `📌 How to use setpp\n\n` +
                      `1️⃣ Set Bot Profile\n` +
                      `   Reply to an image with: .setpp bot\n\n` +
                      `2️⃣ Set Your Profile\n` +
                      `   Reply to an image with: .setpp me\n\n` +
                      `3️⃣ Set Group Profile\n` +
                      `   Reply to an image with: .setpp group`,
                contextInfo: getContextInfo({ sender: sender })
            }, { quoted: fkontak });
        }

        const target = args[0]?.toLowerCase() || '';
        
        if (target === 'bot' && !isOwner) {
            return await conn.sendMessage(from, {
                text: "🚫 Only bot owner can change bot profile!",
                contextInfo: getContextInfo({ sender: sender })
            }, { quoted: fkontak });
        }

        if (target === 'group' && !isGroup) {
            return await conn.sendMessage(from, {
                text: "🚫 This command can only be used in groups!",
                contextInfo: getContextInfo({ sender: sender })
            }, { quoted: fkontak });
        }

        if (target === 'group' && !isOwner && !await isGroupAdmin(conn, from, sender)) {
            return await conn.sendMessage(from, {
                text: "🚫 Only group admins can change group profile!",
                contextInfo: getContextInfo({ sender: sender })
            }, { quoted: fkontak });
        }

        let media;
        let mediaPath;
        
        try {
            if (mek.quoted) {
                media = await downloadMediaMessage(mek.quoted, 'buffer');
                mediaPath = await downloadMediaMessage(mek.quoted, `temp_pp_${Date.now()}`, true);
            } else {
                media = await downloadMediaMessage(mek, 'buffer');
                mediaPath = await downloadMediaMessage(mek, `temp_pp_${Date.now()}`, true);
            }
        } catch (error) {
            console.error('Download error:', error);
            return await conn.sendMessage(from, {
                text: "❌ Failed to download image!",
                contextInfo: getContextInfo({ sender: sender })
            }, { quoted: fkontak });
        }

        if (!media) {
            return await conn.sendMessage(from, {
                text: "❌ Invalid image!",
                contextInfo: getContextInfo({ sender: sender })
            }, { quoted: fkontak });
        }

        let processedImage;
        try {
            const image = await Jimp.read(mediaPath || media);
            await image.resize(640, 640);
            processedImage = await image.getBufferAsync(Jimp.MIME_JPEG);
        } catch (error) {
            console.error('Image processing error:', error);
            processedImage = media;
        }

        let successMessage = '';
        
        switch (target) {
            case 'bot':
                await conn.updateProfilePicture(conn.user.id, processedImage);
                successMessage = `✅ Bot profile picture updated!`;
                config.BOT_IMAGE = 'updated';
                break;

            case 'me':
                await conn.updateProfilePicture(sender, processedImage);
                successMessage = `✅ Your profile picture has been updated!`;
                break;

            case 'group':
                await conn.updateProfilePicture(from, processedImage);
                successMessage = `✅ Group profile picture has been updated!`;
                break;

            default:
                return await conn.sendMessage(from, {
                    text: `❌ Invalid target!\n\nUse: .setpp bot, .setpp me, or .setpp group`,
                    contextInfo: getContextInfo({ sender: sender })
                }, { quoted: fkontak });
        }

        if (mediaPath && fs.existsSync(mediaPath)) {
            fs.unlinkSync(mediaPath);
        }

        await conn.sendMessage(from, {
            image: processedImage,
            caption: `${successMessage}\n\n> ${config.BOT_FOOTER}`,
            contextInfo: getContextInfo({ sender: sender })
        }, { quoted: fkontak });

        await conn.sendMessage(from, {
            react: { text: '✅', key: mek.key }
        });

    } catch (error) {
        console.error('Setpp command error:', error);
        
        if (mediaPath && fs.existsSync(mediaPath)) {
            fs.unlinkSync(mediaPath);
        }

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