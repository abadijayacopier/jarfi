const TelegramBot = require('node-telegram-bot-api');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

const VERSION = "1.1.1-FLASH";

console.log(`\n=========================================`);
console.log(`🚀 DUNIA WIFI AI BOT v${VERSION} (GRATIS)`);
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
            console.log('⚠️ Gagal inisialisasi AI, beralih ke Mode Smart Keyword.');
        }
    } else {
        console.log('💡 Mode Smart Keyword Aktif (API Key belum diisi).');
    }

    console.log('✅ Bot Terhubung & Menunggu Pesan...');

    bot.on('message', async (msg) => {
        const chatId = msg.chat.id;
        const text = msg.text?.toLowerCase();
        if (!text) return;

        console.log(`📩 [ID: ${chatId}] ${msg.from.first_name}: ${text}`);
        bot.sendChatAction(chatId, 'typing');

        try {
            // Ambil Data Real-time
            const [cust] = await pool.query('SELECT COUNT(*) as count FROM Customers');
            const [act] = await pool.query("SELECT COUNT(*) as count FROM Customers WHERE status = 'ACTIVE'");
            const [routers] = await pool.query('SELECT name, ip_address, status FROM Routers');
            
            // --- LOGIKA SMART KEYWORD (BACKUP) ---
            if (text.includes('halo') || text.includes('hi') || text.includes('pagi') || text.includes('siang') || text.includes('malam') || text.includes('hai')) {
                await bot.sendMessage(chatId, `Halo Bos ${msg.from.first_name}! 👋 JarfiMgt siap membantu. Mau cek apa hari ini?\n\nKetik *status* untuk cek jaringan atau *trafik* untuk cek beban.`);
                return; // STOP DI SINI
            }

            if (text.includes('status') || text.includes('jaringan') || text.includes('router') || text.includes('cek') || text.includes('pelanggan') || text.includes('user') || text.includes('online')) {
                let report = `📊 *LAPORAN DUNIA WIFI*\n\n`;
                report += `👥 *Pelanggan:* ${cust[0].count} total (${act[0].count} aktif)\n`;
                report += `🌐 *Status Router:* \n`;
                routers.forEach(r => {
                    const icon = r.status === 'ONLINE' ? '✅' : '❌';
                    report += `${icon} ${r.name} (${r.ip_address})\n`;
                });
                await bot.sendMessage(chatId, report, { parse_mode: 'Markdown' });
                return; // STOP DI SINI
            }

            if (text.includes('trafik') || text.includes('beban') || text.includes('bandwidth') || text.includes('omset')) {
                await bot.sendMessage(chatId, `📉 *INFO OPERASIONAL*\n\nSaat ini ada *${routers.length} Router* terpantau.\nTotal Pelanggan: *${cust[0].count}*.\n\nUntuk trafik detail dan laporan omset, silakan cek Dashboard utama ya Bos! 🚀`);
                return; // STOP DI SINI
            }

            if (text.includes('bantuan') || text.includes('help') || text.includes('menu')) {
                await bot.sendMessage(chatId, `📖 *MENU BANTUAN*\n\n1. Ketik *status* - Cek pelanggan & router.\n2. Ketik *trafik* - Cek info operasional.\n3. Ketik *halo* - Sapa asisten.\n\nChat bebas lainnya akan dijawab oleh AI (jika sudah aktif).`, { parse_mode: 'Markdown' });
                return; // STOP DI SINI
            }

            // --- JIKA TIDAK ADA KEYWORD, PAKAI AI (KALAU ADA) ---
            if (model) {
                try {
                    let systemContext = `DATA REAL-TIME:\n- Pelanggan: ${cust[0].count}\n- Aktif: ${act[0].count}\n- Router: ${routers.map(r => r.name).join(', ')}`;
                    const prompt = `Anda adalah JarfiMgt_bot. Bantu pemilik ISP ini. Konteks: ${systemContext}. Pertanyaan: ${msg.text}`;
                    const result = await model.generateContent(prompt);
                    const response = await result.response;
                    return bot.sendMessage(chatId, response.text(), { parse_mode: 'Markdown' });
                } catch (aiErr) {
                    console.error('❌ AI Error:', aiErr.message);
                }
            }

            // Fallback terakhir kalau AI gagal dan keyword tidak cocok
            bot.sendMessage(chatId, "Waduh Bos, saya belum paham maksudnya. Coba ketik *status* atau tanya soal jaringan ya! 🤖☕");

        } catch (error) {
            console.error('❌ System Error:', error.message);
            bot.sendMessage(chatId, "Maaf Bos, ada gangguan teknis di sistem database. 🛠️");
        }
    });
}

startBot();
