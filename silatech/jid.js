const { cmd } = global;
const config = require('../config');
const { fkontak, getContextInfo } = require('../lib/functions');

cmd({
    pattern: "jid",
    alias: ["getjid", "id", "chatid", "groupid", "channelid", "userid"],
    desc: "Get JID of group/channel/user from mention, link, or reply",
    category: "general",
    react: "🆔",
    filename: __filename
}, async (conn, mek, m, { from, sender, args, isGroup, command, prefix }) => {
    try {
        const input = args.join(' ').toLowerCase();
        let result = [];
        let type = '';

        // ============================================
        // 📌 CASE 1: Get current group JID
        // ============================================
        if (!input && isGroup && !mek.quoted) {
            const groupMetadata = await conn.groupMetadata(from);
            result.push({
                type: '🏘️ 𝙶𝚛𝚘𝚞𝚙',
                name: groupMetadata.subject,
                jid: from,
                id: from.split('@')[0],
                members: groupMetadata.participants.length
            });
        }

        // ============================================
        // 📌 CASE 2: Get JID from replied user
        // ============================================
        else if (mek.quoted && !input) {
            const quotedUser = mek.quoted.participant || mek.quoted.sender;
            const pushName = mek.quoted.pushName || 'Unknown';
            
            result.push({
                type: '👤 𝚄𝚜𝚎𝚛',
                name: pushName,
                jid: quotedUser,
                id: quotedUser.split('@')[0]
            });
        }

        // ============================================
        // 📌 CASE 3: Get JID from mentioned users
        // ============================================
        else if (mek.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
            const mentions = mek.message.extendedTextMessage.contextInfo.mentionedJid;
            
            for (const mention of mentions) {
                const pushName = await getPushName(conn, mention) || 'Unknown';
                result.push({
                    type: '👤 𝚄𝚜𝚎𝚛',
                    name: pushName,
                    jid: mention,
                    id: mention.split('@')[0]
                });
            }
        }

        // ============================================
        // 📌 CASE 4: Get JID from group invite link
        // ============================================
        else if (input.includes('chat.whatsapp.com')) {
            const inviteCode = input.match(/chat\.whatsapp\.com\/([a-zA-Z0-9_-]+)/)?.[1];
            
            if (inviteCode) {
                try {
                    const groupInfo = await conn.groupGetInviteInfo(inviteCode);
                    result.push({
                        type: '🏘️ 𝙶𝚛𝚘𝚞𝚙',
                        name: groupInfo.subject,
                        jid: groupInfo.id,
                        id: groupInfo.id.split('@')[0],
                        members: groupInfo.size,
                        inviteCode: inviteCode
                    });
                } catch (error) {
                    return await conn.sendMessage(from, {
                        text: `❌ *𝙵𝚊𝚒𝚕𝚎𝚍 𝚝𝚘 𝚐𝚎𝚝 𝚐𝚛𝚘𝚞𝚙 𝚒𝚗𝚏𝚘*\n\n${error.message}`,
                        contextInfo: getContextInfo({ sender: sender })
                    }, { quoted: fkontak });
                }
            }
        }

        // ============================================
        // 📌 CASE 5: Get JID from channel/newsletter link
        // ============================================
        else if (input.includes('whatsapp.com/channel/') || input.includes('newsletter')) {
            const channelMatch = input.match(/whatsapp\.com\/channel\/([a-zA-Z0-9_-]+)/);
            
            if (channelMatch) {
                const channelId = channelMatch[1];
                // Newsletter JID format: 120363...@newsletter
                const channelJid = `${channelId}@newsletter`;
                
                try {
                    // Try to get newsletter info
                    const newsletterInfo = await conn.newsletterMetadata('jid', channelJid).catch(() => null);
                    
                    result.push({
                        type: '📢 𝙲𝚑𝚊𝚗𝚗𝚎𝚕 / 𝙽𝚎𝚠𝚜𝚕𝚎𝚝𝚝𝚎𝚛',
                        name: newsletterInfo?.name || 'Unknown Channel',
                        jid: channelJid,
                        id: channelId,
                        subscribers: newsletterInfo?.subscribers || '?'
                    });
                } catch {
                    result.push({
                        type: '📢 𝙲𝚑𝚊𝚗𝚗𝚎𝚕 / 𝙽𝚎𝚠𝚜𝚕𝚎𝚝𝚝𝚎𝚛',
                        name: 'Unknown',
                        jid: channelJid,
                        id: channelId
                    });
                }
            }
        }

        // ============================================
        // 📌 CASE 6: Get JID from phone number
        // ============================================
        else if (input.match(/^\+?[0-9]+$/)) {
            const number = input.replace(/[^0-9]/g, '');
            const userJid = `${number}@s.whatsapp.net`;
            
            // Check if user exists on WhatsApp
            const [exists] = await conn.onWhatsApp(userJid).catch(() => []);
            
            result.push({
                type: '👤 𝚄𝚜𝚎𝚛',
                name: exists?.exists ? (await getPushName(conn, userJid) || 'Unknown') : 'Not on WhatsApp',
                jid: userJid,
                id: number,
                exists: exists?.exists || false
            });
        }

        // ============================================
        // 📌 CASE 7: Get JID from text (treat as group ID or channel ID)
        // ============================================
        else if (input) {
            // Check if it's a group JID
            if (input.includes('@g.us')) {
                try {
                    const groupMetadata = await conn.groupMetadata(input).catch(() => null);
                    result.push({
                        type: '🏘️ 𝙶𝚛𝚘𝚞𝚙',
                        name: groupMetadata?.subject || 'Unknown Group',
                        jid: input,
                        id: input.split('@')[0],
                        members: groupMetadata?.participants?.length || '?'
                    });
                } catch {
                    result.push({
                        type: '🏘️ 𝙶𝚛𝚘𝚞𝚙',
                        name: 'Unknown',
                        jid: input,
                        id: input.split('@')[0]
                    });
                }
            }
            // Check if it's a newsletter JID
            else if (input.includes('@newsletter')) {
                try {
                    const newsletterInfo = await conn.newsletterMetadata('jid', input).catch(() => null);
                    result.push({
                        type: '📢 𝙲𝚑𝚊𝚗𝚗𝚎𝚕',
                        name: newsletterInfo?.name || 'Unknown Channel',
                        jid: input,
                        id: input.split('@')[0],
                        subscribers: newsletterInfo?.subscribers || '?'
                    });
                } catch {
                    result.push({
                        type: '📢 𝙲𝚑𝚊𝚗𝚗𝚎𝚕',
                        name: 'Unknown',
                        jid: input,
                        id: input.split('@')[0]
                    });
                }
            }
            // Check if it's a user JID
            else if (input.includes('@s.whatsapp.net')) {
                const number = input.split('@')[0];
                const [exists] = await conn.onWhatsApp(input).catch(() => []);
                
                result.push({
                    type: '👤 𝚄𝚜𝚎𝚛',
                    name: exists?.exists ? (await getPushName(conn, input) || 'Unknown') : 'Not on WhatsApp',
                    jid: input,
                    id: number,
                    exists: exists?.exists || false
                });
            }
            // Treat as channel ID
            else {
                const channelJid = `${input}@newsletter`;
                try {
                    const newsletterInfo = await conn.newsletterMetadata('jid', channelJid).catch(() => null);
                    result.push({
                        type: '📢 𝙲𝚑𝚊𝚗𝚗𝚎𝚕',
                        name: newsletterInfo?.name || 'Unknown Channel',
                        jid: channelJid,
                        id: input,
                        subscribers: newsletterInfo?.subscribers || '?'
                    });
                } catch {
                    result.push({
                        type: '📢 𝙲𝚑𝚊𝚗𝚗𝚎𝚕',
                        name: 'Unknown',
                        jid: channelJid,
                        id: input
                    });
                }
            }
        }

        // ============================================
        // 📌 If no results found
        // ============================================
        if (result.length === 0) {
            return await showJidHelp(conn, from, sender, prefix, command);
        }

        // ============================================
        // 📌 Format and send results
        // ============================================
        let responseText = `*╭━━━〔 🆔 𝙹𝙸𝙳 𝙸𝙽𝙵𝙾𝚁𝙼𝙰𝚃𝙸𝙾𝙽 〕━━━┈⊷*\n*┃🐢│*\n`;

        for (const item of result) {
            responseText += `*┃🐢│ ${item.type}*\n`;
            responseText += `*┃🐢│ 📛 𝙽𝚊𝚖𝚎:* ${item.name}\n`;
            responseText += `*┃🐢│ 🆔 𝙹𝙸𝙳:* \`${item.jid}\`\n`;
            responseText += `*┃🐢│ 🔢 𝙸𝙳:* ${item.id}\n`;
            
            if (item.members) {
                responseText += `*┃🐢│ 👥 𝙼𝚎𝚖𝚋𝚎𝚛𝚜:* ${item.members}\n`;
            }
            if (item.subscribers) {
                responseText += `*┃🐢│ 📊 𝚂𝚞𝚋𝚜𝚌𝚛𝚒𝚋𝚎𝚛𝚜:* ${item.subscribers}\n`;
            }
            if (item.inviteCode) {
                responseText += `*┃🐢│ 🔗 𝙸𝚗𝚟𝚒𝚝𝚎:* ${item.inviteCode}\n`;
            }
            if (item.exists !== undefined) {
                responseText += `*┃🐢│ ✅ 𝙾𝚗 𝚆𝙰:* ${item.exists ? '𝚈𝚎𝚜' : '𝙽𝚘'}\n`;
            }
            responseText += `*┃🐢│*\n`;
            responseText += `*┃🐢│ ━━━━━━━━━━━━━*\n`;
            responseText += `*┃🐢│*\n`;
        }

        responseText += `*╰━━━━━━━━━━━━━━━┈⊷*\n\n> ${config.BOT_FOOTER}`;

        await conn.sendMessage(from, {
            text: responseText,
            contextInfo: getContextInfo({ sender: sender })
        }, { quoted: fkontak });

        // Send reaction
        await conn.sendMessage(from, {
            react: { text: '🆔', key: mek.key }
        });

    } catch (error) {
        console.error('JID command error:', error);
        await conn.sendMessage(from, {
            text: `❌ *𝙴𝚛𝚛𝚘𝚛:* ${error.message}`,
            contextInfo: getContextInfo({ sender: sender })
        }, { quoted: fkontak });
    }
});

// ============================================
// 📌 HELP FUNCTION
// ============================================
async function showJidHelp(conn, from, sender, prefix, command) {
    const helpText = `*╭━━━〔 🆔 𝙹𝙸𝙳 𝙲𝙾𝙼𝙼𝙰𝙽𝙳 〕━━━┈⊷*
*┃🐢│*
*┃🐢│ 1️⃣ *𝙶𝚎𝚝 𝙲𝚞𝚛𝚛𝚎𝚗𝚝 𝙶𝚛𝚘𝚞𝚙 𝙹𝙸𝙳*
*┃🐢│    ${prefix}${command}
*┃🐢│    (𝚄𝚜𝚎 𝚒𝚗 𝚐𝚛𝚘𝚞𝚙)
*┃🐢│*
*┃🐢│ 2️⃣ *𝙶𝚎𝚝 𝚄𝚜𝚎𝚛 𝙹𝙸𝙳 𝚏𝚛𝚘𝚖 𝚁𝚎𝚙𝚕𝚢*
*┃🐢│    𝚁𝚎𝚙𝚕𝚢 𝚝𝚘 𝚞𝚜𝚎𝚛: ${prefix}${command}
*┃🐢│*
*┃🐢│ 3️⃣ *𝙶𝚎𝚝 𝙹𝙸𝙳 𝚏𝚛𝚘𝚖 𝙼𝚎𝚗𝚝𝚒𝚘𝚗*
*┃🐢│    ${prefix}${command} @user1 @user2
*┃🐢│*
*┃🐢│ 4️⃣ *𝙶𝚎𝚝 𝙶𝚛𝚘𝚞𝚙 𝙹𝙸𝙳 𝚏𝚛𝚘𝚖 𝙻𝚒𝚗𝚔*
*┃🐢│    ${prefix}${command} https://chat.whatsapp.com/xxxx
*┃🐢│*
*┃🐢│ 5️⃣ *𝙶𝚎𝚝 𝙲𝚑𝚊𝚗𝚗𝚎𝚕 𝙹𝙸𝙳 𝚏𝚛𝚘𝚖 𝙻𝚒𝚗𝚔*
*┃🐢│    ${prefix}${command} https://whatsapp.com/channel/xxxx
*┃🐢│*
*┃🐢│ 6️⃣ *𝙶𝚎𝚝 𝚄𝚜𝚎𝚛 𝙹𝙸𝙳 𝚏𝚛𝚘𝚖 𝙽𝚞𝚖𝚋𝚎𝚛*
*┃🐢│    ${prefix}${command} 255612491554
*┃🐢│*
*┃🐢│ 7️⃣ *𝙶𝚎𝚝 𝙸𝚗𝚏𝚘 𝚏𝚛𝚘𝚖 𝙹𝙸𝙳*
*┃🐢│    ${prefix}${command} 1234567890@g.us
*┃🐢│    ${prefix}${command} 1234567890@newsletter
*┃🐢│*
*╰━━━━━━━━━━━━━━━┈⊷*

> ${config.BOT_FOOTER}`;

    await conn.sendMessage(from, {
        image: { url: config.IMAGE_PATH },
        caption: helpText,
        contextInfo: getContextInfo({ sender: sender })
    }, { quoted: fkontak });
}

// ============================================
// 📌 HELPER: Get Push Name
// ============================================
async function getPushName(conn, jid) {
    try {
        const presence = await conn.presenceSubscribe(jid).catch(() => null);
        return presence?.name || jid.split('@')[0];
    } catch {
        return jid.split('@')[0];
    }
}

// ============================================
// 📌 GET ALL GROUP JIDS (Admin only)
// ============================================
cmd({
    pattern: "listjid",
    alias: ["alljid", "groupsjid"],
    desc: "Get JIDs of all groups bot is in",
    category: "owner",
    react: "📋",
    filename: __filename
}, async (conn, mek, m, { from, sender, isOwner }) => {
    try {
        if (!isOwner) {
            return await conn.sendMessage(from, {
                text: "🚫 *𝙾𝚠𝚗𝚎𝚛-𝚘𝚗𝚕𝚢 𝚌𝚘𝚖𝚖𝚊𝚗𝚍!*",
                contextInfo: getContextInfo({ sender: sender })
            }, { quoted: fkontak });
        }

        const groups = Object.values(await conn.groupFetchAllParticipating());
        
        let listText = `*╭━━━〔 📋 𝙰𝙻𝙻 𝙶𝚁𝙾𝚄𝙿 𝙹𝙸𝙳𝚂 〕━━━┈⊷*\n*┃🐢│*\n`;
        listText += `*┃🐢│ 📊 𝚃𝚘𝚝𝚊𝚕: ${groups.length} 𝚐𝚛𝚘𝚞𝚙𝚜*\n*┃🐢│*\n\n`;

        groups.forEach((group, index) => {
            listText += `*${index + 1}. ${group.subject}*\n`;
            listText += `   🆔 \`${group.id}\`\n`;
            listText += `   👥 ${group.participants.length} members\n\n`;
        });

        listText += `*╰━━━━━━━━━━━━━━━┈⊷*\n\n> ${config.BOT_FOOTER}`;

        // Send as file if too long
        if (listText.length > 4000) {
            const buffer = Buffer.from(listText, 'utf-8');
            await conn.sendMessage(from, {
                document: buffer,
                mimetype: 'text/plain',
                fileName: 'groups_jid_list.txt',
                caption: `📋 *𝙻𝚒𝚜𝚝 𝚘𝚏 ${groups.length} 𝚐𝚛𝚘𝚞𝚙𝚜*`,
                contextInfo: getContextInfo({ sender: sender })
            }, { quoted: fkontak });
        } else {
            await conn.sendMessage(from, {
                text: listText,
                contextInfo: getContextInfo({ sender: sender })
            }, { quoted: fkontak });
        }

    } catch (error) {
        console.error('List JID error:', error);
        await conn.sendMessage(from, {
            text: `❌ *𝙴𝚛𝚛𝚘𝚛:* ${error.message}`,
            contextInfo: getContextInfo({ sender: sender })
        }, { quoted: fkontak });
    }
});
