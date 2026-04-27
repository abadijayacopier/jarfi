'use client';

import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { Wifi, PlusCircle, Printer, Trash2, Eye, Settings, Search } from 'lucide-react';
import Link from 'next/link';

export default function VouchersPage() {
    const [vouchers, setVouchers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [routers, setRouters] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showAddForm, setShowAddForm] = useState(false);
    const [formData, setFormData] = useState({ router_id: '', quantity: 10, price: 5000, profile: '', prefix: 'VC-' });
    const [profiles, setProfiles] = useState([]);
    const [loadingProfiles, setLoadingProfiles] = useState(false);
    const [generating, setGenerating] = useState(false);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    useEffect(() => {
        fetchVouchers();
        fetchRouters();
    }, []);

    useEffect(() => {
        if (formData.router_id) {
            fetchProfiles(formData.router_id);
        } else {
            setProfiles([]);
        }
    }, [formData.router_id]);

    const fetchProfiles = async (routerId: string) => {
        setLoadingProfiles(true);
        try {
            const res = await fetch(`/api/mikrotik/profiles?routerId=${routerId}`);
            const data = await res.json();
            if (res.ok) {
                setProfiles(data.profiles || []);
                if (data.profiles && data.profiles.length > 0) {
                    setFormData(prev => ({ ...prev, profile: data.profiles[0] }));
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingProfiles(false);
        }
    };

    const fetchVouchers = async () => {
        try {
            const res = await fetch('/api/vouchers');
            const data = await res.json();
            if (res.ok) setVouchers(data.vouchers || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchRouters = async () => {
        try {
            const res = await fetch('/api/routers');
            const data = await res.json();
            if (res.ok) setRouters(data.routers || []);
        } catch (error) {
            console.error(error);
        }
    };

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.router_id) {
            Swal.fire({ icon: 'warning', title: 'Pilih Router', text: 'Anda harus memilih Router Mikrotik terlebih dahulu.', background: '#1e293b', color: '#fff' });
            return;
        }

        setGenerating(true);
        Swal.fire({ title: 'Membuat Voucher...', text: `Sedang menginjeksi ${formData.quantity} voucher secara rapi ke Mikrotik. Jangan tutup halaman ini!`, allowOutsideClick: false, background: '#1e293b', color: '#fff', didOpen: () => { Swal.showLoading(); } });

        try {
            const res = await fetch('/api/vouchers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await res.json();

            if (res.ok) {
                setShowAddForm(false);
                fetchVouchers();
                Swal.fire({
                    icon: 'success',
                    title: 'Selesai!',
                    text: `${data.count} Voucher berhasil di-generate dan ditarik ke tabel, siap cetak!`,
                    background: '#1e293b',
                    color: '#fff'
                });
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Gagal',
                    text: data.error || 'Terjadi kesalahan saat membuat batch voucher',
                    background: '#1e293b',
                    color: '#fff'
                });
            }
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Error Lokal', text: 'Gagal menghubungi server backend API', background: '#1e293b', color: '#fff' });
        } finally {
            setGenerating(false);
        }
    };

    const handleDeleteAll = async () => {
        const result = await Swal.fire({
            title: 'Hapus Semua?',
            text: "Data voucher di database lokal akan dikosongkan (tidak menghapus di Mikrotik).",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#f43f5e',
            cancelButtonColor: '#334155',
            confirmButtonText: 'Ya, Kosongkan!',
            background: '#1e293b',
            color: '#fff'
        });

        if (!result.isConfirmed) return;

        try {
            const res = await fetch('/api/vouchers', { method: 'DELETE' });
            if (res.ok) {
                fetchVouchers();
                Swal.fire({ icon: 'success', title: 'Terhapus!', text: 'Database voucher lokal telah dikosongkan.', background: '#1e293b', color: '#fff' });
            }
        } catch (err) { console.error(err); }
    };

    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: 'Hapus Voucher?',
            text: "Voucher ini akan dihapus dari database lokal.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#f43f5e',
            cancelButtonColor: '#334155',
            confirmButtonText: 'Ya, Hapus!',
            background: '#1e293b',
            color: '#fff'
        });

        if (!result.isConfirmed) return;

        try {
            const res = await fetch(`/api/vouchers?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                fetchVouchers();
                Swal.fire({ icon: 'success', title: 'Terhapus!', text: 'Voucher telah dihapus.', background: '#1e293b', color: '#fff', timer: 1500, showConfirmButton: false });
            }
        } catch (err) { console.error(err); }
    };

    return (
        <div className="animate-in fade-in duration-500 pb-20 space-y-10">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12">
                <div>
                    <h3 className="text-4xl font-black text-primary flex items-center gap-4">
                        <Wifi className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                        Hotspot Vouchers
                    </h3>
                    <p className="text-muted font-medium mt-2">Generate massal *user* hotspot ke mikrotik untuk bisnis eceran.</p>
                </div>
                <div className="flex items-center gap-5">
                    <button
                        onClick={handleDeleteAll}
                        className="bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 font-black py-4 px-8 rounded-2xl transition-all border border-red-500/10 flex items-center gap-3 uppercase tracking-widest text-[10px]"
                    >
                        <Trash2 className="w-5 h-5" />
                        Kosongkan Database
                    </button>
                    <button
                        onClick={() => setShowAddForm(!showAddForm)}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 px-8 rounded-2xl transition-all shadow-xl shadow-indigo-600/20 flex items-center gap-3 uppercase tracking-widest text-[10px] active:scale-95"
                    >
                        <PlusCircle className="w-5 h-5" />
                        {showAddForm ? 'Tutup Form' : 'Batch Generate'}
                    </button>
                </div>
            </div>

            {showAddForm && (
                <div className="glass p-10 rounded-[3rem] border border-(--glass-border) animate-in slide-in-from-top-6 duration-500 shadow-2xl relative overflow-hidden">
                    <div className="absolute -top-10 -right-10 p-10 opacity-[0.03] dark:opacity-[0.07] pointer-events-none rotate-12">
                        <Wifi className="w-64 h-64 text-primary" />
                    </div>
                    <div className="flex items-center gap-4 mb-10">
                        <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                            <PlusCircle className="w-6 h-6" />
                        </div>
                        <div>
                            <h4 className="text-2xl font-black text-primary">Instruksi Generate Voucher</h4>
                            <p className="text-muted text-xs font-medium mt-1">Konfigurasi parameter batch voucher untuk diinjeksi ke router.</p>
                        </div>
                    </div>

                    <form onSubmit={handleGenerate} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
                        <div className="space-y-3">
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Pilih Router Mikrotik</label>
                            <select required value={formData.router_id} onChange={(e) => setFormData({ ...formData, router_id: e.target.value })} className="w-full clean-input text-sm font-bold">
                                <option value="">-- Pilih Router --</option>
                                {routers.map((r: any) => <option key={r.id} value={r.id}>{r.name} ({r.ip_address})</option>)}
                            </select>
                        </div>
                        <div className="space-y-3">
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Jumlah Voucher</label>
                            <input type="number" required min="1" max="1000" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })} className="w-full clean-input text-sm font-mono font-black" />
                        </div>
                        <div className="space-y-3">
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Harga Jual (Rp)</label>
                            <input type="number" required value={formData.price} onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) })} className="w-full clean-input text-sm font-mono font-black" />
                        </div>
                        <div className="space-y-3">
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Profil Hotspot (Dari Mikrotik)</label>
                            <select 
                                required 
                                value={formData.profile} 
                                onChange={(e) => setFormData({ ...formData, profile: e.target.value })} 
                                className="w-full clean-input text-sm font-black uppercase tracking-widest"
                                disabled={loadingProfiles || profiles.length === 0}
                            >
                                {loadingProfiles ? (
                                    <option>Menarik profil...</option>
                                ) : profiles.length === 0 ? (
                                    <option value="">-- Pilih Router Dulu --</option>
                                ) : (
                                    profiles.map((p) => <option key={p} value={p}>{p}</option>)
                                )}
                            </select>
                        </div>
                        <div className="space-y-3">
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Prefix Kode</label>
                            <input type="text" value={formData.prefix} onChange={(e) => setFormData({ ...formData, prefix: e.target.value })} className="w-full clean-input text-sm font-mono font-black" placeholder="VC-" />
                        </div>
                        <div className="lg:col-span-3 flex justify-end mt-6 pt-10 border-t border-(--glass-border)">
                            <button 
                                type="submit" 
                                disabled={generating} 
                                className="px-12 py-5 rounded-4xl bg-indigo-600 hover:bg-indigo-500 text-white font-black shadow-xl shadow-indigo-600/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 flex items-center gap-4 uppercase tracking-widest text-xs"
                            >
                                <Wifi className="w-6 h-6" /> Mulai Generate & Injeksi
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Screen Area - Tabel Admin */}
            <div className="space-y-6">
                {/* Desktop Table View */}
                <div className="hidden md:block glass rounded-[3rem] overflow-hidden shadow-2xl">
                    <div className="p-10 border-b border-(--glass-border) flex flex-col md:flex-row justify-between items-center gap-8">
                        <div className="flex items-center gap-6">
                            <h4 className="text-xl font-black text-primary uppercase tracking-widest">
                                Database Voucher
                            </h4>
                            <div className="flex gap-3">
                                <Link href="/vouchers/profiles" className="bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 px-5 py-2.5 rounded-xl text-[10px] text-muted font-black uppercase tracking-widest transition flex items-center gap-2 border border-(--glass-border)">
                                    <Settings className="w-4 h-4" /> Atur Paket
                                </Link>
                                <Link href="/vouchers/print" className="bg-indigo-500/10 hover:bg-indigo-500/20 px-5 py-2.5 rounded-xl text-[10px] text-indigo-600 dark:text-indigo-400 font-black uppercase tracking-widest transition flex items-center gap-2 border border-indigo-500/10">
                                    <Printer className="w-4 h-4" /> Cetak
                                </Link>
                            </div>
                        </div>
                        
                        <div className="relative w-full md:w-md">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                            <input 
                                type="text" 
                                placeholder="Cari kode, profil, atau router..." 
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                className="w-full bg-slate-100 dark:bg-slate-900/50 border border-(--glass-border) rounded-2xl py-4 pl-14 pr-6 text-sm text-primary focus:outline-none focus:border-indigo-500 transition-all font-bold shadow-inner"
                            />
                        </div>
                    </div>
                    
                    <div className="overflow-x-auto min-h-[400px]">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white/5 uppercase text-[10px] tracking-[0.2em] font-black text-slate-500">
                                    <th className="px-10 py-8">Kode Voucher</th>
                                    <th className="px-10 py-8">Router</th>
                                    <th className="px-10 py-8">Profil</th>
                                    <th className="px-10 py-8">Harga</th>
                                    <th className="px-10 py-8 text-center">Status</th>
                                    <th className="px-10 py-8 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {loading ? (
                                    <tr><td colSpan={6} className="p-32 text-center text-slate-500 font-black uppercase tracking-[0.3em] animate-pulse text-xs">Menarik data voucher...</td></tr>
                                ) : vouchers.length === 0 ? (
                                    <tr><td colSpan={6} className="p-32 text-center text-slate-500 font-black uppercase tracking-[0.3em] text-xs">Database voucher kosong</td></tr>
                                ) : (
                                    vouchers
                                        .filter((v: any) => 
                                            (v.code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                                            (v.profile || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                                            (v.router_name || '').toLowerCase().includes(searchTerm.toLowerCase())
                                        )
                                        .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                                        .map((v: any) => (
                                            <tr key={v.id} className="hover:bg-white/5 transition-all group">
                                                <td className="px-10 py-8">
                                                    <div>
                                                        <p className="font-mono font-black text-indigo-600 dark:text-indigo-400 text-2xl tracking-widest group-hover:scale-105 transition-transform origin-left">{v.code}</p>
                                                        <p className="text-[10px] font-bold text-muted uppercase tracking-widest mt-1">Pass: {v.password}</p>
                                                    </div>
                                                </td>
                                                <td className="px-10 py-8">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 border border-(--glass-border)">
                                                            <Settings className="w-4 h-4" />
                                                        </div>
                                                        <p className="text-primary font-bold text-sm tracking-tight">{v.router_name}</p>
                                                    </div>
                                                </td>
                                                <td className="px-10 py-8">
                                                    <span className="px-3 py-1.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase rounded-xl border border-indigo-500/10 tracking-widest">{v.profile}</span>
                                                </td>
                                                <td className="px-10 py-8">
                                                    <p className="font-black text-primary text-lg">Rp {parseInt(v.price).toLocaleString('id-ID')}</p>
                                                </td>
                                                <td className="px-10 py-8 text-center">
                                                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black tracking-[0.2em] uppercase border ${v.status === 'AVAILABLE' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/10' : 'bg-slate-500/10 text-slate-500 border-slate-500/10'}`}>
                                                        {v.status === 'AVAILABLE' ? 'Ready' : 'Used'}
                                                    </span>
                                                </td>
                                                <td className="px-10 py-8 text-right">
                                                    <button onClick={() => handleDelete(v.id)} className="p-3.5 rounded-2xl bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-600 hover:text-white border border-red-500/10 transition-all opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 shadow-lg active:scale-90">
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
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
                    {loading ? (
                        <div className="p-20 text-center text-slate-500 font-black uppercase tracking-widest text-xs animate-pulse">Memuat...</div>
                    ) : vouchers.length === 0 ? (
                        <div className="p-20 text-center text-slate-500 font-black uppercase tracking-widest text-xs">Kosong</div>
                    ) : (
                        vouchers
                            .filter((v: any) => 
                                (v.code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                                (v.profile || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                                (v.router_name || '').toLowerCase().includes(searchTerm.toLowerCase())
                            )
                            .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                            .map((v: any) => (
                                <div key={v.id} className="glass p-8 rounded-[2.5rem] border border-(--glass-border) space-y-6 shadow-xl relative overflow-hidden group">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="font-mono font-black text-indigo-600 dark:text-indigo-400 text-3xl tracking-widest">{v.code}</h4>
                                            <p className="text-[11px] font-bold text-muted uppercase tracking-widest mt-2">Password: <span className="text-primary">{v.password}</span></p>
                                        </div>
                                        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${v.status === 'AVAILABLE' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/10' : 'bg-slate-500/10 text-slate-500 border-slate-500/10'}`}>
                                            {v.status === 'AVAILABLE' ? 'Ready' : 'Used'}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-slate-100 dark:bg-white/5 p-4 rounded-2xl border border-(--glass-border)">
                                            <p className="text-[10px] uppercase font-black text-slate-500 mb-1 tracking-widest">Profil</p>
                                            <p className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase">{v.profile}</p>
                                        </div>
                                        <div className="bg-slate-100 dark:bg-white/5 p-4 rounded-2xl border border-(--glass-border)">
                                            <p className="text-[10px] uppercase font-black text-slate-500 mb-1 tracking-widest">Harga</p>
                                            <p className="text-lg font-black text-primary">Rp {parseInt(v.price).toLocaleString('id-ID')}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between pt-4 border-t border-(--glass-border)">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 border border-(--glass-border)">
                                                <Settings className="w-4 h-4" />
                                            </div>
                                            <span className="text-[11px] font-bold text-muted truncate max-w-[150px]">{v.router_name}</span>
                                        </div>
                                        <button onClick={() => handleDelete(v.id)} className="p-3.5 rounded-2xl bg-red-500/10 text-red-600 dark:text-red-400 active:scale-90 transition-all border border-red-500/10">
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ))
                    )}
                </div>

                {/* Pagination Controls */}
                {!loading && vouchers.length > itemsPerPage && (
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-6 pt-10 px-4">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">
                            <span className="text-primary">{vouchers.filter((v: any) => (v.code || '').toLowerCase().includes(searchTerm.toLowerCase()) || (v.profile || '').toLowerCase().includes(searchTerm.toLowerCase())).length}</span> Voucher Terdaftar
                        </p>
                        <div className="flex items-center gap-4">
                            <button 
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="px-8 py-3.5 rounded-2xl glass border border-(--glass-border) text-[11px] font-black uppercase tracking-[0.2em] text-muted hover:text-primary hover:bg-white/5 disabled:opacity-30 transition-all active:scale-95"
                            >
                                Prev
                            </button>
                            <div className="flex gap-2">
                                <span className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-xs shadow-lg shadow-indigo-600/20">{currentPage}</span>
                            </div>
                            <button 
                                onClick={() => setCurrentPage(p => p + 1)}
                                disabled={currentPage >= Math.ceil(vouchers.filter((v: any) => (v.code || '').toLowerCase().includes(searchTerm.toLowerCase()) || (v.profile || '').toLowerCase().includes(searchTerm.toLowerCase())).length / itemsPerPage)}
                                className="px-8 py-3.5 rounded-2xl glass border border-(--glass-border) text-[11px] font-black uppercase tracking-[0.2em] text-muted hover:text-primary hover:bg-white/5 disabled:opacity-30 transition-all active:scale-95"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
