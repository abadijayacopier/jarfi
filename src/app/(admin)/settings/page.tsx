'use client';

import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { 
    Settings, Building2, Save, RefreshCw, CheckCircle2, AlertCircle, FileCheck,
    CreditCard, Printer, History, Send, MessageCircle, Landmark, Smartphone, Info, Loader2, Wifi
} from 'lucide-react';

interface SettingsState {
    [key: string]: string;
}

const defaultSettings: SettingsState = {
    company_name: '',
    company_logo: '',
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
    hotspot_domain: 'www.jarfi.net',
    gemini_api_key: '',
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
                Swal.fire({ icon: 'success', title: 'Tersinkronisasi', text: 'Pengaturan sistem telah diperbarui.', background: '#0f172a', color: '#fff', timer: 1500, showConfirmButton: false });
                await fetch('/api/activity-logs', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'Parameter Diperbarui',
                        description: `Pengguna mengubah pengaturan ${activeTab}`,
                        color: 'text-accent'
                    })
                });
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            } else {
                Swal.fire({ icon: 'error', title: 'Kegagalan', text: 'Gagal menyimpan pengaturan.', background: '#0f172a', color: '#fff' });
            }
        } catch (err) { console.error(err); }
        finally { setSaving(false); }
    };

    const toggleSetting = (key: string) => {
        const newVal = settings[key] === '1' ? '0' : '1';
        setSettings(prev => ({ ...prev, [key]: newVal }));
        fetch('/api/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ [key]: newVal }) });
    };

    const updateField = (key: string, val: string) => setSettings(prev => ({ ...prev, [key]: val }));

    const tabs = [
        { id: 'identity', label: 'Identitas ISP', icon: Building2 },
        { id: 'billing', label: 'Buku Kas & Bank', icon: CreditCard },
        { id: 'integrations', label: 'Tautan Hub', icon: Send },
        { id: 'system', label: 'Sistem', icon: Settings },
    ];

    const Field = ({ label, field, type = 'text', placeholder = '', prefix = '' }: any) => (
        <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 ml-1">{label}</label>
            <div className="relative">
                {prefix && <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm">{prefix}</span>}
                <input
                    type={type}
                    value={settings[field] || ''}
                    onChange={(e) => updateField(field, e.target.value)}
                    placeholder={placeholder}
                    className={`w-full clean-input ${prefix ? 'pl-14' : ''} py-4 font-bold text-sm`}
                />
            </div>
        </div>
    );

    const Toggle = ({ label, desc, field, color = 'accent' }: any) => {
        const isOn = settings[field] === '1';
        const colorMap: any = {
            accent: { bg: 'bg-accent', icon: 'bg-accent/5 text-accent', glow: 'shadow-lg shadow-accent/20' },
            teal: { bg: 'bg-teal-500', icon: 'bg-teal-500/5 text-teal-400', glow: 'shadow-lg shadow-teal-500/20' },
            blue: { bg: 'bg-blue-500', icon: 'bg-blue-500/5 text-blue-400', glow: 'shadow-lg shadow-blue-500/20' },
        };
        const c = colorMap[color] || colorMap.accent;
        return (
            <div onClick={() => toggleSetting(field)} className="flex items-center justify-between p-5 bg-white/2 rounded-2xl border border-(--glass-border) cursor-pointer hover:bg-white/5 transition-all active:scale-[0.98]">
                <div className="flex gap-4 items-center">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-500 ${isOn ? c.icon : 'bg-white/5 text-slate-600'}`}>
                        <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="font-bold text-primary text-sm tracking-tight">{label}</p>
                        <p className="text-[10px] text-muted mt-0.5 font-bold uppercase tracking-widest">{desc}</p>
                    </div>
                </div>
                <div className={`w-12 h-6 rounded-full relative transition-all duration-500 shrink-0 ml-4 ${isOn ? `${c.bg} ${c.glow}` : 'bg-white/10'}`}>
                    <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all duration-500 shadow-lg ${isOn ? 'right-0.5' : 'left-0.5'}`}></div>
                </div>
            </div>
        );
    };

    if (loading) return (
        <div className="animate-in fade-in duration-500 pb-10">
            <div className="p-32 text-center">
                <Loader2 className="w-12 h-12 text-accent animate-spin mx-auto mb-6" />
                <p className="text-slate-500 uppercase font-bold text-[10px] tracking-widest animate-pulse">Menyinkronkan Pengaturan...</p>
            </div>
        </div>
    );

    return (
        <div className="animate-in fade-in duration-500 pb-20 space-y-12">
            {/* Page Header */}
            <div className="mb-6 border-b border-(--glass-border) pb-8">
                <h3 className="text-4xl font-bold text-primary flex items-center gap-4 tracking-tight">
                    <Settings className="w-10 h-10 text-accent" />
                    Pengaturan Sistem
                </h3>
                <p className="text-muted font-medium mt-2 text-lg">Konfigurasi Identitas, Penagihan, Integrasi Hub, dan Parameter Sistem.</p>
            </div>

            {/* Tabs Navigation */}
            <div className="flex gap-3 mb-6 overflow-x-auto pb-4 custom-scrollbar">
                {tabs.map(tab => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-3 px-8 py-3.5 rounded-2xl font-bold text-[11px] uppercase tracking-widest whitespace-nowrap transition-all active:scale-95 ${activeTab === tab.id ? 'bg-accent text-white shadow-xl shadow-accent/20' : 'glass border border-white/5 text-slate-500 hover:text-primary hover:bg-white/5'}`}
                        >
                            <Icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* TAB: Identity */}
            {activeTab === 'identity' && (
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-10 items-start animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="xl:col-span-2">
                        <div className="glass p-10 lg:p-12 rounded-4xl border border-(--glass-border) shadow-xl bg-white/2 relative overflow-hidden">
                            <div className="absolute -top-32 -right-32 w-80 h-80 bg-accent/5 rounded-full blur-3xl"></div>
                            <div className="flex items-center gap-5 mb-10">
                                <div className="w-14 h-14 rounded-2xl bg-accent/5 flex items-center justify-center text-accent border border-accent/10 shadow-inner"><Building2 className="w-7 h-7" /></div>
                                <div>
                                    <h4 className="text-2xl font-bold text-primary tracking-tight">Identitas Perusahaan</h4>
                                    <p className="text-[10px] text-muted font-bold uppercase tracking-widest mt-1">Identitas untuk Tagihan & Voucher</p>
                                </div>
                            </div>
                            <form onSubmit={handleSave} className="space-y-8 relative z-10">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <Field label="Nama Brand / Perusahaan" field="company_name" placeholder="Contoh: Sahabat Network" />
                                    <Field label="URL Logo (Link / Base64)" field="company_logo" placeholder="/logo.png" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 ml-1">Alamat Kantor Pusat</label>
                                    <textarea rows={4} value={settings.company_address} onChange={(e) => updateField('company_address', e.target.value)} placeholder="Masukkan alamat lengkap..." className="w-full clean-input resize-none py-5 px-6 font-bold text-sm"></textarea>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <Field label="Email Dukungan" field="company_email" type="email" />
                                    <Field label="WhatsApp Bisnis" field="company_whatsapp" prefix="+62" />
                                </div>
                                <div className="p-6 bg-accent/5 rounded-3xl border border-accent/10 flex items-center gap-6">
                                    <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center text-accent shadow-inner shrink-0">
                                        <Wifi className="w-7 h-7" />
                                    </div>
                                    <div className="flex-1">
                                        <Field label="Hotspot DNS Name / Domain" field="hotspot_domain" placeholder="Contoh: wifi.hotspot / www.jarfi.net" />
                                        <p className="text-[9px] font-bold text-accent/60 uppercase tracking-widest mt-2 ml-1">Domain ini akan digunakan untuk link QR Code login otomatis.</p>
                                    </div>
                                </div>
                                <button type="submit" disabled={saving} className="w-full py-5 bg-accent hover:bg-accent/90 text-white rounded-2xl font-bold shadow-xl shadow-accent/20 transition-all flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50 uppercase tracking-widest text-[11px]">
                                    {saving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                    Simpan Identitas
                                </button>
                            </form>
                        </div>
                    </div>
                    <div className="space-y-10">
                        <div className="glass p-10 rounded-4xl text-center flex flex-col items-center shadow-xl border border-(--glass-border) bg-white/2 relative overflow-hidden group">
                            <h4 className="text-[10px] font-bold text-slate-500 mb-8 uppercase tracking-widest">Logo Brand</h4>
                            <div className="w-40 h-40 bg-white/2 rounded-4xl border-2 border-dashed border-white/5 mb-6 flex items-center justify-center cursor-pointer hover:border-accent transition-all duration-700 relative overflow-hidden group/logo shadow-inner">
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    className="absolute inset-0 opacity-0 cursor-pointer z-20"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            const reader = new FileReader();
                                            reader.onloadend = () => {
                                                const base64 = reader.result as string;
                                                updateField('company_logo', base64);
                                            };
                                            reader.readAsDataURL(file);
                                        }
                                    }}
                                />
                                {settings.company_logo ? (
                                    <img src={settings.company_logo} alt="Logo" className="w-full h-full object-cover group-hover/logo:scale-110 transition-transform duration-700" />
                                ) : (
                                    <span className="text-6xl font-bold text-accent group-hover/logo:scale-110 transition-transform duration-700">
                                        {(settings.company_name || 'S').charAt(0).toUpperCase()}
                                    </span>
                                )}
                                <div className="absolute inset-0 bg-accent/90 opacity-0 group-hover/logo:opacity-100 flex flex-col items-center justify-center transition-all duration-500 z-10">
                                    <Smartphone className="w-8 h-8 text-white mb-2" />
                                    <span className="text-white text-[9px] font-bold uppercase tracking-widest">Ganti Logo</span>
                                </div>
                            </div>
                            <p className="text-muted text-[10px] font-bold uppercase tracking-widest opacity-40">Logo untuk Dokumen</p>
                        </div>
                        <div className="glass p-10 rounded-4xl shadow-xl border border-(--glass-border) bg-white/2">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 rounded-2xl bg-accent/5 flex items-center justify-center text-accent border border-accent/10 shadow-inner"><FileCheck className="w-6 h-6" /></div>
                                <h4 className="text-xl font-bold text-primary tracking-tight uppercase">Ops Logika</h4>
                            </div>
                            <div className="space-y-4">
                                <Toggle label="Protokol Pajak (11%)" desc="Otomatis terapkan ke Buku Kas" field="tax_enabled" color="accent" />
                                <Toggle label="Isolasi Otomatis" desc="Eksekusi pada H+3" field="auto_isolate" color="teal" />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB: Billing & Bank */}
            {activeTab === 'billing' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="glass p-10 rounded-4xl border border-(--glass-border) shadow-xl bg-white/2">
                        <div className="flex items-center gap-5 mb-10">
                            <div className="w-14 h-14 rounded-2xl bg-accent/5 flex items-center justify-center text-accent border border-accent/10 shadow-inner"><CreditCard className="w-7 h-7" /></div>
                            <div>
                                <h4 className="text-2xl font-bold text-primary tracking-tight">Metode Pembayaran</h4>
                                <p className="text-[10px] text-muted font-bold uppercase tracking-widest mt-1">Pengaturan Pembayaran Pelanggan</p>
                            </div>
                        </div>
                        <div className="space-y-5 mb-8">
                            {['transfer', 'cod', 'ewallet'].map(method => (
                                <div key={method} onClick={() => updateField('payment_method', method)} className={`p-6 rounded-3xl border-2 cursor-pointer transition-all active:scale-95 ${settings.payment_method === method ? 'border-accent/40 bg-accent/5' : 'border-white/5 bg-white/1 hover:bg-white/5'}`}>
                                    <div className="flex items-center gap-4">
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${settings.payment_method === method ? 'border-accent bg-accent' : 'border-slate-700'}`}>
                                            {settings.payment_method === method && <div className="w-2 h-2 rounded-full bg-white"></div>}
                                        </div>
                                        <span className={`font-bold text-[13px] uppercase tracking-widest ${settings.payment_method === method ? 'text-primary' : 'text-slate-500'}`}>{method === 'transfer' ? 'Transfer Bank' : method === 'cod' ? 'Manual (Bayar di Tempat)' : 'Dompet Digital'}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="glass p-10 rounded-4xl border border-(--glass-border) shadow-xl bg-white/2 relative overflow-hidden group">
                        <div className="absolute -right-20 -top-20 p-20 opacity-[0.03] transition-opacity duration-700">
                            <Landmark className="w-56 h-56 text-accent" />
                        </div>
                        <div className="flex items-center gap-5 mb-10 relative z-10">
                            <div className="w-14 h-14 rounded-2xl bg-accent/5 flex items-center justify-center text-accent border border-accent/10 shadow-inner"><Landmark className="w-7 h-7" /></div>
                            <div>
                                <h4 className="text-2xl font-bold text-primary tracking-tight">
                                    {settings.payment_method === 'ewallet' ? 'Dompet Digital' : settings.payment_method === 'cod' ? 'Bayar Manual' : 'Transfer Bank'}
                                </h4>
                                <p className="text-[10px] text-muted font-bold uppercase tracking-widest mt-1">Identifikasi Transaksional</p>
                            </div>
                        </div>
                        
                        <div className="space-y-6 relative z-10">
                            {settings.payment_method === 'cod' ? (
                                <div className="p-10 bg-white/1 border border-dashed border-white/5 rounded-4xl text-center shadow-inner">
                                    <History className="w-12 h-12 text-accent/20 mx-auto mb-6" />
                                    <p className="font-bold text-primary mb-2 uppercase tracking-widest text-xs">Logika COD Manual Aktif</p>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed">Pelunasan langsung di kantor fisik atau melalui teknisi lapangan.</p>
                                </div>
                            ) : (
                                <>
                                    <Field 
                                        label={settings.payment_method === 'ewallet' ? 'Penyedia Digital' : 'Identitas Bank'} 
                                        field="bank_name" 
                                        placeholder={settings.payment_method === 'ewallet' ? 'QRIS / Dana' : 'BCA / BRI'} 
                                    />
                                    <Field 
                                        label={settings.payment_method === 'ewallet' ? 'Identitas Dompet' : 'Nomor Rekening'} 
                                        field="bank_account" 
                                        placeholder="Kode identifikasi..." 
                                    />
                                    <Field 
                                        label="Pemilik Rekening Perusahaan" 
                                        field="bank_holder" 
                                        placeholder="Identitas hukum..." 
                                    />
                                </>
                            )}
                        </div>
                    </div>
                    <div className="glass p-10 rounded-4xl border border-(--glass-border) shadow-xl bg-white/2 lg:col-span-2 relative overflow-hidden group">
                        <div className="absolute -right-20 -top-20 p-20 opacity-[0.03] transition-opacity duration-700">
                            <Printer className="w-56 h-56 text-accent" />
                        </div>
                        <div className="flex items-center gap-5 mb-10 relative z-10">
                            <div className="w-14 h-14 rounded-2xl bg-accent/5 flex items-center justify-center text-accent border border-accent/10 shadow-inner"><Printer className="w-7 h-7" /></div>
                            <div>
                                <h4 className="text-2xl font-bold text-primary tracking-tight">Pengaturan Cetak</h4>
                                <p className="text-[10px] text-muted font-bold uppercase tracking-widest mt-1">Konfigurasi Pencetakan Perangkat Keras</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 ml-1">Tipe Perangkat Keras</label>
                                <select 
                                    value={settings.printer_type} 
                                    onChange={(e) => {
                                        const type = e.target.value;
                                        updateField('printer_type', type);
                                        if (type === 'thermal') updateField('printer_width', '58');
                                        else updateField('printer_width', '210');
                                    }} 
                                    className="w-full clean-input py-4 px-6 appearance-none cursor-pointer font-bold text-sm"
                                >
                                    <option value="thermal">Termal (POS / Hub)</option>
                                    <option value="inkjet">Printer Standar (A4/A5)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 ml-1">Ukuran Kertas</label>
                                <select 
                                    value={settings.printer_width} 
                                    onChange={(e) => updateField('printer_width', e.target.value)} 
                                    className="w-full clean-input py-4 px-6 appearance-none cursor-pointer font-bold text-sm"
                                >
                                    {settings.printer_type === 'thermal' ? (
                                        <>
                                            <option value="58">58mm Standar</option>
                                            <option value="80">80mm Industri</option>
                                        </>
                                    ) : (
                                        <>
                                            <option value="210">Standar A4</option>
                                            <option value="148">Kompak A5</option>
                                        </>
                                    )}
                                </select>
                            </div>
                        </div>
                    </div>
                    <div className="lg:col-span-2">
                        <button onClick={handleSave} disabled={saving} className="w-full py-5 bg-accent hover:bg-accent/90 text-white rounded-2xl font-bold shadow-xl shadow-accent/20 transition-all flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50 uppercase tracking-widest text-[11px]">
                            {saving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                            Simpan Pengaturan Pembayaran
                        </button>
                    </div>
                </div>
            )}

            {/* TAB: Integrations */}
            {activeTab === 'integrations' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="glass p-10 rounded-4xl border border-(--glass-border) shadow-xl bg-white/2 relative overflow-hidden">
                        <div className="flex items-center gap-5 mb-10">
                            <div className="w-14 h-14 rounded-2xl bg-blue-500/5 flex items-center justify-center text-blue-400 border border-blue-500/10 shadow-inner"><Send className="w-7 h-7" /></div>
                            <div>
                                <h4 className="text-2xl font-bold text-primary tracking-tight">Hub Telegram</h4>
                                <p className="text-[10px] text-muted font-bold uppercase tracking-widest mt-1">Pengiriman notifikasi otonom</p>
                            </div>
                        </div>
                        <div className="space-y-6 relative z-10">
                            <Toggle label="Aktifkan Telegram" desc="Pengiriman Notifikasi Otomatis" field="telegram_enabled" color="blue" />
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 ml-1">Kunci Otak AI (Gemini Key)</label>
                                <input
                                    type="password"
                                    value={settings.gemini_api_key || ''}
                                    onChange={(e) => updateField('gemini_api_key', e.target.value)}
                                    placeholder="Tempel Gemini API Key di sini..."
                                    className="w-full clean-input py-4 font-bold text-sm"
                                />
                                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-2 ml-1 italic opacity-60 text-accent">Ambil kuncinya di aistudio.google.com</p>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 ml-1">Token Layanan (BotFather)</label>
                                <input
                                    type="password"
                                    value={settings.telegram_bot_token || ''}
                                    onChange={(e) => updateField('telegram_bot_token', e.target.value)}
                                    placeholder="Tempel Token di sini..."
                                    className="w-full clean-input py-4 font-bold text-sm"
                                />
                                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-2 ml-1 italic opacity-60">Sandi diaktifkan untuk keamanan.</p>
                            </div>
                            <Field 
                                label="Identitas Chat (Chat ID)" 
                                field="telegram_chat_id" 
                                placeholder="Contoh: 123456789 atau -100..." 
                            />
                            <p className="text-[9px] font-bold text-accent/60 uppercase tracking-widest mt-1 ml-1 leading-relaxed">
                                ID unik chat/grup untuk menerima notifikasi. Gunakan @userinfobot untuk cek ID Bos.
                            </p>
                        </div>
                    </div>
                    <div className="glass p-10 rounded-4xl border border-(--glass-border) shadow-xl bg-white/2 relative overflow-hidden group">
                        <div className="flex items-center gap-5 mb-10">
                            <div className="w-14 h-14 rounded-2xl bg-accent/5 flex items-center justify-center text-accent border border-accent/10 shadow-inner"><MessageCircle className="w-7 h-7" /></div>
                            <div>
                                <h4 className="text-2xl font-bold text-primary tracking-tight">API WhatsApp</h4>
                                <p className="text-[10px] text-muted font-bold uppercase tracking-widest mt-1">Pengaturan Notifikasi</p>
                            </div>
                        </div>
                        <div className="space-y-8 relative z-10">
                            <div className="bg-accent/5 border border-accent/10 p-8 rounded-4xl shadow-inner">
                                <div className="flex items-center gap-4 mb-4">
                                    <Smartphone className="w-6 h-6 text-accent" />
                                    <h5 className="font-bold text-primary text-sm uppercase tracking-widest">Tautan Perangkat Keras</h5>
                                </div>
                                <p className="text-[10px] text-muted font-bold leading-relaxed mb-6 uppercase tracking-widest opacity-60">
                                    Sinkronkan dengan bridge perangkat keras untuk transmisi multi-threaded.
                                </p>
                                <a 
                                    href="https://web.whatsapp.com" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-3 w-full py-4 bg-accent hover:bg-accent/90 text-white rounded-2xl font-bold text-[10px] uppercase tracking-widest transition-all shadow-lg active:scale-95"
                                >
                                    <CheckCircle2 className="w-4 h-4" />
                                    Tautan Handshake
                                </a>
                            </div>

                            <div className="space-y-6">
                                <Toggle label="Aktifkan WhatsApp API" desc="Pengiriman Otonom" field="wa_api_enabled" color="accent" />
                                <Field label="URL Gateway API" field="wa_api_url" placeholder="Endpoint API..." />
                                <Field label="Rahasia Otentikasi" field="wa_api_token" placeholder="Token Layanan..." type="password" />
                            </div>
                        </div>
                    </div>
                    <div className="lg:col-span-2">
                        <button onClick={handleSave} disabled={saving} className="w-full py-5 bg-accent hover:bg-accent/90 text-white rounded-2xl font-bold shadow-xl shadow-accent/20 transition-all flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50 uppercase tracking-widest text-[11px]">
                            {saving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                            Simpan Pengaturan Integrasi
                        </button>
                    </div>
                </div>
            )}

            {/* TAB: System */}
            {activeTab === 'system' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="glass p-10 rounded-4xl border border-(--glass-border) shadow-xl bg-white/2 lg:col-span-2">
                        <div className="flex items-center gap-5 mb-10">
                            <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-slate-500 border border-white/10 shadow-inner"><History className="w-7 h-7" /></div>
                            <div>
                                <h4 className="text-2xl font-bold text-primary tracking-tight">Buku Kas Audit</h4>
                                <p className="text-[10px] text-muted font-bold uppercase tracking-widest mt-1">Riwayat modifikasi parameter sistem</p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            {logs.length === 0 ? (
                                <div className="text-center py-20 text-slate-600 font-bold text-[10px] uppercase tracking-widest animate-pulse opacity-40">Tidak ada catatan audit yang teridentifikasi.</div>
                            ) : (
                                logs.map((log: any) => (
                                    <div key={log.id} className="flex items-center gap-5 p-6 bg-white/1 rounded-3xl border border-white/5 group hover:bg-white/2 transition-all">
                                        <div className={`w-2 h-2 rounded-full shrink-0 ${log.color.includes('accent') ? 'bg-accent shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-700'}`}></div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-primary text-sm truncate uppercase tracking-tight">{log.action}</p>
                                            <p className="text-[10px] text-muted font-bold truncate mt-1 uppercase tracking-widest opacity-60">{log.description}</p>
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-white/5 px-4 py-2 rounded-xl border border-white/5">
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
