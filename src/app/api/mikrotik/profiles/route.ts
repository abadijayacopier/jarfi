import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { MikrotikService } from '@/lib/mikrotik';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const routerId = searchParams.get('routerId');

        if (!routerId) return NextResponse.json({ error: 'Router ID required' }, { status: 400 });

        const [routers]: any = await pool.query('SELECT * FROM Routers WHERE id = ?', [routerId]);
        if (routers.length === 0) return NextResponse.json({ error: 'Router not found' }, { status: 404 });
        
        const router = routers[0];
        const mk = new MikrotikService({
            host: router.ip_address,
            user: router.username,
            password: router.password,
            port: router.api_port
        });

        const profiles = await mk.getHotspotProfiles();
        // Extract only names
        const profileNames = profiles.map((p: any) => p.name);

        return NextResponse.json({ profiles: profileNames });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
