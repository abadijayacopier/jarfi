const { RouterOSClient } = require('routeros-client');
const mysql = require('mysql2/promise');

async function run() {
    const pool = mysql.createPool({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'jarfi_db'
    });

    const [routers] = await pool.query('SELECT * FROM Routers LIMIT 1');
    if (routers.length === 0) { console.log('No routers'); process.exit(); }
    
    const router = routers[0];
    const client = new RouterOSClient({
        host: router.ip_address, user: router.username, password: router.password, port: router.api_port
    });
    
    try {
        const conn = await client.connect();
        const active = await conn.menu('/interface').get();
        console.log(JSON.stringify(active.filter(x => x.type === 'pppoe-in').slice(0, 3), null, 2));
    } catch(e) { console.error(e); }
    finally { client.close(); process.exit(); }
}
run();
