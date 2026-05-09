import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { RouterOSClient } from 'routeros-client';

export async function POST(req: Request) {
    try {
        const { customerId } = await req.json();

        // 1. Fetch customer info
        const [custRows]: any = await pool.query('SELECT * FROM Customers WHERE id = ?', [customerId]);
        if (custRows.length === 0) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
        const customer = custRows[0];
        const username = customer.pppoe_username;

        if (!username) return NextResponse.json({ error: 'PPPoE Username not set for this customer' }, { status: 400 });

        // 2. Fetch all routers
        const [routers]: any = await pool.query('SELECT * FROM Routers');
        
        let foundRouterId = null;
        let foundMikrotikMac = null;

        // 3. Scan routers in parallel (with timeout)
        const scanResults = await Promise.allSettled(routers.map(async (router: any) => {
            const client = new RouterOSClient({
                host: router.ip_address,
                user: router.username,
                password: router.password,
                port: router.api_port || 8728,
                timeout: 5000
            });

            try {
                const conn = await client.connect();
                // Search for PPPoE Secret
                const secrets = await conn.menu('/ppp/secret').where('name', username).get();
                
                if (secrets && secrets.length > 0) {
                    // Found! Also try to get Active connection for MAC
                    const actives = await conn.menu('/ppp/active').where('name', username).get();
                    const mac = actives && actives.length > 0 ? (actives[0].callerId || actives[0]['caller-id']) : null;
                    
                    await client.close();
                    return { routerId: router.id, mac };
                }
                
                await client.close();
                return null;
            } catch (err) {
                if (client) try { await client.close(); } catch (e) {}
                console.error(`Failed to scan router ${router.name}:`, err);
                return null;
            }
        }));

        // 4. Process results
        for (const result of scanResults) {
            if (result.status === 'fulfilled' && result.value) {
                foundRouterId = result.value.routerId;
                foundMikrotikMac = result.value.mac;
                break;
            }
        }

        if (foundRouterId) {
            // 5. Update Customer with found Router
            await pool.query(
                'UPDATE Customers SET router_id = ?, mikrotik_mac = ? WHERE id = ?',
                [foundRouterId, foundMikrotikMac, customerId]
            );

            // 6. Optional: Auto-detect OLT if linked to an ODP
            // (Assuming OLT info is tied to the Router or manually configured)
            
            return NextResponse.json({ 
                success: true, 
                message: 'Subscriber detected successfully.',
                router_id: foundRouterId,
                mac: foundMikrotikMac
            });
        }

        return NextResponse.json({ error: 'Subscriber not found on any active routers' }, { status: 404 });
    } catch (error: any) {
        console.error('Auto-detect error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
