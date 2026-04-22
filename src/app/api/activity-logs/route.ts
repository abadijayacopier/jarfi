import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET() {
    try {
        // Create table if not exists
        await pool.query(`
            CREATE TABLE IF NOT EXISTS ActivityLogs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                action VARCHAR(255) NOT NULL,
                description TEXT,
                color VARCHAR(50) DEFAULT 'text-slate-400',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Check if empty, if so add initial log
        const [count]: any = await pool.query('SELECT COUNT(*) as total FROM ActivityLogs');
        if (count[0].total === 0) {
            await pool.query(
                'INSERT INTO ActivityLogs (action, description, color) VALUES (?, ?, ?)',
                ['Sistem Dimulai', 'Pencatatan aktivitas real-time telah diaktifkan.', 'text-emerald-400']
            );
        }

        const [rows]: any = await pool.query('SELECT * FROM ActivityLogs ORDER BY created_at DESC LIMIT 10');
        return NextResponse.json({ success: true, logs: rows });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { action, description, color } = await req.json();
        await pool.query(
            'INSERT INTO ActivityLogs (action, description, color) VALUES (?, ?, ?)',
            [action, description, color || 'text-slate-400']
        );
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
