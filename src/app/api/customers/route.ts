import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { MikrotikService } from '@/lib/mikrotik';

export async function GET() {
    try {
        // Ensure ONU telemetry columns exist
        const columns = [
            { name: 'rx', type: 'FLOAT DEFAULT -22.5' },
            { name: 'tx', type: 'FLOAT DEFAULT 2.1' },
            { name: 'olt_name', type: 'VARCHAR(100) DEFAULT \'01-OLT\'' },
            { name: 'olt_type', type: 'VARCHAR(50) DEFAULT \'EPON\'' },
            { name: 'onu_id', type: 'VARCHAR(50)' },
            { name: 'onu_mac', type: 'VARCHAR(50)' },
            { name: 'payment_status', type: 'ENUM(\'paid\', \'unpaid\') DEFAULT \'unpaid\'' },
            { name: 'last_disconnect', type: 'DATETIME' },
            { name: 'odp_id', type: 'INT' },
            { name: 'latitude', type: 'VARCHAR(50)' },
            { name: 'longitude', type: 'VARCHAR(50)' },
            { name: 'address', type: 'TEXT' }
        ];

        for (const col of columns) {
            try {
                await pool.query(`ALTER TABLE Customers ADD COLUMN ${col.name} ${col.type}`);
            } catch (e) { /* Column likely exists */ }
        }

        const [rows] = await pool.query(`
      SELECT c.*, COALESCE(u.name, c.pppoe_username) as name, u.phone, p.name as package_name, r.name as router_name 
      FROM Customers c
      LEFT JOIN Users u ON c.user_id = u.id
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
        const { id, user_id, name, phone, package_id, pppoe_password, latitude, longitude, odp_id } = body;

        const [customers]: any = await pool.query('SELECT c.*, p.name as package_name, r.id as router_id, r.ip_address, r.username, r.password as r_password, r.api_port FROM Customers c LEFT JOIN Packages p ON c.package_id = p.id LEFT JOIN Routers r ON c.router_id = r.id WHERE c.id = ?', [id]);
        if (customers.length === 0) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });

        const customer = customers[0];

        // Only handle Mikrotik update if router and credentials exist
        if (customer.router_id && (pppoe_password || package_id)) {
            try {
                let newProfile = customer.package_name;
                if (package_id && package_id !== customer.package_id) {
                    const [pkgs]: any = await pool.query('SELECT name FROM Packages WHERE id = ?', [package_id]);
                    if (pkgs.length > 0) newProfile = pkgs[0].name;
                }
                const mk = new MikrotikService({ host: customer.ip_address, user: customer.username, password: customer.r_password, port: customer.api_port });
                await mk.updateSecret(customer.pppoe_username, pppoe_password, newProfile);
            } catch (e: any) {
                console.warn('Mikrotik update warning:', e.message);
            }
        }

        // Build dynamic SQL for Customers update
        let updates: string[] = [];
        let params: any[] = [];

        if (package_id !== undefined) { updates.push('package_id = ?'); params.push(package_id); }
        if (pppoe_password !== undefined) { updates.push('pppoe_password = ?'); params.push(pppoe_password); }
        if (latitude !== undefined) { updates.push('latitude = ?'); params.push(latitude); }
        if (longitude !== undefined) { updates.push('longitude = ?'); params.push(longitude); }
        if (odp_id !== undefined) { updates.push('odp_id = ?'); params.push(odp_id); }

        if (updates.length > 0) {
            params.push(id);
            await pool.query(`UPDATE Customers SET ${updates.join(', ')} WHERE id = ?`, params);
        }

        // Update User info if name or phone is provided
        if (user_id && (name || phone)) {
            let userUpdates: string[] = [];
            let userParams: any[] = [];
            if (name) { userUpdates.push('name = ?'); userParams.push(name); }
            if (phone) { userUpdates.push('phone = ?'); userParams.push(phone); }
            userParams.push(user_id);
            await pool.query(`UPDATE Users SET ${userUpdates.join(', ')} WHERE id = ?`, userParams);
        }

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
