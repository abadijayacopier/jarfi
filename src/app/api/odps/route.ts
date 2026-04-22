import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET() {
    try {
        const [rows]: any = await pool.query(`
            SELECT o.*, (SELECT COUNT(*) FROM Customers WHERE odp_id = o.id) as used_ports
            FROM ODPs o
        `);
        return NextResponse.json({ odps: rows });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, latitude, longitude, capacity } = body;
        await pool.query(
            'INSERT INTO ODPs (name, latitude, longitude, capacity) VALUES (?, ?, ?, ?)',
            [name, latitude, longitude, capacity]
        );
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        await pool.query('DELETE FROM ODPs WHERE id = ?', [id]);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
