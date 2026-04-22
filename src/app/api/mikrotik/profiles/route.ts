import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { MikrotikService } from '@/lib/mikrotik';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const routerId = searchParams.get('routerId');
        const type = searchParams.get('type') || 'ppp'; // Default to ppp

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

        let profiles = [];
        if (type === 'ppp') {
            profiles = await mk.getPPPProfiles();
        } else {
            profiles = await mk.getHotspotProfiles();
        }
        
        return NextResponse.json({ profiles });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { routerId, name, rateLimit, sessionTimeout, sharedUsers } = body;

        const [routers]: any = await pool.query('SELECT * FROM Routers WHERE id = ?', [routerId]);
        const router = routers[0];
        const mk = new MikrotikService({
            host: router.ip_address,
            user: router.username,
            password: router.password,
            port: router.api_port
        });

        await mk.addHotspotProfile(name, rateLimit, sessionTimeout, sharedUsers);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const routerId = searchParams.get('routerId');
        const profileId = searchParams.get('profileId');

        const [routers]: any = await pool.query('SELECT * FROM Routers WHERE id = ?', [routerId]);
        const router = routers[0];
        const mk = new MikrotikService({
            host: router.ip_address,
            user: router.username,
            password: router.password,
            port: router.api_port
        });

        await mk.removeHotspotProfile(profileId!);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
