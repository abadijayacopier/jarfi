import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { Telnet } from 'telnet-client';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await req.json();
        const { command } = body; // e.g., "show onu unauth"

        if (!command) {
            return NextResponse.json({ error: 'Command is required' }, { status: 400 });
        }

        // 1. Get OLT credentials from Database
        const [olts]: any = await pool.query('SELECT * FROM OLTs WHERE id = ?', [id]);
        if (olts.length === 0) {
            return NextResponse.json({ error: 'OLT not found' }, { status: 404 });
        }
        const olt = olts[0];

        // 2. Initialize Telnet Connection
        const connection = new Telnet();
        const paramsTelnet = {
            host: olt.ip_address,
            port: olt.telnet_port || 23,
            username: olt.username,
            password: olt.password,
            shellPrompt: />|#/, // Prompt OLT biasanya berakhiran > atau #
            loginPrompt: /Username:|login:/i,
            passwordPrompt: /Password:/i,
            timeout: 5000,
            execTimeout: 5000
        };

        let output = '';

        try {
            console.log(`Connecting to OLT ${olt.ip_address}...`);
            await connection.connect(paramsTelnet);
            
            // 3. Execute Command
            console.log(`Executing: ${command}`);
            output = await connection.exec(command);
            
            await connection.end();
        } catch (telnetError: any) {
            console.error('Telnet Error:', telnetError);
            return NextResponse.json({ error: 'Telnet connection failed: ' + telnetError.message }, { status: 500 });
        }

        // 4. Return Raw Output (For now, we will parse this later on the frontend or backend)
        return NextResponse.json({ success: true, output });

    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
