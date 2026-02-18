const fs = require('fs-extra');
const path = require('path');

// Database paths
const DB_PATH = './database';
const CHATBOT_FILE = path.join(DB_PATH, 'chatbot.json');
const SETTINGS_FILE = path.join(DB_PATH, 'settings.json');

// Ensure database directory exists
if (!fs.existsSync(DB_PATH)) {
    fs.mkdirSync(DB_PATH, { recursive: true });
}

// ============================================
// 📌 CHATBOT DATABASE
// ============================================
const chatbotDB = {
    // Get chatbot settings
    getChatbotSettings: async () => {
        try {
            if (fs.existsSync(CHATBOT_FILE)) {
                const data = await fs.readFile(CHATBOT_FILE, 'utf8');
                return JSON.parse(data);
            }
        } catch (error) {
            console.error('Error reading chatbot settings:', error);
        }
        return { global: { enabled: true } }; // Default enabled
    },

    // Update chatbot settings
    updateChatbotSettings: async (settings) => {
        try {
            await fs.writeFile(CHATBOT_FILE, JSON.stringify(settings, null, 2));
            return true;
        } catch (error) {
            console.error('Error saving chatbot settings:', error);
            return false;
        }
    },

    // Toggle chatbot
    toggleChatbot: async (enabled) => {
        try {
            const settings = await chatbotDB.getChatbotSettings();
            settings.global.enabled = enabled;
            await chatbotDB.updateChatbotSettings(settings);
            return settings;
        } catch (error) {
            console.error('Error toggling chatbot:', error);
            return null;
        }
    }
};

// ============================================
// 📌 USER PREFERENCES DATABASE
// ============================================
const userDB = {
    // Get user settings
    getUserSettings: async (userId) => {
        try {
            const all = await userDB.getAllSettings();
            return all[userId] || {};
        } catch (error) {
            console.error('Error getting user settings:', error);
            return {};
        }
    },

    // Update user settings
    updateUserSettings: async (userId, settings) => {
        try {
            let all = {};
            if (fs.existsSync(SETTINGS_FILE)) {
                all = JSON.parse(await fs.readFile(SETTINGS_FILE, 'utf8'));
            }
            all[userId] = { ...(all[userId] || {}), ...settings };
            await fs.writeFile(SETTINGS_FILE, JSON.stringify(all, null, 2));
            return true;
        } catch (error) {
            console.error('Error saving user settings:', error);
            return false;
        }
    },

    // Get all settings
    getAllSettings: async () => {
        try {
            if (fs.existsSync(SETTINGS_FILE)) {
                return JSON.parse(await fs.readFile(SETTINGS_FILE, 'utf8'));
            }
        } catch (error) {
            console.error('Error reading all settings:', error);
        }
        return {};
    }
};

// ============================================
// 📌 GROUP SETTINGS DATABASE
// ============================================
const groupDB = {
    // Get group settings
    getGroupSettings: async (groupId) => {
        try {
            const all = await groupDB.getAllGroups();
            return all[groupId] || { welcome: false, goodbye: false, antilink: false };
        } catch (error) {
            return { welcome: false, goodbye: false, antilink: false };
        }
    },

    // Update group settings
    updateGroupSettings: async (groupId, settings) => {
        try {
            const groupFile = path.join(DB_PATH, 'groups.json');
            let all = {};
            if (fs.existsSync(groupFile)) {
                all = JSON.parse(await fs.readFile(groupFile, 'utf8'));
            }
            all[groupId] = { ...(all[groupId] || {}), ...settings };
            await fs.writeFile(groupFile, JSON.stringify(all, null, 2));
            return true;
        } catch (error) {
            console.error('Error saving group settings:', error);
            return false;
        }
    },

    // Get all groups
    getAllGroups: async () => {
        try {
            const groupFile = path.join(DB_PATH, 'groups.json');
            if (fs.existsSync(groupFile)) {
                return JSON.parse(await fs.readFile(groupFile, 'utf8'));
            }
        } catch (error) {
            console.error('Error reading groups:', error);
        }
        return {};
    }
};

module.exports = {
    chatbotDB,
    userDB,
    groupDB,
    
    // Shortcut functions
    getChatbotSettings: chatbotDB.getChatbotSettings,
    updateChatbotSettings: chatbotDB.updateChatbotSettings,
    toggleChatbot: chatbotDB.toggleChatbot,
    
    getUserSettings: userDB.getUserSettings,
    updateUserSettings: userDB.updateUserSettings,
    
    getGroupSettings: groupDB.getGroupSettings,
    updateGroupSettings: groupDB.updateGroupSettings
};
