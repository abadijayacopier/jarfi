import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

async function ensureSchema() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS Inventory (
            id INT AUTO_INCREMENT PRIMARY KEY,
            item_name VARCHAR(255) NOT NULL,
            category VARCHAR(100),
            stock INT DEFAULT 0,
            unit VARCHAR(50),
            price_per_unit DECIMAL(15, 2) DEFAULT 0,
            min_stock INT DEFAULT 5,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
}

export async function GET() {
    try {
        await ensureSchema();
        const [rows] = await pool.query('SELECT * FROM Inventory ORDER BY item_name ASC');
        return NextResponse.json({ items: rows });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const data = await req.json();
        const { item_name, category, stock, unit, price_per_unit, min_stock } = data;
        
        const [result]: any = await pool.query(
            'INSERT INTO Inventory (item_name, category, stock, unit, price_per_unit, min_stock) VALUES (?, ?, ?, ?, ?, ?)',
            [item_name, category, stock, unit, price_per_unit, min_stock]
        );
        
        return NextResponse.json({ success: true, id: result.insertId });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const data = await req.json();
        const { id, item_name, category, stock, unit, price_per_unit, min_stock } = data;
        
        await pool.query(
            'UPDATE Inventory SET item_name = ?, category = ?, stock = ?, unit = ?, price_per_unit = ?, min_stock = ? WHERE id = ?',
            [item_name, category, stock, unit, price_per_unit, min_stock, id]
        );
        
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        
        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
        
        await pool.query('DELETE FROM Inventory WHERE id = ?', [id]);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
