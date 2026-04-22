import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function POST(req: Request) {
    const connection = await pool.getConnection();
    try {
        const backupData = await req.json();
        const tables = ['Routers', 'Packages', 'Customers', 'Invoices', 'Settings'];

        await connection.beginTransaction();

        // Disable foreign key checks for clean restore
        await connection.query('SET FOREIGN_KEY_CHECKS = 0');

        for (const table of tables) {
            if (backupData[table]) {
                // Clear existing data
                await connection.query(`TRUNCATE TABLE ${table}`);
                
                const rows = backupData[table];
                if (rows.length > 0) {
                    const keys = Object.keys(rows[0]);
                    const values = rows.map((row: any) => keys.map(k => row[k]));
                    
                    const placeholders = keys.map(() => '?').join(',');
                    const sql = `INSERT INTO ${table} (${keys.map(k => `\`${k}\``).join(',')}) VALUES ?`;
                    
                    await connection.query(sql, [values]);
                }
            }
        }

        await connection.query('SET FOREIGN_KEY_CHECKS = 1');
        await connection.commit();

        return NextResponse.json({ success: true, message: 'Database restored successfully' });
    } catch (error: any) {
        await connection.rollback();
        return NextResponse.json({ error: error.message }, { status: 500 });
    } finally {
        connection.release();
    }
}
