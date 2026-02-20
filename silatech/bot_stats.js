const { cmd } = global;
const config = require('../config');
const { fkontak, getContextInfo } = require('../lib/functions');
const os = require('os');

cmd({
    pattern: "bot_stats",
    alias: ["stats", "system"],
    desc: "Show detailed bot statistics",
    category: "general",
    react: "📊",
    filename: __filename
}, async (conn, mek, m, { from, sender }) => {
    try {
        const usedMemory = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
        const totalMemory = Math.round(os.totalmem() / 1024 / 1024);
        const freeMemory = Math.round(os.freemem() / 1024 / 1024);
        const cpuCount = os.cpus().length;
        const cpuModel = os.cpus()[0].model;
        const platform = os.platform();
        const arch = os.arch();
        const hostname = os.hostname();
        const uptime = os.uptime();
        const hours = Math.floor(uptime / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = Math.floor(uptime % 60);
        
        const activeCount = global.activeSockets?.size || 0;
        const commandCount = global.commands?.size || 0;

        const statsText = `┏╾─────────── SYSTEM STATS ───────────╼
╿
├⟐ RAM Usage
├⟐   Used: ${usedMemory} MB
├⟐   Free: ${freeMemory} MB
├⟐   Total: ${totalMemory} MB
╿
├⟐ CPU Info
├⟐   Model: ${cpuModel.substring(0, 30)}...
├⟐   Cores: ${cpuCount}
╿
├⟐ Platform
├⟐   OS: ${platform}
├⟐   Arch: ${arch}
├⟐   Host: ${hostname}
╿
├⟐ Bot Stats
├⟐   Active Sessions: ${activeCount}
├⟐   Commands: ${commandCount}
├⟐   System Uptime: ${hours}h ${minutes}m ${seconds}s
╽
┗╾───────────

> ${config.BOT_FOOTER}`;

        await conn.sendMessage(from, {
            image: { url: config.IMAGE_PATH },
            caption: statsText,
            contextInfo: getContextInfo({ sender: sender })
        }, { quoted: fkontak });

    } catch (error) {
        console.error('Stats error:', error);
        await conn.sendMessage(from, {
            text: `❌ Error: ${error.message}`,
            contextInfo: getContextInfo({ sender: sender })
        }, { quoted: fkontak });
    }
});