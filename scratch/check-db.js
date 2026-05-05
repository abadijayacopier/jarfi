const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function check() {
    const connection = await mysql.createConnection(process.env.DATABASE_URL);
    try {
        const [customers] = await connection.execute('SELECT COUNT(*) as count FROM Customers');
        const [users] = await connection.execute('SELECT COUNT(*) as count FROM Users');
        const [packages] = await connection.execute('SELECT COUNT(*) as count FROM Packages');
        const [sample] = await connection.execute('SELECT * FROM Customers LIMIT 1');
        
        console.log('Customers count:', customers[0].count);
        console.log('Users count:', users[0].count);
        console.log('Packages count:', packages[0].count);
        console.log('Sample Customer:', JSON.stringify(sample[0], null, 2));
        
        const [joined] = await connection.execute(`
            SELECT COUNT(*) as count 
            FROM Customers c
            LEFT JOIN Users u ON c.user_id = u.id
            LEFT JOIN Packages p ON c.package_id = p.id
        `);
        console.log('Joined result count:', joined[0].count);
        
    } catch (e) {
        console.error(e);
    } finally {
        await connection.end();
    }
}

check();
