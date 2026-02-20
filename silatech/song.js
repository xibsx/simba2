const { cmd } = global;
const config = require('../config');
const { fkontak, getContextInfo, sleep, downloadMediaMessage } = require('../lib/functions');
const axios = require('axios');
const fs = require('fs-extra');

cmd({
    pattern: "song",
    alias: ["yt", "play", "video", "mp3", "mp4", "ytaudio", "ytvideo"],
    desc: "Download YouTube videos/audio",
    category: "download",
    react: "🎵",
    filename: __filename
}, async (conn, mek, m, { from, sender, args, command, prefix }) => {
    try {
        const userInput = args.join(' ');
        
        if (!userInput) {
            return await conn.sendMessage(from, {
                text: `🎵 How to use song command:\n\n` +
                      `1️⃣ By URL\n` +
                      `   ${prefix}song <youtube-url>\n\n` +
                      `2️⃣ By Search\n` +
                      `   ${prefix}song <song name>\n\n` +
                      `3️⃣ Example:\n` +
                      `   ${prefix}song https://youtu.be/xxxxx\n` +
                      `   ${prefix}song Adele Hello`,
                contextInfo: getContextInfo({ sender: sender })
            }, { quoted: fkontak });
        }

        await conn.sendMessage(from, {
            text: `┏╾─────────── PROCESSING ───────────╼\n╿\n├⟐ Fetching: ${userInput.substring(0, 30)}...\n╽\n┗╾───────────`,
            contextInfo: getContextInfo({ sender: sender })
        }, { quoted: fkontak });

        let videoUrl, videoTitle, videoId;
        
        const urlMatch = userInput.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=|embed\/|v\/|.+\?v=)?([^&\n]{11})/);
        
        if (urlMatch) {
            videoId = urlMatch[1];
            videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
            videoTitle = `Video_${videoId}`;
        } else {
            const searchApi = `https://weeb-api.vercel.app/ytsearch?query=${encodeURIComponent(userInput)}`;
            const searchRes = await axios.get(searchApi);
            
            if (!searchRes.data || searchRes.data.length === 0) {
                throw new Error('No results found');
            }
            
            const firstResult = searchRes.data[0];
            videoId = firstResult.id;
            videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
            videoTitle = firstResult.title.replace(/[^\w\s]/gi, '').substring(0, 50);
            
            await conn.sendMessage(from, {
                image: { url: firstResult.thumbnail },
                caption: `┏╾─────────── RESULT FOUND ───────────╼\n╿\n├⟐ Title: ${firstResult.title}\n├⟐ Duration: ${firstResult.timestamp || 'Unknown'}\n╽\n┗╾───────────`,
                contextInfo: getContextInfo({ sender: sender })
            }, { quoted: fkontak });
        }

        const buttons = [
            {
                buttonId: `${prefix}song_mp3_${videoId}`,
                buttonText: { displayText: '🎵 MP3 Audio' },
                type: 1
            },
            {
                buttonId: `${prefix}song_mp4_${videoId}`,
                buttonText: { displayText: '🎬 MP4 Video' },
                type: 1
            },
            {
                buttonId: `${prefix}song_mp3doc_${videoId}`,
                buttonText: { displayText: '📄 MP3 Document' },
                type: 1
            },
            {
                buttonId: `${prefix}song_mp4doc_${videoId}`,
                buttonText: { displayText: '📁 MP4 Document' },
                type: 1
            }
        ];

        const buttonMessage = {
            text: `┏╾─────────── CHOOSE FORMAT ───────────╼\n╿\n├⟐ Title: ${videoTitle.substring(0, 30)}...\n╿\n├⟐ Please select format:\n╽\n┗╾───────────\n\n> ${config.BOT_FOOTER}`,
            footer: config.BOT_FOOTER,
            buttons: buttons,
            headerType: 1,
            contextInfo: getContextInfo({ sender: sender })
        };

        await conn.sendMessage(from, buttonMessage, { quoted: fkontak });

    } catch (error) {
        console.error('Song command error:', error);
        await conn.sendMessage(from, {
            text: `❌ Error: ${error.message}`,
            contextInfo: getContextInfo({ sender: sender })
        }, { quoted: fkontak });
    }
});

cmd({
    on: 'body',
    fromMe: false
}, async (conn, mek, m, { from, sender, body, prefix }) => {
    try {
        if (!body.startsWith(prefix + 'song_')) return;
        
        const parts = body.split('_');
        if (parts.length < 3) return;
        
        const format = parts[1];
        const videoId = parts[2];
        
        await conn.sendMessage(from, {
            text: `┏╾─────────── DOWNLOADING ───────────╼\n╿\n├⟐ Format: ${format.toUpperCase()}\n├⟐ Please wait...\n╽\n┗╾───────────`,
            contextInfo: getContextInfo({ sender: sender })
        }, { quoted: fkontak });

        const isAudio = format.includes('mp3');
        const isDoc = format.includes('doc');
        
        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
        const apiUrl = `https://yt-dl.officialhectormanuel.workers.dev/?url=${encodeURIComponent(videoUrl)}`;
        
        const response = await axios.get(apiUrl, { timeout: 60000 });
        
        if (!response.data) throw new Error('No data from API');
        
        const data = response.data;
        const title = data.title || 'YouTube Video';
        let downloadUrl;
        
        if (isAudio) {
            downloadUrl = data.audio || data.mp3 || data.url;
        } else {
            downloadUrl = data.video || data.mp4 || data.url;
        }
        
        if (!downloadUrl) throw new Error('Download URL not found');
        
        const fileRes = await axios.get(downloadUrl, { 
            responseType: 'arraybuffer',
            timeout: 120000
        });
        
        const fileBuffer = Buffer.from(fileRes.data);
        const fileSize = fileBuffer.length / (1024 * 1024);
        
        if (fileSize > 50) throw new Error('File too large (>50MB)');
        
        const caption = `┏╾─────────── DOWNLOADED ───────────╼\n╿\n├⟐ Title: ${title.substring(0, 30)}...\n├⟐ Format: ${format.toUpperCase()}\n├⟐ Size: ${fileSize.toFixed(2)} MB\n╽\n┗╾───────────\n\n> ${config.BOT_FOOTER}`;
        
        if (isDoc) {
            await conn.sendMessage(from, {
                document: fileBuffer,
                mimetype: isAudio ? 'audio/mpeg' : 'video/mp4',
                fileName: `${title}.${isAudio ? 'mp3' : 'mp4'}`,
                caption: caption,
                contextInfo: getContextInfo({ sender: sender })
            }, { quoted: fkontak });
        } else {
            if (isAudio) {
                await conn.sendMessage(from, {
                    audio: fileBuffer,
                    mimetype: 'audio/mpeg',
                    ptt: false,
                    contextInfo: getContextInfo({ sender: sender })
                }, { quoted: fkontak });
            } else {
                await conn.sendMessage(from, {
                    video: fileBuffer,
                    caption: caption,
                    contextInfo: getContextInfo({ sender: sender })
                }, { quoted: fkontak });
            }
        }
        
        await conn.sendMessage(from, {
            react: { text: '✅', key: mek.key }
        });
        
    } catch (error) {
        console.error('Download error:', error);
        await conn.sendMessage(from, {
            text: `❌ Download Failed: ${error.message}`,
            contextInfo: getContextInfo({ sender: sender })
        }, { quoted: fkontak });
    }
});