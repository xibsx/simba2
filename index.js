const express = require('express');
const app = express();
const path = require('path');
const bodyParser = require("body-parser");
const PORT = process.env.PORT || 8000;

// Import routes
const pairRoute = require('./sila/sila');
const adminApi = require('./lib/admin-api');

// Set up global objects
global.activeSockets = new Map();
global.EmpirePair = require('./sila/sila').EmpirePair;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files
app.use('/code', pairRoute);
app.use('/api', adminApi);

// HTML pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'sila/silamd/main.html'));
});

app.get('/pair', (req, res) => {
    res.sendFile(path.join(__dirname, 'sila/silamd/pair.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'sila/silamd/admin-panel.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`
    ╭━━━〔 🐢 𝙎𝙄𝙇𝘼-𝙈𝘿 🐢 〕━━━┈⊷
    ┃
    ┃ 🚀 Server: http://localhost:${PORT}
    ┃ 👑 Admin: http://localhost:${PORT}/admin
    ┃ 🔗 Pair: http://localhost:${PORT}/pair
    ┃
    ╰━━━━━━━━━━━━━━━┈⊷
    `);
});

module.exports = app;
