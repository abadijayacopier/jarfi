import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET() {
    try {
        const tables = ['Routers', 'Packages', 'Customers', 'Invoices', 'Settings'];
        const backupData: any = {};

        for (const table of tables) {
            const [rows]: any = await pool.query(`SELECT * FROM ${table}`);
            backupData[table] = rows;
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `jarfi-backup-${timestamp}.json`;

        return new NextResponse(JSON.stringify(backupData, null, 2), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Content-Disposition': `attachment; filename="${filename}"`
            }
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
