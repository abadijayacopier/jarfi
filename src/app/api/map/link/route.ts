import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function POST(req: Request) {
    try {
        // Pre-emptive schema check to prevent "Unknown column" errors
        try {
            await pool.query('ALTER TABLE ODPs ADD COLUMN parent_id INT');
        } catch (e) {}
        try {
            await pool.query('ALTER TABLE ODPs ADD COLUMN router_id INT');
        } catch (e) {}
        try {
            await pool.query('ALTER TABLE ODPs ADD COLUMN olt_id INT');
        } catch (e) {}
        try {
            await pool.query('ALTER TABLE Customers ADD COLUMN odp_id INT');
        } catch (e) {}

        const { sourceId, targetId, type } = await req.json();

        if (type === 'ODP_TO_USER') {
            // sourceId is ODP, targetId is Customer
            // Fetch ODP info to get its router/olt
            const [odpRows]: any = await pool.query('SELECT router_id, olt_id FROM ODPs WHERE id = ?', [sourceId]);
            const odp = odpRows[0];

            await pool.query(
                'UPDATE Customers SET odp_id = ?, router_id = ?, olt_id = ? WHERE id = ?',
                [sourceId, odp?.router_id || null, odp?.olt_id || null, targetId]
            );
            return NextResponse.json({ success: true, message: 'Subscriber linked. Router & OLT inherited automatically.' });
        }

        if (type === 'ODP_TO_ODP') {
            // sourceId is Parent ODP, targetId is Child ODP
            // Fetch Parent ODP info to propagate router/olt
            const [parentRows]: any = await pool.query('SELECT router_id, olt_id FROM ODPs WHERE id = ?', [sourceId]);
            const parent = parentRows[0];

            await pool.query(
                'UPDATE ODPs SET parent_id = ?, router_id = ?, olt_id = ? WHERE id = ?',
                [sourceId, parent?.router_id || null, parent?.olt_id || null, targetId]
            );
            return NextResponse.json({ success: true, message: 'Backbone route updated. Infrastructure info propagated.' });
        }

        return NextResponse.json({ error: 'Invalid link type' }, { status: 400 });
    } catch (error: any) {
        console.error('Link update error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { sourceId, targetId, type } = await req.json();

        if (type === 'ODP_TO_USER') {
            // targetId is Customer
            await pool.query(
                'UPDATE Customers SET odp_id = NULL WHERE id = ?',
                [targetId]
            );
            return NextResponse.json({ success: true, message: 'Subscriber disconnected.' });
        }

        if (type === 'ODP_TO_ODP') {
            // targetId is Child ODP
            await pool.query(
                'UPDATE ODPs SET parent_id = NULL WHERE id = ?',
                [targetId]
            );
            return NextResponse.json({ success: true, message: 'Backbone route severed.' });
        }

        return NextResponse.json({ error: 'Invalid link type' }, { status: 400 });
    } catch (error: any) {
        console.error('Link disconnection error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
