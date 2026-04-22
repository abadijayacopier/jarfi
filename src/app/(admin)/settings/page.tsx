'use client';

import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { Settings, Building2, Smartphone, FileCheck, Save, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

interface SettingsState {
    company_name: string;
    company_address: string;
    company_email: string;
    company_whatsapp: string;
    tax_enabled: string;
    auto_isolate: string;
}

export default function SettingsPage() {
    const [settings, setSettings] = useState<SettingsState>({
        company_name: '',
        company_address: '',
        company_email: '',
        company_whatsapp: '',
        tax_enabled: '0',
        auto_isolate: '1'
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/settings');
            const data = await res.json();
            if (res.ok) setSettings(data.settings);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        if (e) e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            });
            if (res.ok) {
                Swal.fire({ 
                    icon: 'success', 
                    title: 'Berhasil!', 
                    text: 'Pengaturan berhasil diperbarui.', 
                    background: '#1e293b', 
                    color: '#fff',
                    timer: 1500,
                    showConfirmButton: false
                });
            } else {
                Swal.fire({ icon: 'error', title: 'Gagal!', text: 'Gagal menyimpan pengaturan.', background: '#1e293b', color: '#fff' });
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const toggleSetting = (key: string) => {
        const k = key as keyof SettingsState;
        const newVal = settings[k] === '1' ? '0' : '1';
        const newSettings = { ...settings, [k]: newVal };
        setSettings(newSettings);
        
        // Auto save for toggles
        updateSetting(key, newVal);
    };

    const updateSetting = async (key: string, value: string) => {
        try {
            await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ [key]: value })
            });
        } catch (err) { console.error(err); }
    };
    return (
        <div className="animate-in fade-in duration-500 pb-10">
            <div className="mb-8 border-b border-white/5 pb-4">
                <h3 className="text-3xl font-bold text-white flex items-center gap-3">
                    <Settings className="w-8 h-8 text-indigo-400 animate-spin-slow" />
                    Pengaturan Profil ISP & Perusahaan
                </h3>
                <p className="text-slate-400 mt-1">Konfigurasi nama brand, logo perusahaan, dan pengaturan master kontak untuk *invoice* pelanggan.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {loading ? (
                <div className="p-20 text-center text-slate-500 animate-pulse uppercase font-black text-xs tracking-widest">
                    Memuat Konfigurasi...
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Company Form */}
                    <div className="glass p-8 rounded-4xl border border-white/10 shadow-2xl relative overflow-hidden group">
                        <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl group-hover:bg-indigo-500/10 transition-all duration-700"></div>
                        
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20">
                                <Building2 className="w-6 h-6" />
                            </div>
                            <h4 className="text-2xl font-black text-white">Informasi Identitas ISP</h4>
                        </div>

                        <form onSubmit={handleSave} className="space-y-6 relative z-10">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2.5 ml-1">Nama Perusahaan / Brand ISP</label>
                                <input 
                                    type="text" 
                                    value={settings.company_name} 
                                    onChange={(e) => setSettings({...settings, company_name: e.target.value})}
                                    className="w-full bg-slate-900/50 border border-white/10 text-white rounded-2xl px-5 py-4 focus:outline-none focus:border-indigo-500 shadow-inner transition-all font-bold text-lg" 
                                    placeholder="Nama ISP Anda"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2.5 ml-1">Alamat Lengkap Kantor</label>
                                <textarea 
                                    rows={3} 
                                    value={settings.company_address} 
                                    onChange={(e) => setSettings({...settings, company_address: e.target.value})}
                                    className="w-full bg-slate-900/50 border border-white/10 text-white rounded-2xl px-5 py-4 focus:outline-none focus:border-indigo-500 shadow-inner transition-all font-medium"
                                    placeholder="Alamat kantor pusat..."
                                ></textarea>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2.5 ml-1">Email Support</label>
                                    <div className="relative">
                                        <Smartphone className="absolute top-1/2 -translate-y-1/2 left-4 w-5 h-5 text-slate-500" />
                                        <input 
                                            type="email" 
                                            value={settings.company_email} 
                                            onChange={(e) => setSettings({...settings, company_email: e.target.value})}
                                            className="w-full bg-slate-900/50 border border-white/10 text-white rounded-2xl pl-12 px-5 py-4 focus:outline-none focus:border-indigo-500 shadow-inner transition-all font-bold" 
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2.5 ml-1">WhatsApp (+62)</label>
                                    <div className="relative">
                                        <Smartphone className="absolute top-1/2 -translate-y-1/2 left-4 w-5 h-5 text-slate-500" />
                                        <input 
                                            type="text" 
                                            value={settings.company_whatsapp} 
                                            onChange={(e) => setSettings({...settings, company_whatsapp: e.target.value})}
                                            className="w-full bg-slate-900/50 border border-white/10 text-white rounded-2xl pl-12 px-5 py-4 focus:outline-none focus:border-indigo-500 shadow-inner transition-all font-bold" 
                                        />
                                    </div>
                                </div>
                            </div>
                            <button 
                                type="submit"
                                disabled={saving}
                                className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black shadow-xl shadow-indigo-600/20 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 mt-4 uppercase tracking-widest text-xs"
                            >
                                {saving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                Simpan Perubahan Identitas
                            </button>
                        </form>
                    </div>

                    <div className="space-y-8">
                        {/* Logo Config */}
                        <div className="glass p-8 rounded-4xl border border-white/10 text-center flex flex-col items-center shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-teal-400 to-blue-500"></div>
                            <h4 className="text-xl font-black text-white mb-6 uppercase tracking-widest">Logo Perusahaan</h4>
                            <div className="w-40 h-40 bg-slate-900 rounded-3xl border-2 border-dashed border-slate-700 mb-6 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 hover:bg-slate-800 transition-all group relative overflow-hidden">
                                <span className="text-6xl font-black bg-linear-to-r from-teal-400 to-blue-500 bg-clip-text text-transparent group-hover:scale-110 transition-transform">
                                    {settings.company_name?.charAt(0) || 'J'}
                                </span>
                                <div className="absolute inset-0 bg-indigo-600/80 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-all duration-300">
                                    <Smartphone className="w-8 h-8 text-white mb-2" />
                                    <span className="text-white text-[10px] font-black uppercase tracking-widest">Ganti Logo</span>
                                </div>
                            </div>
                            <p className="text-slate-400 text-xs font-medium leading-relaxed max-w-xs">Logo ini akan muncul di semua struk cetak (Invoice) maupun halaman Vouchers.</p>
                        </div>

                        {/* Configuration Toggles */}
                        <div className="glass p-8 rounded-4xl border border-white/10 shadow-2xl">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 rounded-2xl bg-teal-500/10 flex items-center justify-center text-teal-400 border border-teal-500/20">
                                    <FileCheck className="w-6 h-6" />
                                </div>
                                <h4 className="text-2xl font-black text-white">Tagihan & Fitur</h4>
                            </div>
                            
                            <div className="space-y-4">
                                <div 
                                    onClick={() => toggleSetting('tax_enabled')}
                                    className="flex items-center justify-between p-5 bg-slate-900/50 rounded-2xl border border-white/5 cursor-pointer hover:bg-slate-900 transition-all group"
                                >
                                    <div className="flex gap-4 items-center">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${settings.tax_enabled === '1' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-800 text-slate-600'}`}>
                                            <AlertCircle className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="font-black text-white text-sm">Terapkan Pajak (PPN) 11%</p>
                                            <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold tracking-tight">Otomatis pada tagihan bulanan</p>
                                        </div>
                                    </div>
                                    <div className={`w-14 h-7 rounded-full relative transition-all duration-300 ${settings.tax_enabled === '1' ? 'bg-indigo-600' : 'bg-slate-700'}`}>
                                        <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all duration-300 shadow-lg ${settings.tax_enabled === '1' ? 'right-1' : 'left-1'}`}></div>
                                    </div>
                                </div>

                                <div 
                                    onClick={() => toggleSetting('auto_isolate')}
                                    className="flex items-center justify-between p-5 bg-slate-900/50 rounded-2xl border border-white/5 cursor-pointer hover:bg-slate-900 transition-all group"
                                >
                                    <div className="flex gap-4 items-center">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${settings.auto_isolate === '1' ? 'bg-teal-500/20 text-teal-400' : 'bg-slate-800 text-slate-600'}`}>
                                            <CheckCircle2 className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="font-black text-white text-sm">Isolir Keterlambatan Otomatis</p>
                                            <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold tracking-tight">Jatuh tempo melewati 3 hari</p>
                                        </div>
                                    </div>
                                    <div className={`w-14 h-7 rounded-full relative transition-all duration-300 ${settings.auto_isolate === '1' ? 'bg-teal-500' : 'bg-slate-700'}`}>
                                        <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all duration-300 shadow-lg ${settings.auto_isolate === '1' ? 'right-1' : 'left-1'}`}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            </div>
        </div>
    );
}
