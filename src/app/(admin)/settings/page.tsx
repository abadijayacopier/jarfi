'use client';

import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { 
    Settings, Building2, Save, RefreshCw, CheckCircle2, AlertCircle, FileCheck,
    CreditCard, Printer, History, Send, MessageCircle, Landmark, Smartphone
} from 'lucide-react';

interface SettingsState {
    [key: string]: string;
}

const defaultSettings: SettingsState = {
    company_name: '',
    company_address: '',
    company_email: '',
    company_whatsapp: '',
    tax_enabled: '0',
    auto_isolate: '1',
    payment_method: 'transfer',
    bank_name: '',
    bank_account: '',
    bank_holder: '',
    printer_type: 'thermal',
    printer_width: '80',
    telegram_enabled: '0',
    telegram_bot_token: '',
    telegram_chat_id: '',
    wa_api_enabled: '0',
    wa_api_url: '',
    wa_api_token: '',
};

export default function SettingsPage() {
    const [settings, setSettings] = useState<SettingsState>(defaultSettings);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('identity');
    const [logs, setLogs] = useState<any[]>([]);

    useEffect(() => { 
        fetchSettings(); 
        fetchLogs();
        const interval = setInterval(fetchLogs, 5000);
        return () => clearInterval(interval);
    }, []);

    const fetchLogs = async () => {
        try {
            const res = await fetch('/api/activity-logs');
            const data = await res.json();
            if (res.ok) setLogs(data.logs);
        } catch (e) {}
    };

    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/settings');
            const data = await res.json();
            if (res.ok) setSettings({ ...defaultSettings, ...data.settings });
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const handleSave = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            });
            if (res.ok) {
                Swal.fire({ icon: 'success', title: 'Tersimpan!', text: 'Pengaturan berhasil diperbarui.', background: '#1e293b', color: '#fff', timer: 1500, showConfirmButton: false });
                // Log the activity
                await fetch('/api/activity-logs', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'Pengaturan Diperbarui',
                        description: `User memperbarui pengaturan ${activeTab}`,
                        color: 'text-indigo-400'
                    })
                });
                fetchLogs();
            } else {
                Swal.fire({ icon: 'error', title: 'Gagal!', text: 'Gagal menyimpan pengaturan.', background: '#1e293b', color: '#fff' });
            }
        } catch (err) { console.error(err); }
        finally { setSaving(false); }
    };

    const toggleSetting = (key: string) => {
        const newVal = settings[key] === '1' ? '0' : '1';
        setSettings(prev => ({ ...prev, [key]: newVal }));
        // Auto-save toggle
        fetch('/api/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ [key]: newVal }) });
    };

    const updateField = (key: string, val: string) => setSettings(prev => ({ ...prev, [key]: val }));

    const tabs = [
        { id: 'identity', label: 'Profil ISP', icon: Building2 },
        { id: 'billing', label: 'Tagihan & Bank', icon: CreditCard },
        { id: 'integrations', label: 'Integrasi API', icon: Send },
        { id: 'system', label: 'Sistem', icon: Settings },
    ];

    // Input field component
    const Field = ({ label, field, type = 'text', placeholder = '', prefix = '' }: any) => (
        <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1">{label}</label>
            <div className="relative">
                {prefix && <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm">{prefix}</span>}
                <input
                    type={type}
                    value={settings[field] || ''}
                    onChange={(e) => updateField(field, e.target.value)}
                    placeholder={placeholder}
                    className={`w-full bg-slate-900/40 border border-white/10 text-white rounded-2xl ${prefix ? 'pl-14' : 'px-5'} py-4 focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 shadow-inner transition-all font-bold placeholder:text-slate-700`}
                />
            </div>
        </div>
    );

    const Toggle = ({ label, desc, field, color = 'indigo' }: any) => {
        const isOn = settings[field] === '1';
        const colorMap: any = {
            indigo: { bg: 'bg-indigo-600', icon: 'bg-indigo-500/20 text-indigo-400', glow: 'shadow-[0_0_10px_rgba(99,102,241,0.5)]' },
            teal: { bg: 'bg-teal-500', icon: 'bg-teal-500/20 text-teal-400', glow: 'shadow-[0_0_10px_rgba(20,184,166,0.5)]' },
            blue: { bg: 'bg-blue-500', icon: 'bg-blue-500/20 text-blue-400', glow: 'shadow-[0_0_10px_rgba(59,130,246,0.5)]' },
        };
        const c = colorMap[color] || colorMap.indigo;
        return (
            <div onClick={() => toggleSetting(field)} className="flex items-center justify-between p-5 bg-slate-950/40 rounded-2xl border border-white/5 cursor-pointer hover:bg-slate-900/60 transition-all active:scale-[0.98]">
                <div className="flex gap-4 items-center">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-500 ${isOn ? c.icon : 'bg-slate-800 text-slate-600'}`}>
                        <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="font-black text-white text-sm">{label}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5 font-bold">{desc}</p>
                    </div>
                </div>
                <div className={`w-12 h-6 rounded-full relative transition-all duration-500 shrink-0 ml-4 ${isOn ? `${c.bg} ${c.glow}` : 'bg-slate-700'}`}>
                    <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all duration-500 shadow-lg ${isOn ? 'right-0.5' : 'left-0.5'}`}></div>
                </div>
            </div>
        );
    };

    if (loading) return (
        <div className="animate-in fade-in duration-500 pb-10">
            <div className="p-32 text-center">
                <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-slate-500 uppercase font-black text-xs tracking-widest animate-pulse">Memuat Pengaturan...</p>
            </div>
        </div>
    );

    return (
        <div className="animate-in fade-in duration-500 pb-10">
            {/* Page Header */}
            <div className="mb-8 border-b border-white/5 pb-4">
                <h3 className="text-3xl font-bold text-white flex items-center gap-3">
                    <Settings className="w-8 h-8 text-indigo-400" />
                    Pengaturan Sistem ISP
                </h3>
                <p className="text-slate-400 mt-1">Konfigurasi identitas, pembayaran, integrasi, dan pengaturan sistem.</p>
            </div>

            {/* Tabs Navigation */}
            <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
                {tabs.map(tab => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2.5 px-6 py-3.5 rounded-2xl font-black text-sm whitespace-nowrap transition-all ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' : 'glass border border-white/10 text-slate-400 hover:text-white hover:bg-white/5'}`}
                        >
                            <Icon className="w-5 h-5" />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* TAB: Identity */}
            {activeTab === 'identity' && (
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start animate-in fade-in duration-300">
                    <div className="xl:col-span-2">
                        <div className="glass p-8 lg:p-10 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden">
                            <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl"></div>
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20"><Building2 className="w-6 h-6" /></div>
                                <div>
                                    <h4 className="text-xl font-black text-white">Profil Perusahaan</h4>
                                    <p className="text-xs text-slate-400 font-bold">Muncul pada Invoice, Voucher, dan semua dokumen</p>
                                </div>
                            </div>
                            <form onSubmit={handleSave} className="space-y-6 relative z-10">
                                <Field label="Nama Brand / Perusahaan" field="company_name" placeholder="Contoh: JARFI Networks" />
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1">Alamat Kantor Pusat</label>
                                    <textarea rows={3} value={settings.company_address} onChange={(e) => updateField('company_address', e.target.value)} placeholder="Masukkan alamat lengkap..." className="w-full bg-slate-900/40 border border-white/10 text-white rounded-2xl px-5 py-4 focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 shadow-inner transition-all font-medium placeholder:text-slate-700"></textarea>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Field label="Email Support" field="company_email" type="email" />
                                    <Field label="WhatsApp Business" field="company_whatsapp" prefix="+62" />
                                </div>
                                <button type="submit" disabled={saving} className="w-full py-4.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black shadow-xl shadow-indigo-600/20 transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50 uppercase tracking-widest text-xs">
                                    {saving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                    Simpan Identitas
                                </button>
                            </form>
                        </div>
                    </div>
                    <div className="space-y-8">
                        {/* Logo */}
                        <div className="glass p-8 rounded-3xl border border-white/10 text-center flex flex-col items-center shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-indigo-500 to-blue-500"></div>
                            <h4 className="text-xs font-black text-white mb-6 uppercase tracking-[0.2em]">Logo Perusahaan</h4>
                            <div className="w-36 h-36 bg-slate-950 rounded-3xl border-2 border-dashed border-slate-800 mb-5 flex items-center justify-center cursor-pointer hover:border-indigo-500 transition-all duration-500 relative overflow-hidden group/logo">
                                <span className="text-6xl font-black bg-linear-to-br from-indigo-400 to-blue-600 bg-clip-text text-transparent group-hover/logo:scale-110 transition-transform duration-500">
                                    {(settings.company_name || 'J').charAt(0).toUpperCase()}
                                </span>
                                <div className="absolute inset-0 bg-indigo-600/90 opacity-0 group-hover/logo:opacity-100 flex flex-col items-center justify-center transition-all duration-300">
                                    <Smartphone className="w-8 h-8 text-white mb-1" />
                                    <span className="text-white text-[10px] font-black uppercase tracking-widest">Ganti</span>
                                </div>
                            </div>
                            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-tight">Muncul pada Invoice & Vouchers</p>
                        </div>
                        {/* Automation Toggles */}
                        <div className="glass p-6 rounded-3xl border border-white/10 shadow-2xl">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-400 border border-teal-500/20"><FileCheck className="w-5 h-5" /></div>
                                <h4 className="text-lg font-black text-white">Otomatisasi</h4>
                            </div>
                            <div className="space-y-3">
                                <Toggle label="Pajak PPN 11%" desc="Otomatis pada tagihan" field="tax_enabled" color="indigo" />
                                <Toggle label="Auto Isolir" desc="Lewat jatuh tempo 3 hari" field="auto_isolate" color="teal" />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB: Billing & Bank */}
            {activeTab === 'billing' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-300">
                    {/* Payment Method */}
                    <div className="glass p-8 rounded-3xl border border-white/10 shadow-2xl">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20"><CreditCard className="w-6 h-6" /></div>
                            <div>
                                <h4 className="text-xl font-black text-white">Metode Pembayaran</h4>
                                <p className="text-xs text-slate-400 font-bold">Ditampilkan pada invoice pelanggan</p>
                            </div>
                        </div>
                        <div className="space-y-4 mb-6">
                            {['transfer', 'cod', 'ewallet'].map(method => (
                                <div key={method} onClick={() => updateField('payment_method', method)} className={`p-4 rounded-2xl border cursor-pointer transition-all active:scale-[0.98] ${settings.payment_method === method ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-white/5 bg-slate-950/30 hover:bg-slate-900/50'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${settings.payment_method === method ? 'border-emerald-400' : 'border-slate-600'}`}>
                                            {settings.payment_method === method && <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>}
                                        </div>
                                        <span className="font-black text-white text-sm">{method === 'transfer' ? 'Transfer Bank' : method === 'cod' ? 'Bayar Langsung (COD)' : 'E-Wallet (QRIS/Dana/OVO)'}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    {/* Bank Account */}
                    <div className="glass p-8 rounded-3xl border border-white/10 shadow-2xl">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/20"><Landmark className="w-6 h-6" /></div>
                            <div>
                                <h4 className="text-xl font-black text-white">Rekening Bank</h4>
                                <p className="text-xs text-slate-400 font-bold">Informasi transfer untuk pelanggan</p>
                            </div>
                        </div>
                        <div className="space-y-5">
                            <Field label="Nama Bank" field="bank_name" placeholder="BCA / BRI / Mandiri" />
                            <Field label="Nomor Rekening" field="bank_account" placeholder="1234567890" />
                            <Field label="Atas Nama" field="bank_holder" placeholder="PT. ISP Anda" />
                        </div>
                    </div>
                    {/* Printer */}
                    <div className="glass p-8 rounded-3xl border border-white/10 shadow-2xl lg:col-span-2">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 rounded-2xl bg-sky-500/10 flex items-center justify-center text-sky-400 border border-sky-500/20"><Printer className="w-6 h-6" /></div>
                            <div>
                                <h4 className="text-xl font-black text-white">Pengaturan Printer</h4>
                                <p className="text-xs text-slate-400 font-bold">Konfigurasi jenis dan ukuran kertas</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1">Tipe Printer</label>
                                <select value={settings.printer_type} onChange={(e) => updateField('printer_type', e.target.value)} className="w-full bg-slate-900/40 border border-white/10 text-white rounded-2xl px-5 py-4 focus:outline-none focus:border-sky-500/50 shadow-inner transition-all font-bold">
                                    <option value="thermal">Thermal (Struk)</option>
                                    <option value="inkjet">Inkjet / Laser (A4)</option>
                                    <option value="dotmatrix">Dot Matrix</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1">Lebar Kertas (mm)</label>
                                <select value={settings.printer_width} onChange={(e) => updateField('printer_width', e.target.value)} className="w-full bg-slate-900/40 border border-white/10 text-white rounded-2xl px-5 py-4 focus:outline-none focus:border-sky-500/50 shadow-inner transition-all font-bold">
                                    <option value="58">58mm</option>
                                    <option value="80">80mm</option>
                                    <option value="210">A4 (210mm)</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div className="lg:col-span-2">
                        <button onClick={handleSave} disabled={saving} className="w-full py-4.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black shadow-xl shadow-indigo-600/20 transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50 uppercase tracking-widest text-xs">
                            {saving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                            Simpan Pengaturan Tagihan
                        </button>
                    </div>
                </div>
            )}

            {/* TAB: Integrations */}
            {activeTab === 'integrations' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-300">
                    {/* Telegram */}
                    <div className="glass p-8 rounded-3xl border border-white/10 shadow-2xl">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20"><Send className="w-6 h-6" /></div>
                                <div>
                                    <h4 className="text-xl font-black text-white">Telegram Bot</h4>
                                    <p className="text-xs text-slate-400 font-bold">Notifikasi pembayaran & tagihan</p>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-5">
                            <Toggle label="Aktifkan Telegram" desc="Kirim notifikasi otomatis" field="telegram_enabled" color="blue" />
                            <Field label="Bot Token" field="telegram_bot_token" placeholder="123456:ABC-DEF1234ghIkl..." />
                            <Field label="Chat ID" field="telegram_chat_id" placeholder="-1001234567890" />
                        </div>
                    </div>
                    {/* WhatsApp API */}
                    <div className="glass p-8 rounded-3xl border border-white/10 shadow-2xl">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20"><MessageCircle className="w-6 h-6" /></div>
                                <div>
                                    <h4 className="text-xl font-black text-white">WhatsApp API</h4>
                                    <p className="text-xs text-slate-400 font-bold">Blast tagihan ke pelanggan</p>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-5">
                            <Toggle label="Aktifkan WA API" desc="Fonnte / WaBlas / WAPI" field="wa_api_enabled" color="teal" />
                            <Field label="API Gateway URL" field="wa_api_url" placeholder="https://api.fonnte.com/send" />
                            <Field label="API Token / Key" field="wa_api_token" placeholder="Token autentikasi dari provider" type="password" />
                        </div>
                    </div>
                    <div className="lg:col-span-2">
                        <button onClick={handleSave} disabled={saving} className="w-full py-4.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black shadow-xl shadow-indigo-600/20 transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50 uppercase tracking-widest text-xs">
                            {saving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                            Simpan Integrasi
                        </button>
                    </div>
                </div>
            )}

            {/* TAB: System */}
            {activeTab === 'system' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-300">
                    {/* Activity Log */}
                    <div className="glass p-8 rounded-3xl border border-white/10 shadow-2xl lg:col-span-2">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 rounded-2xl bg-violet-500/10 flex items-center justify-center text-violet-400 border border-violet-500/20"><History className="w-6 h-6" /></div>
                            <div>
                                <h4 className="text-xl font-black text-white">Log Aktivitas Terakhir</h4>
                                <p className="text-xs text-slate-400 font-bold">Riwayat perubahan pengaturan sistem</p>
                            </div>
                        </div>
                        <div className="space-y-3">
                            {logs.length === 0 ? (
                                <div className="text-center py-10 text-slate-600 italic text-xs uppercase tracking-widest animate-pulse">Belum ada aktivitas tercatat...</div>
                            ) : (
                                logs.map((log: any) => (
                                    <div key={log.id} className="flex items-center gap-4 p-4 bg-slate-950/30 rounded-2xl border border-white/5 group hover:border-white/10 transition-all">
                                        <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${log.color.replace('text-', 'bg-')} shadow-[0_0_10px_currentColor]`}></div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-white text-sm truncate">{log.action}</p>
                                            <p className="text-[10px] text-slate-500 font-medium truncate">{log.description}</p>
                                        </div>
                                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-tight whitespace-nowrap bg-white/5 px-2 py-1 rounded-lg border border-white/5">
                                            {new Date(log.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
