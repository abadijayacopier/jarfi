const mysql = require('mysql2/promise');

async function check() {
    const pool = mysql.createPool({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'jarfi'
    });

    const [packages] = await pool.query('SELECT * FROM Packages');
    console.log('Current Packages:', packages);
    
    await pool.end();
}

check().catch(console.error);
