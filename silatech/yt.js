const { cmd } = global;
const config = require('../config');
const { fkontak, getContextInfo } = require('../lib/functions');
const axios = require('axios');

cmd({
    pattern: "sila",
    alias: ["silaplay"],
    desc: "YouTube downloader (MP3 or MP4)",
    category: "download",
    react: "📥",
    filename: __filename
}, async (conn, mek, m, { from, sender, args, prefix }) => {
    try {
        const type = args[0]?.toLowerCase();
        const query = args.slice(1).join(' ');
        
        if (!type || !query || (type !== 'mp3' && type !== 'mp4')) {
            return await conn.sendMessage(from, {
                text: `📥 *YouTube Downloader*\n\n` +
                      `*Commands:*\n` +
                      `• ${prefix}sila mp3 <song name> - Download audio\n` +
                      `• ${prefix}sila mp4 <video name> - Download video\n\n` +
                      `*Examples:*\n` +
                      `• ${prefix}sila mp3 Adele Hello\n` +
                      `• ${prefix}sila mp4 FIFA World Cup`,
                contextInfo: getContextInfo({ sender: sender })
            }, { quoted: fkontak });
        }

        await conn.sendMessage(from, {
            text: `🔍 *Searching ${type.toUpperCase()}...*`,
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
            caption: `${type === 'mp3' ? '🎵' : '🎬'} *${videoTitle}*\n⏱️ Duration: ${videoDuration}\n\n📥 *Downloading ${type.toUpperCase()}...*`,
            contextInfo: getContextInfo({ sender: sender })
        }, { quoted: fkontak });

        // Download
        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
        const apiUrl = `https://yt-dl.officialhectormanuel.workers.dev/?url=${encodeURIComponent(videoUrl)}`;
        
        const dlRes = await axios.get(apiUrl, { timeout: 60000 });
        
        if (!dlRes.data) throw new Error('No data from API');
        
        const data = dlRes.data;
        let downloadUrl;
        
        if (type === 'mp3') {
            downloadUrl = data.audio || data.mp3 || data.url;
        } else {
            downloadUrl = data.video || data.mp4 || data.url;
        }
        
        if (!downloadUrl) throw new Error('Download URL not found');
        
        // Download file
        const fileRes = await axios.get(downloadUrl, { 
            responseType: 'arraybuffer',
            timeout: type === 'mp4' ? 180000 : 120000
        });
        
        const fileBuffer = Buffer.from(fileRes.data);
        const fileSize = (fileBuffer.length / (1024 * 1024)).toFixed(2);
        
        if (fileSize > 50) {
            return await conn.sendMessage(from, {
                text: `⚠️ *File too large* (${fileSize} MB)\nMax: 50 MB`,
                contextInfo: getContextInfo({ sender: sender })
            }, { quoted: fkontak });
        }
        
        // Send file
        if (type === 'mp3') {
            await conn.sendMessage(from, {
                audio: fileBuffer,
                mimetype: 'audio/mpeg',
                ptt: false,
                contextInfo: getContextInfo({ sender: sender })
            }, { quoted: fkontak });
        } else {
            await conn.sendMessage(from, {
                video: fileBuffer,
                caption: `🎬 *${videoTitle}*\n📊 Size: ${fileSize} MB\n\n> ${config.BOT_FOOTER}`,
                contextInfo: getContextInfo({ sender: sender })
            }, { quoted: fkontak });
        }

    } catch (error) {
        console.error('SILA error:', error);
        await conn.sendMessage(from, {
            text: `❌ *Error:* ${error.message}`,
            contextInfo: getContextInfo({ sender: sender })
        }, { quoted: fkontak });
    }
});
