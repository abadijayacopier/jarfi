'use client';

import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { Zap, Bell, ShieldAlert, ShieldCheck, MessageSquare, Play, Settings, Info, RefreshCw, Smartphone } from 'lucide-react';

export default function AutomationPage() {
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState<any>(null);
    const [waSettings, setWaSettings] = useState({
        wa_api_key: '',
        wa_api_url: 'https://api.fonnte.com/send',
        isolir_message_template: 'Halo {name}, koneksi internet Anda terisolir karena tunggakan bulan {month}. Total: {amount}. Silakan bayar agar aktif kembali.',
        payment_message_template: 'Terima kasih {name}, pembayaran {month} sebesar {amount} telah diterima. Koneksi aktif kembali.'
    });

    useEffect(() => {
        fetch('/api/settings').then(res => res.json()).then(data => {
            if (data.settings) {
                setWaSettings({
                    wa_api_key: data.settings.wa_api_key || '',
                    wa_api_url: data.settings.wa_api_url || 'https://api.fonnte.com/send',
                    isolir_message_template: data.settings.isolir_message_template || waSettings.isolir_message_template,
                    payment_message_template: data.settings.payment_message_template || waSettings.payment_message_template
                });
            }
        });
    }, []);

    const handleRunAutomation = async () => {
        const result = await Swal.fire({
            title: 'Jalankan Auto-Isolir?',
            text: "Sistem akan memeriksa tagihan semua pelanggan, membuat invoice otomatis, memutus koneksi (ISOLIR) bagi yang menunggak, dan mengirim notifikasi WhatsApp.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#6366f1',
            cancelButtonColor: '#334155',
            confirmButtonText: 'Ya, Jalankan Sekarang!',
            background: '#1e293b',
            color: '#fff'
        });

        if (result.isConfirmed) {
            setLoading(true);
            Swal.fire({ 
                title: 'Sedang Memproses...', 
                text: 'Memeriksa database & berkomunikasi dengan Mikrotik...', 
                allowOutsideClick: false, 
                background: '#1e293b', 
                color: '#fff', 
                didOpen: () => { Swal.showLoading(); } 
            });

            try {
                const res = await fetch('/api/automation/run');
                const data = await res.json();
                if (res.ok) {
                    setStats(data.results);
                    Swal.fire({ 
                        icon: 'success', 
                        title: 'Otomatisasi Selesai', 
                        html: `
                            <div class="text-left text-sm space-y-2 mt-4">
                                <p>✅ Invoice Baru: <b>${data.results.invoices_generated}</b></p>
                                <p>🔒 User Terisolir: <b>${data.results.users_isolated}</b></p>
                                <p>📲 WA Terkirim: <b>${data.results.notifications_sent}</b></p>
                                ${data.results.errors.length > 0 ? `<p class="text-red-400">⚠️ Error: ${data.results.errors.length} user gagal diproses.</p>` : ''}
                            </div>
                        `,
                        background: '#1e293b', 
                        color: '#fff' 
                    });
                } else {
                    Swal.fire({ icon: 'error', title: 'Gagal', text: data.error, background: '#1e293b', color: '#fff' });
                }
            } catch (err) {
                Swal.fire({ icon: 'error', title: 'Error API', text: 'Gagal menghubungi server.', background: '#1e293b', color: '#fff' });
            } finally {
                setLoading(false);
            }
        }
    };

    const saveSettings = async () => {
        try {
            const res = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(waSettings)
            });
            if (res.ok) {
                Swal.fire({ icon: 'success', title: 'Tersimpan', text: 'Pengaturan WhatsApp & Isolir telah diperbarui.', background: '#1e293b', color: '#fff' });
            }
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Gagal Simpan', text: 'Terjadi kesalahan.', background: '#1e293b', color: '#fff' });
        }
    };

    return (
        <div className="animate-in fade-in duration-500 pb-10">
            <div className="mb-8">
                <h3 className="text-3xl font-bold text-white">Automation Hub</h3>
                <p className="text-slate-400 mt-1">Sistem Auto-Isolir & Notifikasi WhatsApp Terintegrasi</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Action Card */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="glass p-8 rounded-3xl border border-indigo-500/20 bg-indigo-500/5 relative overflow-hidden group">
                        <div className="absolute -right-20 -top-20 p-20 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Zap className="w-64 h-64 text-indigo-400" />
                        </div>
                        
                        <div className="relative z-10">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 border border-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.2)]">
                                    <Play className="w-8 h-8 fill-current" />
                                </div>
                                <div>
                                    <h4 className="text-2xl font-black text-white">Eksekusi Auto-Isolir</h4>
                                    <p className="text-slate-400">Jalankan pengecekan tagihan dan pemutusan koneksi otomatis.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                                <div className="bg-slate-900/50 p-4 rounded-2xl border border-white/5">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Status Sistem</p>
                                    <p className="text-lg font-bold text-emerald-400 flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div> Ready
                                    </p>
                                </div>
                                <div className="bg-slate-900/50 p-4 rounded-2xl border border-white/5">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Terakhir Jalan</p>
                                    <p className="text-lg font-bold text-white">Hari Ini</p>
                                </div>
                                <div className="bg-slate-900/50 p-4 rounded-2xl border border-white/5">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Metode</p>
                                    <p className="text-lg font-bold text-indigo-400">API Gateway</p>
                                </div>
                            </div>

                            <button
                                onClick={handleRunAutomation}
                                disabled={loading}
                                className="w-full py-5 rounded-2xl bg-indigo-500 hover:bg-indigo-400 text-white font-black uppercase tracking-widest text-lg transition-all shadow-[0_0_30px_rgba(99,102,241,0.4)] hover:shadow-[0_0_50px_rgba(99,102,241,0.6)] flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                                {loading ? <RefreshCw className="w-6 h-6 animate-spin" /> : <Zap className="w-6 h-6 fill-current" />}
                                {loading ? 'Memproses...' : 'Jalankan Billing Check & Auto-Isolir'}
                            </button>

                            <div className="mt-6 flex items-start gap-3 bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl">
                                <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                                <p className="text-xs text-blue-300 leading-relaxed">
                                    Sistem akan melakukan 3 tahap: <b>1.</b> Generate invoice untuk bulan berjalan jika belum ada. 
                                    <b> 2.</b> Mencari pelanggan ACTIVE yang sudah lewat jatuh tempo tapi belum bayar. 
                                    <b> 3.</b> Memindahkannya ke profil ISOLIR dan mengirim WA.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="glass p-8 rounded-3xl border border-white/10">
                        <div className="flex items-center gap-3 mb-6">
                            <MessageSquare className="w-6 h-6 text-indigo-400" />
                            <h4 className="text-xl font-bold text-white">Template Pesan WhatsApp</h4>
                        </div>
                        
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-slate-500">Pesan Isolir (Tunggakan)</label>
                                <textarea 
                                    value={waSettings.isolir_message_template}
                                    onChange={(e) => setWaSettings({...waSettings, isolir_message_template: e.target.value})}
                                    className="w-full bg-slate-900 border border-white/10 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-indigo-500 min-h-[100px]"
                                />
                                <p className="text-[10px] text-slate-500 italic">Gunakan tag: {'{name}, {month}, {amount}, {due_date}'}</p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-slate-500">Pesan Pembayaran Sukses</label>
                                <textarea 
                                    value={waSettings.payment_message_template}
                                    onChange={(e) => setWaSettings({...waSettings, payment_message_template: e.target.value})}
                                    className="w-full bg-slate-900 border border-white/10 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-indigo-500 min-h-[100px]"
                                />
                            </div>
                            <button onClick={saveSettings} className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-all border border-white/10">Simpan Template</button>
                        </div>
                    </div>
                </div>

                {/* Sidebar Settings */}
                <div className="space-y-8">
                    <div className="glass p-6 rounded-3xl border border-white/10">
                        <div className="flex items-center gap-3 mb-6">
                            <Smartphone className="w-6 h-6 text-indigo-400" />
                            <h4 className="text-lg font-bold text-white">WA Gateway</h4>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-1.5">API URL</label>
                                <input 
                                    type="text" 
                                    value={waSettings.wa_api_url}
                                    onChange={(e) => setWaSettings({...waSettings, wa_api_url: e.target.value})}
                                    className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500" 
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-1.5">API KEY / TOKEN</label>
                                <input 
                                    type="password" 
                                    value={waSettings.wa_api_key}
                                    onChange={(e) => setWaSettings({...waSettings, wa_api_key: e.target.value})}
                                    placeholder="Masukkan Token Fonnte/Lainnya"
                                    className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500" 
                                />
                            </div>
                            <button onClick={saveSettings} className="w-full py-3 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-xl font-bold hover:bg-indigo-500/30 transition-all text-sm">Update Gateway</button>
                        </div>
                    </div>

                    <div className="glass p-6 rounded-3xl border border-white/10">
                        <div className="flex items-center gap-3 mb-4">
                            <Settings className="w-6 h-6 text-slate-400" />
                            <h4 className="text-lg font-bold text-white">Aturan Isolir</h4>
                        </div>
                        <div className="space-y-4 text-sm text-slate-400">
                            <div className="flex justify-between items-center p-3 bg-slate-900/50 rounded-xl">
                                <span>Profil Isolir Default</span>
                                <span className="text-orange-400 font-bold">ISOLIR</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-slate-900/50 rounded-xl">
                                <span>Grace Period</span>
                                <span className="text-white font-bold">0 Hari</span>
                            </div>
                            <p className="text-[11px] leading-relaxed italic border-l-2 border-indigo-500 pl-3">
                                *Pastikan di Mikrotik sudah ada PPP Profile bernama <b>ISOLIR</b> yang mengarahkan pelanggan ke halaman peringatan.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
