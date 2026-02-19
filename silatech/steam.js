const { cmd } = global;
const config = require('../config');
const { fkontak, getContextInfo } = require('../lib/functions');
const axios = require('axios');

cmd({
    pattern: "steam",
    alias: ["steamgame", "steamsearch", "game"],
    desc: "Search for games on Steam",
    category: "search",
    react: "🎮",
    filename: __filename
}, async (conn, mek, m, { from, sender, args }) => {
    try {
        const query = args.join(' ');
        
        if (!query) {
            return await conn.sendMessage(from, {
                text: `🎮 *𝙷𝚘𝚠 𝚝𝚘 𝚞𝚜𝚎 𝚜𝚝𝚎𝚊𝚖 𝚌𝚘𝚖𝚖𝚊𝚗𝚍:*\n\n` +
                      `.𝚜𝚝𝚎𝚊𝚖 <𝚐𝚊𝚖𝚎 𝚗𝚊𝚖𝚎>\n\n` +
                      `𝙴𝚡𝚊𝚖𝚙𝚕𝚎:\n` +
                      `.𝚜𝚝𝚎𝚊𝚖 𝙼𝚒𝚗𝚎𝚌𝚛𝚊𝚏𝚝\n` +
                      `.𝚜𝚝𝚎𝚊𝚖 𝙲𝚢𝚋𝚎𝚛𝚙𝚞𝚗𝚔 2077`,
                contextInfo: getContextInfo({ sender: sender })
            }, { quoted: fkontak });
        }

        // Send searching message
        await conn.sendMessage(from, {
            text: `*🔍 𝚂𝚎𝚊𝚛𝚌𝚑𝚒𝚗𝚐 𝚏𝚘𝚛 "${query}" 𝚘𝚗 𝚂𝚝𝚎𝚊𝚖...*`,
            contextInfo: getContextInfo({ sender: sender })
        }, { quoted: fkontak });

        // Call the API (without API key as per your example)
        const apiUrl = `https://gtech-api-xtp1.onrender.com/api/apk/steam?q=${encodeURIComponent(query)}&apikey=APIKEY`;
        
        const response = await axios.get(apiUrl, { 
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        
        // Check if the response has the expected structure
        if (!response.data || !response.data.status) {
            // If the API returns false status, try to show whatever data is available
            if (response.data?.result) {
                // Continue with the result if available
            } else {
                throw new Error(response.data?.message || 'Game not found');
            }
        }

        const game = response.data.result;

        // Format developers and publishers (with fallbacks)
        const developers = game.developers?.join(', ') || 'Not specified';
        const publishers = game.publishers?.join(', ') || 'Not specified';

        // Create caption
        const caption = `*╭━━━〔 🎮 𝚂𝚃𝙴𝙰𝙼 𝙶𝙰𝙼𝙴 〕━━━┈⊷*
*┃🐢│*
*┃🐢│ 🎯 𝙽𝚊𝚖𝚎: ${game.name || 'Unknown'}*
*┃🐢│ 📦 𝚃𝚢𝚙𝚎: ${game.type || 'Game'}*
*┃🐢│ 💰 𝙿𝚛𝚒𝚌𝚎: ${game.price || 'Free/Unknown'}*
*┃🐢│ 🎮 𝙲𝚘𝚗𝚝𝚛𝚘𝚕𝚕𝚎𝚛: ${game.controller_support || 'Not specified'}*
*┃🐢│*
*┃🐢│ 👨‍💻 𝙳𝚎𝚟𝚎𝚕𝚘𝚙𝚎𝚛𝚜: ${developers}*
*┃🐢│ 🏢 𝙿𝚞𝚋𝚕𝚒𝚜𝚑𝚎𝚛𝚜: ${publishers}*
*┃🐢│*
*┃🐢│ 📝 𝙳𝚎𝚜𝚌𝚛𝚒𝚙𝚝𝚒𝚘𝚗:*
*┃🐢│ ${game.description?.substring(0, 200) || 'No description available'}${game.description?.length > 200 ? '...' : ''}*
*┃🐢│*
*┃🐢│ 🌐 𝚆𝚎𝚋𝚜𝚒𝚝𝚎: ${game.website || 'N/A'}*
*┃🐢│*
*╰━━━━━━━━━━━━━━━┈⊷*

> ${config.BOT_FOOTER}`;

        // Send game info with banner or thumbnail
        await conn.sendMessage(from, {
            image: { url: game.banner || game.thumbnail || config.IMAGE_PATH },
            caption: caption,
            contextInfo: getContextInfo({ sender: sender })
        }, { quoted: fkontak });

        // Send reaction
        await conn.sendMessage(from, {
            react: { text: '🎮', key: mek.key }
        });

    } catch (error) {
        console.error('Steam command error:', error);
        
        let errorMessage = '𝙶𝚊𝚖𝚎 𝚗𝚘𝚝 𝚏𝚘𝚞𝚗𝚍. 𝙿𝚕𝚎𝚊𝚜𝚎 𝚝𝚛𝚢 𝚊𝚗𝚘𝚝𝚑𝚎𝚛 𝚗𝚊𝚖𝚎.';
        
        if (error.message.includes('timeout')) {
            errorMessage = '𝚁𝚎𝚚𝚞𝚎𝚜𝚝 𝚝𝚒𝚖𝚎𝚍 𝚘𝚞𝚝. 𝚃𝚛𝚢 𝚊𝚐𝚊𝚒𝚗.';
        } else if (error.message.includes('404')) {
            errorMessage = '𝙰𝙿𝙸 𝚎𝚗𝚍𝚙𝚘𝚒𝚗𝚝 𝚗𝚘𝚝 𝚏𝚘𝚞𝚗𝚍.';
        } else if (error.message.includes('Network')) {
            errorMessage = '𝙽𝚎𝚝𝚠𝚘𝚛𝚔 𝚎𝚛𝚛𝚘𝚛. 𝙲𝚑𝚎𝚌𝚔 𝚢𝚘𝚞𝚛 𝚒𝚗𝚝𝚎𝚛𝚗𝚎𝚝.';
        }

        await conn.sendMessage(from, {
            text: `❌ *𝙴𝚛𝚛𝚘𝚛:* ${errorMessage}`,
            contextInfo: getContextInfo({ sender: sender })
        }, { quoted: fkontak });

        await conn.sendMessage(from, {
            react: { text: '❌', key: mek.key }
        });
    }
});
