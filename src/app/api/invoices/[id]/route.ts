import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        const query = `
      SELECT 
        i.*,
        c.pppoe_username, c.status as customer_status,
        u.name as customer_name, u.email as customer_email, u.phone as customer_phone,
        p.name as package_name, p.price as package_price, p.bandwidth_limit
      FROM Invoices i
      JOIN Customers c ON i.customer_id = c.id
      JOIN Users u ON c.user_id = u.id
      LEFT JOIN Packages p ON c.package_id = p.id
      WHERE i.id = ?
    `;
        const [rows]: any = await pool.query(query, [id]);
        if (rows.length === 0) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });

        return NextResponse.json({ invoice: rows[0] });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
