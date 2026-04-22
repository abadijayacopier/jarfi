import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET() {
    try {
        // Auto-fix schema more robustly
        try {
            const [columns]: any = await pool.query('SHOW COLUMNS FROM Packages');
            const hasSpeedLimit = columns.some((c: any) => c.Field === 'speed_limit');
            const hasBandwidthLimit = columns.some((c: any) => c.Field === 'bandwidth_limit');

            if (!hasSpeedLimit && hasBandwidthLimit) {
                // Rename bandwidth_limit to speed_limit if only the old one exists
                await pool.query('ALTER TABLE Packages CHANGE bandwidth_limit speed_limit VARCHAR(100) DEFAULT ""');
            } else if (!hasSpeedLimit) {
                // Add speed_limit if neither exists
                await pool.query('ALTER TABLE Packages ADD COLUMN speed_limit VARCHAR(100) DEFAULT "" AFTER name');
            } else {
                // Ensure speed_limit has a default value to avoid insert errors
                await pool.query('ALTER TABLE Packages MODIFY speed_limit VARCHAR(100) DEFAULT ""');
            }
            
            // Also ensure other columns have defaults if they cause issues
            if (hasBandwidthLimit && hasSpeedLimit) {
                // If both exist, make bandwidth_limit nullable or have default to avoid errors
                await pool.query('ALTER TABLE Packages MODIFY bandwidth_limit VARCHAR(100) DEFAULT ""');
            }
        } catch (e: any) {
            console.error('Migration failed:', e.message);
        }

        const [rows] = await pool.query('SELECT * FROM Packages ORDER BY price ASC');
        return NextResponse.json({ packages: rows });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
