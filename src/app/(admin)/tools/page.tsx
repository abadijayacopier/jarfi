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
            title: 'Konfirmasi Restore Database?',
            text: "PERHATIAN: Seluruh data Anda saat ini akan DIHAPUS dan digantikan dengan data dari file backup ini. Aksi ini tidak dapat dibatalkan!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Ya, Restore Sekarang!',
            cancelButtonText: 'Batal',
            background: '#1e293b',
            color: '#fff'
        });

        if (result.isConfirmed) {
            setRestoring(true);
            Swal.fire({ title: 'Merestore Data...', text: 'Mengunggah dan menimpa database...', allowOutsideClick: false, background: '#1e293b', color: '#fff', didOpen: () => { Swal.showLoading(); } });

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
                        Swal.fire({ icon: 'success', title: 'Restore Berhasil!', text: 'Database JARFI telah kembali ke kondisi backup.', background: '#1e293b', color: '#fff' });
                    } else {
                        const data = await res.json();
                        Swal.fire({ icon: 'error', title: 'Gagal Restore', text: data.error, background: '#1e293b', color: '#fff' });
                    }
                    setRestoring(false);
                };
                reader.readAsText(file);
            } catch (err) {
                Swal.fire({ icon: 'error', title: 'Error API', text: 'Gagal menghubungi server.', background: '#1e293b', color: '#fff' });
                setRestoring(false);
            }
        }
        // Reset input
        e.target.value = '';
    };

    const handleExportExcel = async () => {
        Swal.fire({ title: 'Exporting...', text: 'Menyiapkan data pelanggan...', allowOutsideClick: false, background: '#1e293b', color: '#fff', didOpen: () => { Swal.showLoading(); } });
        
        try {
            const res = await fetch('/api/customers');
            const data = await res.json();
            
            if (res.ok) {
                const customers = data.customers || [];
                // Simple CSV conversion
                const headers = ['ID', 'User ID', 'Nama', 'WA', 'Username PPPoE', 'Status'];
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
                a.download = `jarfi-customers-${new Date().toISOString().split('T')[0]}.csv`;
                a.click();
                Swal.close();
            }
        } catch {
            Swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal mengambil data pelanggan.', background: '#1e293b', color: '#fff' });
        }
    };

    return (
        <div className="animate-in fade-in duration-500 pb-20 space-y-12">
            <div className="mb-12">
                <h3 className="text-4xl font-black text-primary tracking-tight flex items-center gap-4">
                    <Database className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
                    System Maintenance
                </h3>
                <p className="text-muted mt-2 font-medium text-sm">Arsip Database, Pemulihan Data, dan Ekspor Laporan Komprehensif.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                {/* Backup Card */}
                <div className="glass p-10 rounded-[3rem] border-2 border-(--glass-border) bg-white/5 hover:border-emerald-500/30 transition-all group shadow-2xl relative overflow-hidden">
                    <div className="absolute -right-24 -top-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-emerald-500/20 transition-all duration-500"></div>
                    
                    <div className="flex items-center gap-6 mb-10 relative z-10">
                        <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border-2 border-emerald-500/20 shadow-inner group-hover:scale-110 group-hover:-rotate-3 transition-all duration-500">
                            <Database className="w-10 h-10" />
                        </div>
                        <div>
                            <h4 className="text-3xl font-black text-primary uppercase tracking-tighter">Snapshots</h4>
                            <p className="text-muted text-sm font-medium">Backup seluruh ekosistem JARFI.</p>
                        </div>
                    </div>
                    
                    <div className="bg-slate-100/50 dark:bg-slate-900/50 p-8 rounded-4xl border-2 border-(--glass-border) mb-10 shadow-inner relative z-10">
                        <ul className="space-y-4">
                            <li className="flex items-center gap-4 text-xs font-black text-slate-500 uppercase tracking-widest">
                                <div className="w-2 h-2 rounded-full bg-emerald-500"></div> Data Pelanggan & Paket
                            </li>
                            <li className="flex items-center gap-4 text-xs font-black text-slate-500 uppercase tracking-widest">
                                <div className="w-2 h-2 rounded-full bg-emerald-500"></div> Invoicing & Ledger
                            </li>
                            <li className="flex items-center gap-4 text-xs font-black text-slate-500 uppercase tracking-widest">
                                <div className="w-2 h-2 rounded-full bg-emerald-500"></div> Network Hub Config
                            </li>
                        </ul>
                    </div>

                    <button
                        onClick={handleBackup}
                        className="w-full py-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-[0.3em] text-[10px] transition-all shadow-2xl shadow-emerald-600/30 flex items-center justify-center gap-4 active:scale-95 relative z-10"
                    >
                        <Download className="w-6 h-6" /> Create Cold Backup (.sql)
                    </button>
                </div>

                {/* Restore Card */}
                <div className="glass p-10 rounded-[3rem] border-2 border-(--glass-border) bg-white/5 hover:border-orange-500/30 transition-all group shadow-2xl relative overflow-hidden">
                    <div className="absolute -right-24 -top-24 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-orange-500/20 transition-all duration-500"></div>
                    
                    <div className="flex items-center gap-6 mb-10 relative z-10">
                        <div className="w-20 h-20 rounded-3xl bg-orange-500/10 flex items-center justify-center text-orange-600 dark:text-orange-400 border-2 border-orange-500/20 shadow-inner group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                            <History className="w-10 h-10" />
                        </div>
                        <div>
                            <h4 className="text-3xl font-black text-primary uppercase tracking-tighter">Rollback</h4>
                            <p className="text-muted text-sm font-medium">Restorasi data dari arsip eksternal.</p>
                        </div>
                    </div>
                    
                    <div className="bg-amber-500/5 dark:bg-amber-500/10 p-8 rounded-4xl border-2 border-amber-500/20 mb-10 shadow-sm relative z-10">
                        <div className="flex items-start gap-4">
                            <AlertTriangle className="w-8 h-8 text-amber-500 shrink-0 mt-0.5" />
                            <p className="text-[11px] leading-relaxed text-amber-700 dark:text-amber-400 font-black uppercase tracking-widest italic">
                                Critical Warning: Seluruh data live akan ditimpa dan <span className="text-red-600">DIHAPUS</span> permanen. Pastikan integritas file backup terverifikasi.
                            </p>
                        </div>
                    </div>

                    <label className="w-full py-6 rounded-2xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 font-black uppercase tracking-[0.3em] text-[10px] transition-all cursor-pointer flex items-center justify-center gap-4 border-2 border-(--glass-border) active:scale-95 relative z-10 shadow-lg">
                        <Upload className="w-6 h-6" />
                        Deploy Backup Artifact
                        <input type="file" accept=".sql" onChange={handleRestore} className="hidden" />
                    </label>
                </div>

                {/* Export Card */}
                <div className="glass p-12 rounded-[3.5rem] border-2 border-(--glass-border) bg-white/5 hover:border-blue-500/30 transition-all md:col-span-2 shadow-2xl relative overflow-hidden group">
                    <div className="absolute -left-40 -bottom-40 w-80 h-80 bg-blue-500/5 rounded-full blur-[100px] pointer-events-none group-hover:bg-blue-500/10 transition-all duration-700"></div>
                    
                    <div className="flex flex-col md:flex-row justify-between items-center gap-10 relative z-10">
                        <div className="flex items-center gap-8">
                            <div className="w-20 h-20 rounded-3xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 border-2 border-blue-500/20 shadow-inner group-hover:scale-110 transition-all">
                                <FileSpreadsheet className="w-10 h-10" />
                            </div>
                            <div>
                                <h4 className="text-2xl font-black text-primary tracking-tight">Intelligence Export</h4>
                                <p className="text-muted text-sm font-medium mt-1">Unduh master data pelanggan dalam format CSV / Excel.</p>
                            </div>
                        </div>
                        <button
                            onClick={handleExportExcel}
                            className="w-full md:w-auto px-12 py-5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-[0.2em] text-[10px] transition-all shadow-2xl shadow-blue-600/30 flex items-center justify-center gap-4 active:scale-95"
                        >
                            <FileSpreadsheet className="w-6 h-6" /> Export Master Ledger
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
