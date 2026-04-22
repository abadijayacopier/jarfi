import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { RouterOSClient } from 'routeros-client';

export async function GET() {
    try {
        const [customers]: any = await pool.query('SELECT COUNT(*) as count FROM Customers');
        const [routers]: any = await pool.query('SELECT * FROM Routers');
        const totalCustomers = customers[0].count;
        
        // Calculate expected revenue from active customers
        const [revenueRow]: any = await pool.query(`
            SELECT SUM(CAST(p.price AS DECIMAL(10,2))) as expected_revenue 
            FROM Customers c 
            LEFT JOIN Packages p ON c.package_id = p.id 
            WHERE c.status = 'ACTIVE'
        `);
        const expectedRevenue = revenueRow[0].expected_revenue || 0;

        // Calculate unpaid invoices
        const [unpaidRow]: any = await pool.query(`
            SELECT SUM(CAST(amount AS DECIMAL(10,2))) as unpaid_total, COUNT(*) as unpaid_count 
            FROM Invoices 
            WHERE status = 'UNPAID'
        `);
        const unpaidTotal = unpaidRow[0].unpaid_total || 0;
        const unpaidCount = unpaidRow[0].unpaid_count || 0;

        // Count customers without packages
        const [noPackageRow]: any = await pool.query('SELECT COUNT(*) as count FROM Customers WHERE package_id IS NULL AND status = \'ACTIVE\'');
        const customersWithoutPackage = noPackageRow[0].count;

        let activePppoe = 0;
        let totalTx = 0;
        let totalRx = 0;

        // Gather real mikrotik stats for all routers
        const routerStats = [];

        for (const router of routers) {
            try {
                const client = new RouterOSClient({
                    host: router.ip_address, user: router.username, password: router.password, port: router.api_port
                });
                const conn = await client.connect();

                try {
                    const resMenu = conn.menu('/system/resource');
                    const [resources] = await resMenu.get();

                    const pppMenu = conn.menu('/ppp/active');
                    const active = await pppMenu.get();
                    activePppoe += active.length;

                    // Get Traffic stats for primary interface
                    const intMenu = conn.menu('/interface');
                    const interfaces = await intMenu.get();
                    const primaryInt = interfaces.find((i: any) => i.name.toLowerCase().includes('ether1') || i.name.toLowerCase().includes('wan') || i.name.toLowerCase().includes('bridge')) || interfaces[0];

                    if (primaryInt) {
                        const traffic = await intMenu.exec('monitor-traffic', { interface: primaryInt.name, once: '' });
                        if (traffic && traffic.length > 0) {
                            totalTx += parseInt(traffic[0]['tx-bits-per-second'] || 0);
                            totalRx += parseInt(traffic[0]['rx-bits-per-second'] || 0);
                        }
                    }

                    routerStats.push({
                        id: router.id,
                        name: router.name,
                        cpu: resources.cpuLoad || resources['cpu-load'] || 0,
                        uptime: resources.uptime || '0s',
                        activeUsers: active.length,
                        version: resources.version || '?'
                    });
                } finally {
                    client.close();
                }
            } catch (e: any) {
                routerStats.push({ id: router.id, name: router.name, error: 'Offline', cpu: 0, uptime: '0s', activeUsers: 0 });
            }
        }

        return NextResponse.json({
            totalCustomers,
            expectedRevenue,
            unpaidTotal,
            unpaidCount,
            customersWithoutPackage,
            activePppoe,
            totalTx: totalTx / 1000000, // Convert to Mbps
            totalRx: totalRx / 1000000, // Convert to Mbps
            routerStats
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
