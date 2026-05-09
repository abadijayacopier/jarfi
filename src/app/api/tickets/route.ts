import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

async function ensureSchema() {
    const tableQuery = `
        CREATE TABLE IF NOT EXISTS SupportTickets (
            id INT AUTO_INCREMENT PRIMARY KEY,
            customer_id INT,
            subject VARCHAR(255) NOT NULL,
            description TEXT,
            status ENUM('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED') DEFAULT 'OPEN',
            priority ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') DEFAULT 'MEDIUM',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (customer_id) REFERENCES Customers(id) ON DELETE SET NULL
        )
    `;
    await pool.query(tableQuery);
}

export async function GET() {
    try {
        await ensureSchema();
        const [rows]: any = await pool.query(`
            SELECT t.*, c.name as customer_name, c.phone as customer_phone 
            FROM SupportTickets t 
            LEFT JOIN Customers c ON t.customer_id = c.id 
            ORDER BY t.created_at DESC
        `);
        return NextResponse.json({ tickets: rows });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        await ensureSchema();
        const body = await req.json();
        const { customer_id, subject, description, priority } = body;
        
        await pool.query(
            'INSERT INTO SupportTickets (customer_id, subject, description, priority) VALUES (?, ?, ?, ?)',
            [customer_id, subject, description, priority || 'MEDIUM']
        );

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const body = await req.json();
        const { id, status } = body;
        await pool.query('UPDATE SupportTickets SET status = ? WHERE id = ?', [status, id]);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
