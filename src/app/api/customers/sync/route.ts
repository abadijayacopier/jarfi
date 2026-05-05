import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { MikrotikService } from '@/lib/mikrotik';

export async function POST(req: Request) {
    try {
        const [customers]: any = await pool.query(`
            SELECT c.*, p.name as package_name, r.ip_address, r.username as r_user, r.password as r_pass, r.api_port
            FROM Customers c
            JOIN Routers r ON c.router_id = r.id
            JOIN Packages p ON c.package_id = p.id
        `);

        let successCount = 0;
        let failCount = 0;
        const errors: any[] = [];

        for (const customer of customers) {
            try {
                if (!customer.pppoe_username) {
                    throw new Error('Username PPPoE tidak didefinisikan');
                }
                if (!customer.ip_address) {
                    throw new Error('IP Router tidak ditemukan');
                }

                const mk = new MikrotikService({
                    host: customer.ip_address,
                    user: customer.r_user,
                    password: customer.r_pass,
                    port: customer.api_port
                });

                // Check if secret already exists
                const secrets = await mk.getSecrets();
                const activeSessions = await mk.getActiveUsers();
                const profiles = await mk.getPPPProfiles();

                const profileExists = profiles.find((p: any) => p.name === customer.package_name);
                const targetProfile = profileExists ? customer.package_name : 'default';

                const exists = secrets.find((s: any) => s.name === customer.pppoe_username);
                const isActive = activeSessions.find((s: any) => s.name === customer.pppoe_username);

                if (!exists) {
                    await mk.addSecret(
                        customer.pppoe_username,
                        customer.pppoe_password || 'jarfipassword123',
                        targetProfile,
                        'pppoe'
                    );
                } else {
                    // Update if exists to ensure profile matches
                    await mk.updateSecret(
                        customer.pppoe_username,
                        customer.pppoe_password,
                        targetProfile
                    );
                }

                // Update status in local DB
                await pool.query(
                    'UPDATE Customers SET status = ? WHERE id = ?',
                    [isActive ? 'active' : 'inactive', customer.id]
                );

                successCount++;
            } catch (err: any) {
                console.error(`Gagal sinkron pelanggan ${customer.pppoe_username}:`, err);
                failCount++;
                errors.push({ 
                    username: customer.pppoe_username, 
                    error: err.message,
                    router: customer.ip_address 
                });
            }
        }

        return NextResponse.json({
            message: `Sinkronisasi selesai. Berhasil: ${successCount}, Gagal: ${failCount}`,
            successCount,
            failCount,
            errors
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
