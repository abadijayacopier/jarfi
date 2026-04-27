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
            const [activeUsers, interfaces, pppSecrets] = await Promise.all([
                conn.menu('/ppp/active').get(),
                conn.menu('/interface').get(),
                conn.menu('/ppp/secret').get()
            ]);

            // Create a lookup for secret profiles
            const secretProfiles: Record<string, string> = {};
            pppSecrets.forEach((s: any) => {
                if (s.name) secretProfiles[s.name] = s.profile || 'default';
            });

            // Create a lookup for interface rx/tx bytes
            const ifaceStats: Record<string, any> = {};
            interfaces.forEach((iface: any) => {
                if (iface.name) {
                    // Stripping brackets <> and prefix "pppoe-" to match with user.name
                    const cleanName = iface.name.replace(/[<>]/g, '').replace(/^pppoe-/, '');
                    const rx = iface.rxByte || iface['rx-byte'] || '0';
                    const tx = iface.txByte || iface['tx-byte'] || '0';
                    ifaceStats[cleanName] = {
                        rxBytes: parseInt(rx),
                        txBytes: parseInt(tx)
                    };
                }
            });

            trafficData = (activeUsers || []).map((user: any) => {
                const stats = ifaceStats[user.name] || { rxBytes: 0, txBytes: 0 };
                return {
                    name: user.name || '',
                    address: user.address || user['caller-id'] || '-',
                    uptime: user.uptime || '0s',
                    encoding: user.encoding || '-',
                    service: user.service || 'pppoe',
                    rxBytes: stats.rxBytes,
                    txBytes: stats.txBytes,
                    profile: secretProfiles[user.name] || '?'
                };
            });
        } finally {
            client.close();
        }

        return NextResponse.json({ traffic: trafficData });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
