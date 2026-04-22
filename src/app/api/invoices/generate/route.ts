import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function POST() {
    try {
        const currentDate = new Date();
        const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

        // 1. Get Settings (Tax etc)
        const [settingsRows]: any = await pool.query('SELECT * FROM Settings');
        const settings = settingsRows.reduce((acc: any, row: any) => {
            acc[row.key] = row.value;
            return acc;
        }, {});
        
        const isTaxEnabled = settings.tax_enabled === '1';

        // 2. Get active customers and their package prices
        const [customers]: any = await pool.query(`
            SELECT c.id, p.price 
            FROM Customers c
            LEFT JOIN Packages p ON c.package_id = p.id
            WHERE c.status = 'ACTIVE'
        `);

        let count = 0;
        let updatedCount = 0;

        for (const customer of customers) {
            const basePrice = parseFloat(customer.price || '0');
            const taxAmount = isTaxEnabled ? Math.round(basePrice * 0.11) : 0;
            const finalAmount = basePrice + taxAmount;

            // Check if invoice already exists for this month
            const [existing]: any = await pool.query(
                'SELECT id, amount, status FROM Invoices WHERE customer_id = ? AND billing_month = ?',
                [customer.id, currentMonth]
            );

            if (existing.length === 0) {
                // Create new invoice
                await pool.query(
                    'INSERT INTO Invoices (customer_id, amount, status, billing_month) VALUES (?, ?, ?, ?)',
                    [customer.id, finalAmount, 'UNPAID', currentMonth]
                );
                count++;
            } else if (existing[0].status === 'UNPAID' && parseFloat(existing[0].amount) === 0 && finalAmount > 0) {
                // Update existing 0-amount unpaid invoice
                await pool.query(
                    'UPDATE Invoices SET amount = ? WHERE id = ?',
                    [finalAmount, existing[0].id]
                );
                updatedCount++;
            }
        }

        return NextResponse.json({ 
            success: true, 
            message: `Berhasil! ${count} tagihan baru dibuat, ${updatedCount} tagihan diperbarui nilainya.`,
            count,
            updatedCount
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
