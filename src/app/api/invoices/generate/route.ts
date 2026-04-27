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

        // 2. Get active customers
        const [customers]: any = await pool.query(`
            SELECT c.id, c.pppoe_username, c.router_id, p.price, p.name as package_name,
                   r.ip_address, r.username as r_user, r.password as r_pass, r.api_port
            FROM Customers c
            LEFT JOIN Packages p ON c.package_id = p.id
            JOIN Routers r ON c.router_id = r.id
            WHERE c.status = 'ACTIVE'
        `);

        // Fetch all packages for fallback matching
        const [allPackages]: any = await pool.query('SELECT * FROM Packages');

        // Cache for mikrotik secrets per router to avoid redundant API calls
        const routerSecretsCache: Record<string, any[]> = {};

        const getMikrotikProfile = async (pppoeUser: string, router: any) => {
            if (!routerSecretsCache[router.id]) {
                try {
                    const { MikrotikService } = require('@/lib/mikrotik');
                    const mk = new MikrotikService({
                        host: router.ip_address, user: router.r_user, password: router.r_pass, port: router.api_port
                    });
                    routerSecretsCache[router.id] = await mk.getSecrets();
                } catch (e) {
                    routerSecretsCache[router.id] = [];
                }
            }
            const secret = routerSecretsCache[router.id].find(s => s.name === pppoeUser);
            return secret?.profile || null;
        };

        let created = 0;
        let updated = 0;
        let skipped = 0;

        for (const customer of customers) {
            let basePrice = parseFloat(customer.price || '0');
            
            // SMART SYNC: If price is 0 or package is missing, try to find match via Live Mikrotik Profile
            if (basePrice === 0) {
                const liveProfile = await getMikrotikProfile(customer.pppoe_username, {
                    id: customer.router_id,
                    ip_address: customer.ip_address,
                    r_user: customer.r_user,
                    r_pass: customer.r_pass,
                    api_port: customer.api_port
                });

                if (liveProfile && typeof liveProfile === 'string') {
                    const matchedPkg = allPackages.find((pkg: any) => 
                        pkg.name && pkg.name.trim().toLowerCase() === liveProfile.trim().toLowerCase()
                    );
                    if (matchedPkg) {
                        basePrice = parseFloat(matchedPkg.price || '0');
                    }
                }
            }

            const taxAmount = isTaxEnabled ? Math.round(basePrice * 0.11) : 0;
            const finalAmount = basePrice + taxAmount;

            // Check if invoice already exists for this month
            const [existing]: any = await pool.query(
                'SELECT id, amount, status FROM Invoices WHERE customer_id = ? AND billing_month = ?',
                [customer.id, currentMonth]
            );

            if (existing.length === 0) {
                // Create new invoice (even if 0, but hopefully basePrice is fixed now)
                await pool.query(
                    'INSERT INTO Invoices (customer_id, amount, status, billing_month) VALUES (?, ?, ?, ?)',
                    [customer.id, finalAmount, 'UNPAID', currentMonth]
                );
                created++;
            } else if (existing[0].status === 'UNPAID') {
                // Always re-sync UNPAID invoices with the latest package price
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
