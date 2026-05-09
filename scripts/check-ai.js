const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');

async function checkModels() {
    console.log("🔍 Mengecek model yang tersedia untuk API Key Anda...");
    
    // Get key from DB or .env
    let geminiKey = process.env.GEMINI_API_KEY;
    try {
        const pool = mysql.createPool({
            host: process.env.MYSQL_HOST || 'localhost',
            user: process.env.MYSQL_USER || 'root',
            password: process.env.MYSQL_PASSWORD || 'admin',
            database: process.env.MYSQL_DATABASE || 'jarfi_db'
        });
        const [rows] = await pool.query("SELECT value FROM Settings WHERE `key` = 'gemini_api_key'");
        if (rows.length > 0) geminiKey = rows[0].value;
        await pool.end();
    } catch (e) {}

    if (!geminiKey) {
        console.error("❌ API Key tidak ditemukan!");
        return;
    }

    const genAI = new GoogleGenerativeAI(geminiKey);
    
    try {
        // We can't easily list models with the standard SDK without a specific method
        // but we can try a simple request to 'gemini-1.5-flash' with v1beta
        console.log("Kunci ditemukan: " + geminiKey.substring(0, 10) + "...");
        
        const testModels = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro"];
        
        for (const m of testModels) {
            try {
                console.log(`Testing model: ${m}...`);
                const model = genAI.getGenerativeModel({ model: m });
                const result = await model.generateContent("hi");
                const response = await result.response;
                console.log(`✅ Model ${m} SUKSES!`);
                process.exit(0);
            } catch (err) {
                console.log(`❌ Model ${m} GAGAL: ${err.message}`);
            }
        }
    } catch (error) {
        console.error("❌ Error fatal:", error.message);
    }
}

checkModels();
