import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { MikrotikService } from '@/lib/mikrotik';

export async function POST(req: Request) {
    try {
        let successCount = 0;
        let failCount = 0;
        const errors: any[] = [];

        // 0. Auto-Migration & Dependencies
        try {
            const [columns]: any = await pool.query('SHOW COLUMNS FROM Customers');
            const colNames = columns.map((c: any) => c.Field);
            if (!colNames.includes('connection_type')) {
                await pool.query("ALTER TABLE Customers ADD COLUMN connection_type ENUM('PPPOE', 'STATIC', 'DHCP') DEFAULT 'PPPOE' AFTER package_id");
            }
            if (!colNames.includes('remote_address')) {
                await pool.query("ALTER TABLE Customers ADD COLUMN remote_address VARCHAR(45) AFTER pppoe_password");
            }
            if (!colNames.includes('mac_address')) {
                await pool.query("ALTER TABLE Customers ADD COLUMN mac_address VARCHAR(17) AFTER remote_address");
            }
        } catch (mErr: any) {
            console.warn('Migration warning:', mErr.message);
        }

        // 1. Fetch Resources
        const [routers]: any = await pool.query('SELECT * FROM Routers');
        let [packages]: any = await pool.query('SELECT * FROM Packages');
        
        // Auto-create default package if none exist
        if (packages.length === 0) {
            await pool.query("INSERT INTO Packages (name, speed_limit, price) VALUES ('Standard', '10M/10M', 0)");
            [packages] = await pool.query('SELECT * FROM Packages');
        }

        const [existingCustomers]: any = await pool.query('SELECT pppoe_username, id FROM Customers WHERE connection_type = "PPPOE"');
        const customerMap = new Map(existingCustomers.map((c: any) => [c.pppoe_username, c.id]));

        for (const router of routers) {
            const mk = new MikrotikService({
                host: router.ip_address,
                user: router.username,
                password: router.password,
                port: router.api_port
            });

            try {
                await mk.execute(async (api) => {
                    const secretsMenu = api.menu('/ppp/secret');
                    const activeMenu = api.menu('/ppp/active');
                    
                    const secrets = await secretsMenu.get();
                    const active = await activeMenu.get();
                    const activeNames = new Set(active.map((a: any) => a.name));

                    for (const secret of secrets) {
                        if (secret.service !== 'pppoe' && secret.service !== 'any') continue;

                        try {
                            const isOnline = activeNames.has(secret.name);
                            const pppoeUser = secret.name;
                            
                            if (customerMap.has(pppoeUser)) {
                                // UPDATE EXISTING
                                await pool.query(
                                    'UPDATE Customers SET status = ?, pppoe_password = ?, router_id = ? WHERE pppoe_username = ?',
                                    [isOnline ? 'active' : 'inactive', secret.password, router.id, pppoeUser]
                                );
                            } else {
                                // IMPORT NEW
                                // Try to find matching package
                                const profileName = String(secret.profile || 'default');
                                const pkg = packages.find((p: any) => 
                                    p.name.toLowerCase() === profileName.toLowerCase() || 
                                    profileName.toLowerCase().includes(p.name.toLowerCase())
                                );
                                
                                const packageId = pkg ? pkg.id : (packages.length > 0 ? packages[0].id : null);
                                if (!packageId) throw new Error(`No packages defined to map secret: ${pppoeUser}`);

                                // 1. Create User
                                const dummyEmail = `${pppoeUser.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}${Math.floor(Math.random() * 10000)}@jarfi.local`;
                                const [userRes]: any = await pool.query(
                                    'INSERT INTO Users (name, email, password, role) VALUES (?, ?, ?, ?)',
                                    [secret.comment || pppoeUser, dummyEmail, 'jarfipassword123', 'CUSTOMER']
                                );
                                const userId = userRes.insertId;

                                // 2. Create Customer
                                await pool.query(
                                    `INSERT INTO Customers 
                                    (user_id, pppoe_username, pppoe_password, router_id, package_id, status, connection_type) 
                                    VALUES (?, ?, ?, ?, ?, ?, 'PPPOE')`,
                                    [
                                        userId, 
                                        pppoeUser, 
                                        secret.password, 
                                        router.id, 
                                        packageId, 
                                        isOnline ? 'active' : 'inactive'
                                    ]
                                );
                                // Add to map to prevent duplicates
                                customerMap.set(pppoeUser, true);
                            }
                            successCount++;
                        } catch (err: any) {
                            failCount++;
                            errors.push({ username: secret.name, error: err.message, router: router.ip_address });
                        }
                    }
                });
            } catch (err: any) {
                console.error(`Router connection fail [${router.ip_address}]:`, err.message);
                errors.push({ username: 'SYSTEM', error: `Gagal terhubung ke router: ${err.message}`, router: router.ip_address });
            }
        }

        return NextResponse.json({
            message: `Sinkronisasi selesai. Berhasil memproses ${successCount} node pelanggan dari ${routers.length} router.`,
            successCount,
            failCount,
            errors
        });
    } catch (error: any) {
        console.error('Sync critical error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
