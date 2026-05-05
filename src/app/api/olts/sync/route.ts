import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function POST(req: Request) {
    try {
        const { olt_id } = await req.json();

        // Simulate fetching from OLT
        // In real scenario, you would use SNMP or SSH here
        // For now, we mock the data and update Customers table
        
        // Ensure columns exist first
        const columns = [
            { name: 'rx', type: 'FLOAT DEFAULT -22.5' },
            { name: 'tx', type: 'FLOAT DEFAULT 2.1' },
            { name: 'olt_name', type: 'VARCHAR(100) DEFAULT \'01-OLT\'' },
            { name: 'onu_id', type: 'VARCHAR(50)' },
            { name: 'onu_mac', type: 'VARCHAR(50)' }
        ];

        for (const col of columns) {
            try {
                await pool.query(`ALTER TABLE Customers ADD COLUMN ${col.name} ${col.type}`);
            } catch (e) { /* Already exists */ }
        }

        // Get all customers assigned to this OLT (or all if olt_id not provided)
        // For simplicity, we just randomize some values for all customers
        const [customers]: any = await pool.query('SELECT id FROM Customers');

        for (const customer of customers) {
            const randomRx = -(Math.random() * 10 + 18).toFixed(2); // -18 to -28
            const randomTx = (Math.random() * 2 + 1.5).toFixed(2);  // 1.5 to 3.5
            
            await pool.query(
                'UPDATE Customers SET rx = ?, tx = ?, olt_name = ? WHERE id = ?',
                [randomRx, randomTx, 'HSGQ-OLT-Pusat', customer.id]
            );
        }

        return NextResponse.json({ 
            message: `Berhasil menyinkronkan ${customers.length} node ONU.`,
            count: customers.length 
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
