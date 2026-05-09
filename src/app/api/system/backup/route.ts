import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import fs from 'fs';
import path from 'path';

export async function POST() {
    try {
        // 1. Get all tables
        const [tables]: any = await pool.query('SHOW TABLES');
        const dbName = process.env.DB_NAME || 'jarfi_db';
        let fullDump = `-- JARFI MGT CORE AUTO-BACKUP\n-- Date: ${new Date().toISOString()}\n\n`;

        for (const tableRow of tables) {
            const tableName = Object.values(tableRow)[0] as string;
            
            // Create Table
            const [createTable]: any = await pool.query(`SHOW CREATE TABLE ${tableName}`);
            fullDump += `${createTable[0]['Create Table']};\n\n`;

            // Insert Data
            const [rows]: any = await pool.query(`SELECT * FROM ${tableName}`);
            for (const row of rows) {
                const keys = Object.keys(row).join('`, `');
                const values = Object.values(row).map(val => {
                    if (val === null) return 'NULL';
                    if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
                    return val;
                }).join(', ');
                fullDump += `INSERT INTO \`${tableName}\` (\`${keys}\`) VALUES (${values});\n`;
            }
            fullDump += '\n';
        }

        // 2. Save to local backups folder
        const backupDir = path.join(process.cwd(), 'backups');
        if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir);
        
        const fileName = `backup_${new Date().toISOString().split('T')[0]}.sql`;
        const filePath = path.join(backupDir, fileName);
        fs.writeFileSync(filePath, fullDump);

        // 3. Log the activity
        await pool.query('INSERT INTO ActivityLogs (action, description, color) VALUES (?, ?, ?)', [
            'System Backup',
            `Otomatisasi cadangan basis data berhasil: ${fileName}`,
            'text-emerald-500'
        ]);

        return NextResponse.json({ success: true, fileName });
    } catch (error: any) {
        console.error('Backup failed:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
