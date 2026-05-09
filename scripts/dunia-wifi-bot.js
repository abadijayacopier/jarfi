const TelegramBot = require('node-telegram-bot-api');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

// Config
const token = process.env.TELEGRAM_BOT_TOKEN;
const geminiKey = process.env.GEMINI_API_KEY;

if (!token || token.includes('your_bot_token_here')) {
    console.error('❌ ERROR: TELEGRAM_BOT_TOKEN belum diisi di .env.local!');
    process.exit(1);
}

if (!geminiKey) {
    console.error('❌ ERROR: GEMINI_API_KEY belum diisi di .env.local!');
    process.exit(1);
}

// Initialize AI
const genAI = new GoogleGenerativeAI(geminiKey);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Initialize Bot (Polling Mode - Works on Localhost!)
const bot = new TelegramBot(token, { polling: true });

console.log('🚀 Dunia WiFi AI Bot Aktif (Mode Polling)...');
console.log('💡 Tip: Chat bot Anda di Telegram sekarang!');

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

async function getSystemContext() {
    try {
        const [customers] = await pool.query('SELECT COUNT(*) as count FROM Customers');
        const [activeCustomers] = await pool.query("SELECT COUNT(*) as count FROM Customers WHERE status = 'ACTIVE'");
        const [routers] = await pool.query('SELECT name, ip_address FROM Routers');
        
        let context = `DATA REAL-TIME DUNIA WIFI:\n`;
        context += `- Total Pelanggan: ${customers[0].count}\n`;
        context += `- Pelanggan Aktif: ${activeCustomers[0].count}\n`;
        context += `- Daftar Router MikroTik:\n`;
        routers.forEach(r => {
            context += `  * ${r.name} (${r.ip_address})\n`;
        });
        
        return context;
    } catch (e) {
        return "Gagal mengambil data sistem.";
    }
}

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (!text) return;

    console.log(`📩 [CHAT ID: ${chatId}] Pesan dari ${msg.from.first_name}: ${text}`);

    // Typing effect
    bot.sendChatAction(chatId, 'typing');

    try {
        const systemContext = await getSystemContext();
        
        const prompt = `
            Anda adalah "JarfiMgt_bot", asisten AI pintar untuk NOC (Network Operations Center) ISP Dunia WiFi.
            Tugas Anda adalah membantu pemilik ISP memantau jaringan.
            
            KONTEKS SISTEM SAAT INI:
            ${systemContext}
            
            INSTRUKSI:
            1. Gunakan gaya bahasa yang ramah, profesional, tapi santai (Gaya Bos/Juragan ISP).
            2. Jawab pertanyaan berdasarkan data real-time di atas.
            3. Jika ada router yang mati (berdasarkan pertanyaan user), berikan semangat.
            4. Gunakan emoji yang relevan.
            
            PERTANYAAN USER: "${text}"
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const replyText = response.text();

        bot.sendMessage(chatId, replyText, { parse_mode: 'Markdown' });
    } catch (error) {
        console.error('❌ AI Error:', error);
        bot.sendMessage(chatId, "Waduh Bos, otak AI saya lagi agak lemot. Coba tanya lagi ya! 🤖☕");
    }
});
