import { Settings, Building2, Smartphone, FileCheck } from 'lucide-react';

export default function SettingsPage() {
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
                {/* Company Form Stub */}
                <div className="glass p-8 rounded-2xl border border-white/10">
                    <div className="flex items-center gap-3 mb-6">
                        <Building2 className="w-6 h-6 text-blue-400" />
                        <h4 className="text-xl font-bold text-white">Informasi Identitas ISP</h4>
                    </div>

                    <div className="space-y-5">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Nama Perusahaan / Brand ISP</label>
                            <input type="text" defaultValue="JARFI Networks" className="w-full bg-slate-900/50 border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Alamat Lengkap Kantor</label>
                            <textarea rows={3} defaultValue="Jl. Teknologi Masa Depan No. 99, Jakarta" className="w-full bg-slate-900/50 border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500"></textarea>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 whitespace-nowrap">Email Support</label>
                                <div className="relative">
                                    <Smartphone className="absolute top-3 left-3 w-4 h-4 text-slate-500" />
                                    <input type="email" defaultValue="cs@jarfi.net" className="w-full bg-slate-900/50 border border-slate-700 text-white rounded-xl pl-9 px-4 py-3 focus:outline-none focus:border-indigo-500" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 whitespace-nowrap">WhatsApp (+62)</label>
                                <div className="relative">
                                    <Smartphone className="absolute top-3 left-3 w-4 h-4 text-slate-500" />
                                    <input type="text" defaultValue="8123456789" className="w-full bg-slate-900/50 border border-slate-700 text-white rounded-xl pl-9 px-4 py-3 focus:outline-none focus:border-indigo-500" />
                                </div>
                            </div>
                        </div>
                        <button className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-lg transition-colors mt-4">Simpan Perubahan Identitas</button>
                    </div>
                </div>

                <div className="space-y-8">
                    {/* Logo Config */}
                    <div className="glass p-8 rounded-2xl border border-white/10 text-center flex flex-col items-center">
                        <h4 className="text-xl font-bold text-white mb-4">Logo Perusahaan</h4>
                        <div className="w-32 h-32 bg-slate-800/80 rounded-2xl border border-dashed border-slate-600 mb-6 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-800 transition-colors">
                            <span className="text-4xl font-black bg-linear-to-r from-teal-400 to-blue-500 bg-clip-text text-transparent">J</span>
                            <span className="text-slate-500 text-xs mt-2 font-medium">Ubah Logo</span>
                        </div>
                        <p className="text-slate-400 text-sm">Logo ini akan muncul di semua struk cetak (Invoice) maupun halaman Vouchers.</p>
                    </div>

                    {/* Invoice Configuration settings */}
                    <div className="glass p-8 rounded-2xl border border-white/10">
                        <div className="flex items-center gap-3 mb-6">
                            <FileCheck className="w-6 h-6 text-teal-400" />
                            <h4 className="text-xl font-bold text-white">Tagihan & PPN</h4>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-white/5">
                                <div>
                                    <p className="font-bold text-white">Terapkan Pajak (PPN) 11%</p>
                                    <p className="text-xs text-slate-400 mt-1">Menambahkan PPN otomatis pada tagihan pelanggan bulanan.</p>
                                </div>
                                <div className="w-12 h-6 bg-slate-700 rounded-full relative cursor-pointer opacity-50">
                                    <div className="absolute left-1 top-1 w-4 h-4 bg-slate-500 rounded-full"></div>
                                </div>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-white/5">
                                <div>
                                    <p className="font-bold text-white">Isolir Keterlambatan Otomatis</p>
                                    <p className="text-xs text-slate-400 mt-1">Mengisolir profil Mikrotik saat jatuh tempo melewati 3 hari.</p>
                                </div>
                                <div className="w-12 h-6 bg-indigo-500 rounded-full relative cursor-pointer">
                                    <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
