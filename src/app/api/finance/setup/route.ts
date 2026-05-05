import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

async function ensureFinanceSchema() {
    try {
        // Expenses Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS Expenses (
                id INT AUTO_INCREMENT PRIMARY KEY,
                category VARCHAR(100),
                description TEXT,
                amount DECIMAL(15, 2),
                date DATE,
                payment_method VARCHAR(50) DEFAULT 'CASH',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Journal Entries Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS Journal_Entries (
                id INT AUTO_INCREMENT PRIMARY KEY,
                type ENUM('DEBIT', 'CREDIT'),
                account VARCHAR(100),
                description TEXT,
                amount DECIMAL(15, 2),
                date DATE,
                reference_id VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Inventory Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS Inventory (
                id INT AUTO_INCREMENT PRIMARY KEY,
                item_name VARCHAR(255),
                category VARCHAR(100),
                stock INT DEFAULT 0,
                unit VARCHAR(20) DEFAULT 'pcs',
                price_per_unit DECIMAL(15, 2),
                min_stock INT DEFAULT 5,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        // ISP Bandwidth Costs
        await pool.query(`
            CREATE TABLE IF NOT EXISTS ISP_Costs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                source_name VARCHAR(100),
                bandwidth_mbps INT,
                monthly_fee DECIMAL(15, 2),
                billing_date INT DEFAULT 1,
                status VARCHAR(20) DEFAULT 'ACTIVE'
            )
        `);

        console.log('Finance & Inventory schemas stabilized.');
    } catch (e) {
        console.error('Finance schema error:', e);
        throw e;
    }
}

export async function GET() {
    try {
        await ensureFinanceSchema();
        return NextResponse.json({ success: true, message: 'Infrastruktur finansial siap.' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
