import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { MikrotikService } from '@/lib/mikrotik';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const router_id = searchParams.get('router_id');
    if (!router_id) return NextResponse.json({ error: 'Router ID required' }, { status: 400 });

    try {
        const [routers]: any = await pool.query('SELECT * FROM Routers WHERE id = ?', [router_id]);
        if (routers.length === 0) return NextResponse.json({ error: 'Router not found' }, { status: 404 });
        const r = routers[0];

        const mk = new MikrotikService({
            host: r.ip_address, user: r.username, password: r.password, port: r.api_port
        });

        // Ambil nama pengguna pppoe yang sudah tercatat di database JARFI
        const [dbCustomers]: any = await pool.query('SELECT pppoe_username FROM Customers WHERE router_id = ?', [router_id]);
        const dbUsernames = dbCustomers.map((c: any) => c.pppoe_username);

        // Tarik langsung dari Mikrotik
        const secrets = await mk.getSecrets();

        // Format data dan tandai flag 'is_synced' (Apakah sudah masuk Database Jarfi atau belum)
        const result = secrets.map((s: any) => ({
            id: s['.id'],
            name: s.name,
            password: s.password,
            profile: s.profile,
            service: s.service || 'any',
            last_logged_out: s['last-logged-out'],
            is_synced: dbUsernames.includes(s.name)
        }));

        return NextResponse.json({ secrets: result });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { router_id, secrets } = await req.json();
        let successCount = 0;

        for (const secret of secrets) {
            // Pastikan nama ada dan berupa string
            const safeName = String(secret.name || 'user_unknown');
            
            // CEK APAKAH USERNAME INI SUDAH ADA DI DATABASE?
            const [existing]: any = await pool.query('SELECT id FROM Customers WHERE pppoe_username = ?', [safeName]);
            if (existing.length > 0) continue; // Skip if already exists to avoid duplicate entry error

            // Buat data user bayangan / sinkron
            const safeEmailName = safeName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
            const dummyEmail = `${safeEmailName}${Math.floor(Math.random() * 10000)}@jarfi.local`;
            
            const [userRes]: any = await pool.query(
                'INSERT INTO Users (name, email, password, phone, role) VALUES (?, ?, ?, ?, ?)',
                [safeName, dummyEmail, 'jarfipassword123', '-', 'CUSTOMER']
            );
            const userId = userRes.insertId;

            // Hubungkan dengan ID paket berdasarkan profile name
            const [packages]: any = await pool.query('SELECT id FROM Packages WHERE name = ? LIMIT 1', [secret.profile]);
            const package_id = packages.length > 0 ? packages[0].id : null;

            await pool.query(
                'INSERT INTO Customers (user_id, router_id, package_id, pppoe_username, pppoe_password, due_date, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [userId, router_id, package_id, safeName, secret.password || '', 1, 'ACTIVE']
            );
            successCount++;
        }

        return NextResponse.json({ success: true, count: successCount });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
