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
        const activeUsers = await conn.menu('/ppp/active').get();
        const monitorList = activeUsers.slice(0, 5).map(u => u.interface).filter(Boolean);
        
        console.log('Monitoring:', monitorList);
        
        if (monitorList.length > 0) {
            const monitor = await conn.menu('/interface').exec('monitor-traffic', {
                interface: monitorList.join(','),
                once: ''
            });
            console.log('Monitor Result:', JSON.stringify(monitor, null, 2));
        }
    } catch(e) { console.error(e); }
    finally { client.close(); process.exit(); }
}
run();
