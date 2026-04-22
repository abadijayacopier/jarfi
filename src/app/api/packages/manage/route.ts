import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

async function ensureSchema() {
    try {
        const [columns]: any = await pool.query('SHOW COLUMNS FROM Packages');
        const hasSpeedLimit = columns.some((c: any) => c.Field === 'speed_limit');
        const hasBandwidthLimit = columns.some((c: any) => c.Field === 'bandwidth_limit');

        if (!hasSpeedLimit && hasBandwidthLimit) {
            await pool.query('ALTER TABLE Packages CHANGE bandwidth_limit speed_limit VARCHAR(100) DEFAULT ""');
        } else if (!hasSpeedLimit) {
            await pool.query('ALTER TABLE Packages ADD COLUMN speed_limit VARCHAR(100) DEFAULT "" AFTER name');
        }
    } catch (e) {}
}

export async function POST(req: Request) {
    try {
        await ensureSchema();
        const { name, speed_limit, price } = await req.json();
        await pool.query('INSERT INTO Packages (name, speed_limit, price) VALUES (?, ?, ?)', [name, speed_limit, price]);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        await ensureSchema();
        const { id, name, speed_limit, price } = await req.json();
        await pool.query('UPDATE Packages SET name = ?, speed_limit = ?, price = ? WHERE id = ?', [name, speed_limit, price, id]);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const url = new URL(req.url);
        const id = url.searchParams.get('id');
        await pool.query('DELETE FROM Packages WHERE id = ?', [id]);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
