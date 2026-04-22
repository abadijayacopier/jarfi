import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET() {
    try {
        const tables = ['Routers', 'Packages', 'ODPs', 'Customers', 'Invoices', 'Settings'];
        let sqlDump = `-- JARFI ISP Management System SQL Dump\n`;
        sqlDump += `-- Generated: ${new Date().toLocaleString()}\n\n`;
        sqlDump += `SET FOREIGN_KEY_CHECKS = 0;\n\n`;

        for (const table of tables) {
            sqlDump += `-- Table structure for ${table}\n`;
            const [rows]: any = await pool.query(`SELECT * FROM ${table}`);
            
            if (rows.length > 0) {
                const columns = Object.keys(rows[0]).map(c => `\`${c}\``).join(', ');
                sqlDump += `DELETE FROM \`${table}\`;\n`;
                
                for (const row of rows) {
                    const values = Object.values(row).map(val => {
                        if (val === null) return 'NULL';
                        if (typeof val === 'number') return val;
                        return `'${val.toString().replace(/'/g, "''")}'`;
                    }).join(', ');
                    
                    sqlDump += `INSERT INTO \`${table}\` (${columns}) VALUES (${values});\n`;
                }
            }
            sqlDump += `\n`;
        }

        sqlDump += `SET FOREIGN_KEY_CHECKS = 1;\n`;

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `jarfi-backup-${timestamp}.sql`;

        return new NextResponse(sqlDump, {
            status: 200,
            headers: {
                'Content-Type': 'application/sql',
                'Content-Disposition': `attachment; filename="${filename}"`
            }
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
