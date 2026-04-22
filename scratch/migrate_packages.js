const mysql = require('mysql2/promise');

async function migrate() {
    const pool = mysql.createPool({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'jarfi_db'
    });

    try {
        await pool.query('ALTER TABLE Packages ADD COLUMN speed_limit VARCHAR(50) AFTER name');
        console.log('Successfully added speed_limit column to Packages table.');
    } catch (error) {
        if (error.code === 'ER_DUP_COLUMN_NAME') {
            console.log('Column speed_limit already exists.');
        } else {
            console.error('Error migrating database:', error);
        }
    } finally {
        await pool.end();
    }
}

migrate();
