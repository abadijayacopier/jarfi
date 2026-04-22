const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function seed() {
    console.log('🌱 Seeding database...');

    try {
        const connection = await mysql.createConnection({
            host: process.env.MYSQL_HOST || 'localhost',
            user: process.env.MYSQL_USER || 'root',
            password: process.env.MYSQL_PASSWORD || 'admin',
            database: process.env.MYSQL_DATABASE || 'jarfi_db'
        });

        // 1. Seed Users
        console.log('Seeding Users...');
        await connection.query(`
            INSERT INTO Users (name, email, password, role) 
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE name=VALUES(name)
        `, ['Admin JARFI', 'admin@jarfi.com', 'admin', 'ADMIN']);

        // 2. Seed Routers
        console.log('Seeding Routers...');
        await connection.query(`
            INSERT INTO Routers (name, ip_address, username, password, status) 
            VALUES (?, ?, ?, ?, ?)
        `, ['Router Pusat', '192.168.88.1', 'admin', '', 'OFFLINE']);

        // 3. Seed Packages
        console.log('Seeding Packages...');
        const packages = [
            ['Hemat 5Mbps', 100000, '5M/5M'],
            ['Standar 10Mbps', 150000, '10M/10M'],
            ['Premium 20Mbps', 250000, '20M/20M']
        ];

        for (const pkg of packages) {
            await connection.query(`
                INSERT INTO Packages (name, price, bandwidth_limit) 
                VALUES (?, ?, ?)
            `, pkg);
        }

        console.log('✅ Seeding selesai!');
        await connection.end();
    } catch (error) {
        console.error('❌ Gagal melakukan seeding:', error.message);
    }
}

seed();
