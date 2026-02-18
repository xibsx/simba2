const { cmd } = global;
const config = require('../config');
const { fkontak, getContextInfo } = require('../lib/functions');
const os = require('os');
const axios = require('axios');

cmd({
    pattern: "alive",
    alias: ["bot", "status", "test"],
    desc: "Premium alive command with interactive buttons",
    category: "general",
    react: "🔮",
    filename: __filename
}, async (conn, mek, m, { from, sender, isOwner, prefix, args }) => {
    try {
        // Send typing indicator
        await conn.sendPresenceUpdate('composing', from);
        
        // Send reaction
        await conn.sendMessage(from, { 
            react: { text: '🔮', key: mek.key } 
        });

        // Get stats
        const startTime = global.socketCreationTime?.get(sender.split('@')[0]) || Date.now();
        const uptime = Math.floor((Date.now() - startTime) / 1000);
        const hours = Math.floor(uptime / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = uptime % 60;
        
        const usedMemory = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
        const totalMemory = Math.round(os.totalmem() / 1024 / 1024);
        const freeMemory = Math.round(os.freemem() / 1024 / 1024);
        const cpuCount = os.cpus().length;
        const platform = os.platform();
        const activeCount = global.activeSockets?.size || 0;

        // Format uptime string
        const uptimeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        // ============================================
        // 📌 CREATE INTERACTIVE BUTTON MESSAGE (Template)
        // ============================================
        const buttons = [
            {
                name: "quick_reply",
                buttonParamsJson: JSON.stringify({
                    display_text: "📋 𝙼𝙴𝙽𝚄",
                    id: `${prefix || config.PREFIX}menu`
                })
            },
            {
                name: "quick_reply",
                buttonParamsJson: JSON.stringify({
                    display_text: "📍 𝙿𝙸𝙽𝙶",
                    id: `${prefix || config.PREFIX}ping`
                })
            },
            {
                name: "quick_reply",
                buttonParamsJson: JSON.stringify({
                    display_text: "📊 𝚂𝚃𝙰𝚃𝚂",
                    id: `${prefix || config.PREFIX}bot_stats`
                })
            },
            {
                name: "quick_reply",
                buttonParamsJson: JSON.stringify({
                    display_text: "👑 𝙾𝚆𝙽𝙴𝚁",
                    id: `${prefix || config.PREFIX}owner`
                })
            }
        ];

        // Send image first
        await conn.sendMessage(from, {
            image: { url: config.IMAGE_PATH },
            caption: `╔══━━━〔 🐢 𝙰𝙻𝙸𝚅𝙴 〕━━━══╗
┃
┃   🔮 *${config.BOT_NAME}*
┃   ⚡ 𝚅𝙴𝚁𝚂𝙸𝙾𝙽: ${config.version}
┃   🕒 𝚄𝙿𝚃𝙸𝙼𝙴: ${uptimeStr}
┃   💾 𝚁𝙰𝙼: ${usedMemory}MB / ${totalMemory}MB
┃   📊 𝙲𝙿𝚄: ${cpuCount} Core
┃   🌐 𝙿𝙻𝙰𝚃𝙵𝙾𝚁𝙼: ${platform}
┃   👥 𝙰𝙲𝚃𝙸𝚅𝙴: ${activeCount}
┃
╚══━━━〔 🐢 𝚂𝙴𝙻𝙴𝙲𝚃 〕━━━══╝`,
            contextInfo: getContextInfo({ sender: sender })
        }, { quoted: fkontak });

        // Send interactive buttons
        const buttonMessage = {
            text: `*⚡ 𝚀𝚄𝙸𝙲𝙺 𝙰𝙲𝚃𝙸𝙾𝙽𝚂*\n\n𝙿𝚛𝚎𝚜𝚜 𝚊 𝚋𝚞𝚝𝚝𝚘𝚗 𝚝𝚘 𝚎𝚡𝚎𝚌𝚞𝚝𝚎 𝚌𝚘𝚖𝚖𝚊𝚗𝚍:`,
            footer: config.BOT_FOOTER,
            buttons: buttons,
            headerType: 1,
            viewOnce: true,
            contextInfo: getContextInfo({ sender: sender })
        };

        await conn.sendMessage(from, buttonMessage, { quoted: fkontak });

        // ============================================
        // 📌 HANDLE BUTTON RESPONSE (In case of direct click)
        // ============================================
        // Buttons automatically trigger commands because ID contains prefix + command

    } catch (error) {
        console.error('Alive premium error:', error);
        
        // Ultra simple fallback
        await conn.sendMessage(from, {
            text: `╔══━━━〔 🐢 𝙰𝙻𝙸𝚅𝙴 〕━━━══╗
┃
┃   🔮 *${config.BOT_NAME} 𝙸𝚂 𝙾𝙽𝙻𝙸𝙽𝙴*
┃   📌 𝙿𝚛𝚎𝚏𝚒𝚡: ${prefix || config.PREFIX || 'None'}
┃
┃   📋 𝙼𝚎𝚗𝚞: ${prefix || config.PREFIX}menu
┃   📍 𝙿𝚒𝚗𝚐: ${prefix || config.PREFIX}ping
┃
╚══━━━〔 🐢 𝚃𝙷𝙰𝙽𝙺𝚂 〕━━━══╝

> ${config.BOT_FOOTER}`,
            contextInfo: getContextInfo({ sender: sender })
        }, { quoted: fkontak });
    }
});
