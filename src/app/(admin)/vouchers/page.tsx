'use client';

import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { Wifi, PlusCircle, Printer, Trash2, Eye, Settings, Search, Loader2, RefreshCw, X as CloseIcon } from 'lucide-react';
import Link from 'next/link';

export default function VouchersPage() {
    const [vouchers, setVouchers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [routers, setRouters] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showAddForm, setShowAddForm] = useState(false);
    const [editingVoucher, setEditingVoucher] = useState<any>(null);
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
        } else if (!editingVoucher) {
            setProfiles([]);
        }
    }, [formData.router_id, editingVoucher]);

    useEffect(() => {
        if (editingVoucher && editingVoucher.router_id) {
            fetchProfiles(editingVoucher.router_id);
        }
    }, [editingVoucher]);

    const fetchProfiles = async (routerId: string) => {
        setLoadingProfiles(true);
        try {
            const res = await fetch(`/api/mikrotik/profiles?routerId=${routerId}&type=hotspot`);
            const data = await res.json();
            if (res.ok) {
                const fetchedProfiles = data.profiles || [];
                // Transform to names if they are objects
                const profileNames = fetchedProfiles.map((p: any) => typeof p === 'object' ? (p.name || p['.id']) : p);
                setProfiles(profileNames);
                if (profileNames.length > 0) {
                    setFormData(prev => ({ ...prev, profile: profileNames[0] }));
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingProfiles(false);
        }
    };

    const fetchVouchers = async (sync: boolean = false) => {
        setLoading(true);
        try {
            const url = sync ? '/api/vouchers?sync=true' : '/api/vouchers';
            const res = await fetch(url);
            const data = await res.json();
            if (res.ok) setVouchers(data.vouchers || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSync = async () => {
        Swal.fire({
            title: 'Sinkronisasi Gateway',
            text: 'Mengambil data user hotspot langsung dari MikroTik...',
            allowOutsideClick: false,
            background: '#0f172a',
            color: '#fff',
            didOpen: () => { Swal.showLoading(); }
        });
        await fetchVouchers(true);
        Swal.fire({
            icon: 'success',
            title: 'Sinkron Selesai',
            text: 'Data voucher telah diperbarui dari gateway.',
            background: '#0f172a',
            color: '#fff',
            timer: 2000,
            showConfirmButton: false
        });
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
            Swal.fire({ icon: 'warning', title: 'Pilihan Diperlukan', text: 'Pilih gateway target untuk injeksi.', background: '#0f172a', color: '#fff' });
            return;
        }

        setGenerating(true);
        Swal.fire({ title: 'Memproses Voucher...', text: `Sedang membuat ${formData.quantity} voucher di MikroTik.`, allowOutsideClick: false, background: '#0f172a', color: '#fff', didOpen: () => { Swal.showLoading(); } });

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
                    title: 'Token Dibuat',
                    text: `${data.count} Token telah berhasil di-injeksi dan disimpan.`,
                    background: '#0f172a',
                    color: '#fff'
                });
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Injeksi Gagal',
                    text: data.error || 'Gagal memproses batch token.',
                    background: '#0f172a',
                    color: '#fff'
                });
            }
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Kesalahan Jaringan', text: 'Kegagalan bridge API.', background: '#0f172a', color: '#fff' });
        } finally {
            setGenerating(false);
        }
    };

    const handleDeleteAll = async () => {
        const result = await Swal.fire({
            title: 'Bersihkan Database?',
            text: "Catatan lokal akan dibersihkan. Status perangkat keras gateway tetap tidak berubah.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#f43f5e',
            confirmButtonText: 'Bersihkan Catatan',
            cancelButtonText: 'Batal',
            background: '#0f172a',
            color: '#fff'
        });

        if (!result.isConfirmed) return;

        try {
            const res = await fetch('/api/vouchers', { method: 'DELETE' });
            if (res.ok) {
                fetchVouchers();
                Swal.fire({ icon: 'success', title: 'Dibersihkan', text: 'Buku kas voucher lokal telah dibersihkan.', background: '#0f172a', color: '#fff' });
            }
        } catch (err) { console.error(err); }
    };

    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: 'Hapus Voucher?',
            text: "Hapus token ini dari catatan lokal.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#f43f5e',
            confirmButtonText: 'Hapus Token',
            cancelButtonText: 'Batal',
            background: '#0f172a',
            color: '#fff'
        });

        if (!result.isConfirmed) return;

        try {
            const res = await fetch(`/api/vouchers?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                fetchVouchers();
                Swal.fire({ icon: 'success', title: 'Dibersihkan', text: 'Token dihapus.', background: '#0f172a', color: '#fff', timer: 1500, showConfirmButton: false });
            }
        } catch (err) { console.error(err); }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch(`/api/vouchers?id=${editingVoucher.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    price: editingVoucher.price,
                    profile: editingVoucher.profile
                })
            });
            if (res.ok) {
                setEditingVoucher(null);
                fetchVouchers();
                Swal.fire({ icon: 'success', title: 'Diperbarui', text: 'Data voucher telah diperbarui.', background: '#0f172a', color: '#fff', confirmButtonColor: '#0ea5e9' });
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="animate-in fade-in duration-500 pb-20 space-y-12">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-6 border-b border-(--glass-border) pb-10">
                <div>
                    <h3 className="text-4xl font-bold text-primary flex items-center gap-4 tracking-tight">
                        <Wifi className="w-10 h-10 text-accent" />
                        Matriks Hotspot
                    </h3>
                    <p className="text-muted font-medium mt-2">Buat token massal dan kelola protokol otentikasi gateway.</p>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                    <button
                        onClick={handleSync}
                        disabled={loading}
                        className="bg-accent/10 hover:bg-accent/20 text-accent font-bold py-3.5 px-8 rounded-2xl transition-all border border-accent/20 flex items-center gap-3 uppercase tracking-widest text-[10px]"
                    >
                        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} /> Sinkronisasi Gateway
                    </button>
                    <button
                        onClick={handleDeleteAll}
                        className="bg-white/5 hover:bg-white/10 text-slate-500 font-bold py-3.5 px-8 rounded-2xl transition-all border border-white/5 flex items-center gap-3 uppercase tracking-widest text-[10px]"
                    >
                        <Trash2 className="w-5 h-5" /> Bersihkan Catatan
                    </button>
                    <button
                        onClick={() => setShowAddForm(!showAddForm)}
                        className="bg-accent hover:bg-accent/90 text-white font-bold py-3.5 px-8 rounded-2xl transition-all shadow-xl active:scale-95 flex items-center gap-3 uppercase tracking-widest text-[10px]"
                    >
                        <PlusCircle className="w-5 h-5" />
                        {showAddForm ? 'Batalkan' : 'Injeksi Token'}
                    </button>
                </div>
            </div>

            {showAddForm && (
                <div className="glass p-12 rounded-4xl border border-(--glass-border) animate-in slide-in-from-top-6 duration-500 shadow-xl bg-white/2 relative overflow-hidden">
                    <div className="absolute -top-10 -right-10 p-10 opacity-[0.03] pointer-events-none rotate-12">
                        <Wifi className="w-64 h-64 text-accent" />
                    </div>
                    <div className="flex items-center gap-5 mb-10">
                        <div className="p-3.5 rounded-2xl bg-accent/5 text-accent border border-accent/10">
                            <Settings className="w-6 h-6" />
                        </div>
                        <div>
                            <h4 className="text-2xl font-bold text-primary tracking-tight">Konfigurasi Voucher</h4>
                            <p className="text-muted text-xs font-bold mt-1 uppercase tracking-widest opacity-60">Atur parameter untuk pembuatan voucher massal</p>
                        </div>
                    </div>

                    <form onSubmit={handleGenerate} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
                        <div className="space-y-3">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Pilih Pusat Gateway (Router)</label>
                            <select required value={formData.router_id} onChange={(e) => setFormData({ ...formData, router_id: e.target.value })} className="w-full clean-input text-sm font-bold">
                                <option value="">-- Pilih MikroTik --</option>
                                {routers.map((r: any) => <option key={r.id} value={r.id}>{r.name} ({r.ip_address})</option>)}
                            </select>
                        </div>
                        <div className="space-y-3">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Stok Voucher (Jumlah)</label>
                            <input type="number" required min="1" max="1000" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })} className="w-full clean-input text-sm font-mono font-bold" />
                        </div>
                        <div className="space-y-3">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Harga Jual (Rp)</label>
                            <input type="number" required value={formData.price} onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) })} className="w-full clean-input text-sm font-mono font-bold" />
                        </div>
                        <div className="space-y-3">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Paket Internet (Profil)</label>
                            <select 
                                required 
                                value={formData.profile} 
                                onChange={(e) => setFormData({ ...formData, profile: e.target.value })} 
                                className="w-full clean-input text-sm font-bold uppercase tracking-widest cursor-pointer disabled:cursor-not-allowed"
                                disabled={loadingProfiles || profiles.length === 0}
                            >
                                {loadingProfiles ? (
                                    <option>Sedang Menarik Data...</option>
                                ) : profiles.length === 0 ? (
                                    <option value="">-- Hubungkan Gateway Dahulu --</option>
                                ) : (
                                    profiles.map((p, idx) => <option key={`${p}-${idx}`} value={p as string}>{p as string}</option>)
                                )}
                            </select>
                        </div>
                        <div className="space-y-3">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Kode Awal (Prefix)</label>
                            <input type="text" value={formData.prefix} onChange={(e) => setFormData({ ...formData, prefix: e.target.value })} className="w-full clean-input text-sm font-mono font-bold" placeholder="VC-" />
                        </div>
                        <div className="lg:col-span-3 flex justify-end mt-6 pt-10 border-t border-white/5">
                            <button 
                                type="submit" 
                                disabled={generating} 
                                className="px-10 py-4 rounded-2xl bg-accent hover:bg-accent/90 text-white font-bold shadow-xl transition-all active:scale-95 disabled:opacity-50 flex items-center gap-3 uppercase tracking-widest text-[11px]"
                            >
                                <Wifi className="w-5 h-5" /> Generate Voucher Sekarang
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Main Content Area */}
            <div className="space-y-8">
                <div className="hidden md:block glass rounded-4xl overflow-hidden shadow-xl border border-(--glass-border) bg-white/2">
                    <div className="p-10 border-b border-white/5 flex flex-col md:flex-row justify-between items-center gap-8 bg-white/2">
                        <div className="flex items-center gap-6">
                            <h4 className="text-xl font-bold text-primary tracking-tight">
                                Pusat Token Hotspot
                            </h4>
                            <div className="flex gap-3">
                                <Link href="/vouchers/profiles" className="bg-white/5 hover:bg-white/10 px-5 py-2 rounded-xl text-[10px] text-slate-400 font-bold uppercase tracking-widest transition flex items-center gap-2 border border-white/5">
                                    <Settings className="w-4 h-4" /> Atur Paket
                                </Link>
                                <Link href="/vouchers/print" className="bg-accent/5 hover:bg-accent/10 px-5 py-2 rounded-xl text-[10px] text-accent font-bold uppercase tracking-widest transition flex items-center gap-2 border border-accent/10">
                                    <Printer className="w-4 h-4" /> Cetak Voucher
                                </Link>
                            </div>
                        </div>
                        
                        <div className="relative w-full md:w-md group">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-accent transition-colors" />
                            <input 
                                type="text" 
                                placeholder="Cari token berdasarkan kode, profil, atau hub..." 
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                className="w-full clean-input !pl-14 pr-6 py-4 font-bold text-sm border-white/5 focus:border-accent/30 transition-all"
                            />
                        </div>
                    </div>
                    
                    <div className="overflow-x-auto min-h-[400px] custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white/1 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5">
                                    <th className="px-8 py-5">Token Akses</th>
                                    <th className="px-8 py-5">Asal Hub</th>
                                    <th className="px-8 py-5">Profil</th>
                                    <th className="px-8 py-5">Nilai Unit</th>
                                    <th className="px-8 py-5 text-center">Status</th>
                                    <th className="px-8 py-5 text-right">Orkestrasi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="p-32 text-center">
                                            <div className="flex flex-col items-center gap-6 animate-pulse">
                                                <Loader2 className="w-10 h-10 animate-spin text-accent" />
                                                <span className="font-bold uppercase tracking-widest text-[10px] text-slate-500">Menyinkronkan data token...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : vouchers.length === 0 ? (
                                    <tr><td colSpan={6} className="p-32 text-center text-slate-500 font-bold uppercase tracking-widest text-[10px] opacity-40">Data Token Kosong.</td></tr>
                                ) : (
                                    vouchers
                                        .filter((v: any) => 
                                            (v.code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                                            (v.profile || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                                            (v.router_name || '').toLowerCase().includes(searchTerm.toLowerCase())
                                        )
                                        .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                                        .map((v: any) => (
                                            <tr key={v.id} className="hover:bg-white/2 transition-all group">
                                                <td className="px-8 py-4">
                                                    <div>
                                                        <p className="font-black text-accent text-xl tracking-tighter group-hover:scale-105 transition-all origin-left uppercase">{v.code}</p>
                                                        <p className="text-[9px] font-bold text-muted uppercase tracking-widest mt-0.5 opacity-40">PIN: {v.password}</p>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <Settings className="w-3.5 h-3.5 text-slate-600" />
                                                        <p className="text-primary font-bold text-xs tracking-tight">{v.router_name}</p>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-4">
                                                    <span className="px-2.5 py-0.5 bg-white/5 text-slate-400 text-[9px] font-bold uppercase rounded-md border border-white/5 tracking-widest">{v.profile}</span>
                                                </td>
                                                <td className="px-8 py-4">
                                                    <p className="font-bold text-primary text-base tracking-tighter">Rp {parseInt(v.price).toLocaleString('id-ID')}</p>
                                                </td>
                                                <td className="px-8 py-4 text-center">
                                                    <span className={`px-3 py-1 rounded-lg text-[8px] font-bold tracking-widest uppercase border ${v.status === 'AVAILABLE' ? 'bg-accent/10 text-accent border-accent/20' : 'bg-slate-500/10 text-slate-500 border-slate-500/20'}`}>
                                                        {v.status === 'AVAILABLE' ? 'SIAP' : 'OFF'}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-4 text-right">
                                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                                        <button 
                                                            onClick={() => Swal.fire({ 
                                                                title: 'Detail Voucher', 
                                                                html: `<div class="text-left font-sans text-sm"><p class="mb-2"><b>Kode:</b> <span class="text-accent">${v.code}</span></p><p class="mb-2"><b>PIN:</b> ${v.password || '-'}</p><p class="mb-2"><b>Profil:</b> ${v.profile || 'default'}</p><p><b>Router:</b> ${v.router_name}</p></div>`, 
                                                                background: '#0f172a', 
                                                                color: '#fff',
                                                                confirmButtonColor: '#0ea5e9'
                                                            })}
                                                            className="p-2.5 rounded-xl bg-white/5 text-slate-400 hover:bg-accent hover:text-white border border-white/5 transition-all shadow-lg active:scale-90" 
                                                            title="Detail"
                                                        >
                                                            <Eye className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button 
                                                            onClick={() => setEditingVoucher(v)}
                                                            className="p-2.5 rounded-xl bg-white/5 text-slate-400 hover:bg-white/10 border border-white/5 transition-all shadow-lg active:scale-90" 
                                                            title="Edit"
                                                        >
                                                            <Settings className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button onClick={() => handleDelete(v.id)} className="p-2.5 rounded-xl bg-white/5 text-slate-400 hover:bg-red-500 hover:text-white border border-white/5 transition-all shadow-lg active:scale-90" title="Hapus">
                                                            <Trash2 className="w-3.5 h-3.5" />
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
                <div className="md:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {loading ? (
                        <div className="col-span-full p-20 text-center animate-pulse font-bold text-[10px] text-slate-500 uppercase tracking-widest">Sinkronisasi...</div>
                    ) : (
                        vouchers
                            .filter((v: any) => 
                                (v.code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                                (v.profile || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                                (v.router_name || '').toLowerCase().includes(searchTerm.toLowerCase())
                            )
                            .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                            .map((v: any) => (
                                <div key={v.id} className="glass p-6 rounded-3xl border border-white/5 bg-white/2 flex flex-col gap-4 shadow-lg group">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-accent animate-pulse"></div>
                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{v.router_name}</span>
                                        </div>
                                        <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${v.status === 'AVAILABLE' ? 'bg-accent/10 text-accent border-accent/20' : 'bg-slate-500/10 text-slate-500 border-slate-500/20'}`}>
                                            {v.status === 'AVAILABLE' ? 'SIAP' : 'OFF'}
                                        </span>
                                    </div>
                                    <div className="py-2">
                                        <h4 className="font-black text-accent text-3xl tracking-tighter leading-none">{v.code}</h4>
                                        <div className="flex items-center justify-between mt-3">
                                            <p className="text-xl font-black text-primary tracking-tighter">Rp {parseInt(v.price).toLocaleString('id-ID')}</p>
                                            <p className="text-[9px] font-bold text-muted uppercase tracking-widest opacity-40">PIN: {v.password}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{v.profile}</span>
                                        <div className="flex gap-3">
                                            <button 
                                                onClick={() => Swal.fire({ 
                                                    title: 'Detail Voucher', 
                                                    html: `<div class="text-left font-sans text-sm"><p class="mb-2"><b>Kode:</b> <span class="text-accent">${v.code}</span></p><p class="mb-2"><b>PIN:</b> ${v.password || '-'}</p><p class="mb-2"><b>Profil:</b> ${v.profile || 'default'}</p><p><b>Router:</b> ${v.router_name}</p></div>`, 
                                                    background: '#0f172a', 
                                                    color: '#fff',
                                                    confirmButtonColor: '#0ea5e9'
                                                })}
                                                className="text-slate-500 hover:text-accent transition-all"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            <button 
                                                onClick={() => setEditingVoucher(v)}
                                                className="text-slate-500 hover:text-accent transition-all"
                                            >
                                                <Settings className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleDelete(v.id)} className="text-red-500/60 hover:text-red-500 active:scale-90 transition-all">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                    )}
                </div>

                {/* Pagination Controls */}
                {!loading && vouchers.length > itemsPerPage && (
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-8 pt-10 px-4">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                            <span className="text-primary font-bold">{vouchers.length}</span> Token Aktif
                        </p>
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="px-6 py-3.5 rounded-xl glass border border-white/5 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-primary disabled:opacity-20 transition-all active:scale-95"
                            >
                                Sebelumnya
                            </button>
                                <button 
                                    onClick={() => setCurrentPage(p => p + 1)}
                                    disabled={currentPage >= Math.ceil(vouchers.length / itemsPerPage)}
                                    className="px-6 py-3.5 rounded-xl glass border border-white/5 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-primary disabled:opacity-20 transition-all active:scale-95"
                                >
                                    Selanjutnya
                                </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            {editingVoucher && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
                    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setEditingVoucher(null)}></div>
                    <div className="relative glass w-full max-w-md p-8 rounded-3xl border border-white/10 shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-2xl bg-accent/10 text-accent">
                                    <Settings className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold text-white uppercase tracking-tight">Edit Voucher</h3>
                            </div>
                            <button onClick={() => setEditingVoucher(null)} className="p-2 hover:bg-white/5 rounded-xl transition-all">
                                <CloseIcon className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>
                        <form onSubmit={handleUpdate} className="space-y-6">
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2 ml-1">Kode (Read-only)</label>
                                <input type="text" disabled value={editingVoucher.code} className="w-full clean-input opacity-50 font-black text-accent" />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2 ml-1">Harga (Rp)</label>
                                <input 
                                    type="number" 
                                    value={editingVoucher.price} 
                                    onChange={(e) => setEditingVoucher({ ...editingVoucher, price: e.target.value })}
                                    className="w-full clean-input font-bold" 
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2 ml-1">Profil MikroTik</label>
                                <select 
                                    value={editingVoucher.profile} 
                                    onChange={(e) => setEditingVoucher({ ...editingVoucher, profile: e.target.value })}
                                    className="w-full clean-input font-bold uppercase"
                                >
                                    {profiles.map((p, idx) => <option key={`${p}-${idx}`} value={p}>{p}</option>)}
                                </select>
                            </div>
                            <div className="flex gap-4 pt-6">
                                <button type="button" onClick={() => setEditingVoucher(null)} className="flex-1 py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 font-bold uppercase tracking-widest text-[10px] transition-all">Batal</button>
                                <button type="submit" className="flex-1 py-4 rounded-2xl bg-accent hover:bg-accent/90 text-white font-bold uppercase tracking-widest text-[10px] shadow-xl transition-all active:scale-95">Simpan Perubahan</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
