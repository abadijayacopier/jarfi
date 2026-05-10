import { NextResponse } from 'next/server';
import { MikrotikService } from '@/lib/mikrotik';
import { pool } from '@/lib/db';
import { sendTelegramNotification } from '@/lib/telegram';

export async function POST(req: Request) {
    let requestBody: any = null;
    try {
        requestBody = await req.json();
        let { id, host, user, password, port } = requestBody;

        // Jika ID diberikan, ambil password dari database jika tidak disertakan di request
        // (Penting karena API list router tidak mengembalikan password)
        if (id && !password) {
            const [rows]: any = await pool.query(
                'SELECT ip_address, username, password, api_port FROM Routers WHERE id = ?', 
                [id]
            );
            
            if (rows.length > 0) {
                const dbRouter = rows[0];
                host = host || dbRouter.ip_address;
                user = user || dbRouter.username;
                password = dbRouter.password;
                port = port || dbRouter.api_port;
            }
        }

        if (!host || !user) {
            return NextResponse.json({ error: 'Host and User are required' }, { status: 400 });
        }

        let routerName = 'Router';
        let previousStatus = 'UNKNOWN';
        if (id) {
            const [rows]: any = await pool.query('SELECT status, name FROM Routers WHERE id = ?', [id]);
            if (rows.length > 0) {
                previousStatus = rows[0].status;
                routerName = rows[0].name;
            }
        }

        const service = new MikrotikService({
            host,
            user,
            password: password || '',
            port: port ? parseInt(port as string) : 8728
        });

        const activeUsers = await service.getActiveUsers();

        if (id) {
            if (previousStatus !== 'ONLINE') {
                sendTelegramNotification(`🟢 *ROUTER ONLINE*\n\nRouter *${routerName}* (${host}) telah kembali UP/ONLINE! ✅\nKoneksi ke jaringan sudah stabil.`);
            }
            await pool.query('UPDATE Routers SET status = ? WHERE id = ?', ['ONLINE', id]);
        }

        return NextResponse.json({
            success: true,
            message: 'Connected to Mikrotik router successfully.',
            activeSessionCount: activeUsers.length
        });
    } catch (error: any) {
        if (requestBody && requestBody.id) {
            try { 
                const [rows]: any = await pool.query('SELECT status, name FROM Routers WHERE id = ?', [requestBody.id]);
                if (rows.length > 0 && rows[0].status !== 'OFFLINE') {
                    sendTelegramNotification(`🔴 *ROUTER DOWN / TERPUTUS*\n\nRouter *${rows[0].name}* (${requestBody.host || 'Unknown IP'}) terdeteksi OFFLINE! ❌\nHarap segera cek perangkat atau jaringan.`);
                }
                await pool.query('UPDATE Routers SET status = ? WHERE id = ?', ['OFFLINE', requestBody.id]); 
            } catch (e) { }
        }
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
