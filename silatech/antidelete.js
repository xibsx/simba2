const { cmd } = global;
const config = require('../config');
const { fkontak, getContextInfo } = require('../lib/functions');
const { getAntiDeleteSettings, updateAntiDeleteSettings } = require('../lib/antifunctions');

cmd({
    pattern: "antidelete",
    alias: ["antidel", "ad"],
    desc: "Toggle anti-delete feature (DM/Group/All)",
    category: "owner",
    react: "🗑️",
    filename: __filename
}, async (conn, mek, m, { from, sender, args, isOwner, prefix }) => {
    try {
        // Check if owner
        if (!isOwner) {
            return await conn.sendMessage(from, {
                text: `❌ *Only bot owner can use this command!*\n\n${config.BOT_FOOTER}`,
                contextInfo: getContextInfo({ sender: sender })
            }, { quoted: fkontak });
        }

        // Get current settings
        const settings = getAntiDeleteSettings();
        const action = args[0]?.toLowerCase();

        // If no args, show status with buttons
        if (!action) {
            const buttons = [
                { 
                    buttonId: `${prefix}antidelete dm`, 
                    buttonText: { displayText: `📱 DM ${settings.global.dm ? '✅' : '❌'}` }, 
                    type: 1 
                },
                { 
                    buttonId: `${prefix}antidelete group`, 
                    buttonText: { displayText: `👥 GROUP ${settings.global.group ? '✅' : '❌'}` }, 
                    type: 1 
                },
                { 
                    buttonId: `${prefix}antidelete all`, 
                    buttonText: { displayText: `🌐 ALL ${settings.global.all ? '✅' : '❌'}` }, 
                    type: 1 
                },
                { 
                    buttonId: `${prefix}antidelete off`, 
                    buttonText: { displayText: '❌ TURN OFF ALL' }, 
                    type: 1 
                }
            ];

            const caption = `🗑️ *ANTI-DELETE SETTINGS*\n\n` +
                           `📱 DM : ${settings.global.dm ? '✅ ON' : '❌ OFF'}\n` +
                           `👥 GROUP : ${settings.global.group ? '✅ ON' : '❌ OFF'}\n` +
                           `🌐 ALL : ${settings.global.all ? '✅ ON' : '❌ OFF'}\n\n` +
                           `Choose option below:\n\n` +
                           `${config.BOT_FOOTER}`;

            await conn.sendMessage(sender, { 
                text: caption, 
                footer: config.BOT_FOOTER,
                buttons: buttons,
                headerType: 1,
                contextInfo: getContextInfo({ sender: sender })
            }, { quoted: fkontak });
            return;
        }

        // Handle actions
        let statusText = '';
        let updated = false;

        switch (action) {
            case 'dm':
                updated = updateAntiDeleteSettings('dm', !settings.global.dm);
                statusText = `📱 DM ${!settings.global.dm ? '𝙴𝙽𝙰𝙱𝙻𝙴𝙳 ✅' : '𝙳𝙸𝚂𝙰𝙱𝙻𝙴𝙳 ❌'}`;
                break;
                
            case 'group':
                updated = updateAntiDeleteSettings('group', !settings.global.group);
                statusText = `👥 GROUP ${!settings.global.group ? '𝙴𝙽𝙰𝙱𝙻𝙴𝙳 ✅' : '𝙳𝙸𝚂𝙰𝙱𝙻𝙴𝙳 ❌'}`;
                break;
                
            case 'all':
                updated = updateAntiDeleteSettings('all', !settings.global.all);
                statusText = `🌐 ALL ${!settings.global.all ? '𝙴𝙽𝙰𝙱𝙻𝙴𝙳 ✅' : '𝙳𝙸𝚂𝙰𝙱𝙻𝙴𝙳 ❌'}`;
                break;
                
            case 'off':
                updated = updateAntiDeleteSettings('dm', false) && 
                          updateAntiDeleteSettings('group', false) && 
                          updateAntiDeleteSettings('all', false);
                statusText = '❌ ALL FEATURES 𝙳𝙸𝚂𝙰𝙱𝙻𝙴𝙳';
                break;
                
            default:
                return await conn.sendMessage(sender, {
                    text: `❌ *Invalid option! Use: dm/group/all/off*\n\n${config.BOT_FOOTER}`,
                    contextInfo: getContextInfo({ sender: sender })
                }, { quoted: fkontak });
        }

        if (updated) {
            const newSettings = getAntiDeleteSettings();
            
            await conn.sendMessage(sender, {
                text: `🗑️ *ANTI-DELETE UPDATED*\n\n` +
                      `${statusText}\n\n` +
                      `📱 DM : ${newSettings.global.dm ? '✅ ON' : '❌ OFF'}\n` +
                      `👥 GROUP : ${newSettings.global.group ? '✅ ON' : '❌ OFF'}\n` +
                      `🌐 ALL : ${newSettings.global.all ? '✅ ON' : '❌ OFF'}\n\n` +
                      `${config.BOT_FOOTER}`,
                contextInfo: getContextInfo({ sender: sender })
            }, { quoted: fkontak });

            await conn.sendMessage(sender, {
                react: { text: '✅', key: mek.key }
            });
        }

    } catch (error) {
        console.error('Antidelete command error:', error);
        await conn.sendMessage(sender, {
            text: `❌ *Error:* ${error.message}\n\n${config.BOT_FOOTER}`,
            contextInfo: getContextInfo({ sender: sender })
        }, { quoted: fkontak });
    }
});
