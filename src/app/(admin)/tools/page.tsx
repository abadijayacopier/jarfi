'use client';

import { useState } from 'react';
import Swal from 'sweetalert2';
import { Database, Download, Upload, FileJson, FileSpreadsheet, AlertTriangle, ShieldCheck, History, Trash2, ArrowRight } from 'lucide-react';

export default function ToolsPage() {
    const [restoring, setRestoring] = useState(false);

    const handleBackup = () => {
        window.location.href = '/api/tools/backup';
    };

    const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const result = await Swal.fire({
            title: 'Konfirmasi Rollback Database?',
            text: "KRITIS: Semua data operasional saat ini akan DIHAPUS PERMANEN dan digantikan dengan artifak ini. Urutan ini tidak dapat dibatalkan setelah diinisialisasi.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Inisialisasi Rollback',
            cancelButtonText: 'Batalkan Urutan',
            background: '#0f172a',
            color: '#fff',
            customClass: {
                popup: 'rounded-4xl border border-white/10'
            }
        });

        if (result.isConfirmed) {
            setRestoring(true);
            Swal.fire({ 
                title: 'Memulihkan Infrastruktur...', 
                text: 'Mendeploy artifak database...', 
                allowOutsideClick: false, 
                background: '#0f172a', 
                color: '#fff', 
                didOpen: () => { Swal.showLoading(); } 
            });

            try {
                const reader = new FileReader();
                reader.onload = async (event) => {
                    const content = event.target?.result;
                    const res = await fetch('/api/tools/restore', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: content as string
                    });

                    if (res.ok) {
                        Swal.fire({ icon: 'success', title: 'Pemulihan Berhasil', text: 'Status infrastruktur inti telah disinkronkan.', background: '#0f172a', color: '#fff' });
                    } else {
                        const data = await res.json();
                        Swal.fire({ icon: 'error', title: 'Pemulihan Gagal', text: data.error, background: '#0f172a', color: '#fff' });
                    }
                    setRestoring(false);
                };
                reader.readAsText(file);
            } catch (err) {
                Swal.fire({ icon: 'error', title: 'Kegagalan Jaringan', text: 'Gagal membangun koneksi dengan API inti.', background: '#0f172a', color: '#fff' });
                setRestoring(false);
            }
        }
        e.target.value = '';
    };

    const handleExportExcel = async () => {
        Swal.fire({ 
            title: 'Membuat Laporan...', 
            text: 'Menyusun intelijen pelanggan...', 
            allowOutsideClick: false, 
            background: '#0f172a', 
            color: '#fff', 
            didOpen: () => { Swal.showLoading(); } 
        });
        
        try {
            const res = await fetch('/api/customers');
            const data = await res.json();
            
            if (res.ok) {
                const customers = data.customers || [];
                const headers = ['ID', 'User ID', 'Nama', 'Telepon', 'Username PPPoE', 'Status'];
                const csvRows = [headers.join(',')];
                
                customers.forEach((c: any) => {
                    csvRows.push([
                        c.id,
                        `"${c.user_id || ''}"`,
                        `"${c.name}"`,
                        `"${c.phone}"`,
                        `"${c.pppoe_username}"`,
                        c.status
                    ].join(','));
                });

                const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `jarfi-intelligence-${new Date().toISOString().split('T')[0]}.csv`;
                a.click();
                Swal.close();
            }
        } catch {
            Swal.fire({ icon: 'error', title: 'Ekspor Gagal', text: 'Tidak dapat mengambil vektor intelijen.', background: '#0f172a', color: '#fff' });
        }
    };

    return (
        <div className="animate-in fade-in duration-500 pb-20 space-y-12">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-16 border-b border-(--glass-border) pb-10">
                <div className="space-y-2">
                    <h3 className="text-4xl font-bold text-primary flex items-center gap-5 tracking-tight">
                        <Database className="w-10 h-10 text-accent fill-accent/10" />
                        Konsol Infrastruktur
                    </h3>
                    <p className="text-muted font-medium text-lg">Pemeliharaan Sistem, Pemulihan Data, dan Ekspor Intelijen.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* Backup Card */}
                <div className="glass p-10 rounded-4xl border border-(--glass-border) bg-white/2 hover:border-accent/30 transition-all duration-500 group shadow-xl relative overflow-hidden">
                    <div className="absolute -right-24 -top-24 w-64 h-64 bg-accent/5 rounded-full blur-3xl pointer-events-none transition-all duration-700"></div>
                    
                    <div className="flex items-center gap-6 mb-12 relative z-10">
                        <div className="w-20 h-20 rounded-3xl bg-accent/5 flex items-center justify-center text-accent border border-accent/10 shadow-inner group-hover:scale-110 transition-all duration-500">
                            <Download className="w-10 h-10" />
                        </div>
                        <div>
                            <h4 className="text-2xl font-bold text-primary tracking-tight">Snapshot</h4>
                            <p className="text-[10px] text-muted font-bold uppercase tracking-widest mt-1">Arsip Ekosistem Lengkap</p>
                        </div>
                    </div>
                    
                    <div className="bg-white/1 p-8 rounded-3xl border border-white/5 mb-10 shadow-inner relative z-10">
                        <ul className="space-y-4">
                            {[
                                'Katalog Pelanggan & Paket',
                                'Artifak Penagihan & Buku Kas',
                                'Konfigurasi Node Jaringan'
                            ].map((item, idx) => (
                                <li key={idx} className="flex items-center gap-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                    <div className="w-1.5 h-1.5 rounded-full bg-accent shadow-[0_0_8px_rgba(16,185,129,0.3)]"></div> {item}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <button
                        onClick={handleBackup}
                        className="w-full py-5 rounded-2xl bg-accent hover:bg-accent/90 text-white font-bold uppercase tracking-widest text-[10px] transition-all shadow-lg active:scale-95 relative z-10"
                    >
                        <Download className="w-5 h-5" /> Inisialisasi Backup Data
                    </button>
                </div>

                {/* Restore Card */}
                <div className="glass p-10 rounded-4xl border border-(--glass-border) bg-white/2 hover:border-amber-500/30 transition-all duration-500 group shadow-xl relative overflow-hidden">
                    <div className="absolute -right-24 -top-24 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none transition-all duration-700"></div>
                    
                    <div className="flex items-center gap-6 mb-12 relative z-10">
                        <div className="w-20 h-20 rounded-3xl bg-amber-500/5 flex items-center justify-center text-amber-500 border border-amber-500/10 shadow-inner group-hover:scale-110 transition-all duration-500">
                            <History className="w-10 h-10" />
                        </div>
                        <div>
                            <h4 className="text-2xl font-bold text-primary tracking-tight">Rollback</h4>
                            <p className="text-[10px] text-muted font-bold uppercase tracking-widest mt-1">Pemulihan Status Arsip</p>
                        </div>
                    </div>
                    
                    <div className="bg-amber-500/5 p-8 rounded-3xl border border-amber-500/10 mb-10 shadow-inner relative z-10">
                        <div className="flex items-start gap-4">
                            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                            <p className="text-[10px] leading-relaxed text-amber-600 font-bold uppercase tracking-widest italic opacity-80">
                                Peringatan: Urutan penimpaan terdeteksi. Ini akan menggantikan data operasional saat ini.
                            </p>
                        </div>
                    </div>

                    <label className="w-full py-5 rounded-2xl bg-white/1 hover:bg-white/2 text-slate-400 font-bold uppercase tracking-widest text-[10px] transition-all cursor-pointer flex items-center justify-center gap-4 border border-white/5 active:scale-95 relative z-10 shadow-lg">
                        <Upload className="w-5 h-5" />
                        Deploy Artifak Status
                        <input type="file" accept=".sql" onChange={handleRestore} className="hidden" />
                    </label>
                </div>

                {/* Intelligence Card */}
                <div className="glass p-12 rounded-4xl border border-(--glass-border) bg-white/2 hover:border-accent/30 transition-all duration-500 md:col-span-2 shadow-xl relative overflow-hidden group">
                    <div className="absolute -left-40 -bottom-40 w-80 h-80 bg-accent/5 rounded-full blur-[100px] pointer-events-none transition-all duration-700"></div>
                    
                    <div className="flex flex-col md:flex-row justify-between items-center gap-10 relative z-10">
                        <div className="flex items-center gap-10">
                            <div className="w-20 h-20 rounded-3xl bg-accent/5 flex items-center justify-center text-accent border border-accent/10 shadow-inner group-hover:scale-110 transition-all duration-500">
                                <FileSpreadsheet className="w-10 h-10" />
                            </div>
                            <div>
                                <h4 className="text-3xl font-bold text-primary tracking-tight">Laporan Pelanggan</h4>
                                <p className="text-muted text-lg font-medium mt-1">Ekspor data master pelanggan ke format CSV untuk audit atau penagihan.</p>
                            </div>
                        </div>
                        <button
                            onClick={handleExportExcel}
                            className="w-full md:w-auto px-12 py-5 rounded-2xl bg-accent hover:bg-accent/90 text-white font-bold uppercase tracking-widest text-[10px] transition-all shadow-xl shadow-accent/20 flex items-center justify-center gap-4 active:scale-95"
                        >
                            <FileSpreadsheet className="w-5 h-5" /> Ekspor Data Pelanggan
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
