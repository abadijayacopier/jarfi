const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

async function seed() {
  console.log('--- Seeding Superadmin ---');
  
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'jarfi_db'
  });

  try {
    const email = 'admin@jarfi.com';
    const password = 'admin123'; // Ganti dengan password yang lebih aman nanti
    const hashedPassword = await bcrypt.hash(password, 10);

    // Check if user exists
    const [rows] = await connection.query('SELECT id FROM Users WHERE email = ?', [email]);
    
    if (rows.length > 0) {
      await connection.query(
        'UPDATE Users SET password = ?, role = ? WHERE email = ?',
        [hashedPassword, 'SUPERADMIN', email]
      );
      console.log('✅ Berhasil mengupdate password Superadmin!');
    } else {
      await connection.query(
        'INSERT INTO Users (name, email, password, role) VALUES (?, ?, ?, ?)',
        ['Super Admin', email, hashedPassword, 'SUPERADMIN']
      );
      console.log('✅ Berhasil membuat Superadmin!');
    }

  } catch (error) {
    console.error('❌ Gagal seeding:', error);
  } finally {
    await connection.end();
    process.exit();
  }
}

seed();
