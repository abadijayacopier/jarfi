const { pool } = require('./src/lib/db');

async function test() {
    try {
        const [packages] = await pool.query('SELECT * FROM Packages');
        console.log('Packages:', packages);
        const [routers] = await pool.query('SELECT * FROM Routers');
        console.log('Routers:', routers);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

test();
