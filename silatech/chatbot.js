const { cmd } = global;
const config = require('../config');
const { fkontak, getContextInfo } = require('../lib/functions');
const { toggleChatbot, getChatbotSettings } = require('../lib/database');

cmd({
    pattern: "chatbot",
    alias: ["ai", "autochat"],
    desc: "Toggle AI Chatbot feature",
    category: "owner",
    react: "🤖",
    filename: __filename
}, async (conn, mek, m, { from, sender, args, isOwner }) => {
    try {
        if (!isOwner) {
            return await conn.sendMessage(from, {
                text: "🚫 Owner-only command!",
                contextInfo: getContextInfo({ sender: sender })
            }, { quoted: fkontak });
        }

        const action = args[0]?.toLowerCase() || 'status';
        const settings = await getChatbotSettings();
        let statusText = "";

        switch (action) {
            case 'on':
                if (settings.global.enabled) {
                    statusText = "📌 Chatbot is already ENABLED!";
                } else {
                    await toggleChatbot(true);
                    statusText = "✅ Chatbot has been ENABLED!";
                }
                break;

            case 'off':
                if (!settings.global.enabled) {
                    statusText = "📌 Chatbot is already DISABLED!";
                } else {
                    await toggleChatbot(false);
                    statusText = "❌ Chatbot has been DISABLED!";
                }
                break;

            default:
                statusText = `📌 Chatbot Status: ${settings.global.enabled ? "✅ ENABLED" : "❌ DISABLED"}`;
                break;
        }

        await conn.sendMessage(from, {
            image: { url: config.IMAGE_PATH },
            caption: `${statusText}\n\n> ${config.BOT_FOOTER}`,
            contextInfo: getContextInfo({ sender: sender })
        }, { quoted: fkontak });

        await conn.sendMessage(from, {
            react: { text: action === 'on' ? '✅' : action === 'off' ? '❌' : 'ℹ️', key: mek.key }
        });

    } catch (error) {
        console.error("Chatbot command error:", error);
        await conn.sendMessage(from, {
            text: `⚠️ Error: ${error.message}`,
            contextInfo: getContextInfo({ sender: sender })
        }, { quoted: fkontak });
    }
});