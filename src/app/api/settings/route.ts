import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

async function ensureSchema() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS Settings (
                \`key\` VARCHAR(100) PRIMARY KEY,
                \`value\` TEXT
            )
        `);
        
        // Seed default values if empty
        const [rows]: any = await pool.query('SELECT COUNT(*) as count FROM Settings');
        if (rows[0].count === 0) {
            const defaults = [
                ['company_name', 'JARFI Networks'],
                ['company_address', 'Jl. Teknologi Masa Depan No. 99, Jakarta'],
                ['company_email', 'cs@jarfi.net'],
                ['company_whatsapp', '8123456789'],
                ['tax_enabled', '0'],
                ['auto_isolate', '1']
            ];
            for (const [k, v] of defaults) {
                await pool.query('INSERT INTO Settings (\`key\`, \`value\`) VALUES (?, ?)', [k, v]);
            }
        }
    } catch (e) {
        console.error('Settings schema error:', e);
    }
}

export async function GET() {
    try {
        await ensureSchema();
        const [rows]: any = await pool.query('SELECT * FROM Settings');
        const settings = rows.reduce((acc: any, row: any) => {
            acc[row.key] = row.value;
            return acc;
        }, {});
        return NextResponse.json({ settings });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        await ensureSchema();
        const data = await req.json();
        
        for (const key in data) {
            await pool.query(
                'INSERT INTO Settings (\`key\`, \`value\`) VALUES (?, ?) ON DUPLICATE KEY UPDATE \`value\` = ?',
                [key, data[key].toString(), data[key].toString()]
            );
        }
        
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
