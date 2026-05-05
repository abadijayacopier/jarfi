const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function check() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'jarfi_db'
  });
  
  const [rows] = await pool.query('SELECT count(*) as total, count(router_id) as with_router FROM Customers');
  console.log('Stats:', rows[0]);
  
  const [samples] = await pool.query('SELECT id, pppoe_username, router_id FROM Customers WHERE router_id IS NOT NULL LIMIT 5');
  console.log('With router samples:', samples);
  
  const [nullSamples] = await pool.query('SELECT id, pppoe_username, router_id FROM Customers WHERE router_id IS NULL LIMIT 5');
  console.log('Without router samples:', nullSamples);

  process.exit();
}
check();
