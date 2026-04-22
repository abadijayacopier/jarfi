import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET() {
    try {
        const [rows] = await pool.query('SELECT id, name, ip_address, api_port, username, status, created_at FROM Routers ORDER BY created_at DESC');
        return NextResponse.json({ routers: rows });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, ip_address, username, password, api_port } = body;

        if (!name || !ip_address || !username) {
            return NextResponse.json({ error: 'Name, IP Address, and Username are required' }, { status: 400 });
        }

        const [result]: any = await pool.query(
            'INSERT INTO Routers (name, ip_address, username, password, api_port, status) VALUES (?, ?, ?, ?, ?, ?)',
            [name, ip_address, username, password || '', api_port || 8728, 'ONLINE']
        );

        return NextResponse.json({ success: true, id: result.insertId });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const body = await req.json();
        const { id, name, ip_address, username, password, api_port } = body;

        if (!id || !name || !ip_address || !username) {
            return NextResponse.json({ error: 'ID, Name, IP, and Username required' }, { status: 400 });
        }

        let updateQuery = 'UPDATE Routers SET name = ?, ip_address = ?, username = ?, api_port = ?, status = ?';
        let params: any[] = [name, ip_address, username, api_port || 8728, 'ONLINE'];

        if (password) {
            updateQuery += ', password = ?';
            params.push(password);
        }
        updateQuery += ' WHERE id = ?';
        params.push(id);

        await pool.query(updateQuery, params);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'Router ID is required' }, { status: 400 });

        await pool.query('DELETE FROM Routers WHERE id = ?', [id]);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
