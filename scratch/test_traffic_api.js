const { RouterOSClient } = require('routeros-client');
const mysql = require('mysql2/promise');

async function run() {
    const pool = mysql.createPool({
        host: 'localhost',
        user: 'root',
        password: 'admin',
        database: 'jarfi_db'
    });

    try {
        const [routers] = await pool.query('SELECT * FROM Routers LIMIT 1');
        if (routers.length === 0) {
            console.log('No routers found in database.');
            process.exit(1);
        }
        
        const router = routers[0];
        console.log(`Connecting to ${router.ip_address}...`);
        
        const client = new RouterOSClient({
            host: router.ip_address, 
            user: router.username, 
            password: router.password, 
            port: router.api_port,
            timeout: 10
        });
        
        const conn = await client.connect();
        console.log('Connected.');

        // Get some interfaces
        const interfaces = await conn.menu('/interface').get();
        const pppoeInterfaces = interfaces.filter(i => i.type === 'pppoe-in').slice(0, 5);
        
        if (pppoeInterfaces.length === 0) {
            console.log('No PPPoE interfaces found.');
            await client.close();
            process.exit(0);
        }

        const interfaceNames = pppoeInterfaces.map(i => i.name).join(',');
        console.log(`Monitoring: ${interfaceNames}`);

        try {
            const monitorData = await conn.menu('/interface/monitor-traffic')
                .where('interface', interfaceNames)
                .where('once', true)
                .get();
            
            console.log('Monitor Result:', JSON.stringify(monitorData, null, 2));
        } catch (e) {
            console.error('Monitor Command Error:', e.message);
        }

        await client.close();
    } catch (e) {
        console.error('Error:', e);
    } finally {
        process.exit(0);
    }
}

run();
