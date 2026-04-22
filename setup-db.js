const fs = require('fs');
const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function run() {
    console.log('Toko/JARFI DB Setup');
    console.log('Menghubungkan ke MySQL...');

    try {
        const connection = await mysql.createConnection({
            host: process.env.MYSQL_HOST || 'localhost',
            user: process.env.MYSQL_USER || 'root',
            password: process.env.MYSQL_PASSWORD || ''
        });

        console.log('Terhubung! Menjalankan skrip schema.sql...');
        const sqlFile = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');

        // Split queries by semicolon
        const queries = sqlFile.split(';').map(q => q.trim()).filter(q => q.length > 0);

        for (let query of queries) {
            if (query) {
                await connection.query(query);
            }
        }

        console.log('✅ Skema Database berhasil dibuat!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Gagal menjalankan setup database:', error.message);
        process.exit(1);
    }
}

run();
