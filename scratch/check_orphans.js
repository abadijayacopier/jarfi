const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

async function check() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'isp_jarfi'
    });

    const [rows] = await connection.query('SELECT COUNT(*) as count FROM Customers');
    console.log('Total Customers in table:', rows[0].count);

    const [rowsWithUser] = await connection.query('SELECT COUNT(*) as count FROM Customers c JOIN Users u ON c.user_id = u.id');
    console.log('Customers with User profiles:', rowsWithUser[0].count);

    const [orphanCustomers] = await connection.query('SELECT id FROM Customers c WHERE NOT EXISTS (SELECT 1 FROM Users u WHERE u.id = c.user_id)');
    console.log('Orphan Customers (no User):', orphanCustomers.length);

    await connection.end();
}

check().catch(console.error);
