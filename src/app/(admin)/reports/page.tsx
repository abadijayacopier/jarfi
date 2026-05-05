'use client';

import { useState, useEffect } from 'react';
import { 
    FileText, Printer, FileSpreadsheet, Download, Filter, 
    BarChart3, Wallet, Users, Package, Activity, ChevronRight,
    Search, Calendar, ArrowUpRight, ArrowDownRight, PrinterIcon
} from 'lucide-react';
import { pool } from '@/lib/db';

export default function ReportsPage() {
    const [activeReport, setActiveReport] = useState<string | null>(null);
    const [dateRange, setDateRange] = useState({ start: '', end: '' });

    const reports = [
        { id: 'customers', title: 'Data Pelanggan', icon: Users, desc: 'Laporan lengkap identitas & status pelanggan.', color: 'accent' },
        { id: 'finance', title: 'Laba & Rugi', icon: Wallet, desc: 'Neraca keuangan, pendapatan vs pengeluaran.', color: 'emerald-500' },
        { id: 'bandwidth', title: 'Pemakaian Bandwidth', icon: Activity, desc: 'Statistik trafik & utilisasi link ISP.', color: 'blue-500' },
        { id: 'inventory', title: 'Inventaris & Aset', icon: Package, desc: 'Stok barang, nilai aset, & kebutuhan logistik.', color: 'purple-500' },
        { id: 'journal', title: 'Jurnal Umum', icon: FileText, desc: 'Catatan transaksi harian & kronologi finansial.', color: 'amber-500' }
    ];

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="animate-in fade-in duration-500 pb-20 space-y-12 print:p-0">
            {/* Header - Hidden on Print */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12 border-b border-white/5 pb-10 print:hidden">
                <div>
                    <h3 className="text-heading flex items-center gap-5">
                        <FileText className="w-10 h-10 text-accent" />
                        Pusat Laporan & Cetak
                    </h3>
                    <p className="text-label mt-2">Arsip & Dokumentasi Administrasi ISP Terpusat</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3 bg-white/5 px-6 py-3 rounded-2xl border border-white/10">
                        <Calendar className="w-4 h-4 text-muted" />
                        <input type="date" className="bg-transparent text-[11px] font-bold uppercase text-primary outline-none" />
                        <span className="text-muted text-[10px]">—</span>
                        <input type="date" className="bg-transparent text-[11px] font-bold uppercase text-primary outline-none" />
                    </div>
                </div>
            </div>

            {/* Report Selection Grid - Hidden on Print */}
            {!activeReport && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 print:hidden">
                    {reports.map((report) => (
                        <button
                            key={report.id}
                            onClick={() => setActiveReport(report.id)}
                            className="glass p-10 rounded-[40px] text-left group hover:scale-[1.02] transition-all duration-500 relative overflow-hidden"
                        >
                            <div className={`absolute -right-8 -top-8 w-32 h-32 bg-${report.color}/5 rounded-full blur-3xl group-hover:bg-${report.color}/10 transition-all duration-700`}></div>
                            <div className="flex justify-between items-start mb-8 relative z-10">
                                <div className={`p-5 rounded-3xl bg-${report.color}/10 border border-${report.color}/20 text-${report.color} group-hover:scale-110 transition-transform duration-500`}>
                                    <report.icon className="w-8 h-8" />
                                </div>
                                <ChevronRight className="w-6 h-6 text-muted opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all" />
                            </div>
                            <h4 className="text-xl font-black text-primary uppercase tracking-tight mb-3 relative z-10">{report.title}</h4>
                            <p className="text-[11px] font-medium text-muted leading-relaxed relative z-10">{report.desc}</p>
                            <div className="mt-8 flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-all relative z-10">
                                <span className={`text-[10px] font-black text-${report.color} uppercase tracking-widest`}>Buka Laporan</span>
                                <div className={`h-px flex-1 bg-${report.color}/20`}></div>
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {/* Report View Area */}
            {activeReport && (
                <div className="space-y-10 animate-in zoom-in-95 duration-500">
                    {/* Report Controls - Hidden on Print */}
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6 glass p-8 rounded-[32px] border-white/10 print:hidden">
                        <button 
                            onClick={() => setActiveReport(null)}
                            className="flex items-center gap-3 text-[10px] font-black text-muted hover:text-primary uppercase tracking-widest transition-colors"
                        >
                            <ChevronRight className="w-4 h-4 rotate-180" /> Kembali
                        </button>
                        <div className="flex items-center gap-4">
                            <button className="h-14 px-8 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-white/10 transition-all flex items-center gap-3">
                                <FileSpreadsheet className="w-4 h-4 text-emerald-500" /> Excel
                            </button>
                            <button className="h-14 px-8 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-white/10 transition-all flex items-center gap-3">
                                <Download className="w-4 h-4 text-blue-500" /> PDF
                            </button>
                            <button 
                                onClick={handlePrint}
                                className="h-14 px-10 rounded-2xl bg-accent text-white shadow-xl shadow-accent/20 text-[10px] font-black uppercase tracking-widest hover:bg-accent/90 transition-all flex items-center gap-3"
                            >
                                <PrinterIcon className="w-4 h-4" /> Cetak Sekarang
                            </button>
                        </div>
                    </div>

                    {/* The Actual Report Content (Printable) */}
                    <div className="bg-white text-slate-900 p-12 md:p-20 rounded-[40px] shadow-2xl min-h-[1000px] print:shadow-none print:p-0 print:rounded-none">
                        {/* Print Header */}
                        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-12 mb-12">
                            <div className="space-y-4">
                                <h1 className="text-4xl font-black tracking-tighter uppercase">JARFI NETWORKS</h1>
                                <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-60">High-Performance ISP Infrastructure</p>
                                <div className="text-[11px] font-medium leading-relaxed max-w-sm">
                                    Jl. Teknologi Masa Depan No. 99, Jakarta<br />
                                    Telp: +62 812 3456 789 | Email: cs@jarfi.net
                                </div>
                            </div>
                            <div className="text-right space-y-2">
                                <h2 className="text-2xl font-black uppercase tracking-tight">LAPORAN {activeReport?.toUpperCase()}</h2>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Periode: MEI 2024</p>
                                <div className="mt-8 p-4 border border-slate-200 rounded-2xl inline-block text-left">
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Tanggal Cetak</p>
                                    <p className="text-xs font-black">{new Date().toLocaleString('id-ID')}</p>
                                </div>
                            </div>
                        </div>

                        {/* Report Table - Simplified for Print */}
                        <div className="space-y-12">
                            <table className="w-full text-left border-collapse border-b border-slate-200">
                                <thead>
                                    <tr className="bg-slate-50 text-[10px] font-black uppercase tracking-widest border-t-2 border-slate-900">
                                        <th className="px-6 py-6 border-b border-slate-200">Keterangan / Item</th>
                                        <th className="px-6 py-6 border-b border-slate-200">Kategori</th>
                                        <th className="px-6 py-6 border-b border-slate-200 text-right">Debit</th>
                                        <th className="px-6 py-6 border-b border-slate-200 text-right">Kredit</th>
                                        <th className="px-6 py-6 border-b border-slate-200 text-right">Saldo</th>
                                    </tr>
                                </thead>
                                <tbody className="text-xs font-medium">
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                                        <tr key={n} className="border-b border-slate-100">
                                            <td className="px-6 py-5">Penjualan Voucher Hotspot - Batch #{100 + n}</td>
                                            <td className="px-6 py-5">Pendapatan</td>
                                            <td className="px-6 py-5 text-right">Rp 1.500.000</td>
                                            <td className="px-6 py-5 text-right">-</td>
                                            <td className="px-6 py-5 text-right font-bold text-sm tracking-tight">Rp {n * 1500000}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Summary Box */}
                            <div className="flex justify-end pt-12">
                                <div className="w-96 space-y-6">
                                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-500">
                                        <span>Total Pendapatan</span>
                                        <span className="text-slate-900">Rp 45.000.000</span>
                                    </div>
                                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-500">
                                        <span>Total Pengeluaran</span>
                                        <span className="text-slate-900">Rp 12.500.000</span>
                                    </div>
                                    <div className="h-px bg-slate-200"></div>
                                    <div className="flex justify-between items-center bg-slate-900 text-white p-6 rounded-2xl shadow-xl">
                                        <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Laba Bersih</span>
                                        <span className="text-xl font-black tracking-tighter">Rp 32.500.000</span>
                                    </div>
                                </div>
                            </div>

                            {/* Signatures */}
                            <div className="grid grid-cols-2 gap-20 pt-20">
                                <div className="text-center space-y-24">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Disiapkan Oleh,</p>
                                    <div className="border-t border-slate-900 pt-4">
                                        <p className="text-xs font-black uppercase tracking-tight">Administrator NOC</p>
                                    </div>
                                </div>
                                <div className="text-center space-y-24">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Disetujui Oleh,</p>
                                    <div className="border-t border-slate-900 pt-4">
                                        <p className="text-xs font-black uppercase tracking-tight">Manager Operasional</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer - Print Only */}
                        <div className="hidden print:block fixed bottom-0 left-0 right-0 py-8 border-t border-slate-100 text-[8px] font-bold text-slate-400 text-center uppercase tracking-[0.3em]">
                            Dokumen ini dihasilkan secara otomatis oleh Sistem Manajemen ISP JARFI NETWORKS • Halaman 1 dari 1
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Print Styles */}
            <style jsx global>{`
                @media print {
                    body {
                        background: white !important;
                        color: black !important;
                    }
                    .print\\:hidden {
                        display: none !important;
                    }
                    @page {
                        size: A4;
                        margin: 20mm;
                    }
                    /* Support for Continuous Form */
                    @page :left {
                        margin-left: 10mm;
                    }
                    .custom-scrollbar {
                        overflow: visible !important;
                    }
                }
            `}</style>
        </div>
    );
}
