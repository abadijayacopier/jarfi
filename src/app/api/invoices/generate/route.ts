import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function POST() {
    try {
        const currentDate = new Date();
        const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

        // Fallback logic in case package_id is null (just insert with 0 amount to test)
        const [customers]: any = await pool.query(`
      SELECT c.id, p.price 
      FROM Customers c
      LEFT JOIN Packages p ON c.package_id = p.id
      WHERE c.status = 'ACTIVE'
    `);

        let count = 0;
        for (const customer of customers) {
            const [existing]: any = await pool.query(
                'SELECT id FROM Invoices WHERE customer_id = ? AND billing_month = ?',
                [customer.id, currentMonth]
            );

            if (existing.length === 0) {
                await pool.query(
                    'INSERT INTO Invoices (customer_id, amount, status, billing_month) VALUES (?, ?, ?, ?)',
                    [customer.id, customer.price || 0, 'UNPAID', currentMonth]
                );
                count++;
            }
        }

        return NextResponse.json({ success: true, count });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
