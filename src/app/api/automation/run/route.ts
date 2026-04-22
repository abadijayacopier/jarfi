import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { MikrotikService } from '@/lib/mikrotik';
import { sendWhatsApp } from '@/lib/whatsapp';

export async function GET() {
    try {
        const today = new Date();
        const currentDay = today.getDate();
        const currentMonth = today.toISOString().slice(0, 7); // "YYYY-MM"

        const results = {
            invoices_generated: 0,
            users_isolated: 0,
            notifications_sent: 0,
            errors: [] as string[]
        };

        // 1. Dapatkan semua pelanggan aktif
        const [customers]: any = await pool.query(`
            SELECT c.*, p.name as package_name, p.price, r.ip_address, r.username as r_user, r.password as r_pass, r.api_port, r.isolir_profile
            FROM Customers c
            JOIN Packages p ON c.package_id = p.id
            JOIN Routers r ON c.router_id = r.id
            WHERE c.status != 'DELETED'
        `);

        for (const customer of customers) {
            try {
                // 2. Pastikan tagihan bulan ini sudah ada
                const [invoices]: any = await pool.query(
                    'SELECT id, status FROM Invoices WHERE customer_id = ? AND billing_month = ?',
                    [customer.id, currentMonth]
                );

                let invoiceStatus = 'UNPAID';
                
                if (invoices.length === 0) {
                    // Buat tagihan otomatis jika belum ada
                    await pool.query(
                        'INSERT INTO Invoices (customer_id, amount, status, billing_month) VALUES (?, ?, ?, ?)',
                        [customer.id, customer.price, 'UNPAID', currentMonth]
                    );
                    results.invoices_generated++;
                } else {
                    invoiceStatus = invoices[0].status;
                }

                // 3. LOGIKA AUTO-ISOLIR
                // Jika Belum Bayar DAN sudah lewat tanggal jatuh tempo
                if (invoiceStatus === 'UNPAID' && currentDay > customer.due_date && customer.status === 'ACTIVE') {
                    const mk = new MikrotikService({
                        host: customer.ip_address,
                        user: customer.r_user,
                        password: customer.r_pass,
                        port: customer.api_port
                    });

                    const isolirProfile = customer.isolir_profile || 'ISOLIR';
                    
                    // Eksekusi di Mikrotik
                    await mk.isolateUser(customer.pppoe_username, isolirProfile);

                    // Update Status di Database
                    await pool.query('UPDATE Customers SET status = ? WHERE id = ?', ['ISOLATED', customer.id]);
                    
                    results.users_isolated++;

                    // 4. Kirim Notifikasi WhatsApp
                    const msg = `Halo ${customer.name}, koneksi internet Anda sementara terisolir karena tagihan bulan ${currentMonth} belum terbayar (Jatuh tempo tgl ${customer.due_date}). Silakan lakukan pembayaran Rp ${parseInt(customer.price).toLocaleString()} agar internet aktif kembali.`;
                    await sendWhatsApp(customer.phone, msg);
                    results.notifications_sent++;
                }

                // 5. LOGIKA AUTO-BUKA ISOLIR (Jika sudah bayar tapi masih ISOLATED)
                if (invoiceStatus === 'PAID' && customer.status === 'ISOLATED') {
                    const mk = new MikrotikService({
                        host: customer.ip_address,
                        user: customer.r_user,
                        password: customer.r_pass,
                        port: customer.api_port
                    });

                    // Kembalikan ke profile aslinya
                    await mk.isolateUser(customer.pppoe_username, customer.package_name);

                    // Update Status di Database
                    await pool.query('UPDATE Customers SET status = ? WHERE id = ?', ['ACTIVE', customer.id]);
                    
                    const msg = `Terima kasih ${customer.name}, pembayaran tagihan Anda sudah kami terima. Koneksi internet Anda telah diaktifkan kembali. Selamat berinternet!`;
                    await sendWhatsApp(customer.phone, msg);
                }

            } catch (err: any) {
                results.errors.push(`Customer ${customer.name}: ${err.message}`);
            }
        }

        return NextResponse.json({ success: true, results });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
