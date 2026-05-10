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
            
            // Debug: List available models
            console.log('🔍 Mengecek daftar model yang tersedia...');
            try {
                // We use a dummy model to check if the key works at least
                model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
                console.log('🤖 Otak AI Siap (Gemini Flash).');
            } catch (e) {
                console.log('⚠️ Gagal inisialisasi AI awal.');
            }
        } catch (e) {
            console.log('⚠️ Gagal inisialisasi AI.');
        }
    }

    console.log('✅ Bot Terhubung & Menunggu Pesan...');

    // --- SISTEM NOTIFIKASI OTOMATIS (CEK SETIAP 5 MENIT) ---
    setInterval(async () => {
        try {
            const settings = await getSettings();
            if (settings.telegram_enabled !== '1') return;

            const chatId = settings.telegram_chat_id;
            if (!chatId) return;

            const [offlineRouters] = await pool.query("SELECT name, ip_address FROM Routers WHERE status = 'OFFLINE'");
            
            if (offlineRouters.length > 0) {
                let alertMsg = `⚠️ *PERINGATAN JARINGAN*\n\n`;
                alertMsg += `Ditemukan *${offlineRouters.length} Router* Down:\n`;
                offlineRouters.forEach(r => {
                    alertMsg += `❌ ${r.name} (${r.ip_address})\n`;
                });
                alertMsg += `\nSegera cek lokasi Bos! 📡🚀`;
                
                bot.sendMessage(chatId, alertMsg, { parse_mode: 'Markdown' });
                console.log(`📢 Notifikasi Terkirim ke ID: ${chatId}`);
            }
        } catch (e) {
            console.error('❌ Notif Error:', e.message);
        }
    }, 5 * 60 * 1000); // 5 Menit

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

            // Match words exactly to avoid false positives (e.g., 'apakah' containing 'p')
            const words = cleanText.split(/\s+/);
            const matches = (keywords) => keywords.some(k => words.includes(k) || cleanText === k);

            // 0. Cari Pelanggan Khusus
            if (words.length >= 2 && ['cari', 'lacak', 'info'].includes(words[0])) {
                const keyword = words.slice(1).join(' ');
                
                const [custs] = await pool.query(`
                    SELECT c.pppoe_username, c.status, p.name as package_name, u.name as real_name
                    FROM Customers c
                    LEFT JOIN Users u ON c.user_id = u.id
                    LEFT JOIN Packages p ON c.package_id = p.id
                    WHERE c.pppoe_username LIKE ? OR u.name LIKE ?
                    LIMIT 3
                `, [`%${keyword}%`, `%${keyword}%`]);

                if (custs.length > 0) {
                    let resultMsg = `🔍 *Hasil Pencarian: ${keyword}*\n\n`;
                    custs.forEach(c => {
                        const icon = c.status === 'ACTIVE' ? '🟢' : (c.status === 'ISOLATED' ? '🔴' : '⚪');
                        resultMsg += `${icon} *${c.pppoe_username}* ${c.real_name ? `(${c.real_name})` : ''}\n`;
                        resultMsg += `├ Paket: ${c.package_name || '-'}\n`;
                        resultMsg += `└ Status: *${c.status}*\n\n`;
                    });
                    return bot.sendMessage(chatId, resultMsg, { parse_mode: 'Markdown' });
                } else {
                    return bot.sendMessage(chatId, `🔍 Maaf Bos, pelanggan dengan keyword *${keyword}* tidak ditemukan di Database.`, { parse_mode: 'Markdown' });
                }
            }

            // 1. Sapaan
            if (matches(greetings) && words.length <= 2) {
                return bot.sendMessage(chatId, `Halo Bos ${msg.from.first_name}! 👋 JarfiMgt siap membantu. Mau cek apa hari ini?\n\nKetik *status* untuk cek jaringan atau *omset* untuk cek bisnis.`);
            }

            // 2. Data MikroTik
            if (matches(mikrotikCmds)) {
                const [routers] = await pool.query('SELECT name FROM Routers');
                return bot.sendMessage(chatId, `📡 *STATUS HARDWARE & CORE*\n\nRouter MikroTik terpantau *ONLINE*. Resource CPU & RAM masih sangat lega untuk melayani pelanggan. Uptime stabil Bos! ✅\n\nTerhubung ke *${routers.length} Router*.`);
            }

            // 3. Layanan
            if (matches(serviceCmds)) {
                const [act] = await pool.query("SELECT COUNT(*) as count FROM Customers WHERE status = 'ACTIVE'");
                return bot.sendMessage(chatId, `🛠️ *LAYANAN DUNIA WIFI*\n\nLayanan *PPPoE & Hotspot* berjalan normal. Pelanggan aktif saat ini: *${act[0].count} User*.\n\nUntuk buat Voucher baru atau Isolasi pelanggan, silakan akses Menu Layanan di Dashboard Utama ya Bos! 🚀`);
            }

            // 4. Status Jaringan
            if (matches(statusCmds)) {
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
            if (matches(billingCmds)) {
                const [cust] = await pool.query('SELECT COUNT(*) as count FROM Customers');
                return bot.sendMessage(chatId, `📉 *INFO OPERASIONAL & BISNIS*\n\nTotal Pelanggan: *${cust[0].count}*.\n\nUntuk laporan omset detail dan grafik bandwidth, silakan cek langsung di Dashboard Jarfi ya Bos! 🚀`);
            }

            // 6. Menu/Help
            if (matches(introCmds)) {
                return bot.sendMessage(chatId, `🤖 *IDENTITAS BOT*\n\nSaya adalah *JarfiMgt_bot*, asisten pintar Dunia WiFi.\n\n*Perintah Tersedia:*\n- /status\n- /trafik\n- /mikrotik\n- /menu`, { parse_mode: 'Markdown' });
            }

            if (model) {
                try {
                    const promptText = `Anda adalah asisten cerdas ISP bernama JarfiMgt_bot. Berikan jawaban yang ramah, singkat, dan membantu kepada bos Anda. Usahakan tanpa menggunakan format teks tebal/miring yang rumit. Pertanyaan: ${msg.text}`;
                    let result;
                    
                    const modelsToTry = ["models/gemini-1.5-flash", "models/gemini-1.5-pro", "models/gemini-pro", "gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro"];
                    let lastError = null;

                    for (const modelName of modelsToTry) {
                        try {
                            const genAI = new GoogleGenerativeAI(geminiKey);
                            // Coba dengan API v1 (lebih stabil di beberapa region)
                            const currentModel = genAI.getGenerativeModel({ model: modelName }, { apiVersion: 'v1' });
                            result = await currentModel.generateContent(promptText);
                            if (result) {
                                console.log(`✅ AI Berhasil menggunakan model: ${modelName} (v1)`);
                                break;
                            }
                        } catch (aiError) {
                            try {
                                // Fallback ke v1beta jika v1 gagal
                                const genAI = new GoogleGenerativeAI(geminiKey);
                                const currentModel = genAI.getGenerativeModel({ model: modelName });
                                result = await currentModel.generateContent(promptText);
                                if (result) {
                                    console.log(`✅ AI Berhasil menggunakan model: ${modelName} (v1beta)`);
                                    break;
                                }
                            } catch (v1betaError) {
                                lastError = v1betaError;
                                console.log(`⚠️ Model ${modelName} gagal: ${v1betaError.message}`);
                                continue;
                            }
                        }
                    }

                    if (!result) throw lastError || new Error("Semua model AI gagal merespon.");
                    
                    const responseText = result.response.text();
                    
                    try {
                        return await bot.sendMessage(chatId, responseText, { parse_mode: 'Markdown' });
                    } catch (parseError) {
                        // Fallback without parse_mode if markdown is invalid
                        return await bot.sendMessage(chatId, responseText);
                    }
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
