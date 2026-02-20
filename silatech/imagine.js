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

        if (!input && isGroup && !mek.quoted) {
            const groupMetadata = await conn.groupMetadata(from);
            result.push({
                type: '🏷️ Group',
                name: groupMetadata.subject,
                jid: from,
                id: from.split('@')[0],
                members: groupMetadata.participants.length
            });
        }

        else if (mek.quoted && !input) {
            const quotedUser = mek.quoted.participant || mek.quoted.sender;
            const pushName = mek.quoted.pushName || 'Unknown';
            
            result.push({
                type: '👤 User',
                name: pushName,
                jid: quotedUser,
                id: quotedUser.split('@')[0]
            });
        }

        else if (mek.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
            const mentions = mek.message.extendedTextMessage.contextInfo.mentionedJid;
            
            for (const mention of mentions) {
                const pushName = await getPushName(conn, mention) || 'Unknown';
                result.push({
                    type: '👤 User',
                    name: pushName,
                    jid: mention,
                    id: mention.split('@')[0]
                });
            }
        }

        else if (input.includes('chat.whatsapp.com')) {
            const inviteCode = input.match(/chat\.whatsapp\.com\/([a-zA-Z0-9_-]+)/)?.[1];
            
            if (inviteCode) {
                try {
                    const groupInfo = await conn.groupGetInviteInfo(inviteCode);
                    result.push({
                        type: '🏷️ Group',
                        name: groupInfo.subject,
                        jid: groupInfo.id,
                        id: groupInfo.id.split('@')[0],
                        members: groupInfo.size,
                        inviteCode: inviteCode
                    });
                } catch (error) {
                    return await conn.sendMessage(from, {
                        text: `❌ Failed to get group info\n\n${error.message}`,
                        contextInfo: getContextInfo({ sender: sender })
                    }, { quoted: fkontak });
                }
            }
        }

        else if (input.includes('whatsapp.com/channel/') || input.includes('newsletter')) {
            const channelMatch = input.match(/whatsapp\.com\/channel\/([a-zA-Z0-9_-]+)/);
            
            if (channelMatch) {
                const channelId = channelMatch[1];
                const channelJid = `${channelId}@newsletter`;
                
                try {
                    const newsletterInfo = await conn.newsletterMetadata('jid', channelJid).catch(() => null);
                    
                    result.push({
                        type: '📢 Channel / Newsletter',
                        name: newsletterInfo?.name || 'Unknown Channel',
                        jid: channelJid,
                        id: channelId,
                        subscribers: newsletterInfo?.subscribers || '?'
                    });
                } catch {
                    result.push({
                        type: '📢 Channel / Newsletter',
                        name: 'Unknown',
                        jid: channelJid,
                        id: channelId
                    });
                }
            }
        }

        else if (input.match(/^\+?[0-9]+$/)) {
            const number = input.replace(/[^0-9]/g, '');
            const userJid = `${number}@s.whatsapp.net`;
            
            const [exists] = await conn.onWhatsApp(userJid).catch(() => []);
            
            result.push({
                type: '👤 User',
                name: exists?.exists ? (await getPushName(conn, userJid) || 'Unknown') : 'Not on WhatsApp',
                jid: userJid,
                id: number,
                exists: exists?.exists || false
            });
        }

        else if (input) {
            if (input.includes('@g.us')) {
                try {
                    const groupMetadata = await conn.groupMetadata(input).catch(() => null);
                    result.push({
                        type: '🏷️ Group',
                        name: groupMetadata?.subject || 'Unknown Group',
                        jid: input,
                        id: input.split('@')[0],
                        members: groupMetadata?.participants?.length || '?'
                    });
                } catch {
                    result.push({
                        type: '🏷️ Group',
                        name: 'Unknown',
                        jid: input,
                        id: input.split('@')[0]
                    });
                }
            }
            else if (input.includes('@newsletter')) {
                try {
                    const newsletterInfo = await conn.newsletterMetadata('jid', input).catch(() => null);
                    result.push({
                        type: '📢 Channel',
                        name: newsletterInfo?.name || 'Unknown Channel',
                        jid: input,
                        id: input.split('@')[0],
                        subscribers: newsletterInfo?.subscribers || '?'
                    });
                } catch {
                    result.push({
                        type: '📢 Channel',
                        name: 'Unknown',
                        jid: input,
                        id: input.split('@')[0]
                    });
                }
            }
            else if (input.includes('@s.whatsapp.net')) {
                const number = input.split('@')[0];
                const [exists] = await conn.onWhatsApp(input).catch(() => []);
                
                result.push({
                    type: '👤 User',
                    name: exists?.exists ? (await getPushName(conn, input) || 'Unknown') : 'Not on WhatsApp',
                    jid: input,
                    id: number,
                    exists: exists?.exists || false
                });
            }
            else {
                const channelJid = `${input}@newsletter`;
                try {
                    const newsletterInfo = await conn.newsletterMetadata('jid', channelJid).catch(() => null);
                    result.push({
                        type: '📢 Channel',
                        name: newsletterInfo?.name || 'Unknown Channel',
                        jid: channelJid,
                        id: input,
                        subscribers: newsletterInfo?.subscribers || '?'
                    });
                } catch {
                    result.push({
                        type: '📢 Channel',
                        name: 'Unknown',
                        jid: channelJid,
                        id: input
                    });
                }
            }
        }

        if (result.length === 0) {
            return await showJidHelp(conn, from, sender, prefix, command);
        }

        let responseText = `┏╾─────────── JID INFORMATION ───────────╼\n╿\n`;

        for (const item of result) {
            responseText += `├⟐ ${item.type}\n`;
            responseText += `├⟐   Name: ${item.name}\n`;
            responseText += `├⟐   JID: \`${item.jid}\`\n`;
            responseText += `├⟐   ID: ${item.id}\n`;
            
            if (item.members) {
                responseText += `├⟐   Members: ${item.members}\n`;
            }
            if (item.subscribers) {
                responseText += `├⟐   Subscribers: ${item.subscribers}\n`;
            }
            if (item.inviteCode) {
                responseText += `├⟐   Invite: ${item.inviteCode}\n`;
            }
            if (item.exists !== undefined) {
                responseText += `├⟐   On WA: ${item.exists ? 'Yes' : 'No'}\n`;
            }
            responseText += `╿\n`;
            responseText += `├⟐ ────────────────────\n`;
            responseText += `╿\n`;
        }

        responseText += `╽\n┗╾───────────\n\n> ${config.BOT_FOOTER}`;

        await conn.sendMessage(from, {
            text: responseText,
            contextInfo: getContextInfo({ sender: sender })
        }, { quoted: fkontak });

        await conn.sendMessage(from, {
            react: { text: '🆔', key: mek.key }
        });

    } catch (error) {
        console.error('JID command error:', error);
        await conn.sendMessage(from, {
            text: `❌ Error: ${error.message}`,
            contextInfo: getContextInfo({ sender: sender })
        }, { quoted: fkontak });
    }
});

async function showJidHelp(conn, from, sender, prefix, command) {
    const helpText = `┏╾─────────── JID HELP ───────────╼
╿
├⟐ 1. Get current group JID
├⟐    ${prefix}${command}
├⟐    (in a group)
╿
├⟐ 2. Get user JID by reply
├⟐    Reply to user: ${prefix}${command}
╿
├⟐ 3. Get JID by mention
├⟐    ${prefix}${command} @user1 @user2
╿
├⟐ 4. Get group JID by link
├⟐    ${prefix}${command} https://chat.whatsapp.com/xxxx
╿
├⟐ 5. Get channel JID by link
├⟐    ${prefix}${command} https://whatsapp.com/channel/xxxx
╿
├⟐ 6. Get user JID by number
├⟐    ${prefix}${command} 255612491554
╿
├⟐ 7. Get info by direct JID
├⟐    ${prefix}${command} 1234567890@g.us
├⟐    ${prefix}${command} 1234567890@newsletter
╽
┗╾───────────

> ${config.BOT_FOOTER}`;

    await conn.sendMessage(from, {
        image: { url: config.IMAGE_PATH },
        caption: helpText,
        contextInfo: getContextInfo({ sender: sender })
    }, { quoted: fkontak });
}

async function getPushName(conn, jid) {
    try {
        const presence = await conn.presenceSubscribe(jid).catch(() => null);
        return presence?.name || jid.split('@')[0];
    } catch {
        return jid.split('@')[0];
    }
}

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
                text: "🚫 Owner-only command!",
                contextInfo: getContextInfo({ sender: sender })
            }, { quoted: fkontak });
        }

        const groups = Object.values(await conn.groupFetchAllParticipating());
        
        let listText = `┏╾─────────── ALL GROUP JIDS ───────────╼\n╿\n`;
        listText += `├⟐ Total: ${groups.length} groups\n╿\n\n`;

        groups.forEach((group, index) => {
            listText += `├⟐ ${index + 1}. ${group.subject}\n`;
            listText += `├⟐    JID: \`${group.id}\`\n`;
            listText += `├⟐    Members: ${group.participants.length}\n\n`;
        });

        listText += `╽\n┗╾───────────\n\n> ${config.BOT_FOOTER}`;

        if (listText.length > 4000) {
            const buffer = Buffer.from(listText, 'utf-8');
            await conn.sendMessage(from, {
                document: buffer,
                mimetype: 'text/plain',
                fileName: 'groups_jid_list.txt',
                caption: `📋 List of ${groups.length} groups`,
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
            text: `❌ Error: ${error.message}`,
            contextInfo: getContextInfo({ sender: sender })
        }, { quoted: fkontak });
    }
});