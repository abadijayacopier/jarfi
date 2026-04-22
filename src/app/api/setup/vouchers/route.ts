import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET() {
    try {
        await pool.query(`
      CREATE TABLE IF NOT EXISTS Vouchers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        router_id INT NOT NULL,
        code VARCHAR(50) NOT NULL UNIQUE,
        password VARCHAR(50) NOT NULL,
        profile VARCHAR(50) NOT NULL,
        price DECIMAL(10,2) NOT NULL DEFAULT 0,
        status ENUM('AVAILABLE', 'USED') DEFAULT 'AVAILABLE',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (router_id) REFERENCES Routers(id) ON DELETE CASCADE
      )
    `);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
