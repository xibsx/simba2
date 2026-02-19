const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const moment = require('moment-timezone');
const Jimp = require('jimp');
const crypto = require('crypto');
const { downloadContentFromMessage, getContentType } = require('@whiskeysockets/baileys');
const config = require('../../config');

// ============================================
// 📌 FAKE VCARD (Global)
// ============================================
const fkontak = {
    "key": {
        "participant": '0@s.whatsapp.net',
        "remoteJid": '0@s.whatsapp.net',
        "fromMe": false,
        "id": "Halo"
    },
    "message": {
        "conversation": "𝚂𝙸𝙻𝙰"
    }
};

// ============================================
// 📌 CONTEXT INFO GENERATOR
// ============================================
const getContextInfo = (m, ownerName = config.OWNER_NAME, formattedOwnerNumber = config.OWNER_NUMBER) => {
    return {
        mentionedJid: m.mentionedJid || [m.sender],
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: config.NEWSLETTER_JIDS[0] || '120363402325089913@newsletter',
            newsletterName: `© ${config.BOT_NAME}`,
            serverMessageId: 143,
        },
        externalAdReply: {
            title: `👑 𝙱𝙾𝚃 𝙾𝚆𝙽𝙴𝚁: ${ownerName}`,
            body: `📞 wa.me/${formattedOwnerNumber}`,
            mediaType: 1,
            previewType: 0,
            thumbnailUrl: config.IMAGE_PATH,
            sourceUrl: `https://wa.me/${formattedOwnerNumber}`,
            renderLargerThumbnail: false,
        }
    };
};

// ============================================
// 📌 MESSAGE PROCESSOR (sms function)
// ============================================
const sms = (conn, m, store) => {
    if (!m) return m;
    
    if (m.key) {
        m.id = m.key.id;
        m.isBot = m.id.startsWith('BAES') && m.id.length === 16;
        m.isBaileys = m.id.startsWith('BAE5') && m.id.length === 16;
        m.chat = m.key.remoteJid;
        m.fromMe = m.key.fromMe;
        m.isGroup = m.chat.endsWith('@g.us');
        m.sender = m.fromMe ? conn.user.id.split(':')[0] + '@s.whatsapp.net' : 
                   m.isGroup ? m.key.participant : m.key.remoteJid;
    }
    
    if (m.message) {
        m.mtype = getContentType(m.message);
        m.msg = (m.mtype == 'viewOnceMessage' ? 
                m.message[m.mtype].message[getContentType(m.message[m.mtype].message)] : 
                m.message[m.mtype]);
        
        try {
            m.body = (m.mtype === 'conversation') ? m.message.conversation : 
                     (m.mtype == 'imageMessage' && m.message.imageMessage.caption) ? m.message.imageMessage.caption : 
                     (m.mtype == 'videoMessage' && m.message.videoMessage.caption) ? m.message.videoMessage.caption : 
                     (m.mtype == 'extendedTextMessage') ? m.message.extendedTextMessage.text : 
                     (m.mtype == 'buttonsResponseMessage') ? m.message.buttonsResponseMessage.selectedButtonId : 
                     (m.mtype == 'listResponseMessage') ? m.message.listResponseMessage.singleSelectReply.selectedRowId : 
                     (m.mtype == 'templateButtonReplyMessage') ? m.message.templateButtonReplyMessage.selectedId : '';
        } catch {
            m.body = false;
        }
        
        let quoted = (m.quoted = m.msg?.contextInfo ? m.msg.contextInfo.quotedMessage : null);
        m.mentionedJid = m.msg?.contextInfo ? m.msg.contextInfo.mentionedJid : [];
        
        if (m.quoted) {
            let type = getContentType(quoted);
            m.quoted = m.quoted[type];
            if (['productMessage'].includes(type)) {
                type = getContentType(m.quoted);
                m.quoted = m.quoted[type];
            }
            if (typeof m.quoted === 'string') m.quoted = { text: m.quoted };
        }
    }
    
    return m;
};

// ============================================
// 📌 DOWNLOAD MEDIA MESSAGE
// ============================================
const downloadMediaMessage = async (message, filename, attachExtension = true) => {
    let quoted = message.msg ? message.msg : message;
    let mime = (message.msg || message).mimetype || '';
    let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0];
    
    const stream = await downloadContentFromMessage(quoted, messageType);
    let buffer = Buffer.from([]);
    for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
    }
    
    if (filename) {
        const FileType = require('file-type');
        let type = await FileType.fromBuffer(buffer);
        let trueFileName = attachExtension ? (filename + '.' + type.ext) : filename;
        await fs.writeFile(trueFileName, buffer);
        return trueFileName;
    }
    
    return buffer;
};

// ============================================
// 📌 FORMAT MESSAGE
// ============================================
const formatMessage = (title, content, footer = config.BOT_FOOTER) => {
    return `*${title}*\n\n${content}\n\n${footer}`;
};

// ============================================
// 📌 FORMAT BYTES
// ============================================
const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

// ============================================
// 📌 GENERATE OTP
// ============================================
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// ============================================
// 📌 GET TIMESTAMP (East Africa Time)
// ============================================
const getTimestamp = () => {
    return moment().tz('Africa/Nairobi').format('YYYY-MM-DD HH:mm:ss');
};

// ============================================
// 📌 CLEAN DUPLICATE FILES
// ============================================
const cleanDuplicateFiles = async (number) => {
    try {
        const Session = mongoose.model('Session');
        const sanitizedNumber = number.replace(/[^0-9]/g, '');
        
        const sessions = await Session.find({ number: sanitizedNumber }).sort({ updatedAt: -1 });
        
        if (sessions.length > 1) {
            const idsToDelete = sessions.slice(1).map(s => s._id);
            await Session.deleteMany({ _id: { $in: idsToDelete } });
            console.log(`Deleted ${idsToDelete.length} duplicate sessions for ${sanitizedNumber}`);
        }
    } catch (error) {
        console.error(`Failed to clean duplicate files for ${number}:`, error);
    }
};

// ============================================
// 📌 RESIZE IMAGE
// ============================================
const resize = async (image, width, height) => {
    let oyy = await Jimp.read(image);
    let kiyomasa = await oyy.resize(width, height).getBufferAsync(Jimp.MIME_JPEG);
    return kiyomasa;
};

// ============================================
// 📌 CAPITALIZE STRING
// ============================================
const capital = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
};

// ============================================
// 📌 CREATE SERIAL
// ============================================
const createSerial = (size) => {
    return crypto.randomBytes(size).toString('hex').slice(0, size);
};

// ============================================
// 📌 SLEEP FUNCTION
// ============================================
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ============================================
// 📌 CHECK IF USER IS GROUP ADMIN
// ============================================
const isGroupAdmin = async (socket, jid, user) => {
    try {
        const groupMetadata = await socket.groupMetadata(jid);
        const participant = groupMetadata.participants.find(p => p.id === user);
        return participant?.admin === 'admin' || participant?.admin === 'superadmin' || false;
    } catch (error) {
        console.error('Error checking group admin status:', error);
        return false;
    }
};

// ============================================
// �UPLOAD TO CATBOX
// ============================================
const uploadToCatbox = async (buffer, filename) => {
    const FormData = require('form-data');
    const form = new FormData();
    form.append('fileToUpload', buffer, filename);
    form.append('reqtype', 'fileupload');
    
    const res = await axios.post('https://catbox.moe/user/api.php', form, {
        headers: form.getHeaders()
    });
    
    return res.data;
};

module.exports = {
    sms,
    downloadMediaMessage,
    formatMessage,
    formatBytes,
    generateOTP,
    getTimestamp,
    cleanDuplicateFiles,
    resize,
    capital,
    createSerial,
    getContextInfo,
    fkontak,
    sleep,
    isGroupAdmin,
    uploadToCatbox
};
