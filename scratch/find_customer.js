const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

async function findCustomer() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'isp_jarfi'
    });

    const query = `
        SELECT c.*, r.name as router_name, p.name as package_name 
        FROM Customers c
        LEFT JOIN Routers r ON c.router_id = r.id
        LEFT JOIN Packages p ON c.package_id = p.id
        WHERE c.name LIKE '%JEDONKKIDUL%' OR c.pppoe_username LIKE '%JEDONKKIDUL%'
    `;
    
    const [results] = await connection.query(query);
    console.log(JSON.stringify(results, null, 2));

    await connection.end();
}

findCustomer().catch(console.error);
