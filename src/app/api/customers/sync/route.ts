import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { MikrotikService } from '@/lib/mikrotik';

export async function POST(req: Request) {
    try {
        let successCount = 0;
        let failCount = 0;
        const errors: any[] = [];

        const [customers]: any = await pool.query(`
            SELECT c.*, p.name as package_name, r.ip_address, r.username as r_user, r.password as r_pass, r.api_port
            FROM Customers c
            JOIN Routers r ON c.router_id = r.id
            JOIN Packages p ON c.package_id = p.id
        `);

        // Group customers by router to optimize connections
        const routerGroups: Record<number, any> = {};
        for (const c of customers) {
            if (!routerGroups[c.router_id]) {
                routerGroups[c.router_id] = {
                    config: {
                        host: c.ip_address,
                        user: c.r_user,
                        password: c.r_pass,
                        port: c.api_port
                    },
                    customers: []
                };
            }
            routerGroups[c.router_id].customers.push(c);
        }

        for (const routerId in routerGroups) {
            const group = routerGroups[routerId];
            const mk = new MikrotikService(group.config);

            await mk.execute(async (api) => {
                const secretsMenu = api.menu('/ppp/secret');
                const activeMenu = api.menu('/ppp/active');
                const profilesMenu = api.menu('/ppp/profile');

                // Pre-fetch profiles once per router
                const profiles = await profilesMenu.get();

                for (const customer of group.customers) {
                    try {
                        if (!customer.pppoe_username) throw new Error('Username PPPoE kosong');

                        const targetProfile = profiles.find((p: any) => p.name === customer.package_name) 
                            ? customer.package_name : 'default';

                        // Efficient single-query checks
                        const existing = await secretsMenu.where('name', customer.pppoe_username).get();
                        const active = await activeMenu.where('name', customer.pppoe_username).get();

                        if (existing.length === 0) {
                            await secretsMenu.add({
                                name: customer.pppoe_username,
                                password: customer.pppoe_password || 'jarfipassword123',
                                profile: targetProfile,
                                service: 'pppoe'
                            });
                        } else {
                            await secretsMenu.update({
                                '.id': existing[0]['.id'],
                                password: customer.pppoe_password || existing[0].password,
                                profile: targetProfile
                            });
                        }

                        // Update local DB status
                        await pool.query(
                            'UPDATE Customers SET status = ? WHERE id = ?',
                            [active.length > 0 ? 'active' : 'inactive', customer.id]
                        );

                        successCount++;
                    } catch (err: any) {
                        console.error(`Sync error [${customer.pppoe_username}]:`, err.message);
                        failCount++;
                        errors.push({ 
                            username: customer.pppoe_username, 
                            error: err.message,
                            router: group.config.host 
                        });
                    }
                }
            });
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
