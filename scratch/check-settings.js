const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function check() {
    try {
        const pool = mysql.createPool({
            host: process.env.MYSQL_HOST || 'localhost',
            user: process.env.MYSQL_USER || 'root',
            password: process.env.MYSQL_PASSWORD || 'admin',
            database: process.env.MYSQL_DATABASE || 'jarfi_db'
        });

        const [rows] = await pool.query('SELECT * FROM Settings');
        console.log('--- SETTINGS FROM DATABASE ---');
        const dbKey = rows.find(r => r.key === 'gemini_api_key')?.value;
        
        console.log('\n--- SETTINGS FROM ENV ---');
        console.log(`GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.substring(0, 5) + '...' : 'EMPTY'}`);

        if (dbKey) {
            console.log('\n--- LIVE TEST GOOGLE AI (DB KEY) ---');
            const { GoogleGenerativeAI } = require('@google/generative-ai');
            const genAI = new GoogleGenerativeAI(dbKey);
            
            // Mencoba model paling umum
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            try {
                process.stdout.write('⏳ Menghubungi Google AI Studio... ');
                const result = await model.generateContent("Test connection. Reply with 'OK'.");
                console.log('✅ BERHASIL!');
                console.log('Respon:', result.response.text());
            } catch (err) {
                console.log('❌ GAGAL!');
                console.log('Alasan:', err.message);
                if (err.message.includes('404')) {
                    console.log('\n💡 ANALISA: Error 404 berarti Key Bos valid tapi "TIDAK MENGENAL" model ini.');
                    console.log('Saran: Pastikan Bos pilih "Create API key in NEW project" di AI Studio.');
                }
            }
        }

    } catch (e) {
        console.error('Error:', e.message);
    }
    process.exit();
}

check();
