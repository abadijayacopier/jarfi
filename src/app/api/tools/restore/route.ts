import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function POST(req: Request) {
    const connection = await pool.getConnection();
    try {
        const sqlContent = await req.text();
        const queries = sqlContent
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0 && !line.startsWith('--'));

        await connection.beginTransaction();

        // Join lines and split by semicolon to handle multi-line if needed
        // but for our simple generator, line-by-line is safer
        for (const query of queries) {
            if (query.endsWith(';')) {
                await connection.query(query);
            }
        }

        await connection.commit();

        return NextResponse.json({ success: true, message: 'SQL Database restored successfully' });
    } catch (error: any) {
        await connection.rollback();
        return NextResponse.json({ error: error.message }, { status: 500 });
    } finally {
        connection.release();
    }
}
