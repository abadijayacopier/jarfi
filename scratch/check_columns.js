const { pool } = require('./src/lib/db');

async function test() {
    try {
        const [columns] = await pool.query('SHOW COLUMNS FROM Customers');
        console.log('Columns:', columns.map(c => c.Field));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

test();
