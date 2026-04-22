import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET() {
    try {
        const query = `
      SELECT 
        i.id, i.amount, i.status, i.billing_month, i.paid_at,
        c.pppoe_username, u.name as customer_name
      FROM Invoices i
      JOIN Customers c ON i.customer_id = c.id
      JOIN Users u ON c.user_id = u.id
      ORDER BY i.created_at DESC
    `;
        const [rows] = await pool.query(query);
        return NextResponse.json({ invoices: rows });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const { id, status, amount, billing_month } = await req.json();
        if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

        let updateQuery = 'UPDATE Invoices SET ';
        let params: any[] = [];
        let sets: string[] = [];

        if (status) {
            sets.push('status = ?');
            params.push(status);
            if (status === 'PAID') {
                sets.push('paid_at = CURRENT_TIMESTAMP');
            } else {
                sets.push('paid_at = NULL');
            }
        }

        if (amount !== undefined) {
            sets.push('amount = ?');
            params.push(amount);
        }

        if (billing_month) {
            sets.push('billing_month = ?');
            params.push(billing_month);
        }

        if (sets.length === 0) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });

        updateQuery += sets.join(', ') + ' WHERE id = ?';
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

        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        await pool.query('DELETE FROM Invoices WHERE id = ?', [id]);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
