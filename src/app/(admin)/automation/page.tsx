'use client';

import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { Zap, Bell, ShieldAlert, ShieldCheck, MessageSquare, Play, Settings, Info, RefreshCw, Smartphone, ChevronRight, Activity, Cpu, Globe, Lock } from 'lucide-react';

export default function AutomationPage() {
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState<any>(null);
    const [waSettings, setWaSettings] = useState({
        wa_api_key: '',
        wa_api_url: 'https://api.fonnte.com/send',
        isolir_message_template: 'Halo {name}, koneksi internet Anda terisolir karena tunggakan bulan {month}. Total: {amount}. Silakan bayar agar aktif kembali.',
        payment_message_template: 'Terika kasih {name}, pembayaran {month} sebesar {amount} telah diterima. Koneksi aktif kembali.'
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
            title: 'Initialize Autonomous Cycle?',
            text: "System will audit balances, execute isolation for overdue subscribers, and dispatch WhatsApp notifications.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#10b981',
            confirmButtonText: 'Initialize Cycle',
            background: '#0f172a',
            color: '#fff'
        });

        if (result.isConfirmed) {
            setLoading(true);
            Swal.fire({
                title: 'Orchestrating...',
                text: 'Synchronizing with gateway matrix...',
                allowOutsideClick: false,
                background: '#0f172a',
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
                        title: 'Cycle Complete',
                        html: `
                            <div class="text-left text-xs space-y-4 mt-6 p-6 bg-white/5 rounded-3xl border border-white/10">
                                <p class="flex items-center justify-between font-bold"><span>New Invoices</span> <b class="text-accent text-lg">${data.results.invoices_generated}</b></p>
                                <p class="flex items-center justify-between font-bold"><span>Isolated Nodes</span> <b class="text-amber-500 text-lg">${data.results.users_isolated}</b></p>
                                <p class="flex items-center justify-between font-bold"><span>Notifications</span> <b class="text-accent text-lg">${data.results.notifications_sent}</b></p>
                                ${data.results.errors.length > 0 ? `<p class="text-red-400 pt-2 border-t border-white/10">Faults detected: ${data.results.errors.length}</p>` : ''}
                            </div>
                        `,
                        background: '#0f172a',
                        color: '#fff'
                    });
                } else {
                    Swal.fire({ icon: 'error', title: 'Cycle Fault', text: data.error, background: '#0f172a', color: '#fff' });
                }
            } catch (err) {
                Swal.fire({ icon: 'error', title: 'API Error', text: 'Infrastructure link failure.', background: '#0f172a', color: '#fff' });
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
                Swal.fire({ icon: 'success', title: 'Committed', text: 'Automation parameters updated.', background: '#0f172a', color: '#fff' });
            }
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Fault', text: 'Failed to commit settings.', background: '#0f172a', color: '#fff' });
        }
    };

    return (
        <div className="animate-in fade-in duration-500 pb-20 space-y-12">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-16 border-b border-(--glass-border) pb-10">
                <div className="space-y-2">
                    <h3 className="text-4xl font-bold text-primary flex items-center gap-5 tracking-tight">
                        <Zap className="w-10 h-10 text-accent fill-accent/5" />
                        Autonomous Intelligence
                    </h3>
                    <p className="text-muted font-medium text-lg">Orchestrating Billing Cycles, Auto-Isolation, & Smart Notifications.</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="px-5 py-2.5 rounded-xl bg-accent/5 border border-accent/10 text-accent flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-accent animate-pulse"></div>
                        <span className="text-[10px] font-bold uppercase tracking-widest">Engine Nominal</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Main Action Card */}
                <div className="lg:col-span-2 space-y-12">
                    <div className="glass p-12 rounded-4xl relative overflow-hidden group shadow-xl border border-(--glass-border) bg-white/2">
                        <div className="absolute -right-40 -top-40 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[100px] pointer-events-none transition-all duration-700"></div>

                        <div className="relative z-10">
                            <div className="flex flex-col md:flex-row items-start md:items-center gap-8 mb-12">
                                <div className="w-20 h-20 rounded-3xl bg-accent/5 flex items-center justify-center text-accent border border-accent/10 shadow-inner group-hover:scale-110 transition-all duration-500">
                                    <Cpu className="w-10 h-10" />
                                </div>
                                <div>
                                    <h4 className="text-2xl font-bold text-primary tracking-tight">Cycle Synchronization</h4>
                                    <p className="text-slate-500 font-medium mt-1">Audit subscriber matrix and execute mass isolation protocol.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                                <div className="bg-white/1 p-8 rounded-3xl border border-white/5 shadow-inner transition-all">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">Integrity</p>
                                    <div className="font-bold text-accent flex items-center gap-3 uppercase tracking-widest">
                                        Verified
                                    </div>
                                </div>
                                <div className="bg-white/1 p-8 rounded-3xl border border-white/5 shadow-inner transition-all">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">State</p>
                                    <p className="font-bold text-primary uppercase tracking-widest">Standby</p>
                                </div>
                                <div className="bg-white/1 p-8 rounded-3xl border border-white/5 shadow-inner transition-all">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">Protocol</p>
                                    <p className="font-bold text-accent uppercase tracking-widest">REST/API</p>
                                </div>
                            </div>

                            <button
                                onClick={handleRunAutomation}
                                disabled={loading}
                                className="w-full py-6 rounded-3xl bg-accent hover:bg-accent/90 text-white font-bold uppercase tracking-widest text-[11px] transition-all shadow-xl active:scale-95 flex items-center justify-center gap-4 disabled:opacity-50"
                            >
                                {loading ? <RefreshCw className="w-6 h-6 animate-spin" /> : <Zap className="w-6 h-6 fill-current" />}
                                {loading ? 'Orchestrating Cycle...' : 'Execute Autonomous Sequence'}
                            </button>

                            <div className="mt-10 flex items-start gap-6 bg-accent/5 border border-accent/10 p-8 rounded-3xl">
                                <Info className="w-5 h-5 text-accent shrink-0 mt-1" />
                                <div className="text-xs text-muted leading-relaxed font-medium">
                                    Autonomous process: <span className="text-primary font-bold">1.</span> Invoicing audit.
                                    <span className="text-primary font-bold"> 2.</span> Gateway policy enforcement.
                                    <span className="text-primary font-bold"> 3.</span> Multi-channel notification dispatch via <span className="px-2 py-0.5 bg-accent/10 text-accent rounded text-[9px] font-bold tracking-widest uppercase">FONNTE</span> API.
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="glass p-12 rounded-4xl shadow-xl border border-(--glass-border) bg-white/2 relative">
                        <div className="flex items-center gap-6 mb-12">
                            <div className="w-16 h-16 rounded-2xl bg-accent/5 flex items-center justify-center text-accent border border-accent/10 shadow-inner">
                                <MessageSquare className="w-8 h-8" />
                            </div>
                            <div>
                                <h4 className="text-2xl font-bold text-primary tracking-tight">Notification Matrix</h4>
                                <p className="text-[10px] text-muted font-bold tracking-widest uppercase mt-1">Smart WhatsApp Message Templates</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-12">
                            <div className="space-y-4">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Isolation Template</label>
                                <textarea
                                    value={waSettings.isolir_message_template}
                                    onChange={(e) => setWaSettings({ ...waSettings, isolir_message_template: e.target.value })}
                                    className="w-full clean-input min-h-[140px] py-6 px-8 text-base font-medium leading-relaxed"
                                />
                                <div className="flex flex-wrap gap-2 mt-4 ml-1">
                                    {['{name}', '{month}', '{amount}'].map(tag => (
                                        <span key={tag} className="px-3 py-1 bg-white/5 border border-white/5 rounded-lg text-[9px] font-mono font-bold text-accent uppercase tracking-widest">{tag}</span>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-4">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Confirmation Template</label>
                                <textarea
                                    value={waSettings.payment_message_template}
                                    onChange={(e) => setWaSettings({ ...waSettings, payment_message_template: e.target.value })}
                                    className="w-full clean-input min-h-[140px] py-6 px-8 text-base font-medium leading-relaxed"
                                />
                            </div>
                            <button
                                onClick={saveSettings}
                                className="w-fit px-12 py-4 bg-accent hover:bg-accent/90 text-white rounded-2xl font-bold uppercase tracking-widest text-[10px] transition-all shadow-lg active:scale-95"
                            >
                                Commit Matrix
                            </button>
                        </div>
                    </div>
                </div>

                {/* Sidebar Settings */}
                <div className="space-y-12">
                    <div className="glass p-10 rounded-4xl group overflow-hidden relative shadow-xl border border-(--glass-border) bg-accent/5">
                        <div className="absolute -right-16 -bottom-16 p-12 opacity-[0.03] transition-all duration-700">
                            <Smartphone className="w-56 h-56 text-accent" />
                        </div>
                        <div className="flex items-center gap-5 mb-10 relative z-10">
                            <div className="w-14 h-14 rounded-2xl bg-accent/5 flex items-center justify-center text-accent border border-accent/10 shadow-inner">
                                <Globe className="w-7 h-7" />
                            </div>
                            <h4 className="text-xl font-bold text-primary tracking-tight">Hub Matrix</h4>
                        </div>
                        <div className="space-y-8 relative z-10">
                            <p className="text-[13px] text-slate-500 leading-relaxed font-medium">
                                Synchronize hardware device with Fonnte for multi-threaded notification transmission.
                            </p>
                            <a
                                href="https://web.whatsapp.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full py-4 bg-accent hover:bg-accent/90 text-white rounded-2xl font-bold uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-3 active:scale-95 shadow-lg"
                            >
                                <Smartphone className="w-5 h-5" />
                                Handshake Device
                            </a>
                        </div>
                    </div>

                    <div className="glass p-10 rounded-4xl shadow-xl border border-(--glass-border) bg-white/2">
                        <div className="flex items-center gap-5 mb-10">
                            <div className="w-14 h-14 rounded-2xl bg-accent/5 flex items-center justify-center text-accent border border-accent/10 shadow-inner">
                                <Settings className="w-7 h-7" />
                            </div>
                            <h4 className="text-xl font-bold text-primary tracking-tight">API Interface</h4>
                        </div>
                        <div className="space-y-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block ml-1">Service Vector</label>
                                <input
                                    type="text"
                                    value={waSettings.wa_api_url}
                                    onChange={(e) => setWaSettings({ ...waSettings, wa_api_url: e.target.value })}
                                    className="w-full clean-input text-[11px] font-mono py-4 px-6 font-bold"
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block ml-1">Auth Secret</label>
                                <input
                                    type="password"
                                    value={waSettings.wa_api_key}
                                    onChange={(e) => setWaSettings({ ...waSettings, wa_api_key: e.target.value })}
                                    placeholder="Enter API Key"
                                    className="w-full clean-input text-[11px] font-mono py-4 px-6 font-bold"
                                />
                            </div>
                            <button
                                onClick={saveSettings}
                                className="w-full py-4 bg-accent/5 text-accent border border-accent/10 rounded-2xl font-bold uppercase tracking-widest text-[10px] hover:bg-accent hover:text-white transition-all"
                            >
                                Comm Link
                            </button>
                        </div>
                    </div>

                    <div className="glass p-10 rounded-4xl shadow-xl border border-(--glass-border) bg-white/2">
                        <div className="flex items-center gap-5 mb-10">
                            <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-slate-500 border border-white/10">
                                <Lock className="w-7 h-7" />
                            </div>
                            <h4 className="text-xl font-bold text-primary tracking-tight">Policy Logic</h4>
                        </div>
                        <div className="space-y-6">
                            <div className="flex justify-between items-center p-5 bg-white/1 rounded-2xl border border-white/5 shadow-inner">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Profile Vector</span>
                                <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest px-3 py-1 bg-amber-500/5 rounded-lg border border-amber-500/10">ISOLIR</span>
                            </div>
                            <div className="flex justify-between items-center p-5 bg-white/1 rounded-2xl border border-white/5 shadow-inner">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Protocol</span>
                                <span className="text-[10px] font-bold text-primary uppercase tracking-widest px-3 py-1 bg-white/5 rounded-lg border border-white/10">HARD-CUT</span>
                            </div>
                            <div className="mt-8 p-6 bg-accent/5 border-l-4 border-accent rounded-r-3xl">
                                <p className="text-[11px] leading-relaxed text-slate-500 font-bold uppercase tracking-widest italic opacity-60">
                                    Audit Warning: Profile "ISOLIR" must be established in gateway nodes for enforcement.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
