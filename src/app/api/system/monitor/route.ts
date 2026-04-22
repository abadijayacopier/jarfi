import { NextResponse } from 'next/server';
import os from 'os';

export async function GET() {
    // Avoid caching for live stats
    try {
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const usedMem = totalMem - freeMem;

        const cpus = os.cpus();
        const uptime = os.uptime();

        return NextResponse.json({
            memory: {
                total: totalMem,
                used: usedMem,
                free: freeMem,
                percent: ((usedMem / totalMem) * 100).toFixed(1)
            },
            cpu: {
                model: cpus[0].model,
                cores: cpus.length,
            },
            system: {
                platform: os.platform(),
                arch: os.arch(),
                uptime: uptime,
                uptimeString: `${Math.floor(uptime / 86400)}d ${Math.floor((uptime % 86400) / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`
            },
            timestamp: new Date().toISOString()
        }, {
            headers: {
                'Cache-Control': 'no-store, max-age=0',
            }
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
