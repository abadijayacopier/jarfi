import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

async function ensureSchema() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS Journal (
            id INT AUTO_INCREMENT PRIMARY KEY,
            date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            description VARCHAR(255) NOT NULL,
            category VARCHAR(100),
            debit DECIMAL(15, 2) DEFAULT 0,
            credit DECIMAL(15, 2) DEFAULT 0,
            reference_id VARCHAR(50),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
}

export async function GET() {
    try {
        await ensureSchema();
        const [rows] = await pool.query('SELECT * FROM Journal ORDER BY date DESC');
        return NextResponse.json({ journal: rows });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        await ensureSchema();
        const { description, category, debit, credit, reference_id } = await req.json();
        
        await pool.query(
            'INSERT INTO Journal (description, category, debit, credit, reference_id) VALUES (?, ?, ?, ?, ?)',
            [description, category, debit || 0, credit || 0, reference_id]
        );
        
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
