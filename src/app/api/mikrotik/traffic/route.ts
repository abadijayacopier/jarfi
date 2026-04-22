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

        // Get active PPP connections with their traffic info
        const activeUsers = await mk.getActiveUsers();

        // Map active users with their traffic data (uptime, address, etc.)
        const trafficData = (activeUsers || []).map((user: any) => ({
            name: user.name || '',
            address: user.address || user['caller-id'] || '-',
            uptime: user.uptime || '0s',
            encoding: user.encoding || '-',
            service: user.service || 'pppoe',
        }));

        return NextResponse.json({ traffic: trafficData });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
