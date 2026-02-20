const { cmd } = global;
const config = require('../config');
const { fkontak, getContextInfo, formatBytes } = require('../lib/functions');
const axios = require('axios');
const yts = require('yt-search');

cmd({
    pattern: "song",
    alias: ["play", "mp3", "music"],
    desc: "Download song from YouTube",
    category: "downloader",
    react: "🎵",
    filename: __filename
}, async (conn, mek, m, { from, sender, args, q, prefix }) => {
    try {
        // Check if query provided
        if (!q) {
            return await conn.sendMessage(from, {
                text: `🎵 *How to use song command:*\n\n` +
                      `1️⃣ *By URL*\n` +
                      `   ${prefix}song <youtube-url>\n\n` +
                      `2️⃣ *By Search*\n` +
                      `   ${prefix}song <song name>\n\n` +
                      `3️⃣ *Example:*\n` +
                      `   ${prefix}song https://youtu.be/xxxxx\n` +
                      `   ${prefix}song Adele Hello
> ${config.BOT_FOOTER}`,
                contextInfo: getContextInfo({ sender: sender })
            }, { quoted: fkontak });
        }

        // Search for video
        let videoData = null;
        let videoUrl = '';
        let title = '';
        let thumbnail = '';
        let duration = '';
        let views = '';

        // Check if it's a direct YouTube URL
        if (q.includes('youtube.com') || q.includes('youtu.be')) {
            const videoId = q.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)?.[1];
            
            if (!videoId) {
                return await conn.sendMessage(from, {
                    text: `❌ *𝙸𝚗𝚟𝚊𝚕𝚒𝚍 𝚈𝚘𝚞𝚃𝚞𝚋𝚎 𝚕𝚒𝚗𝚔*\n\n${config.BOT_FOOTER}`,
                    contextInfo: getContextInfo({ sender: sender })
                }, { quoted: fkontak });
            }
            
            const search = await yts({ videoId: videoId });
            if (search) videoData = search;
        } else {
            // Send searching message (without saving to send later)
            await conn.sendMessage(from, {
                react: { text: '🔍', key: mek.key }
            });
            
            const search = await yts(q);
            if (!search || !search.all || search.all.length === 0) {
                return await conn.sendMessage(from, {
                    text: `❌ *𝙽𝚘 𝚛𝚎𝚜𝚞𝚕𝚝𝚜 𝚏𝚘𝚞𝚗𝚍 𝚏𝚘𝚛* "${q}"\n\n${config.BOT_FOOTER}`,
                    contextInfo: getContextInfo({ sender: sender })
                }, { quoted: fkontak });
            }
            
            videoData = search.all[0];
        }

        if (!videoData) {
            return await conn.sendMessage(from, {
                text: `❌ *𝙲𝚘𝚞𝚕𝚍 𝚗𝚘𝚝 𝚐𝚎𝚝 𝚟𝚒𝚍𝚎𝚘 𝚒𝚗𝚏𝚘𝚛𝚖𝚊𝚝𝚒𝚘𝚗*\n\n${config.BOT_FOOTER}`,
                contextInfo: getContextInfo({ sender: sender })
            }, { quoted: fkontak });
        }

        videoUrl = videoData.url;
        title = videoData.title || 'Unknown Title';
        thumbnail = videoData.thumbnail || videoData.image;
        duration = videoData.timestamp || videoData.duration?.toString() || 'N/A';
        views = videoData.views ? videoData.views.toLocaleString() : 'N/A';

        // Format duration
        if (duration.includes(':')) {
            // Already formatted
        } else if (!isNaN(duration)) {
            const seconds = parseInt(duration);
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;
            duration = `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
        }

        // Prepare caption with song info
        const caption = `┏━❑ *𝚂𝙾𝙽𝙶 𝙸𝙽𝙵𝙾* ━━━━━━━━━
┃ 🎵 *𝚃𝙸𝚃𝙻𝙴:* ${title}
┃ ⏱️ *𝙳𝚄𝚁𝙰𝚃𝙸𝙾𝙽:* ${duration}
┃ 👁️ *𝚅𝙸𝙴𝚆𝚂:* ${views}
┃ 🔗 *𝙻𝙸𝙽𝙺:* ${videoUrl}
┗━━━━━━━━━━━━━━━━━━━━

> ${config.BOT_FOOTER}`;

        // Create button message with thumbnail and buttons
        const buttonMessage = {
            image: { url: thumbnail },
            caption: caption,
            footer: config.BOT_FOOTER,
            buttons: [
                {
                    buttonId: `download_audio_${Buffer.from(videoUrl).toString('base64')}`,
                    buttonText: { displayText: '🎵 𝙰𝚄𝙳𝙸𝙾 𝙼𝙿𝟹' },
                    type: 1
                },
                {
                    buttonId: `download_doc_${Buffer.from(videoUrl).toString('base64')}`,
                    buttonText: { displayText: '📄 𝙰𝚄𝙳𝙸𝙾 𝙳𝙾𝙲' },
                    type: 1
                }
            ],
            headerType: 4,
            contextInfo: getContextInfo({ sender: sender })
        };

        await conn.sendMessage(from, buttonMessage, { quoted: fkontak });

    } catch (error) {
        console.error('Song command error:', error);
        await conn.sendMessage(from, {
            text: `❌ *𝙴𝚛𝚛𝚘𝚛:* ${error.message}\n\n${config.BOT_FOOTER}`,
            contextInfo: getContextInfo({ sender: sender })
        }, { quoted: fkontak });
    }
});

// ============================================
// 📌 BUTTON RESPONSE HANDLER
// ============================================
cmd({ on: "body" }, async (conn, mek, m, { from, sender, body }) => {
    try {
        // Check if message is a button response
        if (mek.message?.buttonsResponseMessage) {
            const buttonId = mek.message.buttonsResponseMessage.selectedButtonId;
            
            if (buttonId.startsWith('download_audio_') || buttonId.startsWith('download_doc_')) {
                await conn.sendMessage(from, {
                    react: { text: '⏳', key: mek.key }
                });

                // Extract video URL from buttonId
                const encodedUrl = buttonId.replace('download_audio_', '').replace('download_doc_', '');
                const videoUrl = Buffer.from(encodedUrl, 'base64').toString('utf-8');
                
                // Get video info for title
                const search = await yts({ videoId: videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)?.[1] });
                const title = search?.title || 'Unknown Title';
                
                // Try downloading from API
                try {
                    // Use fallback API first (known working)
                    const fallbackApi = `https://yt-dl.officialhectormanuel.workers.dev/?url=${encodeURIComponent(videoUrl)}`;
                    const fallbackResponse = await axios.get(fallbackApi, { timeout: 30000 });
                    const fallbackData = fallbackResponse.data;
                    
                    if (fallbackData?.status && fallbackData.audio) {
                        const audioUrl = fallbackData.audio;
                        const fileName = `${title.substring(0, 50).replace(/[^\w\s]/gi, '')}.mp3`;
                        
                        if (buttonId.startsWith('download_audio_')) {
                            // Send as playable audio
                            await conn.sendMessage(from, {
                                audio: { url: audioUrl },
                                mimetype: "audio/mpeg",
                                fileName: fileName,
                                contextInfo: getContextInfo({ sender: sender })
                            }, { quoted: fkontak });
                        } else {
                            // Send as document
                            await conn.sendMessage(from, {
                                document: { url: audioUrl },
                                mimetype: "audio/mpeg",
                                fileName: fileName,
                                caption: `📄 *${title}*\n\n> ${config.BOT_FOOTER}`,
                                contextInfo: getContextInfo({ sender: sender })
                            }, { quoted: fkontak });
                        }
                        
                        await conn.sendMessage(from, {
                            react: { text: '✅', key: mek.key }
                        });
                    } else {
                        throw new Error('No audio URL found');
                    }
                    
                } catch (error) {
                    console.error('Download error:', error);
                    
                    // Try alternative API
                    try {
                        const apiUrl = `https://api.dhamzxploit.my.id/api/ytplay?query=${encodeURIComponent(videoUrl)}`;
                        const response = await axios.get(apiUrl, { timeout: 30000 });
                        const data = response.data;
                        
                        let audioUrl = data?.result?.audio || data?.audio || data?.download;
                        
                        if (audioUrl) {
                            const fileName = `${title.substring(0, 50).replace(/[^\w\s]/gi, '')}.mp3`;
                            
                            if (buttonId.startsWith('download_audio_')) {
                                await conn.sendMessage(from, {
                                    audio: { url: audioUrl },
                                    mimetype: "audio/mpeg",
                                    fileName: fileName,
                                    contextInfo: getContextInfo({ sender: sender })
                                }, { quoted: fkontak });
                            } else {
                                await conn.sendMessage(from, {
                                    document: { url: audioUrl },
                                    mimetype: "audio/mpeg",
                                    fileName: fileName,
                                    caption: `📄 *${title}*\n\n> ${config.BOT_FOOTER}`,
                                    contextInfo: getContextInfo({ sender: sender })
                                }, { quoted: fkontak });
                            }
                            
                            await conn.sendMessage(from, {
                                react: { text: '✅', key: mek.key }
                            });
                        } else {
                            throw new Error('No audio URL from alternative API');
                        }
                        
                    } catch (altError) {
                        console.error('Alternative download error:', altError);
                        
                        await conn.sendMessage(from, {
                            text: `❌ *𝙵𝚊𝚒𝚕𝚎𝚍 𝚝𝚘 𝚍𝚘𝚠𝚗𝚕𝚘𝚊𝚍 𝚊𝚞𝚍𝚒𝚘*\n\n𝚁𝚎𝚊𝚜𝚘𝚗: ${error.message}\n\n${config.BOT_FOOTER}`,
                            contextInfo: getContextInfo({ sender: sender })
                        }, { quoted: fkontak });
                        
                        await conn.sendMessage(from, {
                            react: { text: '❌', key: mek.key }
                        });
                    }
                }
            }
        }
    } catch (error) {
        console.error('Button handler error:', error);
    }
});
