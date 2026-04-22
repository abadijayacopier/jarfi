import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { MikrotikService } from '@/lib/mikrotik';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const router_id = searchParams.get('router_id');
    const interfaceName = searchParams.get('interface') || 'ether1';

    if (!router_id) {
        const [routers]: any = await pool.query('SELECT id FROM Routers LIMIT 1');
        if (routers.length === 0) return NextResponse.json({ error: 'No router' }, { status: 404 });
        return NextResponse.redirect(new URL(req.url + '?router_id=' + routers[0].id + '&interface=' + interfaceName));
    }

    try {
        const [routers]: any = await pool.query('SELECT * FROM Routers WHERE id = ?', [router_id]);
        if (routers.length === 0) return NextResponse.json({ error: 'Router not found' }, { status: 404 });
        const r = routers[0];

        const mk = new MikrotikService({
            host: r.ip_address, user: r.username, password: r.password, port: r.api_port
        });

        const command = searchParams.get('command');
        if (command === 'interfaces') {
            const ifaces = await mk.getInterfaces();
            return NextResponse.json({ interfaces: ifaces.map((i: any) => i.name) });
        }

        const traffic = await mk.getInterfaceTraffic(interfaceName);
        const resources = await mk.getResources();
        let latency = 0;
        try {
            const pingRes = await mk.ping('8.8.8.8', 1);
            if (pingRes && pingRes.length > 0) {
                latency = parseInt(pingRes[0].avgRtt || pingRes[0].time || '0');
            }
        } catch (e) {}

        if (traffic && traffic.length > 0 && resources && resources.length > 0) {
            const data = traffic[0];
            const resData = resources[0];

            let totalMem = parseInt(resData.totalMemory || '1');
            let freeMem = parseInt(resData.freeMemory || '0');
            let percentMem = (((totalMem - freeMem) / totalMem) * 100).toFixed(1);

            return NextResponse.json({
                rx: parseInt(data.rxBitsPerSecond || '0'),
                tx: parseInt(data.txBitsPerSecond || '0'),
                cpu: parseInt(resData.cpuLoad || '0'),
                uptime: resData.uptime,
                freeMem: freeMem,
                totalMem: totalMem,
                percentMem: percentMem,
                board: resData.boardName,
                version: resData.version,
                architecture: resData.architectureName,
                cpuModel: resData.cpu,
                latency: latency
            }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
        }

        return NextResponse.json({ rx: 0, tx: 0, cpu: 0, uptime: '0s', freeMem: 0, totalMem: 1, percentMem: 0, board: '', version: '' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
