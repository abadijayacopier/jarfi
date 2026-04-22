import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { MikrotikService } from '@/lib/mikrotik';

export async function POST(req: Request) {
    try {
        const { router_id } = await req.json();
        if (!router_id) return NextResponse.json({ error: 'Router ID required' }, { status: 400 });

        const [routers]: any = await pool.query('SELECT * FROM Routers WHERE id = ?', [router_id]);
        if (routers.length === 0) return NextResponse.json({ error: 'Router not found' }, { status: 404 });
        const r = routers[0];

        const mk = new MikrotikService({
            host: r.ip_address, user: r.username, password: r.password, port: r.api_port
        });

        const profiles = await mk.getPPPProfiles();
        let addedCount = 0;
        let updatedCount = 0;

        for (const profile of profiles) {
            // Skip default profiles
            if (['default', 'default-encryption'].includes(profile.name)) continue;

            const name = profile.name;
            const speedLimit = profile['rate-limit'] || '10M/10M';
            
            // Intelligent Price Detection from name (e.g., "150K LT" -> 150000)
            let detectedPrice = 0;
            const priceMatch = name.match(/(\d+)/);
            if (priceMatch) {
                let num = parseInt(priceMatch[1]);
                // If num is small (like 75, 100, 150), assume it's in thousands
                detectedPrice = num < 1000 ? num * 1000 : num;
            }

            // Check if package already exists
            const [existing]: any = await pool.query('SELECT id, price FROM Packages WHERE name = ?', [name]);
            
            if (existing.length === 0) {
                // Insert new package
                await pool.query(
                    'INSERT INTO Packages (name, speed_limit, price) VALUES (?, ?, ?)',
                    [name, speedLimit, detectedPrice]
                );
                addedCount++;
            } else {
                // Update existing package speed limit
                // Only update price if it's currently 0
                const currentPrice = parseFloat(existing[0].price || '0');
                if (currentPrice === 0 && detectedPrice > 0) {
                    await pool.query(
                        'UPDATE Packages SET speed_limit = ?, price = ? WHERE id = ?',
                        [speedLimit, detectedPrice, existing[0].id]
                    );
                } else {
                    await pool.query(
                        'UPDATE Packages SET speed_limit = ? WHERE id = ?',
                        [speedLimit, existing[0].id]
                    );
                }
                updatedCount++;
            }
        }

        return NextResponse.json({ 
            success: true, 
            message: `Sinkronisasi selesai: ${addedCount} baru, ${updatedCount} diperbarui.`,
            count: addedCount,
            updatedCount
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
