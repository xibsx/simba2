const { cmd } = global;
const config = require('../config');
const { fkontak, getContextInfo, downloadMediaMessage, sleep } = require('../lib/functions');
const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

// Primary API (yako)
const PRIMARY_API = 'https://yt-dl.officialhectormanuel.workers.dev/?url=';
// Backup APIs
const BACKUP_API1 = 'https://api.siputzx.my.id/api/d/yt?url=';
const BACKUP_API2 = 'https://api.ryzendesu.vip/api/downloader/ytmp3?url=';
const BACKUP_API3 = 'https://api.agatz.xyz/api/yt?url=';

cmd({
    pattern: "song",
    alias: ["yt", "play", "video", "mp3", "mp4"],
    desc: "Download YouTube videos/audio (MP3/MP4)",
    category: "download",
    react: "🎵",
    filename: __filename
}, async (conn, mek, m, { from, sender, args, command }) => {
    try {
        // Get YouTube URL from args or quoted message
        let url = args[0] || '';
        
        // If no URL, check if replied to a message with URL
        if (!url && mek.quoted) {
            const quotedText = mek.quoted.message?.conversation || 
                              mek.quoted.message?.extendedTextMessage?.text || '';
            const urlMatch = quotedText.match(/(https?:\/\/[^\s]+)/);
            if (urlMatch) url = urlMatch[0];
        }

        if (!url) {
            return await conn.sendMessage(from, {
                text: `🎵 *𝙷𝚘𝚠 𝚝𝚘 𝚞𝚜𝚎 𝚜𝚘𝚗𝚐 𝚌𝚘𝚖𝚖𝚊𝚗𝚍:*\n\n` +
                      `1️⃣ *𝙳𝚘𝚠𝚗𝚕𝚘𝚊𝚍 𝚋𝚢 𝚄𝚁𝙻*\n` +
                      `   .𝚜𝚘𝚗𝚐 <𝚢𝚘𝚞𝚝𝚞𝚋𝚎 𝚞𝚛𝚕>\n\n` +
                      `2️⃣ *𝚂𝚎𝚊𝚛𝚌𝚑 𝚊𝚗𝚍 𝙳𝚘𝚠𝚗𝚕𝚘𝚊𝚍*\n` +
                      `   .𝚜𝚘𝚗𝚐 <𝚜𝚘𝚗𝚐 𝚗𝚊𝚖𝚎>\n\n` +
                      `3️⃣ *𝙳𝚒𝚛𝚎𝚌𝚝 𝙳𝚘𝚠𝚗𝚕𝚘𝚊𝚍 (𝚛𝚎𝚙𝚕𝚢 𝚝𝚘 𝚕𝚒𝚗𝚔)*\n` +
                      `   𝚁𝚎𝚙𝚕𝚢 𝚝𝚘 𝚊 𝚖
