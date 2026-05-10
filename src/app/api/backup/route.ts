import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET() {
    try {
        const [tablesRows]: any = await pool.query('SHOW TABLES');
        let backupData: any = {};
        
        for (const row of tablesRows) {
            const tableName = Object.values(row)[0] as string;
            const [data] = await pool.query(`SELECT * FROM ${tableName}`);
            backupData[tableName] = data;
        }

        return NextResponse.json(backupData, {
            headers: {
                'Content-Disposition': `attachment; filename="jarfi_backup_${new Date().toISOString().split('T')[0]}.json"`,
                'Content-Type': 'application/json'
            }
        });
    } catch (error: any) {
        console.error('Backup Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    let connection;
    try {
        const backupData = await req.json();
        connection = await pool.getConnection();
        
        // Disable foreign key checks during restore
        await connection.query('SET FOREIGN_KEY_CHECKS = 0');
        
        for (const [tableName, rows] of Object.entries(backupData)) {
            const dataRows = rows as any[];
            if (dataRows.length === 0) continue;
            
            // Check if table exists
            const [tableExists]: any = await connection.query(`SHOW TABLES LIKE '${tableName}'`);
            if (tableExists.length === 0) continue;
            
            const columns = Object.keys(dataRows[0]);
            const values = dataRows.map(row => columns.map(col => row[col]));
            
            if(values.length > 0) {
                // We use REPLACE INTO to overwrite existing rows based on primary keys
                await connection.query(`REPLACE INTO ${tableName} (${columns.join(', ')}) VALUES ?`, [values]);
            }
        }
        
        await connection.query('SET FOREIGN_KEY_CHECKS = 1');
        connection.release();
        
        return NextResponse.json({ success: true, message: 'Database restored successfully' });
    } catch (error: any) {
        console.error('Restore Error:', error);
        if (connection) {
            await connection.query('SET FOREIGN_KEY_CHECKS = 1');
            connection.release();
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
