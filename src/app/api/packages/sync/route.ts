import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { MikrotikService } from '@/lib/mikrotik';

export async function POST(req: Request) {
    try {
        const { router_id } = await req.json();
        if (!router_id) return NextResponse.json({ error: 'Router ID required' }, { status: 400 });

        const [routers]: any = await pool.query('SELECT * FROM Routers WHERE id = ?', [router_id]);
        if (routers.length === 0) return NextResponse.json({ error: 'Router not found' }, { status: 404 });
        const r = routers[0];

        const mk = new MikrotikService({
            host: r.ip_address, user: r.username, password: r.password, port: r.api_port
        });

        const profiles = await mk.getPPPProfiles();
        let addedCount = 0;

        for (const profile of profiles) {
            if (profile.name === 'default' || profile.name === 'default-encryption') continue;

            // Check if package already exists
            const [existing]: any = await pool.query('SELECT id FROM Packages WHERE name = ?', [profile.name]);
            
            if (existing.length === 0) {
                await pool.query(
                    'INSERT INTO Packages (name, speed_limit, price) VALUES (?, ?, ?)',
                    [profile.name, profile['rate-limit'] || '10M/10M', 0] // Default price 0, user can edit later
                );
                addedCount++;
            }
        }

        return NextResponse.json({ success: true, count: addedCount });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
