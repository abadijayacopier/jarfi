import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { MikrotikService } from '@/lib/mikrotik';

export async function GET() {
    try {
        const [rows] = await pool.query(`
      SELECT c.*, u.name, u.phone, p.name as package_name, r.name as router_name 
      FROM Customers c
      JOIN Users u ON c.user_id = u.id
      LEFT JOIN Packages p ON c.package_id = p.id
      LEFT JOIN Routers r ON c.router_id = r.id
      ORDER BY c.created_at DESC
    `);
        return NextResponse.json({ customers: rows });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { name, phone, router_id, package_id, pppoe_username, pppoe_password, due_date } = await req.json();

        const dummyEmail = `${name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}${Math.floor(Math.random() * 10000)}@jarfi.local`;
        const [userRes]: any = await pool.query(
            'INSERT INTO Users (name, email, password, phone, role) VALUES (?, ?, ?, ?, ?)',
            [name, dummyEmail, 'jarfipassword123', phone, 'CUSTOMER']
        );
        const userId = userRes.insertId;

        await pool.query(
            'INSERT INTO Customers (user_id, router_id, package_id, pppoe_username, pppoe_password, due_date, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [userId, router_id, package_id, pppoe_username, pppoe_password, due_date, 'ACTIVE']
        );

        if (router_id) {
            const [routers]: any = await pool.query('SELECT * FROM Routers WHERE id = ?', [router_id]);
            if (routers.length > 0) {
                const router = routers[0];
                let profileName = 'default';
                if (package_id) {
                    const [packages]: any = await pool.query('SELECT name FROM Packages WHERE id = ?', [package_id]);
                    if (packages.length > 0) profileName = packages[0].name;
                }

                try {
                    const mk = new MikrotikService({ host: router.ip_address, user: router.username, password: router.password, port: router.api_port });
                    await mk.addSecret(pppoe_username, pppoe_password, profileName);
                } catch (err: any) {
                    console.error('Mikrotik Add Secret gagal:', err.message);
                }
            }
        }

        return NextResponse.json({ success: true, message: 'Pelanggan berhasil dibuat dan sinkron ke RouterOS' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const body = await req.json();
        const { id, user_id, name, phone, package_id, pppoe_password } = body;

        const [customers]: any = await pool.query('SELECT c.*, p.name as package_name, r.id as router_id, r.ip_address, r.username, r.password as r_password, r.api_port FROM Customers c LEFT JOIN Packages p ON c.package_id = p.id LEFT JOIN Routers r ON c.router_id = r.id WHERE c.id = ?', [id]);
        if (customers.length === 0) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });

        const customer = customers[0];
        let newProfile = customer.package_name;
        if (package_id && package_id !== customer.package_id) {
            const [pkgs]: any = await pool.query('SELECT name FROM Packages WHERE id = ?', [package_id]);
            if (pkgs.length > 0) newProfile = pkgs[0].name;
        }

        if (customer.router_id) {
            try {
                const mk = new MikrotikService({ host: customer.ip_address, user: customer.username, password: customer.r_password, port: customer.api_port });
                await mk.updateSecret(customer.pppoe_username, pppoe_password, newProfile);
            } catch (e: any) {
                console.warn('Mikrotik update warning:', e.message);
            }
        }

        let updateQuery = `UPDATE Customers SET package_id = ? ${pppoe_password ? ', pppoe_password = ?' : ''} WHERE id = ?`;
        let params: any[] = pppoe_password ? [package_id, pppoe_password, id] : [package_id, id];
        await pool.query(updateQuery, params);

        await pool.query('UPDATE Users SET name = ?, phone = ? WHERE id = ?', [name, phone, user_id]);

        return NextResponse.json({ success: true, message: 'Updated successfully' });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    try {
        const [customers]: any = await pool.query('SELECT c.*, r.id as router_id, r.ip_address, r.username, r.password as r_password, r.api_port FROM Customers c LEFT JOIN Routers r ON c.router_id = r.id WHERE c.id = ?', [id]);
        if (customers.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        const customer = customers[0];

        if (customer.router_id) {
            try {
                const mk = new MikrotikService({ host: customer.ip_address, user: customer.username, password: customer.r_password, port: customer.api_port });
                await mk.removeSecret(customer.pppoe_username);
            } catch (e) {
                console.warn('Failed to remove secret from Mikrotik', e);
            }
        }

        await pool.query('DELETE FROM Customers WHERE id = ?', [id]);
        await pool.query('DELETE FROM Users WHERE id = ?', [customer.user_id]);

        return NextResponse.json({ success: true, message: 'Deleted successfully' });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
