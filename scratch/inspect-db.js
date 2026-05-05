import { pool } from './src/lib/db.js';

async function listTables() {
    try {
        const [rows] = await pool.query('SHOW TABLES');
        console.log('Tables in database:');
        console.log(JSON.stringify(rows, null, 2));
        
        for (const row of rows) {
            const tableName = Object.values(row)[0];
            const [columns] = await pool.query(`DESCRIBE ${tableName}`);
            console.log(`\nTable: ${tableName}`);
            console.log(JSON.stringify(columns, null, 2));
        }
        
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

listTables();
