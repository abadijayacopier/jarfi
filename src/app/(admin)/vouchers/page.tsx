'use client';

import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { Wifi, PlusCircle, Printer, Trash2, Eye, Settings, Search, Loader2 } from 'lucide-react';
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
            Swal.fire({ icon: 'warning', title: 'Pilihan Diperlukan', text: 'Pilih gateway target untuk injeksi.', background: '#0f172a', color: '#fff' });
            return;
        }

        setGenerating(true);
        Swal.fire({ title: 'Menginjeksi Voucher...', text: `Membangun ${formData.quantity} node dalam logika gateway.`, allowOutsideClick: false, background: '#0f172a', color: '#fff', didOpen: () => { Swal.showLoading(); } });

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
                    title: 'Injeksi Berhasil',
                    text: `${data.count} Voucher telah dibangun dan disinkronkan.`,
                    background: '#0f172a',
                    color: '#fff'
                });
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Kegagalan',
                    text: data.error || 'Gagal membuat batch.',
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

    return (
        <div className="animate-in fade-in duration-500 pb-20 space-y-12">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12 border-b border-(--glass-border) pb-10">
                <div>
                    <h3 className="text-4xl font-bold text-primary flex items-center gap-4 tracking-tight">
                        <Wifi className="w-10 h-10 text-accent" />
                        Matriks Hotspot
                    </h3>
                    <p className="text-muted font-medium mt-2">Buat token massal dan kelola protokol otentikasi gateway.</p>
                </div>
                <div className="flex items-center gap-5">
                    <button
                        onClick={handleDeleteAll}
                        className="bg-red-500/5 hover:bg-red-500/10 text-red-500 font-bold py-3.5 px-8 rounded-2xl transition-all border border-red-500/10 flex items-center gap-3 uppercase tracking-widest text-[10px]"
                    >
                        <Trash2 className="w-5 h-5" /> Bersihkan Logika Token
                    </button>
                    <button
                        onClick={() => setShowAddForm(!showAddForm)}
                        className="bg-accent hover:bg-accent/90 text-white font-bold py-3.5 px-8 rounded-2xl transition-all shadow-xl active:scale-95 flex items-center gap-3 uppercase tracking-widest text-[10px]"
                    >
                        <PlusCircle className="w-5 h-5" />
                        {showAddForm ? 'Batalkan Siklus' : 'Logika Batch'}
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
                            <h4 className="text-2xl font-bold text-primary tracking-tight">Parameter Logika</h4>
                            <p className="text-muted text-xs font-bold mt-1 uppercase tracking-widest opacity-60">Konfigurasi vektor injeksi batch</p>
                        </div>
                    </div>

                    <form onSubmit={handleGenerate} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
                        <div className="space-y-3">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Hub Gateway</label>
                            <select required value={formData.router_id} onChange={(e) => setFormData({ ...formData, router_id: e.target.value })} className="w-full clean-input text-sm font-bold">
                                <option value="">-- Pilih Hub --</option>
                                {routers.map((r: any) => <option key={r.id} value={r.id}>{r.name} ({r.ip_address})</option>)}
                            </select>
                        </div>
                        <div className="space-y-3">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Jumlah Token</label>
                            <input type="number" required min="1" max="1000" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })} className="w-full clean-input text-sm font-mono font-bold" />
                        </div>
                        <div className="space-y-3">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Nilai Unit (Rp)</label>
                            <input type="number" required value={formData.price} onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) })} className="w-full clean-input text-sm font-mono font-bold" />
                        </div>
                        <div className="space-y-3">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Logika Profil</label>
                            <select 
                                required 
                                value={formData.profile} 
                                onChange={(e) => setFormData({ ...formData, profile: e.target.value })} 
                                className="w-full clean-input text-sm font-bold uppercase tracking-widest"
                                disabled={loadingProfiles || profiles.length === 0}
                            >
                                {loadingProfiles ? (
                                    <option>Mengambil profil...</option>
                                ) : profiles.length === 0 ? (
                                    <option value="">-- Pilih Hub Terlebih Dahulu --</option>
                                ) : (
                                    profiles.map((p) => <option key={p} value={p}>{p}</option>)
                                )}
                            </select>
                        </div>
                        <div className="space-y-3">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Prefiks Token</label>
                            <input type="text" value={formData.prefix} onChange={(e) => setFormData({ ...formData, prefix: e.target.value })} className="w-full clean-input text-sm font-mono font-bold" placeholder="VC-" />
                        </div>
                        <div className="lg:col-span-3 flex justify-end mt-6 pt-10 border-t border-white/5">
                            <button 
                                type="submit" 
                                disabled={generating} 
                                className="px-10 py-4 rounded-2xl bg-accent hover:bg-accent/90 text-white font-bold shadow-xl transition-all active:scale-95 disabled:opacity-50 flex items-center gap-3 uppercase tracking-widest text-[11px]"
                            >
                                <Wifi className="w-5 h-5" /> Eksekusi Injeksi Batch
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
                                    <Settings className="w-4 h-4" /> Kebijakan
                                </Link>
                                <Link href="/vouchers/print" className="bg-accent/5 hover:bg-accent/10 px-5 py-2 rounded-xl text-[10px] text-accent font-bold uppercase tracking-widest transition flex items-center gap-2 border border-accent/10">
                                    <Printer className="w-4 h-4" /> Pengiriman
                                </Link>
                            </div>
                        </div>
                        
                        <div className="relative w-full md:w-md">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input 
                                type="text" 
                                placeholder="Cari token berdasarkan kode, profil, atau hub..." 
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                className="w-full clean-input pl-14 pr-6 py-4 font-bold text-sm"
                            />
                        </div>
                    </div>
                    
                    <div className="overflow-x-auto min-h-[400px] custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white/1 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5">
                                    <th className="px-10 py-8">Token Akses</th>
                                    <th className="px-10 py-8">Asal Hub</th>
                                    <th className="px-10 py-8">Profil</th>
                                    <th className="px-10 py-8">Nilai Unit</th>
                                    <th className="px-10 py-8 text-center">Status</th>
                                    <th className="px-10 py-8 text-right">Orkestrasi</th>
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
                                                <td className="px-10 py-8">
                                                    <div>
                                                        <p className="font-mono font-bold text-accent text-2xl tracking-tighter group-hover:scale-105 transition-all origin-left">{v.code}</p>
                                                        <p className="text-[10px] font-bold text-muted uppercase tracking-widest mt-1 opacity-40">Rahasia: {v.password}</p>
                                                    </div>
                                                </td>
                                                <td className="px-10 py-8">
                                                    <div className="flex items-center gap-3">
                                                        <Settings className="w-3.5 h-3.5 text-slate-600" />
                                                        <p className="text-primary font-bold text-sm tracking-tight">{v.router_name}</p>
                                                    </div>
                                                </td>
                                                <td className="px-10 py-8">
                                                    <span className="px-3 py-1 bg-white/5 text-slate-400 text-[10px] font-bold uppercase rounded-lg border border-white/5 tracking-widest">{v.profile}</span>
                                                </td>
                                                <td className="px-10 py-8">
                                                    <p className="font-bold text-primary text-lg tracking-tighter">Rp {parseInt(v.price).toLocaleString('id-ID')}</p>
                                                </td>
                                                <td className="px-10 py-8 text-center">
                                                    <span className={`px-4 py-1.5 rounded-xl text-[9px] font-bold tracking-widest uppercase border ${v.status === 'AVAILABLE' ? 'bg-accent/10 text-accent border-accent/20' : 'bg-slate-500/10 text-slate-500 border-slate-500/20'}`}>
                                                        {v.status === 'AVAILABLE' ? 'SIAP' : 'KADALUARSA'}
                                                    </span>
                                                </td>
                                                <td className="px-10 py-8 text-right">
                                                    <button onClick={() => handleDelete(v.id)} className="p-3.5 rounded-xl bg-white/5 text-slate-400 hover:bg-red-500 hover:text-white border border-white/5 transition-all opacity-0 group-hover:opacity-100 shadow-lg active:scale-90" title="Hapus">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
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
                        <div className="p-20 text-center animate-pulse font-bold text-[10px] text-slate-500 uppercase tracking-widest">Sinkronisasi...</div>
                    ) : (
                        vouchers
                            .filter((v: any) => 
                                (v.code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                                (v.profile || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                                (v.router_name || '').toLowerCase().includes(searchTerm.toLowerCase())
                            )
                            .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                            .map((v: any) => (
                                <div key={v.id} className="glass p-8 rounded-4xl border border-(--glass-border) bg-white/2 space-y-6 shadow-xl group">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="font-mono font-bold text-accent text-3xl tracking-tighter">{v.code}</h4>
                                            <p className="text-[10px] font-bold text-muted uppercase tracking-widest mt-2">Rahasia: <span className="text-primary">{v.password}</span></p>
                                        </div>
                                        <span className={`px-4 py-1.5 rounded-xl text-[9px] font-bold uppercase tracking-widest border ${v.status === 'AVAILABLE' ? 'bg-accent/10 text-accent border-accent/20' : 'bg-slate-500/10 text-slate-500 border-slate-500/20'}`}>
                                            {v.status === 'AVAILABLE' ? 'SIAP' : 'KADALUARSA'}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-white/1 p-4 rounded-2xl border border-white/5">
                                            <p className="text-[9px] uppercase font-bold text-slate-500 mb-1 tracking-widest">Profil</p>
                                            <p className="text-xs font-bold text-accent uppercase">{v.profile}</p>
                                        </div>
                                        <div className="bg-white/1 p-4 rounded-2xl border border-white/5">
                                            <p className="text-[9px] uppercase font-bold text-slate-500 mb-1 tracking-widest">Nilai</p>
                                            <p className="text-lg font-bold text-primary tracking-tighter">Rp {parseInt(v.price).toLocaleString('id-ID')}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                        <div className="flex items-center gap-3">
                                            <Settings className="w-4 h-4 text-slate-600" />
                                            <span className="text-[10px] font-bold text-muted truncate max-w-[150px] uppercase tracking-widest">{v.router_name}</span>
                                        </div>
                                        <button onClick={() => handleDelete(v.id)} className="p-3 rounded-xl bg-red-500/5 text-red-500 border border-red-500/10 active:scale-90 transition-all">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
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
                                Node Berikutnya
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
