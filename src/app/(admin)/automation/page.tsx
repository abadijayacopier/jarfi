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
        <div className="animate-in fade-in duration-500 pb-20 space-y-12">
            <div className="mb-12">
                <h3 className="text-4xl font-black text-primary tracking-tight flex items-center gap-4">
                    <Zap className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                    Autonomous Operations
                </h3>
                <p className="text-muted mt-2 font-medium text-sm">Orkestrasi Billing, Auto-Isolir, dan Notifikasi Cerdas.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Main Action Card */}
                <div className="lg:col-span-2 space-y-12">
                    <div className="glass p-12 rounded-[3.5rem] relative overflow-hidden group shadow-2xl border-2 border-(--glass-border) bg-white/5">
                        <div className="absolute -right-40 -top-40 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none group-hover:bg-indigo-500/15 transition-all duration-700"></div>
                        
                        <div className="relative z-10">
                            <div className="flex flex-col md:flex-row items-start md:items-center gap-8 mb-12">
                                <div className="w-24 h-24 rounded-4xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border-2 border-indigo-500/20 shadow-inner group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                                    <Zap className="w-12 h-12 fill-indigo-600/10" />
                                </div>
                                <div>
                                    <h4 className="text-3xl font-black text-primary tracking-tight">Billing Synchronization</h4>
                                    <p className="text-muted font-medium mt-1">Audit database pelanggan dan eksekusi isolir massal.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                                <div className="bg-slate-100/50 dark:bg-slate-900/50 p-8 rounded-4xl border-2 border-(--glass-border) shadow-inner group/stat hover:border-indigo-500/30 transition-all">
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-3">System Integrity</p>
                                    <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-3 uppercase tracking-widest">
                                        <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div> Secure
                                    </div>
                                </div>
                                <div className="bg-slate-100/50 dark:bg-slate-900/50 p-8 rounded-4xl border-2 border-(--glass-border) shadow-inner group/stat hover:border-indigo-500/30 transition-all">
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-3">Last Execution</p>
                                    <p className="text-xl font-black text-primary uppercase tracking-widest">Active Now</p>
                                </div>
                                <div className="bg-slate-100/50 dark:bg-slate-900/50 p-8 rounded-4xl border-2 border-(--glass-border) shadow-inner group/stat hover:border-indigo-500/30 transition-all">
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-3">Service Bus</p>
                                    <p className="text-xl font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">REST API</p>
                                </div>
                            </div>

                            <button
                                onClick={handleRunAutomation}
                                disabled={loading}
                                className="w-full py-7 rounded-4xl bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-[0.3em] text-sm transition-all shadow-2xl shadow-indigo-600/30 hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-5 disabled:opacity-50"
                            >
                                {loading ? <RefreshCw className="w-8 h-8 animate-spin" /> : <Zap className="w-8 h-8 fill-current" />}
                                {loading ? 'Orchestrating Tasks...' : 'Execute Automation Sequence'}
                            </button>

                            <div className="mt-10 flex items-start gap-6 bg-indigo-500/5 dark:bg-indigo-500/10 border-2 border-indigo-500/10 p-8 rounded-4xl shadow-sm">
                                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 shrink-0">
                                    <Info className="w-6 h-6" />
                                </div>
                                <p className="text-[13px] text-slate-600 dark:text-indigo-300/80 leading-relaxed font-medium">
                                    Sistem akan melakukan 3 tahap kritis: <b className="text-primary font-black">1.</b> Invoicing audit otomatis. 
                                    <b className="text-primary font-black"> 2.</b> Identifikasi profil jatuh tempo di Mikrotik. 
                                    <b className="text-primary font-black"> 3.</b> Relokasi ke sandbox <span className="px-2 py-0.5 bg-amber-500/10 text-amber-600 rounded text-[10px] font-black tracking-widest uppercase">ISOLIR</span> dan diseminasi notifikasi.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="glass p-12 rounded-[3.5rem] shadow-2xl border border-(--glass-border)">
                        <div className="flex items-center gap-6 mb-12">
                            <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border-2 border-indigo-500/20 shadow-inner">
                                <MessageSquare className="w-8 h-8" />
                            </div>
                            <div>
                                <h4 className="text-2xl font-black text-primary tracking-tight">Notification Engine</h4>
                                <p className="text-[10px] text-muted font-black tracking-[0.3em] uppercase mt-1">Dynamic WhatsApp Messaging templates</p>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-10">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-1">Disconnection Template (Isolir)</label>
                                <textarea 
                                    value={waSettings.isolir_message_template}
                                    onChange={(e) => setWaSettings({...waSettings, isolir_message_template: e.target.value})}
                                    className="w-full clean-input min-h-[150px] py-6 px-8 text-base font-medium leading-relaxed"
                                    placeholder="Masukkan template pesan isolir..."
                                />
                                <div className="flex flex-wrap gap-2 mt-2 ml-1">
                                    {['{name}', '{month}', '{amount}', '{due_date}'].map(tag => (
                                        <span key={tag} className="px-3 py-1 bg-slate-100 dark:bg-white/5 border border-(--glass-border) rounded-lg text-[10px] font-mono font-black text-indigo-500 uppercase tracking-widest">{tag}</span>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-1">Success Notification (Payment)</label>
                                <textarea 
                                    value={waSettings.payment_message_template}
                                    onChange={(e) => setWaSettings({...waSettings, payment_message_template: e.target.value})}
                                    className="w-full clean-input min-h-[150px] py-6 px-8 text-base font-medium leading-relaxed"
                                    placeholder="Masukkan template pesan lunas..."
                                />
                            </div>
                            <button 
                                onClick={saveSettings} 
                                className="w-fit px-12 py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] transition-all shadow-xl shadow-indigo-600/20 hover:scale-105 active:scale-95"
                            >
                                Commit Templates
                            </button>
                        </div>
                    </div>
                </div>

                {/* Sidebar Settings */}
                <div className="space-y-12">
                    <div className="glass p-10 rounded-[3rem] group overflow-hidden relative shadow-2xl border-2 border-(--glass-border) bg-emerald-500/5">
                        <div className="absolute -right-16 -bottom-16 p-12 opacity-[0.05] group-hover:opacity-[0.1] transition-all duration-700">
                            <Smartphone className="w-56 h-56 text-emerald-500" />
                        </div>
                        <div className="flex items-center gap-5 mb-10 relative z-10">
                            <div className="w-14 h-14 rounded-[1.25rem] bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border-2 border-emerald-500/20 shadow-inner">
                                <Smartphone className="w-7 h-7" />
                            </div>
                            <h4 className="text-xl font-black text-primary tracking-tight">Hub Linkage</h4>
                        </div>
                        <div className="space-y-8 relative z-10">
                            <p className="text-sm text-slate-600 dark:text-emerald-300/80 leading-relaxed font-medium">
                                Sinkronisasi perangkat WhatsApp untuk transmisi notifikasi tagihan massal secara realtime.
                            </p>
                            <a 
                                href="https://web.whatsapp.com" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="w-full py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] transition-all flex items-center justify-center gap-4 shadow-xl shadow-emerald-600/30 hover:scale-[1.02] active:scale-95"
                            >
                                <Smartphone className="w-6 h-6" />
                                Handshake Device
                            </a>
                        </div>
                    </div>

                    <div className="glass p-10 rounded-[3rem] shadow-2xl border border-(--glass-border)">
                        <div className="flex items-center gap-5 mb-10">
                            <div className="w-14 h-14 rounded-[1.25rem] bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border-2 border-indigo-500/20 shadow-inner">
                                <Settings className="w-7 h-7" />
                            </div>
                            <h4 className="text-xl font-black text-primary tracking-tight">API Gateway</h4>
                        </div>
                        <div className="space-y-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 block ml-1">Service Endpoint</label>
                                <input 
                                    type="text" 
                                    value={waSettings.wa_api_url}
                                    onChange={(e) => setWaSettings({...waSettings, wa_api_url: e.target.value})}
                                    className="w-full clean-input text-xs font-mono py-4 px-6" 
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 block ml-1">Credential Token</label>
                                <input 
                                    type="password" 
                                    value={waSettings.wa_api_key}
                                    onChange={(e) => setWaSettings({...waSettings, wa_api_key: e.target.value})}
                                    placeholder="Masukkan Token Fonnte"
                                    className="w-full clean-input text-xs font-mono py-4 px-6" 
                                />
                            </div>
                            <button 
                                onClick={saveSettings} 
                                className="w-full py-5 bg-indigo-600/10 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 border-2 border-indigo-500/10 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-indigo-600/20 dark:hover:bg-indigo-600/30 transition-all active:scale-95"
                            >
                                Authenticate
                            </button>
                        </div>
                    </div>

                    <div className="glass p-10 rounded-[3rem] shadow-2xl border border-(--glass-border)">
                        <div className="flex items-center gap-5 mb-8">
                            <div className="w-14 h-14 rounded-[1.25rem] bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-600 dark:text-slate-400 border-2 border-(--glass-border)">
                                <ShieldCheck className="w-7 h-7" />
                            </div>
                            <h4 className="text-xl font-black text-primary tracking-tight">Logic Policy</h4>
                        </div>
                        <div className="space-y-5">
                            <div className="flex justify-between items-center p-6 bg-slate-100/50 dark:bg-slate-900/50 rounded-2xl border-2 border-(--glass-border) shadow-inner">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Target Profile</span>
                                <span className="text-sm font-black text-amber-600 dark:text-amber-500 uppercase tracking-widest px-3 py-1 bg-amber-500/10 rounded-lg">ISOLIR</span>
                            </div>
                            <div className="flex justify-between items-center p-6 bg-slate-100/50 dark:bg-slate-900/50 rounded-2xl border-2 border-(--glass-border) shadow-inner">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Grace Period</span>
                                <span className="text-sm font-black text-primary uppercase tracking-widest px-3 py-1 bg-slate-200 dark:bg-white/10 rounded-lg">Hard Cut</span>
                            </div>
                            <div className="mt-8 p-6 bg-indigo-500/5 dark:bg-indigo-500/10 border-l-8 border-indigo-500 rounded-r-3xl shadow-sm">
                                <p className="text-[11px] leading-relaxed text-indigo-600 dark:text-indigo-300 font-black uppercase tracking-widest italic">
                                    System Verification Required: Ensure PPP Profile <span className="text-primary font-black">"ISOLIR"</span> exists in all active gateway nodes.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
