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
        <div className="animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-8">
                <h3 className="text-3xl font-bold text-white">Tagihan (Invoices)</h3>
                <button
                    onClick={handleGenerateInvoices}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-2xl transition-all shadow-[0_0_15px_rgba(37,99,235,0.4)] hover:shadow-[0_0_25px_rgba(37,99,235,0.6)] flex items-center gap-2"
                >
                    <Save className="w-5 h-5" /> Generate Tagihan Bulan Ini
                </button>
            </div>

            {/* Content View: Table (Desktop) & Cards (Mobile) */}
            <div className="space-y-4">
                {/* Desktop Table View */}
                <div className="hidden md:block glass rounded-4xl border border-white/10 overflow-hidden shadow-2xl">
                    <div className="p-6 border-b border-white/10 bg-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <h4 className="text-xl font-bold text-white">Data Tagihan</h4>
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input 
                                type="text" 
                                placeholder="Cari nama, username, atau bulan..." 
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-2.5 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all shadow-inner"
                            />
                        </div>
                    </div>
                    <div className="overflow-x-auto min-h-[400px]">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/10 bg-white/5 uppercase text-[10px] tracking-widest font-black text-slate-400">
                                    <th className="p-5">Bulan</th>
                                    <th className="p-5">Pelanggan</th>
                                    <th className="p-5">Total</th>
                                    <th className="p-5">Status</th>
                                    <th className="p-5">Tgl Lunas</th>
                                    <th className="p-5 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-sm">
                                {loading ? (
                                    <tr><td colSpan={6} className="p-20 text-center text-slate-400">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
                                            Menarik data tagihan...
                                        </div>
                                    </td></tr>
                                ) : invoices.length === 0 ? (
                                    <tr><td colSpan={6} className="p-20 text-center text-slate-400">Belum ada tagihan.</td></tr>
                                ) : (
                                    invoices
                                        .filter((inv: any) => 
                                            (inv.customer_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                                            (inv.pppoe_username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                                            (inv.billing_month || '').includes(searchTerm)
                                        )
                                        .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                                        .map((inv: any) => (
                                        <tr key={inv.id} className="hover:bg-white/5 transition-all group">
                                            <td className="p-5 font-bold text-white group-hover:text-indigo-400 transition-colors">{inv.billing_month}</td>
                                            <td className="p-5">
                                                <div className="font-bold text-white text-base leading-tight">{inv.customer_name}</div>
                                                <div className="text-xs font-mono text-slate-500 mt-0.5">{inv.pppoe_username}</div>
                                            </td>
                                             <td className="p-5 font-black text-indigo-400 text-lg">
                                                 <div className="flex items-center gap-2">
                                                     Rp {parseInt(inv.amount).toLocaleString('id-ID')}
                                                     {parseInt(inv.amount) === 0 && (
                                                         <div className="group/warn relative">
                                                             <AlertTriangle className="w-4 h-4 text-amber-500 animate-pulse" />
                                                             <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-[10px] rounded whitespace-nowrap opacity-0 group-hover/warn:opacity-100 transition-opacity pointer-events-none z-50">
                                                                 Paket belum diatur
                                                             </div>
                                                         </div>
                                                     )}
                                                 </div>
                                             </td>
                                            <td className="p-5">
                                                <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black tracking-widest uppercase border ${inv.status === 'PAID' ? 'bg-teal-500/10 text-teal-400 border-teal-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30'}`}>
                                                    {inv.status}
                                                </span>
                                            </td>
                                            <td className="p-5 text-slate-400 font-medium">
                                                {inv.paid_at ? new Date(inv.paid_at).toLocaleString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : <span className="opacity-30">Belum Bayar</span>}
                                            </td>
                                            <td className="p-5">
                                                <div className="flex items-center justify-center gap-2">
                                                    {inv.status === 'UNPAID' && (
                                                        <button onClick={() => handleConfirmPayment(inv.id)} title="Set Lunas" className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400 hover:bg-teal-500/20 border border-teal-500/20 hover:scale-110 transition-all">
                                                            <CheckCircle className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    <Link href={`/invoices/print/${inv.id}`} title="Cetak Invoice" className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/20 hover:scale-110 transition-all">
                                                        <Printer className="w-4 h-4" />
                                                    </Link>
                                                    <button onClick={() => openEditModal(inv)} title="Edit" className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 hover:scale-110 transition-all">
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => handleDelete(inv.id)} title="Hapus" className="p-2.5 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 hover:scale-110 transition-all">
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

                {/* Mobile Card View */}
                <div className="md:hidden space-y-4">
                    <div className="glass p-4 rounded-2xl border border-white/10 mb-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input 
                                type="text" 
                                placeholder="Cari tagihan..." 
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-indigo-500 shadow-inner"
                            />
                        </div>
                    </div>
                    {loading ? (
                        <div className="p-10 text-center text-slate-500 animate-pulse">Memuat...</div>
                    ) : invoices.length === 0 ? (
                        <div className="p-10 text-center text-slate-500">Kosong</div>
                    ) : (
                        invoices
                            .filter((inv: any) => 
                                (inv.customer_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                                (inv.pppoe_username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                                (inv.billing_month || '').includes(searchTerm)
                            )
                            .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                            .map((inv: any) => (
                                <div key={inv.id} className="glass p-5 rounded-3xl border border-white/10 space-y-4 shadow-xl">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="font-black text-white text-lg leading-tight">{inv.customer_name}</h4>
                                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mt-1">{inv.billing_month}</p>
                                        </div>
                                        <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-tighter ${inv.status === 'PAID' ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                                            {inv.status}
                                        </span>
                                    </div>
                                    <div className="bg-slate-900/50 p-4 rounded-2xl border border-white/5">
                                        <p className="text-[9px] uppercase font-black text-slate-500 mb-1">Total Tagihan</p>
                                        <p className="text-xl font-black text-white">Rp {parseInt(inv.amount).toLocaleString('id-ID')}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        {inv.status === 'UNPAID' && (
                                            <button onClick={() => handleConfirmPayment(inv.id)} className="flex-1 py-3 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all">
                                                <CheckCircle className="w-3 h-3" /> Lunas
                                            </button>
                                        )}
                                        <Link href={`/invoices/print/${inv.id}`} className="flex-1 py-3 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all">
                                            <Printer className="w-3 h-3" /> Cetak
                                        </Link>
                                    </div>
                                    <div className="flex gap-2 pt-2">
                                        <button onClick={() => openEditModal(inv)} className="flex-1 py-2.5 rounded-xl bg-blue-500/5 text-blue-400 border border-white/5 text-[9px] font-bold uppercase tracking-widest">Edit</button>
                                        <button onClick={() => handleDelete(inv.id)} className="flex-1 py-2.5 rounded-xl bg-red-500/5 text-red-500 border border-white/5 text-[9px] font-bold uppercase tracking-widest">Hapus</button>
                                    </div>
                                </div>
                            ))
                    )}
                </div>

                {/* Pagination Controls */}
                {!loading && invoices.length > itemsPerPage && (
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-8 px-2">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                            Total <span className="text-white">{invoices.filter((inv: any) => (inv.customer_name || '').toLowerCase().includes(searchTerm.toLowerCase()) || (inv.pppoe_username || '').toLowerCase().includes(searchTerm.toLowerCase())).length}</span> Tagihan Ditemukan
                        </p>
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="px-5 py-2.5 rounded-xl glass border border-white/10 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white disabled:opacity-30 transition-all"
                            >
                                Prev
                            </button>
                            <button 
                                onClick={() => setCurrentPage(p => p + 1)}
                                disabled={currentPage >= Math.ceil(invoices.filter((inv: any) => (inv.customer_name || '').toLowerCase().includes(searchTerm.toLowerCase()) || (inv.pppoe_username || '').toLowerCase().includes(searchTerm.toLowerCase())).length / itemsPerPage)}
                                className="px-5 py-2.5 rounded-xl glass border border-white/10 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white disabled:opacity-30 transition-all"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            {showEditForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="bg-slate-800 w-full max-w-lg p-8 rounded-4xl border border-white/10 shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-8">
                            <h4 className="text-2xl font-black text-white flex items-center gap-3">
                                <Edit className="text-teal-400 w-6 h-6" /> Edit Tagihan
                            </h4>
                            <button onClick={() => setShowEditForm(false)} className="text-slate-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 p-2 rounded-full">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Bulan Tagihan</label>
                                <input 
                                    type="text" 
                                    value={editData.billing_month} 
                                    onChange={(e) => setEditData({...editData, billing_month: e.target.value})} 
                                    className="w-full bg-slate-900 border border-slate-700 rounded-2xl p-4 text-white focus:outline-none focus:border-indigo-500 transition-all font-mono" 
                                    placeholder="YYYY-MM"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Total Tagihan (Rp)</label>
                                <input 
                                    type="number" 
                                    value={editData.amount} 
                                    onChange={(e) => setEditData({...editData, amount: parseInt(e.target.value)})} 
                                    className="w-full bg-slate-900 border border-slate-700 rounded-2xl p-4 text-white focus:outline-none focus:border-indigo-500 transition-all font-mono" 
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Status Pembayaran</label>
                                <select 
                                    value={editData.status} 
                                    onChange={(e) => setEditData({...editData, status: e.target.value})} 
                                    className="w-full bg-slate-900 border border-slate-700 rounded-2xl p-4 text-white focus:outline-none focus:border-indigo-500 transition-all appearance-none"
                                >
                                    <option value="UNPAID">BELUM DIBAYAR (UNPAID)</option>
                                    <option value="PAID">LUNAS (PAID)</option>
                                </select>
                            </div>
                        </div>

                        <div className="mt-10 flex gap-4">
                            <button onClick={() => setShowEditForm(false)} className="flex-1 py-4 rounded-2xl hover:bg-white/5 transition-colors text-slate-300 font-bold">Batal</button>
                            <button onClick={handleUpdate} className="flex-1 py-4 rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-900 font-black shadow-lg shadow-teal-500/20 transition-all flex items-center justify-center gap-2">
                                <Save className="w-5 h-5" /> Simpan Perubahan
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
