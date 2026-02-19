const { cmd } = global;
const config = require('../config');
const { fkontak, getContextInfo } = require('../lib/functions');
const fs = require('fs-extra');
const path = require('path');

// Path ya features file
const featuresPath = path.join(__dirname, '..', 'database', 'features.json');

// Hakikisha folder ipo
if (!fs.existsSync(path.join(__dirname, '..', 'database'))) {
    fs.mkdirSync(path.join(__dirname, '..', 'database'), { recursive: true });
}

// Create features file if not exists
if (!fs.existsSync(featuresPath)) {
    fs.writeFileSync(featuresPath, JSON.stringify({ AUTO_BIO: 'yes' }, null, 2));
}

cmd({
    pattern: "autobio",
    alias: ["autobios", "bio"],
    desc: "Toggle Auto Bio feature (on/off)",
    category: "owner",
    react: "🔁",
    filename: __filename
}, async (conn, mek, m, { from, sender, args, isOwner, prefix }) => {
    try {
        // Check if user is owner
        if (!isOwner) {
            return await conn.sendMessage(from, {
                text: "🚫 *𝙾𝚗𝚕𝚢 𝚋𝚘𝚝 𝚘𝚠𝚗𝚎𝚛 𝚌𝚊𝚗 𝚞𝚜𝚎 𝚝𝚑𝚒𝚜 𝚌𝚘𝚖𝚖𝚊𝚗𝚍!*",
                contextInfo: getContextInfo({ sender: sender })
            }, { quoted: fkontak });
        }

        // Read current features
        let features = {};
        try {
            features = JSON.parse(fs.readFileSync(featuresPath, 'utf8'));
        } catch (error) {
            features = { AUTO_BIO: 'yes' };
        }

        const key = 'AUTO_BIO';
        const current = features[key] || 'yes';

        // If no argument, show buttons
        if (!args || args.length === 0) {
            const buttons = [
                { 
                    buttonId: `${prefix}autobio on`, 
                    buttonText: { displayText: '✅ 𝙾𝙽' }, 
                    type: 1 
                },
                { 
                    buttonId: `${prefix}autobio off`, 
                    buttonText: { displayText: '❌ 𝙾𝙵𝙵' }, 
                    type: 1 
                }
            ];

            const caption = `*╭━━━〔 🔁 𝙰𝚄𝚃𝙾 𝙱𝙸𝙾 〕━━━┈⊷*\n*┃*\n*┃ 📌 𝙲𝚞𝚛𝚛𝚎𝚗𝚝 𝚂𝚝𝚊𝚝𝚞𝚜: ${current === 'yes' ? '✅ 𝙴𝙽𝙰𝙱𝙻𝙴𝙳' : '❌ 𝙳𝙸𝚂𝙰𝙱𝙻𝙴𝙳'}*\n*┃*\n*┃ 𝙿𝚕𝚎𝚊𝚜𝚎 𝚜𝚎𝚕𝚎𝚌𝚝 𝚊𝚗 𝚘𝚙𝚝𝚒𝚘𝚗 𝚋𝚎𝚕𝚘𝚠:*\n*┃*\n*╰━━━━━━━━━━━━━━━┈⊷*`;

            const buttonMessage = {
                image: { url: config.IMAGE_PATH },
                caption: caption,
                footer: config.BOT_FOOTER,
                buttons: buttons,
                headerType: 4,
                contextInfo: getContextInfo({ sender: sender })
            };

            await conn.sendMessage(from, buttonMessage, { quoted: fkontak });
            return;
        }

        // Process the argument
        let next = current;
        const action = args[0].toString().toLowerCase();

        if (action === 'on' || action === 'yes') {
            next = 'yes';
        } else if (action === 'off' || action === 'no') {
            next = 'no';
        } else {
            return await conn.sendMessage(from, {
                text: `❌ *𝙸𝚗𝚟𝚊𝚕𝚒𝚍 𝚘𝚙𝚝𝚒𝚘𝚗!*\n\n𝚄𝚜𝚎: .autobio on 𝚘𝚛 .autobio off`,
                contextInfo: getContextInfo({ sender: sender })
            }, { quoted: fkontak });
        }

        // Update features file
        features[key] = next;
        fs.writeFileSync(featuresPath, JSON.stringify(features, null, 2));

        // Update config (optional)
        if (next === 'yes') {
            config.AUTO_BIO = 'true';
        } else {
            config.AUTO_BIO = 'false';
        }

        // Send confirmation
        await conn.sendMessage(from, {
            text: `*╭━━━〔 ✅ 𝚄𝙿𝙳𝙰𝚃𝙴𝙳 〕━━━┈⊷*\n*┃*\n*┃ 🔁 𝙰𝚄𝚃𝙾 𝙱𝙸𝙾*\n*┃*\n*┃ 📌 𝙽𝚎𝚠 𝚂𝚝𝚊𝚝𝚞𝚜: ${next === 'yes' ? '✅ 𝙴𝙽𝙰𝙱𝙻𝙴𝙳' : '❌ 𝙳𝙸𝚂𝙰𝙱𝙻𝙴𝙳'}*\n*┃*\n*┃ 👤 𝙱𝚢: @${sender.split('@')[0]}*\n*┃*\n*╰━━━━━━━━━━━━━━━┈⊷*\n\n${config.BOT_FOOTER}`,
            contextInfo: getContextInfo({ sender: sender, mentionedJid: [sender] })
        }, { quoted: fkontak });

        // Send reaction
        await conn.sendMessage(from, {
            react: { text: next === 'yes' ? '✅' : '❌', key: mek.key }
        });

    } catch (error) {
        console.error('Autobio command error:', error);
        await conn.sendMessage(from, {
            text: `❌ *𝙴𝚛𝚛𝚘𝚛:* ${error.message}`,
            contextInfo: getContextInfo({ sender: sender })
        }, { quoted: fkontak });
    }
});
