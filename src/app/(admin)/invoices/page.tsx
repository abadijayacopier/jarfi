'use client';

import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { Printer, Edit, Trash2, CheckCircle, X, Save, Search, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function InvoicesPage() {
    const [invoices, setInvoices] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    const [showEditForm, setShowEditForm] = useState(false);
    const [editData, setEditData] = useState({ id: 0, amount: 0, billing_month: '', status: '' });

    // Pagination
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
            title: 'Generate Tagihan?',
            text: "Sistem akan otomatis membuat tagihan untuk semua pelanggan aktif.",
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3b82f6',
            cancelButtonColor: '#334155',
            confirmButtonText: 'Ya, Buat Tagihan',
            background: '#1e293b',
            color: '#fff'
        });

        if (!result.isConfirmed) return;

        Swal.fire({ title: 'Memproses...', allowOutsideClick: false, background: '#1e293b', color: '#fff', didOpen: () => { Swal.showLoading(); } });
        try {
            const res = await fetch('/api/invoices/generate', { method: 'POST' });
            const data = await res.json();
            if (res.ok) {
                Swal.fire({ 
                    icon: 'success', 
                    title: 'Berhasil', 
                    text: data.message || `${data.count} tagihan baru telah dibuat!`, 
                    background: '#1e293b', 
                    color: '#fff' 
                });
                fetchInvoices();
            } else {
                Swal.fire({ icon: 'error', title: 'Gagal', text: data.error, background: '#1e293b', color: '#fff' });
            }
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Error', text: 'Gagal terhubung ke API.', background: '#1e293b', color: '#fff' });
        }
    };

    const handleConfirmPayment = async (id: number) => {
        const result = await Swal.fire({
            title: 'Konfirmasi Lunas?',
            text: "Anda menyatakan bahwa tagihan ini telah dibayar LUNAS.",
            icon: 'success',
            showCancelButton: true,
            confirmButtonColor: '#14b8a6',
            cancelButtonColor: '#334155',
            confirmButtonText: 'Ya, Lunas!',
            background: '#1e293b',
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
                Swal.fire({ icon: 'success', title: 'Selesai', text: 'Status tagihan jadi Lunas', background: '#1e293b', color: '#fff', timer: 1500, showConfirmButton: false });
                fetchInvoices();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: 'Hapus Tagihan?',
            text: "Data tagihan ini akan dihapus permanen!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#f43f5e',
            cancelButtonColor: '#334155',
            confirmButtonText: 'Ya, hapus!',
            background: '#1e293b',
            color: '#fff'
        });

        if (!result.isConfirmed) return;

        try {
            const res = await fetch(`/api/invoices?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                fetchInvoices();
                Swal.fire({ icon: 'success', title: 'Terhapus!', text: 'Tagihan telah dihapus.', background: '#1e293b', color: '#fff' });
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
                Swal.fire({ icon: 'success', title: 'Diperbarui!', text: 'Data tagihan berhasil diubah.', background: '#1e293b', color: '#fff' });
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="animate-in fade-in duration-500 pb-20 space-y-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12">
                <div>
                    <h3 className="text-4xl font-black text-primary flex items-center gap-4">
                        <Printer className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                        Billing & Invoices
                    </h3>
                    <p className="text-muted font-medium mt-2 text-sm">Kelola penagihan bulanan dan status pembayaran seluruh pelanggan ISP.</p>
                </div>
                <button
                    onClick={handleGenerateInvoices}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4.5 px-10 rounded-2xl transition-all shadow-2xl shadow-indigo-600/30 hover:scale-105 active:scale-95 flex items-center gap-3 uppercase tracking-[0.2em] text-[10px]"
                >
                    <Save className="w-5 h-5" /> Generate Tagihan Baru
                </button>
            </div>

            {/* Content View: Table (Desktop) & Cards (Mobile) */}
            <div className="space-y-8">
                {/* Desktop Table View */}
                <div className="hidden md:block glass rounded-[3rem] overflow-hidden shadow-2xl border border-(--glass-border)">
                    <div className="p-10 border-b border-(--glass-border) flex flex-col md:flex-row justify-between items-start md:items-center gap-8 bg-white/5">
                        <h4 className="text-2xl font-black text-primary">Data Ledger Tagihan</h4>
                        <div className="relative w-full md:w-[450px]">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                            <input 
                                type="text" 
                                placeholder="Cari nama, username, atau bulan..." 
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                className="w-full bg-slate-100 dark:bg-slate-900/50 border-2 border-(--glass-border) rounded-3xl py-4.5 pl-14 pr-6 text-sm font-bold text-primary focus:outline-none focus:border-indigo-500 transition-all shadow-inner"
                            />
                        </div>
                    </div>
                    <div className="overflow-x-auto min-h-[450px]">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-white/2 uppercase text-[10px] tracking-[0.3em] font-black text-slate-500 border-b border-(--glass-border)">
                                    <th className="p-8">Bulan Billing</th>
                                    <th className="p-8">Profil Pelanggan</th>
                                    <th className="p-8">Total Amount</th>
                                    <th className="p-8">Status</th>
                                    <th className="p-8">Log Pembayaran</th>
                                    <th className="p-8 text-center">Aksi Manajemen</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-(--glass-border) text-sm">
                                {loading ? (
                                    <tr><td colSpan={6} className="p-32 text-center text-slate-500">
                                        <div className="flex flex-col items-center gap-6 animate-pulse">
                                            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-indigo-600"></div>
                                            <span className="font-black uppercase tracking-[0.3em] text-[10px]">Menyinkronkan data ledger...</span>
                                        </div>
                                    </td></tr>
                                ) : invoices.length === 0 ? (
                                    <tr><td colSpan={6} className="p-32 text-center text-slate-500 font-black uppercase tracking-widest opacity-60">Database tagihan masih kosong.</td></tr>
                                ) : (
                                    invoices
                                        .filter((inv: any) => 
                                            (inv.customer_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                                            (inv.pppoe_username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                                            (inv.billing_month || '').includes(searchTerm)
                                        )
                                        .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                                        .map((inv: any) => (
                                        <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-white/2 transition-all group">
                                            <td className="p-8 font-black text-primary group-hover:text-indigo-600 transition-colors uppercase tracking-[0.2em] text-[11px]">{inv.billing_month}</td>
                                            <td className="p-8">
                                                <div className="font-black text-primary text-lg tracking-tight leading-tight">{inv.customer_name}</div>
                                                <div className="text-[10px] font-black font-mono text-muted mt-2 uppercase tracking-widest bg-slate-100 dark:bg-white/5 inline-block px-2 py-1 rounded-md">{inv.pppoe_username}</div>
                                            </td>
                                             <td className="p-8 font-black text-indigo-600 dark:text-indigo-400 text-2xl tracking-tight">
                                                 <div className="flex items-center gap-4">
                                                     Rp {parseInt(inv.amount).toLocaleString('id-ID')}
                                                     {parseInt(inv.amount) === 0 && (
                                                         <div className="group/warn relative">
                                                             <AlertTriangle className="w-6 h-6 text-amber-500 animate-pulse" />
                                                             <div className="absolute left-full ml-4 px-4 py-3 bg-slate-950 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl whitespace-nowrap opacity-0 group-hover/warn:opacity-100 transition-all pointer-events-none z-50 shadow-2xl border border-white/10 border-l-4 border-l-amber-500">
                                                                 Konfigurasi paket belum diatur
                                                             </div>
                                                         </div>
                                                     )}
                                                 </div>
                                             </td>
                                            <td className="p-8">
                                                <span className={`px-5 py-2.5 rounded-2xl text-[10px] font-black tracking-[0.25em] uppercase border shadow-sm ${inv.status === 'PAID' ? 'bg-teal-500/10 text-teal-600 border-teal-500/20' : 'bg-red-500/10 text-red-600 border-red-500/20'}`}>
                                                    {inv.status}
                                                </span>
                                            </td>
                                            <td className="p-8 text-muted font-black text-[10px] uppercase tracking-[0.2em] opacity-80">
                                                {inv.paid_at ? (
                                                    <div className="flex items-center gap-2">
                                                        <CheckCircle className="w-3.5 h-3.5 text-teal-500" />
                                                        {new Date(inv.paid_at).toLocaleString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                ) : <span className="opacity-30">Pending Transaction</span>}
                                            </td>
                                            <td className="p-8">
                                                <div className="flex items-center justify-center gap-4">
                                                    {inv.status === 'UNPAID' && (
                                                        <button 
                                                            onClick={() => handleConfirmPayment(inv.id)} 
                                                            title="Konfirmasi Pelunasan" 
                                                            className="p-4 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 hover:bg-teal-600 hover:text-white border-2 border-teal-500/10 hover:scale-110 active:scale-90 transition-all shadow-md"
                                                        >
                                                            <CheckCircle className="w-5 h-5" />
                                                        </button>
                                                    )}
                                                    <Link 
                                                        href={`/invoices/print/${inv.id}`} 
                                                        title="Cetak Invoice Fisik" 
                                                        className="p-4 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white border-2 border-indigo-500/10 hover:scale-110 active:scale-90 transition-all shadow-md"
                                                    >
                                                        <Printer className="w-5 h-5" />
                                                    </Link>
                                                    <button 
                                                        onClick={() => openEditModal(inv)} 
                                                        title="Koreksi Data Tagihan" 
                                                        className="p-4 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white border-2 border-blue-500/10 hover:scale-110 active:scale-90 transition-all shadow-md"
                                                    >
                                                        <Edit className="w-5 h-5" />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDelete(inv.id)} 
                                                        title="Hapus Permanent" 
                                                        className="p-4 rounded-2xl bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-600 hover:text-white border-2 border-red-500/10 hover:scale-110 active:scale-90 transition-all shadow-md"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
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

                {/* Mobile Card View */}
                <div className="md:hidden space-y-6">
                    <div className="glass p-6 rounded-4xl border border-(--glass-border) shadow-xl">
                        <div className="relative">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                            <input 
                                type="text" 
                                placeholder="Cari tagihan..." 
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                className="w-full bg-slate-100 dark:bg-slate-900/50 border-2 border-(--glass-border) rounded-[1.25rem] py-4.5 pl-14 pr-6 text-sm font-bold text-primary focus:outline-none focus:border-indigo-500 shadow-inner"
                            />
                        </div>
                    </div>
                    {loading ? (
                        <div className="p-20 text-center text-slate-500 animate-pulse font-black uppercase tracking-[0.3em] text-[10px]">Sinkronisasi...</div>
                    ) : invoices.length === 0 ? (
                        <div className="p-20 text-center text-slate-500 font-black uppercase text-[10px] tracking-widest opacity-60">Tidak ada data</div>
                    ) : (
                        invoices
                            .filter((inv: any) => 
                                (inv.customer_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                                (inv.pppoe_username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                                (inv.billing_month || '').includes(searchTerm)
                            )
                            .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                            .map((inv: any) => (
                                <div key={inv.id} className="glass p-8 rounded-[2.5rem] space-y-6 shadow-2xl border border-(--glass-border) relative overflow-hidden group">
                                    <div className="flex justify-between items-start relative z-10">
                                        <div>
                                            <h4 className="font-black text-primary text-2xl leading-tight tracking-tight">{inv.customer_name}</h4>
                                            <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.2em] mt-3 bg-indigo-500/5 px-3 py-1.5 rounded-xl border border-indigo-500/10 inline-block">{inv.billing_month}</p>
                                        </div>
                                        <span className={`px-4 py-2 rounded-2xl text-[9px] font-black uppercase tracking-[0.25em] border shadow-sm ${inv.status === 'PAID' ? 'bg-teal-500/10 text-teal-600 border-teal-500/20' : 'bg-red-500/10 text-red-600 border-red-500/20'}`}>
                                            {inv.status}
                                        </span>
                                    </div>
                                    <div className="bg-slate-100 dark:bg-slate-900/50 p-6 rounded-4xl border-2 border-(--glass-border) shadow-inner relative z-10">
                                        <p className="text-[9px] uppercase font-black text-slate-500 mb-2 tracking-[0.2em]">Current Billing Amount</p>
                                        <p className="text-3xl font-black text-primary tracking-tight">Rp {parseInt(inv.amount).toLocaleString('id-ID')}</p>
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-4 relative z-10">
                                        {inv.status === 'UNPAID' && (
                                            <button onClick={() => handleConfirmPayment(inv.id)} className="flex-1 py-4.5 rounded-2xl bg-teal-500/10 text-teal-600 border-2 border-teal-500/10 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all shadow-lg hover:bg-teal-600 hover:text-white">
                                                <CheckCircle className="w-4 h-4" /> Tandai Lunas
                                            </button>
                                        )}
                                        <Link href={`/invoices/print/${inv.id}`} className="flex-1 py-4.5 rounded-2xl bg-indigo-500/10 text-indigo-600 border-2 border-indigo-500/10 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all shadow-lg hover:bg-indigo-600 hover:text-white">
                                            <Printer className="w-4 h-4" /> Cetak Invoice
                                        </Link>
                                    </div>
                                    <div className="flex gap-4 pt-2 relative z-10">
                                        <button onClick={() => openEditModal(inv)} className="flex-1 py-4 rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 border-2 border-(--glass-border) text-[9px] font-black uppercase tracking-[0.2em] hover:text-primary transition-all">Edit Data</button>
                                        <button onClick={() => handleDelete(inv.id)} className="flex-1 py-4 rounded-2xl bg-red-500/5 text-red-600 border-2 border-red-500/10 text-[9px] font-black uppercase tracking-[0.2em] hover:bg-red-500 hover:text-white transition-all">Hapus Tagihan</button>
                                    </div>
                                </div>
                            ))
                    )}
                </div>

                {/* Pagination Controls */}
                {!loading && invoices.length > itemsPerPage && (
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-8 pt-12 px-4">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">
                            Found <span className="text-primary font-black">{invoices.filter((inv: any) => (inv.customer_name || '').toLowerCase().includes(searchTerm.toLowerCase()) || (inv.pppoe_username || '').toLowerCase().includes(searchTerm.toLowerCase())).length}</span> Billing Records
                        </p>
                        <div className="flex items-center gap-4">
                            <button 
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="px-8 py-4 rounded-2xl glass border-2 border-(--glass-border) text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-primary disabled:opacity-30 transition-all shadow-xl shadow-black/5 active:scale-95"
                            >
                                Previous
                            </button>
                            <button 
                                onClick={() => setCurrentPage(p => p + 1)}
                                disabled={currentPage >= Math.ceil(invoices.filter((inv: any) => (inv.customer_name || '').toLowerCase().includes(searchTerm.toLowerCase()) || (inv.pppoe_username || '').toLowerCase().includes(searchTerm.toLowerCase())).length / itemsPerPage)}
                                className="px-8 py-4 rounded-2xl glass border-2 border-(--glass-border) text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-primary disabled:opacity-30 transition-all shadow-xl shadow-black/5 active:scale-95"
                            >
                                Next Page
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            {showEditForm && (
                <div className="fixed inset-0 z-60 flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-500">
                    <div className="glass w-full max-w-lg p-10 lg:p-12 rounded-[3rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] border border-(--glass-border) animate-in zoom-in-95 duration-500 relative overflow-hidden">
                        <div className="absolute -top-32 -right-32 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>
                        
                        <div className="flex justify-between items-center mb-10 border-b border-(--glass-border) pb-8 relative z-10">
                            <div className="flex items-center gap-5">
                                <div className="w-14 h-14 rounded-2xl bg-teal-500/10 flex items-center justify-center text-teal-600 dark:text-teal-400 border-2 border-teal-500/20 shadow-inner">
                                    <Edit className="w-7 h-7" />
                                </div>
                                <div>
                                    <h4 className="text-2xl font-black text-primary">Koreksi Tagihan</h4>
                                    <p className="text-[10px] text-muted font-black tracking-[0.2em] uppercase mt-1">Manual adjustment utility</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setShowEditForm(false)} 
                                className="text-slate-400 hover:text-primary transition-all bg-slate-100 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-800 p-3 rounded-2xl active:scale-90 shadow-sm"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="space-y-10 relative z-10">
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 ml-1">Periode Tagihan</label>
                                <input 
                                    type="text" 
                                    value={editData.billing_month} 
                                    onChange={(e) => setEditData({...editData, billing_month: e.target.value})} 
                                    className="w-full clean-input font-mono font-black text-xl py-5 px-6" 
                                    placeholder="YYYY-MM"
                                />
                                <p className="text-[10px] text-slate-500 mt-4 ml-1 font-bold italic opacity-70 uppercase tracking-widest">Gunakan format standarisasi: 2024-05</p>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 ml-1">Koreksi Nominal</label>
                                <div className="relative">
                                    <input 
                                        type="number" 
                                        value={editData.amount} 
                                        onChange={(e) => setEditData({...editData, amount: parseInt(e.target.value)})} 
                                        className="w-full clean-input pl-16 font-mono font-black text-2xl py-5" 
                                    />
                                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 font-black text-lg">Rp</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 ml-1">Status Final Tagihan</label>
                                <div className="relative">
                                    <select 
                                        value={editData.status} 
                                        onChange={(e) => setEditData({...editData, status: e.target.value})} 
                                        className="w-full clean-input appearance-none font-black text-xs uppercase tracking-[0.2em] py-5 px-6 cursor-pointer"
                                    >
                                        <option value="UNPAID">BELUM DIBAYAR (UNPAID)</option>
                                        <option value="PAID">LUNAS (PAID)</option>
                                    </select>
                                    <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                                        <CheckCircle className="w-5 h-5 text-indigo-500" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-16 flex flex-col sm:flex-row gap-5 pt-10 border-t border-(--glass-border) relative z-10">
                            <button 
                                onClick={() => setShowEditForm(false)} 
                                className="flex-1 px-10 py-5 rounded-2xl text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest text-[10px] hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
                            >
                                Batalkan
                            </button>
                            <button 
                                onClick={handleUpdate}
                                className="flex-1 px-12 py-5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black shadow-2xl shadow-indigo-600/30 transition-all flex items-center justify-center gap-4 hover:scale-105 active:scale-95 uppercase tracking-[0.2em] text-[10px]"
                            >
                                <Save className="w-5 h-5" /> Simpan Update
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
