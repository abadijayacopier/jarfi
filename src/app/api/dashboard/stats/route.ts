import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { RouterOSClient } from 'routeros-client';

// Global cache for router throughput calculation
const routerTrafficCache = new Map<string, { rx: number, tx: number, time: number }>();

export async function GET() {
    try {
        const [customers]: any = await pool.query('SELECT COUNT(*) as count FROM Customers');
        const [routers]: any = await pool.query('SELECT * FROM Routers');
        const totalCustomers = customers[0].count;
        
        const [revenueRow]: any = await pool.query(`
            SELECT SUM(CAST(p.price AS DECIMAL(10,2))) as expected_revenue 
            FROM Customers c 
            LEFT JOIN Packages p ON c.package_id = p.id 
            WHERE c.status = 'ACTIVE'
        `);
        const expectedRevenue = revenueRow[0].expected_revenue || 0;

        const [unpaidRow]: any = await pool.query(`
            SELECT SUM(CAST(amount AS DECIMAL(10,2))) as unpaid_total, COUNT(*) as unpaid_count 
            FROM Invoices 
            WHERE status = 'UNPAID'
        `);
        const unpaidTotal = unpaidRow[0].unpaid_total || 0;
        const unpaidCount = unpaidRow[0].unpaid_count || 0;

        const [noPackageRow]: any = await pool.query('SELECT COUNT(*) as count FROM Customers WHERE package_id IS NULL AND status = \'ACTIVE\'');
        const customersWithoutPackage = noPackageRow[0].count;

        let activePppoe = 0;
        let totalTx = 0;
        let totalRx = 0;
        const routerStats: any[] = [];
        const now = Date.now();

        // High-speed parallel router polling
        const routerStatsResults = await Promise.all(routers.map(async (router: any) => {
            let client: any = null;
            try {
                client = new RouterOSClient({
                    host: router.ip_address, user: router.username, password: router.password, port: router.api_port, timeout: 5
                });
                const conn = await client.connect();

                const [resources, active, interfaces] = await Promise.all([
                    conn.menu('/system/resource').get(),
                    conn.menu('/ppp/active').get(),
                    conn.menu('/interface').get()
                ]);

                // Calculate router-wide throughput from WAN interface if possible, or sum of physical
                let currentRouterRx = 0;
                let currentRouterTx = 0;

                const parseBytes = (val: any) => {
                    if (!val) return 0;
                    const cleaned = String(val).replace(/[^0-9]/g, '');
                    return parseInt(cleaned) || 0;
                };

                // Strategy: Sum only physical interfaces to avoid double counting with dynamic ones
                interfaces.forEach((i: any) => {
                    if (!i.name.includes('<') && !i.name.includes('pppoe-') && !i.name.includes('bridge')) {
                        currentRouterRx += parseBytes(i['rx-byte'] || i.rxByte);
                        currentRouterTx += parseBytes(i['tx-byte'] || i.txByte);
                    }
                });

                const cacheKey = `router_${router.id}`;
                const lastData = routerTrafficCache.get(cacheKey);
                let rxSpeed = 0;
                let txSpeed = 0;

                if (lastData) {
                    const timeDiff = (now - lastData.time) / 1000;
                    if (timeDiff > 0 && timeDiff < 60) {
                        rxSpeed = Math.max(0, Math.round(((currentRouterRx - lastData.rx) * 8) / timeDiff));
                        txSpeed = Math.max(0, Math.round(((currentRouterTx - lastData.tx) * 8) / timeDiff));
                    }
                }

                routerTrafficCache.set(cacheKey, { rx: currentRouterRx, tx: currentRouterTx, time: now });

                await client.close();

                return {
                    stats: {
                        id: router.id,
                        name: router.name,
                        cpu: resources[0].cpuLoad || resources[0]['cpu-load'] || 0,
                        uptime: resources[0].uptime || '0s',
                        activeUsers: active.length,
                        version: resources[0].version || '?'
                    },
                    activeCount: active.length,
                    rxSpeed,
                    txSpeed
                };
            } catch (e) {
                if (client) try { await client.close(); } catch {}
                return {
                    stats: { id: router.id, name: router.name, error: 'Offline', cpu: 0, uptime: '0s', activeUsers: 0 },
                    activeCount: 0,
                    rxSpeed: 0,
                    txSpeed: 0
                };
            }
        }));

        routerStatsResults.forEach(res => {
            activePppoe += res.activeCount;
            totalRx += res.rxSpeed;
            totalTx += res.txSpeed;
            routerStats.push({
                ...res.stats,
                rxSpeed: res.rxSpeed,
                txSpeed: res.txSpeed
            });
        });

        return NextResponse.json({
            totalCustomers,
            expectedRevenue,
            unpaidTotal,
            unpaidCount,
            customersWithoutPackage,
            activePppoe,
            totalTx, 
            totalRx, 
            routerStats: routerStats as any[]
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
