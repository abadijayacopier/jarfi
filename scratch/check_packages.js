const { pool } = require('./src/lib/db');

async function check() {
    const [rows] = await pool.query('SELECT count(*) as count FROM Customers WHERE package_id IS NULL');
    console.log('Customers with no package:', rows[0].count);
    
    const [packages] = await pool.query('SELECT name FROM Packages');
    console.log('Available Packages:', packages.map(p => p.name).join(', '));
}

check().then(() => process.exit());
