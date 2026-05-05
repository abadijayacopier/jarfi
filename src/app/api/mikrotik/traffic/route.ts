import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { MikrotikService } from '@/lib/mikrotik';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const routerId = searchParams.get('router_id');

    if (!routerId) {
        return NextResponse.json({ error: 'router_id required' }, { status: 400 });
    }

    try {
        // Get router details
        const [routers]: any = await pool.query('SELECT * FROM Routers WHERE id = ?', [routerId]);
        if (routers.length === 0) {
            return NextResponse.json({ error: 'Router not found' }, { status: 404 });
        }

        const router = routers[0];
        const mk = new MikrotikService({
            host: router.ip_address,
            user: router.username,
            password: router.password,
            port: router.api_port
        });

        // Use custom RouterOS API connection to get both active users and interface stats
        const { RouterOSClient } = require('routeros-client');
        const client = new RouterOSClient({
            host: router.ip_address, user: router.username, password: router.password, port: router.api_port
        });
        const conn = await client.connect();
        
        let trafficData = [];
        try {
            const [activeUsers, pppSecrets] = await Promise.all([
                conn.menu('/ppp/active').get(),
                conn.menu('/ppp/secret').get()
            ]);

            // Create a lookup for secret profiles
            const secretProfiles: Record<string, string> = {};
            pppSecrets.forEach((s: any) => {
                if (s.name) secretProfiles[s.name] = s.profile || 'default';
            });

            if (activeUsers.length > 0) {
                // Get real-time traffic for all active users at once
                const ifaceList = activeUsers.map((u: any) => `<pppoe-${u.name}>`).join(',');
                const monitorResults = await conn.menu('/interface').exec('monitor-traffic', { 
                    interface: ifaceList, 
                    once: '' 
                });

                // Create a lookup for real-time rates
                const rateStats: Record<string, any> = {};
                (Array.isArray(monitorResults) ? monitorResults : [monitorResults]).forEach((res: any) => {
                    const cleanName = res.name?.replace(/[<>]/g, '').replace(/^pppoe-/, '');
                    if (cleanName) {
                        rateStats[cleanName] = {
                            rxSpeed: parseInt(res['rx-bits-per-second'] || '0'),
                            txSpeed: parseInt(res['tx-bits-per-second'] || '0')
                        };
                    }
                });

                trafficData = activeUsers.map((user: any) => {
                    const stats = rateStats[user.name] || { rxSpeed: 0, txSpeed: 0 };
                    return {
                        name: user.name || '',
                        address: user.address || user['caller-id'] || '-',
                        uptime: user.uptime || '0s',
                        encoding: user.encoding || '-',
                        service: user.service || 'pppoe',
                        rxSpeed: stats.rxSpeed,
                        txSpeed: stats.txSpeed,
                        rxBytes: 0, // Legacy support if needed
                        txBytes: 0,
                        profile: secretProfiles[user.name] || '?'
                    };
                });
            }
        } finally {
            client.close();
        }

        return NextResponse.json({ traffic: trafficData });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
