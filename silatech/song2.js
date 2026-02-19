const { cmd } = global;
const config = require('../config');
const { fkontak, getContextInfo } = require('../lib/functions');
const axios = require('axios');

cmd({
    pattern: "song",
    alias: ["ytmp3", "ytaudio"],
    desc: "Download YouTube audio (MP3)",
    category: "download",
    react: "🎵",
    filename: __filename
}, async (conn, mek, m, { from, sender, args, prefix }) => {
    try {
        const query = args.join(' ');
        
        if (!query) {
            return await conn.sendMessage(from, {
                text: `🎵 *Song Downloader*\n\n` +
                      `Usage: ${prefix}song2 <song name or URL>\n\n` +
                      `Example: ${prefix}song2 Adele Hello`,
                contextInfo: getContextInfo({ sender: sender })
            }, { quoted: fkontak });
        }

        await conn.sendMessage(from, {
            text: `🔍 *Searching:* ${query}`,
            contextInfo: getContextInfo({ sender: sender })
        }, { quoted: fkontak });

        // Search for video
        const searchApi = `https://weeb-api.vercel.app/ytsearch?query=${encodeURIComponent(query)}`;
        const searchRes = await axios.get(searchApi);
        
        if (!searchRes.data || searchRes.data.length === 0) {
            throw new Error('No results found');
        }
        
        const video = searchRes.data[0];
        const videoId = video.id;
        const videoTitle = video.title;
        const videoThumb = video.thumbnail;
        const videoDuration = video.timestamp || 'Unknown';

        // Send info with thumbnail
        await conn.sendMessage(from, {
            image: { url: videoThumb },
            caption: `🎵 *${videoTitle}*\n⏱️ Duration: ${videoDuration}\n\n📥 *Downloading MP3...*`,
            contextInfo: getContextInfo({ sender: sender })
        }, { quoted: fkontak });

        // Download MP3
        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
        const apiUrl = `https://yt-dl.officialhectormanuel.workers.dev/?url=${encodeURIComponent(videoUrl)}`;
        
        const dlRes = await axios.get(apiUrl, { timeout: 60000 });
        
        if (!dlRes.data) throw new Error('No data from API');
        
        const data = dlRes.data;
        const audioUrl = data.audio || data.mp3 || data.url;
        
        if (!audioUrl) throw new Error('Audio URL not found');
        
        // Download audio file
        const audioRes = await axios.get(audioUrl, { 
            responseType: 'arraybuffer',
            timeout: 120000
        });
        
        const audioBuffer = Buffer.from(audioRes.data);
        const fileSize = (audioBuffer.length / (1024 * 1024)).toFixed(2);
        
        // Send audio
        await conn.sendMessage(from, {
            audio: audioBuffer,
            mimetype: 'audio/mpeg',
            ptt: false,
            contextInfo: getContextInfo({ sender: sender })
        }, { quoted: fkontak });

        await conn.sendMessage(from, {
            text: `✅ *Download complete*\n📊 Size: ${fileSize} MB`,
            contextInfo: getContextInfo({ sender: sender })
        }, { quoted: fkontak });

    } catch (error) {
        console.error('Song2 error:', error);
        await conn.sendMessage(from, {
            text: `❌ *Error:* ${error.message}`,
            contextInfo: getContextInfo({ sender: sender })
        }, { quoted: fkontak });
    }
});
