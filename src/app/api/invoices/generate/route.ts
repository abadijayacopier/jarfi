import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function POST() {
    try {
        const currentDate = new Date();
        const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

        // 1. Get Settings (Tax etc)
        let isTaxEnabled = false;
        try {
            const [settingsRows]: any = await pool.query('SELECT * FROM Settings');
            const settings = settingsRows.reduce((acc: any, row: any) => {
                acc[row.key] = row.value;
                return acc;
            }, {});
            isTaxEnabled = settings.tax_enabled === '1';
        } catch { /* Settings table may not exist yet */ }

        // 2. Get active customers with their package price AND name
        const [customers]: any = await pool.query(`
            SELECT c.id, c.pppoe_username, p.price, p.name as package_name
            FROM Customers c
            LEFT JOIN Packages p ON c.package_id = p.id
            WHERE c.status = 'ACTIVE'
        `);

        let created = 0;
        let updated = 0;
        let skipped = 0;

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
                // Create new invoice (even if 0, but user will be warned in dashboard)
                await pool.query(
                    'INSERT INTO Invoices (customer_id, amount, status, billing_month) VALUES (?, ?, ?, ?)',
                    [customer.id, finalAmount, 'UNPAID', currentMonth]
                );
                created++;
            } else if (existing[0].status === 'UNPAID') {
                // Always re-sync UNPAID invoices with the latest package price
                // Use parseFloat to avoid string vs number comparison issues
                const currentAmount = parseFloat(existing[0].amount || '0');
                if (Math.abs(currentAmount - finalAmount) > 0.01) {
                    await pool.query(
                        'UPDATE Invoices SET amount = ? WHERE id = ?',
                        [finalAmount, existing[0].id]
                    );
                    updated++;
                } else {
                    skipped++;
                }
            } else {
                skipped++;
            }
        }

        const parts: string[] = [];
        if (created > 0) parts.push(`${created} tagihan baru dibuat`);
        if (updated > 0) parts.push(`${updated} tagihan diperbarui`);
        if (skipped > 0) parts.push(`${skipped} tidak berubah`);

        return NextResponse.json({
            success: true,
            message: parts.length > 0 ? parts.join(', ') + '.' : 'Tidak ada pelanggan aktif.',
            count: created,
            updatedCount: updated
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
