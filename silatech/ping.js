const { cmd } = global;
const config = require('../config');
const { fkontak, getContextInfo } = require('../lib/functions');

cmd({
    pattern: "ping",
    alias: ["p", "speed"],
    desc: "Check bot response time",
    category: "general",
    react: "📍",
    filename: __filename
}, async (conn, mek, m, { from, sender }) => {
    try {
        const start = Date.now();
        await conn.sendMessage(from, { 
            text: 'Ping...',
            contextInfo: getContextInfo({ sender: sender })
        }, { quoted: fkontak });
        
        const end = Date.now();
        const latency = end - start;
        
        await conn.sendMessage(from, {
            text: `┏╾─────────── PING ───────────╼\n╿\n├⟐ Speed: ${latency}ms\n├⟐ Time: ${new Date().toLocaleString()}\n╽\n┗╾───────────\n\n${config.BOT_FOOTER}`,
            contextInfo: getContextInfo({ sender: sender })
        }, { quoted: fkontak });
        
    } catch (error) {
        console.error('Ping error:', error);
    }
});