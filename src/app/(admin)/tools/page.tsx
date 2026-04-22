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
        <div className="animate-in fade-in duration-500 pb-10">
            <div className="mb-8">
                <h3 className="text-3xl font-bold text-white">Maintenance & Tools</h3>
                <p className="text-slate-400 mt-1">Kelola cadangan data, ekspor laporan, dan pembersihan sistem</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Backup Card */}
                <div className="glass p-8 rounded-3xl border border-emerald-500/20 bg-emerald-500/5 hover:border-emerald-500/40 transition-all group">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/30">
                            <Database className="w-8 h-8" />
                        </div>
                        <div>
                            <h4 className="text-2xl font-black text-white uppercase tracking-tight">Backup Database</h4>
                            <p className="text-slate-400 text-sm">Amankan seluruh data sistem ke file eksternal.</p>
                        </div>
                    </div>
                    
                    <div className="bg-slate-900/50 p-6 rounded-2xl border border-white/5 mb-8">
                        <ul className="space-y-3 text-sm text-slate-300">
                            <li className="flex items-center gap-3"><ShieldCheck className="w-4 h-4 text-emerald-400" /> Seluruh Data Pelanggan & Paket</li>
                            <li className="flex items-center gap-3"><ShieldCheck className="w-4 h-4 text-emerald-400" /> Data Invoice & Riwayat Bayar</li>
                            <li className="flex items-center gap-3"><ShieldCheck className="w-4 h-4 text-emerald-400" /> Pengaturan Router & API</li>
                        </ul>
                    </div>

                    <button
                        onClick={handleBackup}
                        className="w-full py-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-black uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center justify-center gap-3"
                    >
                        <Download className="w-6 h-6" /> Unduh Cadangan (.json)
                    </button>
                </div>

                {/* Restore Card */}
                <div className="glass p-8 rounded-3xl border border-orange-500/20 bg-orange-500/5 hover:border-orange-500/40 transition-all">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 rounded-2xl bg-orange-500/20 flex items-center justify-center text-orange-400 border border-orange-500/30">
                            <History className="w-8 h-8" />
                        </div>
                        <div>
                            <h4 className="text-2xl font-black text-white uppercase tracking-tight">Restore Data</h4>
                            <p className="text-slate-400 text-sm">Kembalikan data dari file cadangan sebelumnya.</p>
                        </div>
                    </div>
                    
                    <div className="bg-slate-900/50 p-6 rounded-2xl border border-white/5 mb-8">
                        <div className="flex items-start gap-3 text-orange-300/80 text-xs">
                            <AlertTriangle className="w-5 h-5 shrink-0" />
                            <p>Proses ini akan <b>MENGHAPUS</b> data yang ada saat ini secara permanen. Pastikan file backup Anda benar.</p>
                        </div>
                    </div>

                    <label className="w-full py-4 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-black uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-3 border border-white/10">
                        <Upload className="w-6 h-6" />
                        Pilih File Backup
                        <input type="file" accept=".json" onChange={handleRestore} className="hidden" />
                    </label>
                </div>

                {/* Export Card */}
                <div className="glass p-8 rounded-3xl border border-blue-500/20 bg-blue-500/5 md:col-span-2">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-400 border border-blue-500/30">
                                <FileSpreadsheet className="w-7 h-7" />
                            </div>
                            <div>
                                <h4 className="text-xl font-bold text-white">Ekspor Data Pelanggan</h4>
                                <p className="text-slate-400 text-sm">Unduh daftar pelanggan lengkap untuk kebutuhan pelaporan atau Excel.</p>
                            </div>
                        </div>
                        <button
                            onClick={handleExportExcel}
                            className="px-8 py-4 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-bold transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)] flex items-center gap-3"
                        >
                            <FileSpreadsheet className="w-5 h-5" /> Export ke CSV/Excel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
