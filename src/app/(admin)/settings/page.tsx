'use client';

import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { 
    Settings, Building2, Save, RefreshCw, CheckCircle2, AlertCircle, FileCheck,
    CreditCard, Printer, History, Send, MessageCircle, Landmark, Smartphone, Info
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
                    className={`w-full clean-input ${prefix ? 'pl-14' : ''} py-4`}
                />
            </div>
        </div>
    );

    const Toggle = ({ label, desc, field, color = 'indigo' }: any) => {
        const isOn = settings[field] === '1';
        const colorMap: any = {
            indigo: { bg: 'bg-indigo-600', icon: 'bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400', glow: 'shadow-lg shadow-indigo-500/20' },
            teal: { bg: 'bg-teal-500', icon: 'bg-teal-500/10 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400', glow: 'shadow-lg shadow-teal-500/20' },
            blue: { bg: 'bg-blue-500', icon: 'bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400', glow: 'shadow-lg shadow-blue-500/20' },
        };
        const c = colorMap[color] || colorMap.indigo;
        return (
            <div onClick={() => toggleSetting(field)} className="flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-(--glass-border) cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-900/60 transition-all active:scale-[0.98]">
                <div className="flex gap-4 items-center">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-500 ${isOn ? c.icon : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600'}`}>
                        <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="font-black text-primary text-sm">{label}</p>
                        <p className="text-[10px] text-muted mt-0.5 font-bold">{desc}</p>
                    </div>
                </div>
                <div className={`w-12 h-6 rounded-full relative transition-all duration-500 shrink-0 ml-4 ${isOn ? `${c.bg} ${c.glow}` : 'bg-slate-300 dark:bg-slate-700'}`}>
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
        <div className="animate-in fade-in duration-500 pb-20 space-y-10">
            {/* Page Header */}
            <div className="mb-12 border-b border-(--glass-border) pb-8">
                <h3 className="text-4xl font-black text-primary flex items-center gap-4">
                    <Settings className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                    Pengaturan Sistem ISP
                </h3>
                <p className="text-muted font-medium mt-2">Konfigurasi identitas, pembayaran, integrasi, dan pengaturan sistem.</p>
            </div>

            {/* Tabs Navigation */}
            <div className="flex gap-3 mb-12 overflow-x-auto pb-4 scrollbar-hide">
                {tabs.map(tab => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-3 px-8 py-4.5 rounded-3xl font-black text-sm whitespace-nowrap transition-all active:scale-95 ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' : 'glass border border-(--glass-border) text-slate-500 hover:text-primary hover:bg-slate-100 dark:hover:bg-white/5'}`}
                        >
                            <Icon className="w-5 h-5" />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* TAB: Identity */}
            {activeTab === 'identity' && (
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-10 items-start animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="xl:col-span-2">
                        <div className="glass p-10 lg:p-12 rounded-[2.5rem] border border-(--glass-border) shadow-xl relative overflow-hidden">
                            <div className="absolute -top-32 -right-32 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl"></div>
                            <div className="flex items-center gap-5 mb-10">
                                <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shadow-inner"><Building2 className="w-7 h-7" /></div>
                                <div>
                                    <h4 className="text-2xl font-black text-primary">Profil Perusahaan</h4>
                                    <p className="text-xs text-muted font-bold uppercase tracking-widest mt-1">Muncul pada Invoice, Voucher, dan semua dokumen</p>
                                </div>
                            </div>
                            <form onSubmit={handleSave} className="space-y-8 relative z-10">
                                <Field label="Nama Brand / Perusahaan" field="company_name" placeholder="Contoh: JARFI Networks" />
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 ml-1">Alamat Kantor Pusat</label>
                                    <textarea rows={4} value={settings.company_address} onChange={(e) => updateField('company_address', e.target.value)} placeholder="Masukkan alamat lengkap..." className="w-full clean-input resize-none py-5 px-6"></textarea>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <Field label="Email Support" field="company_email" type="email" />
                                    <Field label="WhatsApp Business" field="company_whatsapp" prefix="+62" />
                                </div>
                                <button type="submit" disabled={saving} className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-3xl font-black shadow-xl shadow-indigo-600/20 transition-all flex items-center justify-center gap-4 active:scale-[0.98] disabled:opacity-50 uppercase tracking-[0.2em] text-xs">
                                    {saving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                    Simpan Identitas
                                </button>
                            </form>
                        </div>
                    </div>
                    <div className="space-y-10">
                        {/* Logo */}
                        <div className="glass p-10 rounded-[2.5rem] text-center flex flex-col items-center shadow-xl border border-(--glass-border) relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-full h-1.5 bg-linear-to-r from-indigo-600 to-blue-600"></div>
                            <h4 className="text-[10px] font-black text-primary mb-8 uppercase tracking-[0.3em]">Logo Perusahaan</h4>
                            <div className="w-44 h-44 bg-slate-50 dark:bg-slate-950 rounded-4xl border-2 border-dashed border-slate-200 dark:border-slate-800 mb-6 flex items-center justify-center cursor-pointer hover:border-indigo-500 transition-all duration-700 relative overflow-hidden group/logo shadow-inner">
                                <span className="text-7xl font-black bg-linear-to-br from-indigo-600 to-blue-600 dark:from-indigo-400 dark:to-blue-600 bg-clip-text text-transparent group-hover/logo:scale-110 transition-transform duration-700">
                                    {(settings.company_name || 'J').charAt(0).toUpperCase()}
                                </span>
                                <div className="absolute inset-0 bg-indigo-600/90 opacity-0 group-hover/logo:opacity-100 flex flex-col items-center justify-center transition-all duration-500">
                                    <Smartphone className="w-10 h-10 text-white mb-2" />
                                    <span className="text-white text-[10px] font-black uppercase tracking-widest">Ganti Logo</span>
                                </div>
                            </div>
                            <p className="text-muted text-[10px] font-bold uppercase tracking-widest">Muncul pada Invoice & Vouchers</p>
                        </div>
                        {/* Automation Toggles */}
                        <div className="glass p-10 rounded-[2.5rem] shadow-xl border border-(--glass-border)">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 rounded-2xl bg-teal-500/10 flex items-center justify-center text-teal-600 dark:text-teal-400 border border-teal-500/20 shadow-inner"><FileCheck className="w-6 h-6" /></div>
                                <h4 className="text-xl font-black text-primary">Otomatisasi</h4>
                            </div>
                            <div className="space-y-4">
                                <Toggle label="Pajak PPN 11%" desc="Otomatis pada tagihan" field="tax_enabled" color="indigo" />
                                <Toggle label="Auto Isolir" desc="Lewat jatuh tempo 3 hari" field="auto_isolate" color="teal" />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB: Billing & Bank */}
            {activeTab === 'billing' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Payment Method */}
                    <div className="glass p-10 rounded-[2.5rem] border border-(--glass-border) shadow-xl">
                        <div className="flex items-center gap-5 mb-10">
                            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-inner"><CreditCard className="w-7 h-7" /></div>
                            <div>
                                <h4 className="text-2xl font-black text-primary">Metode Pembayaran</h4>
                                <p className="text-xs text-muted font-bold uppercase tracking-widest mt-1">Ditampilkan pada invoice pelanggan</p>
                            </div>
                        </div>
                        <div className="space-y-5 mb-8">
                            {['transfer', 'cod', 'ewallet'].map(method => (
                                <div key={method} onClick={() => updateField('payment_method', method)} className={`p-6 rounded-3xl border-2 cursor-pointer transition-all active:scale-[0.98] ${settings.payment_method === method ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-(--glass-border) bg-slate-50 dark:bg-slate-950/30 hover:bg-slate-100 dark:hover:bg-slate-900/50'}`}>
                                    <div className="flex items-center gap-4">
                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${settings.payment_method === method ? 'border-emerald-500 bg-emerald-500' : 'border-slate-400'}`}>
                                            {settings.payment_method === method && <div className="w-2.5 h-2.5 rounded-full bg-white"></div>}
                                        </div>
                                        <span className={`font-black text-sm ${settings.payment_method === method ? 'text-primary' : 'text-slate-500'}`}>{method === 'transfer' ? 'Transfer Bank' : method === 'cod' ? 'Bayar Langsung (COD)' : 'E-Wallet (QRIS/Dana/OVO)'}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    {/* Bank Account / Payment Details */}
                    <div className="glass p-10 rounded-[2.5rem] border border-(--glass-border) shadow-xl relative overflow-hidden group">
                        <div className="absolute -right-20 -top-20 p-20 opacity-[0.03] group-hover:opacity-[0.1] transition-opacity duration-700">
                            <Landmark className="w-56 h-56 text-amber-500" />
                        </div>
                        <div className="flex items-center gap-5 mb-10 relative z-10">
                            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 border border-amber-500/20 shadow-inner"><Landmark className="w-7 h-7" /></div>
                            <div>
                                <h4 className="text-2xl font-black text-primary">
                                    {settings.payment_method === 'ewallet' ? 'Detail E-Wallet' : settings.payment_method === 'cod' ? 'Detail COD' : 'Rekening Bank'}
                                </h4>
                                <p className="text-xs text-muted font-bold uppercase tracking-widest mt-1">Informasi pembayaran untuk pelanggan</p>
                            </div>
                        </div>
                        
                        <div className="space-y-6 relative z-10">
                            {settings.payment_method === 'cod' ? (
                                <div className="p-10 bg-slate-50 dark:bg-slate-900/40 border border-dashed border-(--glass-border) rounded-4xl text-center shadow-inner">
                                    <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-amber-600 dark:text-amber-400">
                                        <History className="w-10 h-10" />
                                    </div>
                                    <p className="font-black mb-2">Metode COD Terpilih</p>
                                    <p className="text-xs text-muted font-medium uppercase tracking-tight">Pelanggan akan diarahkan untuk membayar langsung ke kantor atau teknisi terdekat.</p>
                                </div>
                            ) : (
                                <>
                                    <Field 
                                        label={settings.payment_method === 'ewallet' ? 'Nama E-Wallet' : 'Nama Bank'} 
                                        field="bank_name" 
                                        placeholder={settings.payment_method === 'ewallet' ? 'DANA / OVO / GoPay / QRIS' : 'BCA / BRI / Mandiri'} 
                                    />
                                    <Field 
                                        label={settings.payment_method === 'ewallet' ? 'Nomor HP / ID E-Wallet' : 'Nomor Rekening'} 
                                        field="bank_account" 
                                        placeholder={settings.payment_method === 'ewallet' ? '081234567890' : '1234567890'} 
                                    />
                                    <Field 
                                        label="Atas Nama (Owner)" 
                                        field="bank_holder" 
                                        placeholder="Contoh: PT. JARFI NETWORKS" 
                                    />
                                </>
                            )}
                        </div>
                    </div>
                    {/* Printer */}
                    <div className="glass p-10 rounded-[2.5rem] border border-(--glass-border) shadow-xl lg:col-span-2 relative overflow-hidden group">
                        <div className="absolute -right-20 -top-20 p-20 opacity-[0.03] group-hover:opacity-[0.1] transition-opacity duration-700">
                            <Printer className="w-56 h-56 text-sky-500" />
                        </div>
                        <div className="flex items-center gap-5 mb-10 relative z-10">
                            <div className="w-14 h-14 rounded-2xl bg-sky-500/10 flex items-center justify-center text-sky-600 dark:text-sky-400 border border-sky-500/20 shadow-inner"><Printer className="w-7 h-7" /></div>
                            <div>
                                <h4 className="text-2xl font-black text-primary">Pengaturan Printer</h4>
                                <p className="text-xs text-muted font-bold uppercase tracking-widest mt-1">Konfigurasi jenis dan ukuran kertas struk/invoice</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10">
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 ml-1">Tipe Printer</label>
                                <select 
                                    value={settings.printer_type} 
                                    onChange={(e) => {
                                        const type = e.target.value;
                                        updateField('printer_type', type);
                                        // Auto-adjust width based on type
                                        if (type === 'thermal') updateField('printer_width', '58');
                                        else updateField('printer_width', '210');
                                    }} 
                                    className="w-full clean-input py-4.5 px-6 appearance-none cursor-pointer"
                                >
                                    <option value="thermal">Thermal (Struk / POS)</option>
                                    <option value="inkjet">Inkjet / Laser (A4)</option>
                                    <option value="dotmatrix">Dot Matrix (LX-310/etc)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 ml-1">Lebar Kertas</label>
                                <select 
                                    value={settings.printer_width} 
                                    onChange={(e) => updateField('printer_width', e.target.value)} 
                                    className="w-full clean-input py-4.5 px-6 appearance-none cursor-pointer"
                                >
                                    {settings.printer_type === 'thermal' ? (
                                        <>
                                            <option value="58">58mm (Kecil)</option>
                                            <option value="80">80mm (Besar)</option>
                                        </>
                                    ) : (
                                        <>
                                            <option value="210">A4 (210mm x 297mm)</option>
                                            <option value="148">A5 (Setengah A4)</option>
                                        </>
                                    )}
                                </select>
                            </div>
                        </div>
                        
                        <div className="mt-10 p-6 bg-sky-500/5 border border-sky-500/10 rounded-3xl flex items-start gap-4">
                            <Info className="w-5 h-5 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
                            <p className="text-[11px] text-sky-700 dark:text-sky-300 leading-relaxed font-bold italic uppercase tracking-tight">
                                *Pengaturan ini akan mempengaruhi tata letak (layout) saat Anda mencetak Invoice atau Voucher dari sistem agar presisi sesuai kertas.
                            </p>
                        </div>
                    </div>
                    <div className="lg:col-span-2">
                        <button onClick={handleSave} disabled={saving} className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-3xl font-black shadow-xl shadow-indigo-600/20 transition-all flex items-center justify-center gap-4 active:scale-[0.98] disabled:opacity-50 uppercase tracking-[0.2em] text-xs">
                            {saving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                            Simpan Pengaturan Tagihan
                        </button>
                    </div>
                </div>
            )}

            {/* TAB: Integrations */}
            {activeTab === 'integrations' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Telegram */}
                    <div className="glass p-10 rounded-[2.5rem] border border-(--glass-border) shadow-xl relative overflow-hidden">
                        <div className="absolute -right-20 -top-20 p-20 opacity-[0.03] transition-opacity duration-700">
                            <Send className="w-56 h-56 text-blue-500" />
                        </div>
                        <div className="flex items-center justify-between mb-10 relative z-10">
                            <div className="flex items-center gap-5">
                                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 border border-blue-500/20 shadow-inner"><Send className="w-7 h-7" /></div>
                                <div>
                                    <h4 className="text-2xl font-black text-primary">Telegram Bot</h4>
                                    <p className="text-xs text-muted font-bold uppercase tracking-widest mt-1">Notifikasi pembayaran & tagihan</p>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-6 relative z-10">
                            <Toggle label="Aktifkan Telegram" desc="Kirim notifikasi otomatis" field="telegram_enabled" color="blue" />
                            <Field label="Bot Token" field="telegram_bot_token" placeholder="123456:ABC-DEF1234ghIkl..." />
                            <Field label="Chat ID" field="telegram_chat_id" placeholder="-1001234567890" />
                        </div>
                    </div>
                    {/* WhatsApp API */}
                    <div className="glass p-10 rounded-[2.5rem] border border-(--glass-border) shadow-xl relative overflow-hidden group">
                        <div className="absolute -right-20 -top-20 p-20 opacity-[0.03] group-hover:opacity-[0.1] transition-opacity duration-700">
                            <MessageCircle className="w-56 h-56 text-emerald-500" />
                        </div>
                        <div className="flex items-center justify-between mb-10 relative z-10">
                            <div className="flex items-center gap-5">
                                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-inner"><MessageCircle className="w-7 h-7" /></div>
                                <div>
                                    <h4 className="text-2xl font-black text-primary">WhatsApp API</h4>
                                    <p className="text-xs text-muted font-bold uppercase tracking-widest mt-1">Blast tagihan ke pelanggan</p>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-8 relative z-10">
                            <div className="bg-emerald-500/5 border border-emerald-500/10 p-8 rounded-4xl mb-2 shadow-inner">
                                <div className="flex items-center gap-4 mb-4">
                                    <Smartphone className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                                    <h5 className="font-black text-primary text-sm uppercase tracking-widest">Status Device</h5>
                                </div>
                                <p className="text-xs text-muted leading-relaxed mb-6 font-medium">
                                    Gunakan WhatsApp Web untuk memantau pesan yang terkirim atau hubungkan device baru melalui gateway.
                                </p>
                                <a 
                                    href="https://web.whatsapp.com" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-3 w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-[1.25rem] font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-xl shadow-emerald-600/20 active:scale-[0.98]"
                                >
                                    <CheckCircle2 className="w-4 h-4" />
                                    Tautkan / Scan WA Web
                                </a>
                            </div>

                            <div className="space-y-6 pt-2">
                                <Toggle label="Aktifkan WA API" desc="Fonnte / WaBlas / WAPI" field="wa_api_enabled" color="teal" />
                                <Field label="API Gateway URL" field="wa_api_url" placeholder="https://api.fonnte.com/send" />
                                <Field label="API Token / Key" field="wa_api_token" placeholder="Token autentikasi dari provider" type="password" />
                            </div>
                        </div>
                    </div>
                    <div className="lg:col-span-2">
                        <button onClick={handleSave} disabled={saving} className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-3xl font-black shadow-xl shadow-indigo-600/20 transition-all flex items-center justify-center gap-4 active:scale-[0.98] disabled:opacity-50 uppercase tracking-[0.2em] text-xs">
                            {saving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                            Simpan Integrasi
                        </button>
                    </div>
                </div>
            )}

            {/* TAB: System */}
            {activeTab === 'system' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Activity Log */}
                    <div className="glass p-10 rounded-[2.5rem] border border-(--glass-border) shadow-xl lg:col-span-2">
                        <div className="flex items-center gap-5 mb-10">
                            <div className="w-14 h-14 rounded-2xl bg-violet-500/10 flex items-center justify-center text-violet-600 dark:text-violet-400 border border-violet-500/20 shadow-inner"><History className="w-7 h-7" /></div>
                            <div>
                                <h4 className="text-2xl font-black text-primary">Log Aktivitas Terakhir</h4>
                                <p className="text-xs text-muted font-bold uppercase tracking-widest mt-1">Riwayat perubahan pengaturan sistem</p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            {logs.length === 0 ? (
                                <div className="text-center py-20 text-slate-400 italic text-xs uppercase tracking-[0.3em] font-black animate-pulse">Belum ada aktivitas tercatat...</div>
                            ) : (
                                logs.map((log: any) => (
                                    <div key={log.id} className="flex items-center gap-5 p-6 bg-slate-50 dark:bg-slate-950/30 rounded-3xl border border-(--glass-border) group hover:border-indigo-500/30 transition-all shadow-sm">
                                        <div className={`w-3 h-3 rounded-full shrink-0 ${log.color.replace('text-', 'bg-')} shadow-[0_0_15px_currentColor]`}></div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-black text-primary text-sm truncate uppercase tracking-tight">{log.action}</p>
                                            <p className="text-[10px] text-muted font-bold truncate mt-1 uppercase">{log.description}</p>
                                        </div>
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap bg-slate-200 dark:bg-white/5 px-4 py-2 rounded-xl border border-(--glass-border) shadow-inner">
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
