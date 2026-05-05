'use client';

import { useState, useEffect } from 'react';
import { 
    FileText, Printer, FileSpreadsheet, Download, Filter, 
    BarChart3, Wallet, Users, Package, Activity, ChevronRight,
    Search, Calendar, ArrowUpRight, ArrowDownRight, PrinterIcon,
    Loader2
} from 'lucide-react';

export default function ReportsPage() {
    const [activeReport, setActiveReport] = useState<string | null>(null);
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [reportData, setReportData] = useState<any[]>([]);
    const [summary, setSummary] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const fetchReportData = async (type: string) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/reports?type=${type}&start=${dateRange.start}&end=${dateRange.end}`);
            const data = await res.json();
            setReportData(data.data || []);
            setSummary(data.summary || null);
        } catch (e) {
            console.error('Failed to fetch report:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectReport = (id: string) => {
        setActiveReport(id);
        setCurrentPage(1);
        setSearchTerm('');
        fetchReportData(id);
    };

    const filteredData = reportData.filter(item => 
        Object.values(item).some(val => 
            String(val).toLowerCase().includes(searchTerm.toLowerCase())
        )
    );

    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const paginatedData = filteredData.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const formatIDR = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const exportToExcel = () => {
        if (!reportData.length) return;
        
        const headers = Object.keys(reportData[0]);
        const csvContent = [
            headers.join(','),
            ...reportData.map(row => headers.map(header => JSON.stringify(row[header])).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `Laporan_${activeReport}_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

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
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-6 border-b border-white/5 pb-10 print:hidden">
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
                        <input 
                            type="date" 
                            value={dateRange.start}
                            onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                            onBlur={() => activeReport && fetchReportData(activeReport)}
                            className="bg-transparent text-[11px] font-bold uppercase text-primary outline-none" 
                        />
                        <span className="text-muted text-[10px]">—</span>
                        <input 
                            type="date" 
                            value={dateRange.end}
                            onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                            onBlur={() => activeReport && fetchReportData(activeReport)}
                            className="bg-transparent text-[11px] font-bold uppercase text-primary outline-none" 
                        />
                    </div>
                </div>
            </div>

            {/* Report Selection Grid - Hidden on Print */}
            {!activeReport && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 print:hidden">
                    {reports.map((report) => (
                        <button
                            key={report.id}
                            onClick={() => handleSelectReport(report.id)}
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
                    <div className="flex flex-col lg:flex-row justify-between items-center gap-6 glass p-8 rounded-[32px] border-white/10 print:hidden">
                        <div className="flex items-center gap-6 w-full lg:w-auto">
                            <button 
                                onClick={() => setActiveReport(null)}
                                className="flex items-center gap-3 text-[10px] font-black text-muted hover:text-primary uppercase tracking-widest transition-colors whitespace-nowrap"
                            >
                                <ChevronRight className="w-4 h-4 rotate-180" /> Kembali
                            </button>
                            <div className="h-10 w-px bg-white/10 hidden lg:block"></div>
                            {activeReport !== 'customers' && (
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                                        <input 
                                            type="date" 
                                            value={dateRange.start}
                                            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                                            className="h-14 bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 text-[11px] font-bold text-primary outline-none focus:border-accent/50 transition-all"
                                        />
                                    </div>
                                    <div className="h-px w-4 bg-white/10"></div>
                                    <div className="relative">
                                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                                        <input 
                                            type="date" 
                                            value={dateRange.end}
                                            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                                            className="h-14 bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 text-[11px] font-bold text-primary outline-none focus:border-accent/50 transition-all"
                                        />
                                    </div>
                                    <button 
                                        onClick={() => fetchReportData(activeReport)}
                                        className="h-14 w-14 rounded-2xl bg-accent text-white flex items-center justify-center hover:bg-accent/90 transition-all shadow-lg active:scale-95"
                                    >
                                        <Filter className="w-5 h-5" />
                                    </button>
                                </div>
                            )}
                            <div className="h-10 w-px bg-white/10 hidden lg:block"></div>
                            <div className="relative flex-1 lg:w-80">
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                                <input 
                                    type="text" 
                                    placeholder="Cari cepat di laporan..."
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 text-[11px] font-bold text-primary outline-none focus:border-accent/50 transition-all"
                                />
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end">
                            <button 
                                onClick={exportToExcel}
                                className="h-12 md:h-14 px-4 md:px-8 rounded-2xl bg-white/5 border border-white/10 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-primary hover:bg-white/10 transition-all flex items-center gap-2 md:gap-3 flex-1 md:flex-none justify-center"
                            >
                                <FileSpreadsheet className="w-3.5 h-3.5 md:w-4 md:h-4 text-emerald-500" /> 
                                <span className="md:inline">Excel</span>
                            </button>
                            <button className="h-12 md:h-14 px-4 md:px-8 rounded-2xl bg-white/5 border border-white/10 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-primary hover:bg-white/10 transition-all flex items-center gap-2 md:gap-3 flex-1 md:flex-none justify-center">
                                <Download className="w-3.5 h-3.5 md:w-4 md:h-4 text-blue-500" />
                                <span className="md:inline">PDF</span>
                            </button>
                            <button 
                                onClick={handlePrint}
                                className="h-12 md:h-14 px-6 md:px-10 rounded-2xl bg-accent text-white shadow-xl shadow-accent/20 text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:bg-accent/90 transition-all flex items-center gap-2 md:gap-3 w-full md:w-auto justify-center"
                            >
                                <PrinterIcon className="w-3.5 h-3.5 md:w-4 md:h-4" /> 
                                <span className="inline">Cetak</span>
                            </button>
                        </div>
                    </div>

                    {/* The Actual Report Content (Printable) */}
                    <div className="bg-white text-slate-900 p-12 md:p-20 rounded-[40px] shadow-2xl min-h-[1000px] print:shadow-none print:p-0 print:rounded-none">
                        {/* Print Header */}
                        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-12 mb-6">
                            <div className="space-y-4">
                                <h1 className="text-4xl font-black tracking-tighter uppercase">JARFI NETWORKS</h1>
                                <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-60">High-Performance ISP Infrastructure</p>
                                <div className="text-[11px] font-medium leading-relaxed max-w-sm">
                                    Jl. Teknologi Masa Depan No. 99, Jakarta<br />
                                    Telp: +62 812 3456 789 | Email: cs@jarfi.net
                                </div>
                            </div>
                            <div className="text-right space-y-2">
                                <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Laporan {activeReport === 'customers' ? 'Data Pelanggan' : reports.find(r => r.id === activeReport)?.title}</h2>
                                {activeReport !== 'customers' && (
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">Periode: {dateRange.start ? new Date(dateRange.start).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }) : 'Seluruh Waktu'}</p>
                                )}
                                <div className="mt-8 p-4 border border-slate-200 rounded-2xl inline-block text-left">
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Tanggal Cetak</p>
                                    <p className="text-xs font-black">{new Date().toLocaleString('id-ID')}</p>
                                </div>
                            </div>
                        </div>

                        {/* Report Table - Simplified for Print */}
                        <div className="space-y-12 overflow-x-auto custom-scrollbar">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                                    <Loader2 className="w-12 h-12 text-accent animate-spin" />
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Menyusun Dokumentasi...</p>
                                </div>
                            ) : reportData.length === 0 ? (
                                <div className="text-center py-20 text-slate-400 font-bold italic">
                                    Tidak ada data untuk periode ini.
                                </div>
                            ) : (
                                <>
                                    <table className="w-full text-left border-collapse border-b border-slate-200 min-w-[800px]">
                                        <thead>
                                            <tr className="bg-slate-50 text-[10px] font-black uppercase tracking-widest border-t-2 border-slate-900">
                                                {activeReport === 'customers' ? (
                                                    <>
                                                        <th className="px-6 py-6 border-b border-slate-200">Nama Pelanggan</th>
                                                        <th className="px-6 py-6 border-b border-slate-200">Username</th>
                                                        <th className="px-6 py-6 border-b border-slate-200">Paket</th>
                                                        <th className="px-6 py-6 border-b border-slate-200 text-center">Status</th>
                                                        <th className="px-6 py-6 border-b border-slate-200 text-right">Biaya</th>
                                                    </>
                                                ) : activeReport === 'finance' ? (
                                                    <>
                                                        <th className="px-6 py-6 border-b border-slate-200">Periode</th>
                                                        <th className="px-6 py-6 border-b border-slate-200">Pelanggan</th>
                                                        <th className="px-6 py-6 border-b border-slate-200">Tanggal Bayar</th>
                                                        <th className="px-6 py-6 border-b border-slate-200 text-center">Status</th>
                                                        <th className="px-6 py-6 border-b border-slate-200 text-right">Nominal</th>
                                                    </>
                                                ) : activeReport === 'inventory' ? (
                                                    <>
                                                        <th className="px-6 py-6 border-b border-slate-200">Nama Barang</th>
                                                        <th className="px-6 py-6 border-b border-slate-200">Kategori</th>
                                                        <th className="px-6 py-6 border-b border-slate-200 text-center">Stok</th>
                                                        <th className="px-6 py-6 border-b border-slate-200 text-right">Harga Satuan</th>
                                                        <th className="px-6 py-6 border-b border-slate-200 text-right">Total Nilai</th>
                                                    </>
                                                ) : activeReport === 'journal' ? (
                                                    <>
                                                        <th className="px-6 py-6 border-b border-slate-200">Aksi / Aktivitas</th>
                                                        <th className="px-6 py-6 border-b border-slate-200">Keterangan</th>
                                                        <th className="px-6 py-6 border-b border-slate-200 text-center">Waktu</th>
                                                        <th className="px-6 py-6 border-b border-slate-200 text-right">Tipe</th>
                                                    </>
                                                ) : activeReport === 'bandwidth' ? (
                                                    <>
                                                        <th className="px-6 py-6 border-b border-slate-200">Username</th>
                                                        <th className="px-6 py-6 border-b border-slate-200">OLT Node</th>
                                                        <th className="px-6 py-6 border-b border-slate-200 text-right">Download (RX)</th>
                                                        <th className="px-6 py-6 border-b border-slate-200 text-right">Upload (TX)</th>
                                                    </>
                                                ) : (
                                                    <>
                                                        <th className="px-6 py-6 border-b border-slate-200">Item</th>
                                                        <th className="px-6 py-6 border-b border-slate-200">Kategori</th>
                                                        <th className="px-6 py-6 border-b border-slate-200 text-right">Debit</th>
                                                        <th className="px-6 py-6 border-b border-slate-200 text-right">Kredit</th>
                                                        <th className="px-6 py-6 border-b border-slate-200 text-right">Saldo</th>
                                                    </>
                                                )}
                                            </tr>
                                        </thead>
                                        <tbody className="text-xs font-medium">
                                            {paginatedData.map((item, idx) => (
                                                <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                                                    {activeReport === 'customers' ? (
                                                        <>
                                                            <td className="px-6 py-5 font-bold">{item.customer_name}</td>
                                                            <td className="px-6 py-5 font-mono text-[10px]">{item.username}</td>
                                                            <td className="px-6 py-5">{item.package_name}</td>
                                                            <td className="px-6 py-5 text-center">
                                                                <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase ${item.status.toUpperCase() === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                                                    {item.status}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-5 text-right font-bold">{formatIDR(item.monthly_fee || 0)}</td>
                                                        </>
                                                    ) : activeReport === 'finance' ? (
                                                        <>
                                                            <td className="px-6 py-5 uppercase">{item.period}</td>
                                                            <td className="px-6 py-5 font-bold">{item.customer_name}</td>
                                                            <td className="px-6 py-5">{item.paid_at ? new Date(item.paid_at).toLocaleDateString('id-ID') : '-'}</td>
                                                            <td className="px-6 py-5 text-center">
                                                                <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase ${item.status === 'PAID' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>
                                                                    {item.status}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-5 text-right font-bold">{formatIDR(item.amount || 0)}</td>
                                                        </>
                                                    ) : activeReport === 'inventory' ? (
                                                        <>
                                                            <td className="px-6 py-5 font-bold uppercase">{item.name}</td>
                                                            <td className="px-6 py-5">{item.category}</td>
                                                            <td className="px-6 py-5 text-center font-bold">
                                                                {item.stock} <span className="text-[10px] text-slate-400 font-medium">{item.unit}</span>
                                                            </td>
                                                            <td className="px-6 py-5 text-right">{formatIDR(item.price || 0)}</td>
                                                            <td className="px-6 py-5 text-right font-black">{formatIDR(item.value || 0)}</td>
                                                        </>
                                                    ) : activeReport === 'journal' ? (
                                                        <>
                                                            <td className="px-6 py-5 font-bold">{item.name}</td>
                                                            <td className="px-6 py-5 text-slate-500">{item.category}</td>
                                                            <td className="px-6 py-5 text-center font-mono text-[10px]">{new Date(item.date).toLocaleString('id-ID')}</td>
                                                            <td className="px-6 py-5 text-right uppercase font-black text-slate-400">{item.debit > 0 ? formatIDR(item.debit) : '-'}</td>
                                                        </>
                                                    ) : activeReport === 'bandwidth' ? (
                                                        <>
                                                            <td className="px-6 py-5 font-bold">{item.name}</td>
                                                            <td className="px-6 py-5">{item.olt}</td>
                                                            <td className="px-6 py-5 text-right font-mono font-bold text-emerald-600">{(item.rx / 1000000).toFixed(2)} Mbps</td>
                                                            <td className="px-6 py-5 text-right font-mono font-bold text-blue-600">{(item.tx / 1000000).toFixed(2)} Mbps</td>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <td className="px-6 py-5">{item.name || 'Item'}</td>
                                                            <td className="px-6 py-5">{item.category || 'N/A'}</td>
                                                            <td className="px-6 py-5 text-right">{formatIDR(item.debit || 0)}</td>
                                                            <td className="px-6 py-5 text-right">{formatIDR(item.credit || 0)}</td>
                                                            <td className="px-6 py-5 text-right font-bold">{formatIDR(item.balance || 0)}</td>
                                                        </>
                                                    )}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>

                                    {/* Pagination Controls - Hidden on Print */}
                                    <div className="flex justify-between items-center py-8 border-t border-slate-100 print:hidden">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                            Menampilkan {Math.min(filteredData.length, (currentPage - 1) * itemsPerPage + 1)}-{Math.min(filteredData.length, currentPage * itemsPerPage)} dari {filteredData.length} data
                                        </p>
                                        <div className="flex gap-2">
                                            <button 
                                                disabled={currentPage === 1}
                                                onClick={() => setCurrentPage(currentPage - 1)}
                                                className="px-4 py-2 rounded-lg bg-slate-50 border border-slate-200 text-[10px] font-black uppercase disabled:opacity-30"
                                            >
                                                Prev
                                            </button>
                                            <div className="flex gap-1">
                                                {[...Array(totalPages)].map((_, i) => (
                                                    <button
                                                        key={i}
                                                        onClick={() => setCurrentPage(i + 1)}
                                                        className={`w-8 h-8 rounded-lg text-[10px] font-black ${currentPage === i + 1 ? 'bg-slate-900 text-white' : 'bg-slate-50 border border-slate-200 text-slate-600'}`}
                                                    >
                                                        {i + 1}
                                                    </button>
                                                ))}
                                            </div>
                                            <button 
                                                disabled={currentPage === totalPages}
                                                onClick={() => setCurrentPage(currentPage + 1)}
                                                className="px-4 py-2 rounded-lg bg-slate-50 border border-slate-200 text-[10px] font-black uppercase disabled:opacity-30"
                                            >
                                                Next
                                            </button>
                                        </div>
                                    </div>

                                    {/* Summary Box */}
                                    <div className="flex justify-end pt-12">
                                        <div className="w-96 space-y-6">
                                            {activeReport === 'customers' ? (
                                                <>
                                                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-500">
                                                        <span>Total Pelanggan</span>
                                                        <span className="text-slate-900">{summary?.total}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-500">
                                                        <span>Aktif / Terhubung</span>
                                                        <span className="text-emerald-600">{summary?.active}</span>
                                                    </div>
                                                    <div className="h-px bg-slate-200"></div>
                                                    <div className="flex justify-between items-center bg-slate-900 text-white p-6 rounded-2xl shadow-xl">
                                                        <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Nonaktif / Terputus</span>
                                                        <span className="text-xl font-black tracking-tighter text-rose-400">{summary?.inactive}</span>
                                                    </div>
                                                </>
                                            ) : activeReport === 'finance' ? (
                                                <>
                                                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-500">
                                                        <span>Total Tagihan</span>
                                                        <span className="text-slate-900">{formatIDR(summary?.total_billed || 0)}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-500">
                                                        <span>Terbayar (Lunas)</span>
                                                        <span className="text-emerald-600">{formatIDR(summary?.total_paid || 0)}</span>
                                                    </div>
                                                    <div className="h-px bg-slate-200"></div>
                                                    <div className="flex justify-between items-center bg-slate-900 text-white p-6 rounded-2xl shadow-xl">
                                                        <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Piutang (Belum Bayar)</span>
                                                        <span className="text-xl font-black tracking-tighter text-amber-400">{formatIDR(summary?.total_unpaid || 0)}</span>
                                                    </div>
                                                </>
                                            ) : activeReport === 'inventory' ? (
                                                <>
                                                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-500">
                                                        <span>Total Jenis Barang</span>
                                                        <span className="text-slate-900">{summary?.total_items}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-500">
                                                        <span>Total Unit Tersedia</span>
                                                        <span className="text-slate-900">{summary?.total_stock}</span>
                                                    </div>
                                                    <div className="h-px bg-slate-200"></div>
                                                    <div className="flex justify-between items-center bg-slate-900 text-white p-6 rounded-2xl shadow-xl">
                                                        <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Nilai Total Aset</span>
                                                        <span className="text-xl font-black tracking-tighter text-emerald-400">{formatIDR(summary?.total_value || 0)}</span>
                                                    </div>
                                                </>
                                            ) : activeReport === 'journal' ? (
                                                <>
                                                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-500">
                                                        <span>Total Debit</span>
                                                        <span className="text-emerald-600 font-bold">{formatIDR(summary?.total_debit || 0)}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-500">
                                                        <span>Total Kredit</span>
                                                        <span className="text-rose-600 font-bold">{formatIDR(summary?.total_credit || 0)}</span>
                                                    </div>
                                                    <div className="h-px bg-slate-200"></div>
                                                    <div className="flex justify-between items-center bg-slate-900 text-white p-6 rounded-2xl shadow-xl">
                                                        <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Jumlah Transaksi</span>
                                                        <span className="text-xl font-black tracking-tighter">{summary?.count} Record</span>
                                                    </div>
                                                </>
                                            ) : activeReport === 'bandwidth' ? (
                                                <>
                                                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-500">
                                                        <span>Rata-rata Download</span>
                                                        <span className="text-emerald-400 font-bold">{(summary?.avg_rx / 1000000).toFixed(2)} Mbps</span>
                                                    </div>
                                                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-500">
                                                        <span>Rata-rata Upload</span>
                                                        <span className="text-blue-400 font-bold">{(summary?.avg_tx / 1000000).toFixed(2)} Mbps</span>
                                                    </div>
                                                    <div className="h-px bg-slate-200"></div>
                                                    <div className="flex justify-between items-center bg-slate-900 text-white p-6 rounded-2xl shadow-xl">
                                                        <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Total Node Aktif</span>
                                                        <span className="text-xl font-black tracking-tighter">{summary?.total_active} User</span>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="flex justify-between items-center bg-slate-900 text-white p-6 rounded-2xl shadow-xl">
                                                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Total Balance</span>
                                                    <span className="text-xl font-black tracking-tighter">Rp 0</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}

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
