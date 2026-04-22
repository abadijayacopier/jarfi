import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { RouterOSClient } from 'routeros-client';

export async function GET() {
    try {
        const [customers]: any = await pool.query('SELECT COUNT(*) as count FROM Customers');
        const [routers]: any = await pool.query('SELECT * FROM Routers');
        const totalCustomers = customers[0].count;
        let activePppoe = 0;

        // Gather real mikrotik stats for all routers
        const routerStats = [];

        for (const router of routers) {
            try {
                const client = new RouterOSClient({
                    host: router.ip_address, user: router.username, password: router.password, port: router.api_port
                });
                const conn = await client.connect();

                try {
                    const resMenu = conn.menu('/system/resource');
                    const [resources] = await resMenu.get();

                    const pppMenu = conn.menu('/ppp/active');
                    const active = await pppMenu.get();
                    activePppoe += active.length;

                    routerStats.push({
                        id: router.id,
                        name: router.name,
                        cpu: resources['cpu-load'],
                        uptime: resources['uptime'],
                        activeUsers: active.length,
                        version: resources['version']
                    });
                } finally {
                    client.close();
                }
            } catch (e: any) {
                routerStats.push({ id: router.id, name: router.name, error: 'Offline', cpu: 0, uptime: '0s', activeUsers: 0 });
            }
        }

        return NextResponse.json({
            totalCustomers,
            activePppoe,
            routerStats
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
