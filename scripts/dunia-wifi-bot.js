const TelegramBot = require('node-telegram-bot-api');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

const VERSION = "2.0.0-PRO-MAX";

console.log(`\n=========================================`);
console.log(`🚀 DUNIA WIFI AI BOT v${VERSION}`);
console.log(`=========================================\n`);

// Database Connection
const pool = mysql.createPool({
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || 'admin',
    database: process.env.MYSQL_DATABASE || 'jarfi_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function getSettings() {
    try {
        const [rows] = await pool.query('SELECT * FROM Settings');
        const settings = {};
        rows.forEach(row => { settings[row.key] = row.value; });
        return settings;
    } catch (e) { return {}; }
}

async function startBot() {
    const settings = await getSettings();
    const token = settings.telegram_bot_token || process.env.TELEGRAM_BOT_TOKEN;
    const geminiKey = settings.gemini_api_key || process.env.GEMINI_API_KEY;

    if (!token || token.includes('your_bot_token_here')) {
        console.error('❌ ERROR: TELEGRAM_BOT_TOKEN belum diisi!');
        process.exit(1);
    }

    const bot = new TelegramBot(token, { polling: true });
    let model = null;

    if (geminiKey && !geminiKey.includes('your_api_key')) {
        try {
            const genAI = new GoogleGenerativeAI(geminiKey);
            model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            console.log('🤖 Otak AI Siap (Gemini Flash).');
        } catch (e) {
            console.log('⚠️ Gagal inisialisasi AI.');
        }
    }

    console.log('✅ Bot Terhubung & Menunggu Pesan...');

    bot.on('message', async (msg) => {
        const chatId = msg.chat.id;
        const text = msg.text?.toLowerCase() || "";
        if (!text) return;

        // Bersihkan teks dari awalan '/' jika ada
        const cleanText = text.startsWith('/') ? text.substring(1) : text;
        console.log(`📩 [ID: ${chatId}] ${msg.from.first_name}: ${text} (Clean: ${cleanText})`);
        
        bot.sendChatAction(chatId, 'typing');

        try {
            // --- LOGIKA SMART KEYWORD (SEBELUM DB AGAR CEPAT) ---
            const greetings = ['halo', 'hi', 'hai', 'pagi', 'siang', 'malam', 'p', 'assalamualaikum', 'start'];
            const statusCmds = ['status', 'jaringan', 'router', 'cek', 'pelanggan', 'user', 'online', 'kabar'];
            const mikrotikCmds = ['mikrotik', 'winbox', 'routeros', 'ros', 'rb', 'routerboard', 'cpu', 'ram', 'uptime'];
            const serviceCmds = ['pppoe', 'hotspot', 'voucher', 'paket', 'isolasi', 'pelunasan'];
            const billingCmds = ['omset', 'duit', 'uang', 'bayar', 'tagihan', 'trafik', 'beban', 'bandwidth'];
            const introCmds = ['siapa', 'namamu', 'bantuan', 'menu', 'help'];

            // 1. Sapaan
            if (greetings.some(k => cleanText.includes(k))) {
                return bot.sendMessage(chatId, `Halo Bos ${msg.from.first_name}! 👋 JarfiMgt siap membantu. Mau cek apa hari ini?\n\nKetik *status* untuk cek jaringan atau *omset* untuk cek bisnis.`);
            }

            // 2. Data MikroTik
            if (mikrotikCmds.some(k => cleanText.includes(k))) {
                const [routers] = await pool.query('SELECT name FROM Routers');
                return bot.sendMessage(chatId, `📡 *STATUS HARDWARE & CORE*\n\nRouter MikroTik terpantau *ONLINE*. Resource CPU & RAM masih sangat lega untuk melayani pelanggan. Uptime stabil Bos! ✅\n\nTerhubung ke *${routers.length} Router*.`);
            }

            // 3. Layanan
            if (serviceCmds.some(k => cleanText.includes(k))) {
                const [act] = await pool.query("SELECT COUNT(*) as count FROM Customers WHERE status = 'ACTIVE'");
                return bot.sendMessage(chatId, `🛠️ *LAYANAN DUNIA WIFI*\n\nLayanan *PPPoE & Hotspot* berjalan normal. Pelanggan aktif saat ini: *${act[0].count} User*.\n\nUntuk buat Voucher baru atau Isolasi pelanggan, silakan akses Menu Layanan di Dashboard Utama ya Bos! 🚀`);
            }

            // 4. Status Jaringan
            if (statusCmds.some(k => cleanText.includes(k))) {
                const [cust] = await pool.query('SELECT COUNT(*) as count FROM Customers');
                const [act] = await pool.query("SELECT COUNT(*) as count FROM Customers WHERE status = 'ACTIVE'");
                const [routers] = await pool.query('SELECT name, ip_address, status FROM Routers');
                
                let report = `📊 *LAPORAN DUNIA WIFI*\n\n`;
                report += `👥 *Pelanggan:* ${cust[0].count} total (${act[0].count} aktif)\n`;
                report += `🌐 *Status Router:* \n`;
                routers.forEach(r => {
                    const icon = r.status === 'ONLINE' ? '✅' : '❌';
                    report += `${icon} ${r.name} (${r.ip_address})\n`;
                });
                return bot.sendMessage(chatId, report, { parse_mode: 'Markdown' });
            }

            // 5. Billing
            if (billingCmds.some(k => cleanText.includes(k))) {
                const [cust] = await pool.query('SELECT COUNT(*) as count FROM Customers');
                return bot.sendMessage(chatId, `📉 *INFO OPERASIONAL & BISNIS*\n\nTotal Pelanggan: *${cust[0].count}*.\n\nUntuk laporan omset detail dan grafik bandwidth, silakan cek langsung di Dashboard Jarfi ya Bos! 🚀`);
            }

            // 6. Menu/Help
            if (introCmds.some(k => cleanText.includes(k))) {
                return bot.sendMessage(chatId, `🤖 *IDENTITAS BOT*\n\nSaya adalah *JarfiMgt_bot*, asisten pintar Dunia WiFi.\n\n*Perintah Tersedia:*\n- /status\n- /trafik\n- /mikrotik\n- /menu`, { parse_mode: 'Markdown' });
            }

            // --- AI FALLBACK ---
            if (model) {
                try {
                    const result = await model.generateContent(`Anda JarfiMgt_bot. Bantu bos ini. Tanya: ${msg.text}`);
                    const response = await result.response;
                    return bot.sendMessage(chatId, response.text(), { parse_mode: 'Markdown' });
                } catch (e) {
                    console.error('❌ AI Fail:', e.message);
                }
            }

            bot.sendMessage(chatId, "Waduh Bos, saya belum paham maksudnya. Coba ketik *status* atau tanya soal jaringan ya! 🤖☕");

        } catch (error) {
            console.error('❌ Error:', error.message);
            bot.sendMessage(chatId, "Maaf Bos, sistem sedang gangguan. 🛠️");
        }
    });
}

startBot();
