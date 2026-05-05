import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const start = searchParams.get('start');
    const end = searchParams.get('end');

    try {
        let data: any[] = [];
        let summary: any = {};

        switch (type) {
            case 'customers':
                const [customerRows]: any = await pool.query(`
                    SELECT 
                        c.pppoe_username as username,
                        COALESCE(u.name, c.pppoe_username) as customer_name,
                        COALESCE(p.name, 'No Package') as package_name,
                        COALESCE(p.price, 0) as monthly_fee,
                        c.status,
                        c.due_date,
                        COALESCE(c.rx, 0) as signal,
                        c.created_at
                    FROM Customers c
                    LEFT JOIN Users u ON c.user_id = u.id
                    LEFT JOIN Packages p ON c.package_id = p.id
                    ORDER BY customer_name ASC
                `);
                data = customerRows;
                summary = {
                    total: data.length,
                    active: data.filter((d: any) => d.status.toUpperCase() === 'ACTIVE').length,
                    inactive: data.filter((d: any) => d.status.toUpperCase() !== 'ACTIVE').length
                };
                break;

            case 'finance':
                const [financeRows]: any = await pool.query(`
                    SELECT 
                        i.id,
                        u.name as customer_name,
                        i.amount,
                        i.status,
                        i.billing_month as period,
                        i.paid_at
                    FROM Invoices i
                    JOIN Customers c ON i.customer_id = c.id
                    JOIN Users u ON c.user_id = u.id
                    ${start && end ? 'WHERE i.created_at BETWEEN ? AND ?' : ''}
                    ORDER BY i.created_at DESC
                `, start && end ? [start, end] : []);
                data = financeRows;
                
                summary = {
                    total_billed: data.reduce((acc: number, curr: any) => acc + Number(curr.amount), 0),
                    total_paid: data.filter((d: any) => d.status === 'PAID').reduce((acc: number, curr: any) => acc + Number(curr.amount), 0),
                    total_unpaid: data.filter((d: any) => d.status !== 'PAID').reduce((acc: number, curr: any) => acc + Number(curr.amount), 0)
                };
                break;

            case 'inventory':
                try {
                    const [invRows]: any = await pool.query(`
                        SELECT 
                            item_name as name,
                            category,
                            stock,
                            unit,
                            price_per_unit as price,
                            (stock * price_per_unit) as value
                        FROM Inventory 
                        ORDER BY category ASC, item_name ASC
                    `);
                    data = invRows;
                    summary = {
                        total_items: data.length,
                        total_stock: data.reduce((acc: number, curr: any) => acc + curr.stock, 0),
                        total_value: data.reduce((acc: number, curr: any) => acc + Number(curr.value), 0)
                    };
                } catch (e) {
                    data = [];
                }
                break;

            case 'journal':
                try {
                    const [journalRows]: any = await pool.query(`
                        SELECT 
                            description as name,
                            category,
                            date,
                            debit,
                            credit
                        FROM Journal 
                        ORDER BY date DESC
                    `);
                    data = journalRows;
                    summary = {
                        total_debit: data.reduce((acc: number, curr: any) => acc + Number(curr.debit), 0),
                        total_credit: data.reduce((acc: number, curr: any) => acc + Number(curr.credit), 0),
                        count: data.length
                    };
                } catch (e) {
                    data = [];
                }
                break;

            case 'bandwidth':
                const [bwRows]: any = await pool.query(`
                    SELECT 
                        pppoe_username as name,
                        'TRAFFIC' as category,
                        COALESCE(rx, 0) as rx,
                        COALESCE(tx, 0) as tx,
                        olt_name as olt
                    FROM Customers
                    WHERE status = 'ACTIVE'
                    ORDER BY rx DESC
                `);
                data = bwRows;
                summary = {
                    total_active: data.length,
                    avg_rx: data.reduce((acc: number, curr: any) => acc + Number(curr.rx), 0) / (data.length || 1),
                    avg_tx: data.reduce((acc: number, curr: any) => acc + Number(curr.tx), 0) / (data.length || 1)
                };
                break;

            default:
                return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
        }

        return NextResponse.json({ data, summary });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
