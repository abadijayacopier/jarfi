import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { MikrotikService } from '@/lib/mikrotik';
import { sendTelegramNotification } from '@/lib/telegram';

export async function POST(req: Request) {
    try {
        const { customer_id } = await req.json();

        const [customers]: any = await pool.query(`
      SELECT c.pppoe_username, r.ip_address, r.username as mk_user, r.password as mk_pass, r.api_port
      FROM Customers c
      JOIN Routers r ON c.router_id = r.id
      WHERE c.id = ?
    `, [customer_id]);

        if (customers.length === 0) return NextResponse.json({ error: 'Customer or Router not found' }, { status: 404 });

        const data = customers[0];
        const mk = new MikrotikService({
            host: data.ip_address,
            user: data.mk_user,
            password: data.mk_pass,
            port: data.api_port
        });

        await mk.isolateUser(data.pppoe_username, 'ISOLIR');
        await pool.query('UPDATE Customers SET status = "ISOLATED" WHERE id = ?', [customer_id]);
        
        sendTelegramNotification(`⚠️ *PELANGGAN TERISOLIR (MANUAL)*\n\n💻 *Username:* ${data.pppoe_username}\n\nKoneksi pelanggan ini telah dinonaktifkan/diisolir secara manual melalui Dashboard NOC.`);

        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
