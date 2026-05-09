const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function update() {
  console.log('--- Updating Database Schema ---');
  
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'jarfi_db'
  });

  try {
    console.log('Mengupdate ENUM role di tabel Users...');
    await connection.query(`
      ALTER TABLE Users 
      MODIFY COLUMN role ENUM('SUPERADMIN', 'ADMIN', 'KASIR', 'TEKNISI', 'PELANGGAN', 'CUSTOMER') 
      DEFAULT 'PELANGGAN'
    `);
    console.log('✅ Berhasil mengupdate schema database!');
  } catch (error) {
    console.error('❌ Gagal update schema:', error.message);
  } finally {
    await connection.end();
    process.exit();
  }
}

update();
