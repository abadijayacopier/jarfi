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

    const [routers] = await connection.query('SELECT id, name, ip_address, status FROM Routers');
    console.log('--- Routers ---');
    console.table(routers);

    const [customers] = await connection.query('SELECT id, name, pppoe_username, router_id, status FROM Customers');
    console.log('--- Customers ---');
    console.table(customers);

    await connection.end();
}

check().catch(console.error);
