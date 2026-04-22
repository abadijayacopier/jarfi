import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { MikrotikService } from '@/lib/mikrotik';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const router_id = searchParams.get('router_id');

    if (!router_id) {
        const [routers]: any = await pool.query('SELECT id FROM Routers LIMIT 1');
        if (routers.length === 0) return NextResponse.json({ error: 'No router' }, { status: 404 });
        return NextResponse.redirect(new URL(req.url + '?router_id=' + routers[0].id));
    }

    try {
        const [routers]: any = await pool.query('SELECT * FROM Routers WHERE id = ?', [router_id]);
        if (routers.length === 0) return NextResponse.json({ error: 'Router not found' }, { status: 404 });

        const r = routers[0];
        const mk = new MikrotikService({
            host: r.ip_address, user: r.username, password: r.password, port: r.api_port
        });

        const logs = await mk.getLogs(40); // 40 latest entries

        return NextResponse.json({ logs }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
