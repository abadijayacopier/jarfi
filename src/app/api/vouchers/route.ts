import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { MikrotikService } from '@/lib/mikrotik';

function generateRandomString(length: number) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < length; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
    return result;
}

export async function GET() {
    try {
        const [rows] = await pool.query(`
      SELECT v.*, r.name as router_name 
      FROM Vouchers v
      JOIN Routers r ON v.router_id = r.id
      ORDER BY v.created_at DESC
    `);
        return NextResponse.json({ vouchers: rows });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { router_id, quantity, price, profile, prefix } = await req.json();
        if (!router_id || !quantity || !profile) return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });

        const [routers]: any = await pool.query('SELECT * FROM Routers WHERE id = ?', [router_id]);
        if (routers.length === 0) return NextResponse.json({ error: 'Router not found' }, { status: 404 });
        const router = routers[0];

        const mk = new MikrotikService({
            host: router.ip_address, user: router.username, password: router.password, port: router.api_port
        });

        let successCount = 0;
        const generatedVouchers = [];

        // Loop for bulk Generation
        for (let i = 0; i < quantity; i++) {
            const code = (prefix || '') + generateRandomString(5);
            const password = generateRandomString(4);

            try {
                await mk.addHotspotUser(code, password, profile);
                await pool.query(
                    'INSERT INTO Vouchers (router_id, code, password, profile, price) VALUES (?, ?, ?, ?, ?)',
                    [router_id, code, password, profile, parseFloat(price) || 0]
                );
                successCount++;
                generatedVouchers.push({ code, password });
            } catch (e: any) {
                console.error(`Gagal membuat voucher ${code}:`, e.message);
            }
        }

        return NextResponse.json({ success: true, count: successCount, vouchers: generatedVouchers });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        if (id) {
            await pool.query('DELETE FROM Vouchers WHERE id = ?', [id]);
        } else {
            await pool.query('DELETE FROM Vouchers');
        }
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
