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
                text: "🚫 *𝙾𝚠𝚗𝚎𝚛-𝚘𝚗𝚕𝚢 𝚌𝚘𝚖𝚖𝚊𝚗𝚍!*",
                contextInfo: getContextInfo({ sender: sender })
            }, { quoted: fkontak });
        }

        const action = args[0]?.toLowerCase() || 'status';
        const settings = await getChatbotSettings();
        let statusText = "";

        switch (action) {
            case 'on':
                if (settings.global.enabled) {
                    statusText = "📌 𝙲𝚑𝚊𝚝𝚋𝚘𝚝 𝚒𝚜 𝚊𝚕𝚛𝚎𝚊𝚍𝚢 *𝙴𝙽𝙰𝙱𝙻𝙴𝙳*!";
                } else {
                    await toggleChatbot(true);
                    statusText = "✅ 𝙲𝚑𝚊𝚝𝚋𝚘𝚝 𝚑𝚊𝚜 𝚋𝚎𝚎𝚗 *𝙴𝙽𝙰𝙱𝙻𝙴𝙳*!";
                }
                break;

            case 'off':
                if (!settings.global.enabled) {
                    statusText = "📌 𝙲𝚑𝚊𝚝𝚋𝚘𝚝 𝚒𝚜 𝚊𝚕𝚛𝚎𝚊𝚍𝚢 *𝙳𝙸𝚂𝙰𝙱𝙻𝙴𝙳*!";
                } else {
                    await toggleChatbot(false);
                    statusText = "❌ 𝙲𝚑𝚊𝚝𝚋𝚘𝚝 𝚑𝚊𝚜 𝚋𝚎𝚎𝚗 *𝙳𝙸𝚂𝙰𝙱𝙻𝙴𝙳*!";
                }
                break;

            default:
                statusText = `📌 𝙲𝚑𝚊𝚝𝚋𝚘𝚝 𝚂𝚝𝚊𝚝𝚞𝚜: ${settings.global.enabled ? "✅ *𝙴𝙽𝙰𝙱𝙻𝙴𝙳*" : "❌ *𝙳𝙸𝚂𝙰𝙱𝙻𝙴𝙳*"}`;
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
