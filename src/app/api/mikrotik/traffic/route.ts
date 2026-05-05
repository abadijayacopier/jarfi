import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
const { RouterOSClient } = require('routeros-client');

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const routerId = searchParams.get('router_id');

    if (!routerId) {
        return NextResponse.json({ error: 'Router ID is required' }, { status: 400 });
    }

    let client: any = null;

    try {
        const [routers]: any = await pool.query('SELECT * FROM Routers WHERE id = ?', [routerId]);
        const router = routers[0];

        if (!router) {
            return NextResponse.json({ error: 'Router not found' }, { status: 404 });
        }

        client = new RouterOSClient({
            host: router.ip_address, 
            user: router.username, 
            password: router.password, 
            port: router.api_port,
            timeout: 10
        });

        const conn = await client.connect();
        
        const [activeUsers, pppoeInterfaces, pppSecrets] = await Promise.all([
            conn.menu('/ppp/active').get(),
            conn.menu('/interface/pppoe-server').get(),
            conn.menu('/ppp/secret').get()
        ]);

        const secretProfiles: Record<string, string> = {};
        pppSecrets.forEach((s: any) => {
            if (s.name) secretProfiles[s.name] = s.profile || 'default';
        });

        const userToIface: Record<string, string> = {};
        const rateStats: Record<string, any> = {};

        pppoeInterfaces.forEach((i: any) => {
            if (i.user && i.name) {
                const uName = String(i.user).toLowerCase();
                userToIface[uName] = i.name;
                
                if (i['tx-bits-per-second'] || i['rx-bits-per-second']) {
                    rateStats[uName] = {
                        rxSpeed: parseInt(i['tx-bits-per-second'] || '0'),
                        txSpeed: parseInt(i['rx-bits-per-second'] || '0')
                    };
                }
            }
        });

        activeUsers.forEach((u: any) => {
            const uName = String(u.name).toLowerCase();
            if (!userToIface[uName]) {
                userToIface[uName] = `<pppoe-${u.name}>`; 
            }
        });

        const missingRates = Object.keys(userToIface).filter(u => !rateStats[u]);
        if (missingRates.length > 0) {
            const activeIfaceNames = missingRates.map(u => userToIface[u]);
            const batchSize = 15; 
            
            for (let i = 0; i < activeIfaceNames.length; i += batchSize) {
                const batch = activeIfaceNames.slice(i, i + batchSize);
                try {
                    const monitorResults = await conn.menu('/interface').exec('monitor-traffic', { 
                        interface: batch.join(','), 
                        once: '',
                        '.proplist': 'name,rx-bits-per-second,tx-bits-per-second,rx-rate,tx-rate'
                    });

                    (Array.isArray(monitorResults) ? monitorResults : [monitorResults]).forEach((res: any) => {
                        const ifaceName = res.name;
                        const matchedUser = Object.keys(userToIface).find(u => {
                            const storedIface = userToIface[u];
                            return storedIface === ifaceName || 
                                   storedIface.replace(/[<>]/g, '') === String(ifaceName).replace(/[<>]/g, '');
                        });
                        
                        if (matchedUser) {
                            rateStats[matchedUser] = {
                                rxSpeed: parseInt(res['tx-bits-per-second'] || res['tx-rate'] || '0'),
                                txSpeed: parseInt(res['rx-bits-per-second'] || res['rx-rate'] || '0')
                            };
                        }
                    });
                } catch (batchErr) {}
            }
        }

        const trafficData = activeUsers.map((user: any) => {
            const uName = String(user.name || '').toLowerCase();
            const stats = rateStats[uName] || { rxSpeed: 0, txSpeed: 0 };
            return {
                name: user.name || '',
                address: user.address || user['caller-id'] || '-',
                uptime: user.uptime || '0s',
                encoding: user.encoding || '-',
                service: user.service || 'pppoe',
                rxSpeed: stats.rxSpeed,
                txSpeed: stats.txSpeed,
                rxBytes: 0,
                txBytes: 0,
                profile: secretProfiles[user.name] || '?'
            };
        });

        await client.close();
        return NextResponse.json({ traffic: trafficData });

    } catch (error: any) {
        if (client) {
            try { await client.close(); } catch (e) {}
        }
        console.error('Traffic API Error:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
