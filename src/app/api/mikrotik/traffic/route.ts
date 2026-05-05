import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
const { RouterOSClient } = require('routeros-client');

// In-memory cache to store last byte counts for speed calculation
// Format: routerId_interfaceName -> { rx: number, tx: number, time: number }
const trafficCache = new Map<string, { rx: number, tx: number, time: number }>();

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const routerId = searchParams.get('router_id');

    if (!routerId) {
        return NextResponse.json({ error: 'Router ID is required' }, { status: 400 });
    }

    let client: any = null;

    try {
        const [routers]: any = await pool.query('SELECT * FROM Routers WHERE id = ?', [routerId]);
        const router = routers[0];

        if (!router) {
            return NextResponse.json({ error: 'Router not found' }, { status: 404 });
        }

        client = new RouterOSClient({
            host: router.ip_address, 
            user: router.username, 
            password: router.password, 
            port: router.api_port,
            timeout: 10
        });

        const conn = await client.connect();
        
        // Fetch active users and interfaces
        const [activeUsers, interfaces] = await Promise.all([
            conn.menu('/ppp/active').get(),
            conn.menu('/interface').get()
        ]);

        const now = Date.now();
        
        // Collect interface names for monitoring
        // Only monitor interfaces that are dynamic pppoe-in or physical ones used by active users
        const activeInterfaceNames = activeUsers
            .map((u: any) => u.interface || `<pppoe-${u.name}>`)
            .filter((name: string) => name && !name.includes('unreachable'));

        // Also include physical interfaces just in case
        const physicalInterfaces = interfaces
            .filter((i: any) => !i.name.includes('<') && !i.name.includes('pppoe-'))
            .map((i: any) => i.name);
        
        const monitorList = Array.from(new Set([...activeInterfaceNames, ...physicalInterfaces])).join(',');

        let monitorData: any[] = [];
        if (monitorList) {
            try {
                // Get instantaneous rates directly from MikroTik
                monitorData = await conn.menu('/interface/monitor-traffic')
                    .where('interface', monitorList)
                    .where('once', true)
                    .get();
            } catch (e) {
                console.error('Monitor-traffic failed, falling back to delta:', e);
            }
        }

        const monitorMap: Record<string, any> = {};
        if (Array.isArray(monitorData)) {
            monitorData.forEach((m: any) => {
                monitorMap[m.name] = {
                    rx: parseInt(m['rx-bits-per-second'] || '0'),
                    tx: parseInt(m['tx-bits-per-second'] || '0')
                };
            });
        }

        const trafficData: any[] = [];
        const statsMap: Record<string, any> = {};
        
        interfaces.forEach((i: any) => {
            if (!i.name) return;

            const currentRx = parseInt(i.rxByte || i['rx-byte'] || '0');
            const currentTx = parseInt(i.txByte || i['tx-byte'] || '0');
            const currentRxPkt = parseInt(i.rxPacket || i['rx-packet'] || '0');
            const currentTxPkt = parseInt(i.txPacket || i['tx-packet'] || '0');
            
            // Use monitor-traffic data for speed (Instantaneous)
            const monitorStats = monitorMap[i.name];
            let rxSpeed = 0;
            let txSpeed = 0;

            if (monitorStats) {
                // Router TX is user RX (Download), Router RX is user TX (Upload)
                rxSpeed = monitorStats.tx; 
                txSpeed = monitorStats.rx;
            } else {
                // Fallback to delta calculation
                const cacheKey = `${routerId}_${i.name}`;
                const lastData = trafficCache.get(cacheKey);
                if (lastData && lastData.rx > 0 && lastData.tx > 0) {
                    const timeDiff = (now - lastData.time) / 1000;
                    if (timeDiff > 0 && timeDiff < 60) {
                        rxSpeed = Math.max(0, Math.round(((currentTx - lastData.tx) * 8) / timeDiff));
                        txSpeed = Math.max(0, Math.round(((currentRx - lastData.rx) * 8) / timeDiff));
                    }
                }
                trafficCache.set(cacheKey, { rx: currentRx, tx: currentTx, time: now });
            }
            
            statsMap[i.name] = { 
                rx: rxSpeed, 
                tx: txSpeed, 
                rxTotal: currentRx, 
                txTotal: currentTx,
                rxPkt: currentRxPkt,
                txPkt: currentTxPkt,
                mtu: i.mtu || i.actualMtu || 1480,
                lastUp: i.lastLinkUpTime || i['last-link-up-time'] || '-'
            };
        });

        // Helper to format bytes
        const formatBytes = (bytes: number) => {
            if (bytes === 0) return '0 B';
            const k = 1024;
            const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        };

        // Step 2: Map active users to calculated stats
        activeUsers.forEach((u: any) => {
            let ifaceName = u.interface;
            if (!ifaceName) {
                const pattern = `<pppoe-${u.name}>`;
                const foundIface = interfaces.find((i: any) => 
                    i.name === pattern || i.name === u.name || i.name === `pppoe-${u.name}`
                );
                if (foundIface) ifaceName = foundIface.name;
            }

            const stats = statsMap[ifaceName] || { rx: 0, tx: 0, rxTotal: 0, txTotal: 0, rxPkt: 0, txPkt: 0, mtu: 1480, lastUp: '-' };
            
            const uptimeStr = String(u.uptime || '0s');
            let totalSeconds = 0;
            const matches = {
                w: uptimeStr.match(/(\d+)w/),
                d: uptimeStr.match(/(\d+)d/),
                h: uptimeStr.match(/(\d+)h/),
                m: uptimeStr.match(/(\d+)m/),
                s: uptimeStr.match(/(\d+)s/)
            };
            if (matches.w) totalSeconds += parseInt(matches.w[1]) * 604800;
            if (matches.d) totalSeconds += parseInt(matches.d[1]) * 86400;
            if (matches.h) totalSeconds += parseInt(matches.h[1]) * 3600;
            if (matches.m) totalSeconds += parseInt(matches.m[1]) * 60;
            if (matches.s) totalSeconds += parseInt(matches.s[1]);

            const connectedAt = new Date(now - (totalSeconds * 1000));
            
            trafficData.push({
                name: String(u.name).trim(),
                address: u.address || '-',
                callerId: u.callerId || u['caller-id'] || '-',
                uptime: uptimeStr,
                uptimeSeconds: totalSeconds,
                connectedAt: connectedAt.toISOString(),
                rxSpeed: stats.rx,
                txSpeed: stats.tx,
                rxTotal: formatBytes(stats.rxTotal),
                txTotal: formatBytes(stats.txTotal),
                rxPkt: stats.rxPkt,
                txPkt: stats.txPkt,
                mtu: stats.mtu,
                lastUp: stats.lastUp,
                status: 'active'
            });
        });

        // Periodic debug log (only first 3 active users with traffic)
        const activeWithTraffic = trafficData.filter(t => t.rxSpeed > 1000).slice(0, 3);
        if (activeWithTraffic.length > 0) {
            console.log(`[Router ${routerId}] Active traffic:`, activeWithTraffic.map(t => `${t.name}: ${(t.rxSpeed/1000000).toFixed(2)} Mbps`));
        }

        await client.close();
        return NextResponse.json({ traffic: trafficData });

    } catch (error: any) {
        if (client) {
            try { await client.close(); } catch (e) {}
        }
        console.error('Traffic API Error:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
