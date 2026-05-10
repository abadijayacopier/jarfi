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

        // Ambil identitas perusahaan untuk semua jenis laporan
        let globalCompanyName = '';
        try {
            const [sRows]: any = await pool.query("SELECT `key`, `value` FROM Settings WHERE `key` = 'company_name'");
            if (sRows.length > 0) globalCompanyName = sRows[0].value;
        } catch(e) {}

        switch (type) {
            case 'customers':
                const [customerRows]: any = await pool.query(`
                    SELECT 
                        c.id,
                        c.pppoe_username as username,
                        COALESCE(u.name, c.pppoe_username) as customer_name,
                        COALESCE(p.name, 'Belum Ada Paket') as package_name,
                        COALESCE(p.price, 0) as monthly_fee,
                        COALESCE(c.status, 'ACTIVE') as status,
                        c.due_date,
                        u.phone,
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
                    active: data.filter((d: any) => (d.status || '').toUpperCase() === 'ACTIVE').length,
                    inactive: data.filter((d: any) => (d.status || '').toUpperCase() !== 'ACTIVE').length
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
                        c.pppoe_username as name,
                        COALESCE(u.name, c.pppoe_username) as customer_name,
                        COALESCE(p.name, '-') as package_name,
                        COALESCE(p.bandwidth_limit, '-') as speed,
                        COALESCE(c.rx, 0) as rx,
                        COALESCE(c.tx, 0) as tx,
                        COALESCE(c.olt_name, '-') as olt
                    FROM Customers c
                    LEFT JOIN Users u ON c.user_id = u.id
                    LEFT JOIN Packages p ON c.package_id = p.id
                    WHERE c.status = 'ACTIVE'
                    ORDER BY c.rx ASC
                `);
                data = bwRows;
                summary = {
                    total_active: data.length,
                    avg_rx: data.length > 0 ? data.reduce((acc: number, curr: any) => acc + Number(curr.rx), 0) / data.length : 0,
                    avg_tx: data.length > 0 ? data.reduce((acc: number, curr: any) => acc + Number(curr.tx), 0) / data.length : 0
                };
                break;

            case 'stiker':
                // Pastikan kolom address ada
                try { await pool.query("ALTER TABLE Customers ADD COLUMN address TEXT"); } catch(e) {}

                // Ambil identitas perusahaan dari Settings
                let companyName = 'Dunia WiFi';
                let companyLogo = '';
                let bankName = '';
                let bankAccount = '';
                let bankHolder = '';
                let companyWhatsapp = '';
                try {
                    const [settingsRows]: any = await pool.query("SELECT `key`, `value` FROM Settings WHERE `key` IN ('company_name', 'company_logo', 'bank_name', 'bank_account', 'bank_holder', 'company_whatsapp')");
                    settingsRows.forEach((s: any) => {
                        if (s.key === 'company_name') companyName = s.value;
                        if (s.key === 'company_logo') companyLogo = s.value;
                        if (s.key === 'bank_name') bankName = s.value;
                        if (s.key === 'bank_account') bankAccount = s.value;
                        if (s.key === 'bank_holder') bankHolder = s.value;
                        if (s.key === 'company_whatsapp') companyWhatsapp = s.value;
                    });
                } catch(e) {}

                // Auto-repair: Update customers yang package_id masih NULL
                // Cari profil MikroTik dari secrets, cocokkan ke Packages
                try {
                    const [orphans]: any = await pool.query(
                        'SELECT c.id, c.pppoe_username, c.router_id FROM Customers c WHERE c.package_id IS NULL'
                    );
                    
                    if (orphans.length > 0) {
                        // Ambil semua router yang terlibat
                        const routerIds = [...new Set(orphans.map((o: any) => o.router_id))];
                        const { MikrotikService } = await import('@/lib/mikrotik');
                        
                        for (const rid of routerIds) {
                            try {
                                const [routers]: any = await pool.query('SELECT * FROM Routers WHERE id = ?', [rid]);
                                if (routers.length === 0) continue;
                                const r = routers[0];
                                
                                const mk = new MikrotikService({
                                    host: r.ip_address, user: r.username, password: r.password, port: r.api_port
                                });
                                
                                const secrets = await mk.getSecrets();
                                const secretMap: Record<string, string> = {};
                                secrets.forEach((s: any) => { secretMap[s.name] = s.profile || ''; });
                                
                                const orphansForRouter = orphans.filter((o: any) => o.router_id == rid);
                                for (const orphan of orphansForRouter) {
                                    const profile = secretMap[orphan.pppoe_username];
                                    if (profile) {
                                        const [pkgs]: any = await pool.query('SELECT id FROM Packages WHERE name = ? LIMIT 1', [profile]);
                                        if (pkgs.length > 0) {
                                            await pool.query('UPDATE Customers SET package_id = ? WHERE id = ?', [pkgs[0].id, orphan.id]);
                                        }
                                    }
                                }
                            } catch(mkErr) {
                                // Router offline, skip
                            }
                        }
                    }
                } catch(repairErr) {
                    console.error('Auto-repair package_id failed:', repairErr);
                }

                // Deteksi kolom speed yang tersedia (bandwidth_limit atau speed_limit)
                let speedCol = 'p.speed_limit';
                try {
                    const [cols]: any = await pool.query('SHOW COLUMNS FROM Packages');
                    const hasSpeedLimit = cols.some((c: any) => c.Field === 'speed_limit');
                    const hasBandwidthLimit = cols.some((c: any) => c.Field === 'bandwidth_limit');
                    if (hasSpeedLimit) speedCol = 'p.speed_limit';
                    else if (hasBandwidthLimit) speedCol = 'p.bandwidth_limit';
                } catch(e) {}

                const [stikerRows]: any = await pool.query(`
                    SELECT 
                        c.id as customer_id,
                        c.pppoe_username as username,
                        COALESCE(u.name, c.pppoe_username) as customer_name,
                        COALESCE(p.name, 'Belum Ada') as package_name,
                        COALESCE(${speedCol}, '-') as speed,
                        COALESCE(u.phone, '-') as phone,
                        COALESCE(c.address, '-') as address,
                        COALESCE(c.status, 'ACTIVE') as status
                    FROM Customers c
                    LEFT JOIN Users u ON c.user_id = u.id
                    LEFT JOIN Packages p ON c.package_id = p.id
                    ORDER BY customer_name ASC
                `);
                data = stikerRows;
                summary = { 
                    total: data.length, 
                    company_name: companyName, 
                    company_logo: companyLogo,
                    bank_name: bankName,
                    bank_account: bankAccount,
                    bank_holder: bankHolder,
                    company_whatsapp: companyWhatsapp
                };
                break;

            default:
                return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
        }

        // Inject identitas perusahaan ke semua summary
        if (globalCompanyName && !summary.company_name) {
            summary.company_name = globalCompanyName;
        }

        return NextResponse.json({ data, summary });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
