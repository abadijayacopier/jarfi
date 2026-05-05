import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function POST(req: Request) {
    try {
        const { sourceId, targetId, type } = await req.json();

        if (type === 'ODP_TO_USER') {
            // sourceId is ODP, targetId is Customer
            await pool.query(
                'UPDATE Customers SET odp_id = ? WHERE id = ?',
                [sourceId, targetId]
            );
            return NextResponse.json({ success: true, message: 'Subscriber linked to ODP node.' });
        }

        if (type === 'ODP_TO_ODP') {
            // sourceId is Parent ODP, targetId is Child ODP
            await pool.query(
                'UPDATE ODPs SET parent_id = ? WHERE id = ?',
                [sourceId, targetId]
            );
            return NextResponse.json({ success: true, message: 'Infrastructure backbone route updated.' });
        }

        return NextResponse.json({ error: 'Invalid link type' }, { status: 400 });
    } catch (error: any) {
        console.error('Link update error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
