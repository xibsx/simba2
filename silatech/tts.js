const { cmd } = global;
const config = require('../config');
const { fkontak, getContextInfo } = require('../lib/functions');
const axios = require('axios');
const googleTTS = require('google-tts-api');

cmd({
    pattern: "tts",
    alias: ["say", "speak", "voice"],
    desc: "Convert text to speech (any language)",
    category: "tools",
    react: "🔊",
    filename: __filename
}, async (conn, mek, m, { from, sender, args }) => {
    try {
        const text = args.join(' ');
        
        if (!text) {
            return await conn.sendMessage(from, {
                text: `🔊 Usage: .tts <text>\n\nExample: .tts Hello World\n.say Assalamualaikum`,
                contextInfo: getContextInfo({ sender: sender })
            }, { quoted: fkontak });
        }

        const ttsUrl = googleTTS.getAudioUrl(text, {
            lang: 'en',
            slow: false,
            host: "https://translate.google.com",
        });

        const response = await axios.get(ttsUrl, { 
            responseType: "arraybuffer",
            timeout: 30000
        });
        
        const audioBuffer = Buffer.from(response.data, "binary");

        await conn.sendMessage(from, {
            audio: audioBuffer,
            mimetype: "audio/mp4",
            ptt: false,
            contextInfo: getContextInfo({ sender: sender })
        }, { quoted: fkontak });

        await conn.sendMessage(from, {
            react: { text: '🔊', key: mek.key }
        });

    } catch (error) {
        console.error('TTS error:', error);
        await conn.sendMessage(from, {
            text: `❌ Failed: ${error.message}`,
            contextInfo: getContextInfo({ sender: sender })
        }, { quoted: fkontak });
    }
});