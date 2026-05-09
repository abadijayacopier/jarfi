'use client';

import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { Printer, Edit, Trash2, CheckCircle, X, Save, Search, AlertTriangle, Loader2, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function InvoicesPage() {
    const [invoices, setInvoices] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    const [showEditForm, setShowEditForm] = useState(false);
    const [editData, setEditData] = useState({ id: 0, amount: 0, billing_month: '', status: '' });

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    useEffect(() => {
        fetchInvoices();
    }, []);

    const fetchInvoices = async () => {
        try {
            const res = await fetch('/api/invoices');
            const data = await res.json();
            if (res.ok) setInvoices(data.invoices || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateInvoices = async () => {
        const result = await Swal.fire({
            title: 'Buat Tagihan?',
            text: "Sistem akan secara otomatis membuat tagihan untuk semua pelanggan aktif.",
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#10b981',
            confirmButtonText: 'Buat Sekarang',
            cancelButtonText: 'Batal',
            background: '#0f172a',
            color: '#fff'
        });

        if (!result.isConfirmed) return;

        Swal.fire({ title: 'Memproses...', allowOutsideClick: false, background: '#0f172a', color: '#fff', didOpen: () => { Swal.showLoading(); } });
        try {
            const res = await fetch('/api/invoices/generate', { method: 'POST' });
            const data = await res.json();
            if (res.ok) {
                Swal.fire({ 
                    icon: 'success', 
                    title: 'Berhasil', 
                    text: data.message || `${data.count} tagihan baru telah dibuat.`, 
                    background: '#0f172a', 
                    color: '#fff' 
                });
                fetchInvoices();
            } else {
                Swal.fire({ icon: 'error', title: 'Kegagalan', text: data.error, background: '#0f172a', color: '#fff' });
            }
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Kesalahan', text: 'Kegagalan konektivitas API.', background: '#0f172a', color: '#fff' });
        }
    };

    const handleConfirmPayment = async (id: number) => {
        const result = await Swal.fire({
            title: 'Konfirmasi Pembayaran?',
            text: "Tandai tagihan ini sebagai LUNAS dalam buku kas.",
            icon: 'success',
            showCancelButton: true,
            confirmButtonColor: '#10b981',
            confirmButtonText: 'Konfirmasi Lunas',
            cancelButtonText: 'Batal',
            background: '#0f172a',
            color: '#fff'
        });

        if (!result.isConfirmed) return;

        try {
            const res = await fetch('/api/invoices', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status: 'PAID' })
            });
            if (res.ok) {
                Swal.fire({ icon: 'success', title: 'Selesai', text: 'Tagihan diperbarui menjadi LUNAS.', background: '#0f172a', color: '#fff', timer: 1500, showConfirmButton: false });
                fetchInvoices();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: 'Hapus Tagihan?',
            text: "Tindakan ini tidak dapat dibatalkan.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#f43f5e',
            confirmButtonText: 'Hapus Catatan',
            cancelButtonText: 'Batal',
            background: '#0f172a',
            color: '#fff'
        });

        if (!result.isConfirmed) return;

        try {
            const res = await fetch(`/api/invoices?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                fetchInvoices();
                Swal.fire({ icon: 'success', title: 'Dihapus', text: 'Tagihan telah dihapus dari sistem.', background: '#0f172a', color: '#fff' });
            }
        } catch (err) {
            console.error(err);
        }
    };

    const openEditModal = (inv: any) => {
        setEditData({
            id: inv.id,
            amount: parseInt(inv.amount),
            billing_month: inv.billing_month,
            status: inv.status
        });
        setShowEditForm(true);
    };

    const handleUpdate = async () => {
        try {
            const res = await fetch('/api/invoices', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editData)
            });
            if (res.ok) {
                setShowEditForm(false);
                fetchInvoices();
                Swal.fire({ icon: 'success', title: 'Diperbarui', text: 'Catatan penagihan telah disinkronkan.', background: '#0f172a', color: '#fff' });
            }
        } catch (err) {
            console.error(err);
        }
    };

    const filteredInvoices = invoices.filter((inv: any) => 
        (inv.customer_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (inv.pppoe_username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (inv.billing_month || '').includes(searchTerm)
    );

    const paginatedInvoices = filteredInvoices.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);

    return (
        <div className="animate-in fade-in duration-500 pb-20 space-y-10">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-6 border-b border-(--glass-border) pb-8">
                <div>
                    <h3 className="text-4xl font-bold text-primary flex items-center gap-4 tracking-tight">
                        <FileText className="w-10 h-10 text-accent" />
                        Buku Kas Penagihan
                    </h3>
                    <p className="text-muted font-medium mt-2 text-lg">Tagihan pelanggan dan catatan transaksi.</p>
                </div>
                <button
                    onClick={handleGenerateInvoices}
                    className="bg-accent hover:bg-accent/90 text-white font-bold py-4 px-10 rounded-2xl transition-all shadow-xl active:scale-95 flex items-center gap-3 uppercase tracking-widest text-[10px]"
                >
                    <Save className="w-5 h-5" /> Buat Siklus Tagihan
                </button>
            </div>

            {/* Main Content Area */}
            <div className="space-y-8">
                {/* Search & Stats Card */}
                <div className="glass p-8 rounded-4xl border border-(--glass-border) shadow-xl bg-white/2 relative overflow-hidden group">
                    <div className="absolute -right-24 -top-24 w-64 h-64 bg-accent/5 rounded-full blur-3xl transition-all duration-700 group-hover:bg-accent/10"></div>
                    <div className="flex flex-col md:flex-row justify-between items-center gap-8 relative z-10">
                        <div className="relative w-full md:w-[500px]">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                            <input 
                                type="text" 
                                placeholder="Saring catatan berdasarkan nama atau periode..." 
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                className="w-full clean-input pl-18 pr-6 py-4 font-bold text-sm"
                            />
                        </div>
                        <div className="flex items-center gap-10">
                            <div className="text-center">
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Total Catatan</p>
                                <p className="text-2xl font-bold text-primary">{filteredInvoices.length}</p>
                            </div>
                            <div className="w-px h-8 bg-white/5"></div>
                            <div className="text-center">
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Pendapatan Tertunda</p>
                                <p className="text-2xl font-bold text-red-500">{filteredInvoices.filter((i:any) => i.status !== 'PAID').length}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block glass rounded-4xl overflow-hidden shadow-xl border border-(--glass-border) bg-white/2">
                    <div className="overflow-x-auto min-h-[500px] custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white/1 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5">
                                    <th className="px-10 py-8">Siklus Penagihan</th>
                                    <th className="px-10 py-8">Pelanggan</th>
                                    <th className="px-10 py-8">Jumlah Pendapatan</th>
                                    <th className="px-10 py-8">Status</th>
                                    <th className="px-10 py-8">Eksekusi</th>
                                    <th className="px-10 py-8 text-right">Orkestrasi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-sm">
                                {loading ? (
                                    <tr><td colSpan={6} className="p-32 text-center">
                                        <div className="flex flex-col items-center gap-6 animate-pulse">
                                            <Loader2 className="w-10 h-10 text-accent animate-spin" />
                                            <span className="font-bold uppercase tracking-widest text-[10px] text-slate-500">Menyinkronkan Buku Kas...</span>
                                        </div>
                                    </td></tr>
                                ) : paginatedInvoices.length === 0 ? (
                                    <tr><td colSpan={6} className="p-32 text-center text-slate-400 font-bold uppercase tracking-widest opacity-40">Tidak ada catatan yang teridentifikasi.</td></tr>
                                ) : (
                                    paginatedInvoices.map((inv: any) => (
                                        <tr key={inv.id} className="hover:bg-white/2 transition-all group">
                                            <td className="px-8 py-3">
                                                <span className="font-bold text-primary group-hover:text-accent transition-colors uppercase tracking-widest text-[10px] bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                                                    {inv.billing_month}
                                                </span>
                                            </td>
                                            <td className="px-8 py-3">
                                                <div className="text-value uppercase">{inv.customer_name}</div>
                                                <div className="text-label mt-1.5 opacity-40">@{inv.pppoe_username}</div>
                                            </td>
                                             <td className="px-8 py-3">
                                                 <div className="flex items-center gap-4">
                                                     <span className="font-bold text-primary text-[15px] tracking-tight">Rp {parseInt(inv.amount).toLocaleString('id-ID')}</span>
                                                     {parseInt(inv.amount) === 0 && (
                                                         <div className="group/warn relative">
                                                             <AlertTriangle className="w-5 h-5 text-amber-500 animate-pulse" />
                                                             <div className="absolute left-full ml-4 px-4 py-2 bg-slate-900 text-white text-[9px] font-bold uppercase tracking-widest rounded-xl whitespace-nowrap opacity-0 group-hover/warn:opacity-100 transition-all z-50 border border-white/10 shadow-2xl">
                                                                 Kesalahan Profil Terdeteksi
                                                             </div>
                                                         </div>
                                                     )}
                                                 </div>
                                             </td>
                                             <td className="px-8 py-3">
                                                 <span className={`px-4 py-2 rounded-xl text-[9px] font-black tracking-widest uppercase border ${inv.status === 'PAID' ? 'bg-accent/10 text-emerald-600 dark:text-accent border-accent/20' : 'bg-rose-500/10 text-rose-600 dark:text-rose-500 border-rose-500/20'}`}>
                                                     {inv.status === 'PAID' ? 'LUNAS' : 'TERTUNDA'}
                                                 </span>
                                             </td>
                                             <td className="px-8 py-3">
                                                 {inv.paid_at ? (
                                                     <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                                                         <CheckCircle className="w-3.5 h-3.5 text-accent" />
                                                         {new Date(inv.paid_at).toLocaleDateString('id-ID')}
                                                     </div>
                                                 ) : <span className="text-slate-400 dark:text-slate-600 font-black text-[10px] uppercase tracking-widest italic opacity-60 dark:opacity-40">Belum Bayar</span>}
                                             </td>
                                             <td className="px-8 py-3">
                                                 <div className="flex items-center justify-end gap-3 opacity-60 dark:opacity-40 group-hover:opacity-100 transition-opacity">
                                                    {inv.status !== 'PAID' && (
                                                        <button 
                                                            onClick={() => handleConfirmPayment(inv.id)} 
                                                            className="p-3 rounded-xl bg-accent/10 text-accent hover:bg-accent hover:text-white border border-accent/20 transition-all"
                                                            title="Konfirmasi Lunas"
                                                        >
                                                            <CheckCircle className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    <Link 
                                                        href={`/invoices/print/${inv.id}`} 
                                                        className="p-3 rounded-xl bg-white/5 text-slate-400 hover:bg-sky-500 hover:text-white border border-white/5 transition-all"
                                                        title="Cetak"
                                                    >
                                                        <Printer className="w-4 h-4" />
                                                    </Link>
                                                    <button 
                                                        onClick={() => openEditModal(inv)} 
                                                        className="p-3 rounded-xl bg-white/5 text-slate-400 hover:bg-slate-700 hover:text-white border border-white/5 transition-all"
                                                        title="Ubah"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDelete(inv.id)} 
                                                        className="p-3 rounded-xl bg-white/5 text-slate-400 hover:bg-red-500 hover:text-white border border-white/5 transition-all"
                                                        title="Hapus"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Mobile View */}
                <div className="md:hidden space-y-6">
                    {loading ? (
                        <div className="p-20 text-center">
                            <Loader2 className="w-10 h-10 text-accent animate-spin mx-auto mb-4" />
                            <p className="font-bold text-[10px] text-slate-500 uppercase tracking-widest">Sinkronisasi...</p>
                        </div>
                    ) : paginatedInvoices.map((inv: any) => (
                        <div key={inv.id} className="glass p-8 rounded-4xl space-y-6 shadow-xl border border-(--glass-border) bg-white/2">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-bold text-primary text-xl tracking-tight">{inv.customer_name}</h4>
                                    <p className="text-[10px] font-bold text-accent uppercase tracking-widest mt-2 px-3 py-1 bg-accent/5 rounded-lg border border-accent/10 inline-block">{inv.billing_month}</p>
                                </div>
                                <span className={`px-4 py-2 rounded-xl text-[9px] font-bold uppercase tracking-widest border ${inv.status === 'PAID' ? 'bg-accent/10 text-accent border-accent/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                                    {inv.status === 'PAID' ? 'LUNAS' : 'TERTUNDA'}
                                </span>
                            </div>
                            <div className="bg-slate-950/40 p-6 rounded-3xl border border-white/5">
                                <p className="text-[9px] uppercase font-bold text-slate-500 mb-2 tracking-widest">Jumlah Tagihan</p>
                                <p className="text-3xl font-bold text-primary tracking-tighter">Rp {parseInt(inv.amount).toLocaleString('id-ID')}</p>
                            </div>
                            <div className="flex gap-3">
                                {inv.status !== 'PAID' && (
                                    <button onClick={() => handleConfirmPayment(inv.id)} className="flex-1 py-4 rounded-xl bg-accent text-white font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all">
                                        <CheckCircle className="w-4 h-4" /> LUNASKAN
                                    </button>
                                )}
                                <Link href={`/invoices/print/${inv.id}`} className="flex-1 py-4 rounded-xl bg-white/5 text-slate-400 border border-white/5 font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2">
                                    <Printer className="w-4 h-4" /> CETAK
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Pagination */}
                {!loading && totalPages > 1 && (
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-8 pt-10 px-4">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                            Menampilkan <span className="text-primary font-bold">{paginatedInvoices.length}</span> dari <span className="text-primary font-bold">{filteredInvoices.length}</span> catatan
                        </p>
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-3.5 rounded-xl glass border border-white/5 text-slate-500 hover:text-accent disabled:opacity-20 transition-all active:scale-95"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <div className="flex items-center gap-2">
                                {[...Array(totalPages)].map((_, i) => (
                                    <button 
                                        key={i}
                                        onClick={() => setCurrentPage(i + 1)}
                                        className={`w-9 h-9 rounded-lg font-bold text-[10px] transition-all ${currentPage === i + 1 ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'bg-white/5 border border-white/5 text-slate-500'}`}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                            </div>
                            <button 
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="p-3.5 rounded-xl glass border border-white/5 text-slate-500 hover:text-accent disabled:opacity-20 transition-all active:scale-95"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            {showEditForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-slate-900 w-full max-w-lg p-10 lg:p-12 rounded-4xl shadow-2xl border border-white/10 animate-in zoom-in-95 duration-300 relative overflow-hidden">
                        <div className="absolute -top-32 -right-32 w-80 h-80 bg-accent/5 rounded-full blur-3xl pointer-events-none"></div>
                        
                        <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-8">
                            <div className="flex items-center gap-5">
                                <div className="w-14 h-14 rounded-2xl bg-accent/5 flex items-center justify-center text-accent border border-accent/10 shadow-inner">
                                    <Edit className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="text-2xl font-bold text-primary tracking-tight">Ubah Buku Kas</h4>
                                    <p className="text-[10px] text-muted font-bold tracking-widest uppercase mt-1">Penyesuaian catatan manual</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setShowEditForm(false)} 
                                className="text-slate-500 hover:text-white transition-all bg-white/5 p-3 rounded-xl"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="space-y-10">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 ml-1">Periode Siklus</label>
                                <input 
                                    type="text" 
                                    value={editData.billing_month} 
                                    onChange={(e) => setEditData({...editData, billing_month: e.target.value})} 
                                    className="w-full clean-input font-mono font-bold text-xl py-5 px-6" 
                                    placeholder="YYYY-MM"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 ml-1">Jumlah Penyesuaian</label>
                                <div className="relative">
                                    <input 
                                        type="number" 
                                        value={editData.amount} 
                                        onChange={(e) => setEditData({...editData, amount: parseInt(e.target.value)})} 
                                        className="w-full clean-input pl-16 font-mono font-bold text-2xl py-5" 
                                    />
                                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-lg">Rp</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 ml-1">Status Pelunasan</label>
                                <div className="relative">
                                    <select 
                                        value={editData.status} 
                                        onChange={(e) => setEditData({...editData, status: e.target.value})} 
                                        className="w-full clean-input appearance-none font-bold text-[10px] uppercase tracking-widest py-5 px-6 cursor-pointer"
                                    >
                                        <option value="UNPAID">VEKTOR BELUM BAYAR</option>
                                        <option value="PAID">CATATAN LUNAS</option>
                                    </select>
                                    <CheckCircle className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-accent/50 pointer-events-none" />
                                </div>
                            </div>
                        </div>

                        <div className="mt-16 flex flex-col sm:flex-row gap-5 pt-10 border-t border-white/5">
                            <button 
                                onClick={() => setShowEditForm(false)} 
                                className="flex-1 px-10 py-4 rounded-2xl text-slate-500 font-bold uppercase tracking-widest text-[10px] hover:bg-white/5 transition-all"
                            >
                                Batal
                            </button>
                            <button 
                                onClick={handleUpdate}
                                className="flex-1 px-12 py-4 rounded-2xl bg-accent hover:bg-accent/90 text-white font-bold shadow-xl transition-all flex items-center justify-center gap-3 active:scale-95 uppercase tracking-widest text-[10px]"
                            >
                                <Save className="w-5 h-5" /> Simpan Pembaruan
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
