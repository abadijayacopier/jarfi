import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET() {
    try {
        // Ensure OLTs table exists
        await pool.query(`
            CREATE TABLE IF NOT EXISTS OLTs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                ip_address VARCHAR(50) NOT NULL,
                username VARCHAR(100),
                password VARCHAR(100),
                telnet_port INT DEFAULT 23,
                snmp_community VARCHAR(100) DEFAULT 'public',
                type ENUM('EPON', 'GPON') DEFAULT 'EPON',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        const [olts]: any = await pool.query('SELECT * FROM OLTs ORDER BY created_at DESC');
        return NextResponse.json({ olts });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, ip_address, username, password, telnet_port, snmp_community, type } = body;

        if (!name || !ip_address) {
            return NextResponse.json({ error: 'Name and IP Address are required' }, { status: 400 });
        }

        const [result]: any = await pool.query(
            'INSERT INTO OLTs (name, ip_address, username, password, telnet_port, snmp_community, type) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [name, ip_address, username, password, telnet_port || 23, snmp_community || 'public', type || 'EPON']
        );

        return NextResponse.json({ id: result.insertId, message: 'OLT added successfully' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const body = await req.json();
        const { id, name, ip_address, username, password, telnet_port, snmp_community, type } = body;

        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        await pool.query(
            'UPDATE OLTs SET name=?, ip_address=?, username=?, password=?, telnet_port=?, snmp_community=?, type=? WHERE id=?',
            [name, ip_address, username, password, telnet_port, snmp_community, type, id]
        );

        return NextResponse.json({ message: 'OLT updated successfully' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        await pool.query('DELETE FROM OLTs WHERE id = ?', [id]);
        return NextResponse.json({ message: 'OLT deleted successfully' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
