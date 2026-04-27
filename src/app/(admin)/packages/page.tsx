'use client';

import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { Package, RefreshCw, Plus, Trash2, Edit, Save, X, Search, Wifi } from 'lucide-react';

export default function PackagesPage() {
    const [packages, setPackages] = useState([]);
    const [routers, setRouters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    const [showForm, setShowForm] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);
    const [formData, setFormData] = useState({ name: '', speed_limit: '', price: 0 });

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    useEffect(() => {
        fetchPackages();
        fetchRouters();
    }, []);

    const fetchPackages = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/packages', { cache: 'no-store' });
            const data = await res.json();
            if (res.ok) setPackages(data.packages || []);
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
        } catch (err) {
            console.error(err);
        }
    };

    const handleSync = async () => {
        if (routers.length === 0) {
            Swal.fire({ icon: 'error', title: 'Router Tidak Ada', text: 'Tambahkan router terlebih dahulu.', background: '#1e293b', color: '#fff' });
            return;
        }

        const { value: routerId } = await Swal.fire({
            title: 'Pilih Mikrotik',
            text: 'Pilih router untuk mengambil daftar profil PPPoE',
            input: 'select',
            inputOptions: Object.fromEntries(routers.map((r: any) => [r.id, r.name])),
            inputPlaceholder: '-- Pilih Router --',
            showCancelButton: true,
            background: '#1e293b',
            color: '#fff',
            confirmButtonColor: '#3b82f6'
        });

        if (!routerId) return;

        Swal.fire({ title: 'Sinkronisasi...', text: 'Mengambil data dari Mikrotik...', allowOutsideClick: false, background: '#1e293b', color: '#fff', didOpen: () => { Swal.showLoading(); } });

        try {
            const res = await fetch('/api/packages/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ router_id: routerId })
            });
            const data = await res.json();
            if (res.ok) {
                Swal.fire({ icon: 'success', title: 'Sinkronisasi Berhasil', text: data.message, background: '#1e293b', color: '#fff' });
                fetchPackages();
            } else {
                Swal.fire({ icon: 'error', title: 'Gagal', text: data.error, background: '#1e293b', color: '#fff' });
            }
        } catch (err) {
            console.error(err);
        }
    };

    const [saving, setSaving] = useState(false);
    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        const method = isEditing ? 'PUT' : 'POST';
        const url = '/api/packages/manage';

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(isEditing ? { ...formData, id: editId } : formData)
            });
            if (res.ok) {
                await fetchPackages();
                setShowForm(false);
                setIsEditing(false);
                setEditId(null);
                setFormData({ name: '', speed_limit: '', price: 0 });
                Swal.fire({ 
                    icon: 'success', 
                    title: 'Berhasil', 
                    text: 'Paket berhasil disimpan!', 
                    background: '#1e293b', 
                    color: '#fff', 
                    timer: 1500, 
                    showConfirmButton: false 
                });
            } else {
                const data = await res.json();
                Swal.fire({ icon: 'error', title: 'Gagal', text: data.error || 'Terjadi kesalahan saat menyimpan.', background: '#1e293b', color: '#fff' });
            }
        } catch (err) {
            console.error(err);
            Swal.fire({ icon: 'error', title: 'Error', text: 'Koneksi ke server gagal.', background: '#1e293b', color: '#fff' });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: number, name: string) => {
        const result = await Swal.fire({
            title: `Hapus Paket ${name}?`,
            text: "Data paket akan dihapus permanen.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#334155',
            confirmButtonText: 'Ya, Hapus!',
            background: '#1e293b',
            color: '#fff'
        });

        if (result.isConfirmed) {
            try {
                const res = await fetch(`/api/packages/manage?id=${id}`, { method: 'DELETE' });
                if (res.ok) {
                    Swal.fire({ icon: 'success', title: 'Terhapus', text: 'Paket telah dihapus.', background: '#1e293b', color: '#fff' });
                    fetchPackages();
                }
            } catch (err) { console.error(err); }
        }
    };

    return (
        <div className="animate-in fade-in duration-500 pb-20 space-y-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12">
                <div>
                    <h3 className="text-4xl font-black text-primary flex items-center gap-4">
                        <Package className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                        Manajemen Paket Internet
                    </h3>
                    <p className="text-muted font-medium mt-2">Kelola harga dan kecepatan untuk setiap paket layanan ISP Anda.</p>
                </div>
                <div className="flex flex-wrap gap-4">
                    <button
                        onClick={handleSync}
                        className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-black py-4 px-8 rounded-4xl transition-all border border-blue-500/20 flex items-center gap-3 uppercase tracking-widest text-[10px] hover:scale-105 active:scale-95 shadow-xl shadow-blue-500/5"
                    >
                        <RefreshCw className="w-5 h-5" /> Sinkron Mikrotik
                    </button>
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 px-8 rounded-4xl transition-all shadow-xl shadow-indigo-600/20 flex items-center gap-3 uppercase tracking-widest text-[10px] hover:scale-105 active:scale-95"
                    >
                        <Plus className="w-5 h-5" /> Tambah Manual
                    </button>
                </div>
            </div>

            {/* Pop Up Modal Form */}
            {showForm && (
                <div className="fixed inset-0 z-60 flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-500">
                    <div className="glass w-full max-w-2xl p-10 lg:p-12 rounded-4xl shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] border border-(--glass-border) animate-in zoom-in-95 duration-500 relative overflow-hidden">
                        <div className="absolute -top-32 -right-32 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
                        
                        <div className="flex justify-between items-center mb-10 border-b border-(--glass-border) pb-8 relative z-10">
                            <div className="flex items-center gap-5">
                                <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shadow-inner">
                                    {isEditing ? <Edit className="w-7 h-7" /> : <Plus className="w-7 h-7" />}
                                </div>
                                <div>
                                    <h4 className="text-2xl font-black text-primary">
                                        {isEditing ? 'Ubah Paket' : 'Tambah Paket Baru'}
                                    </h4>
                                    <p className="text-[10px] text-muted font-black tracking-[0.2em] uppercase mt-1">Mikrotik PPPoE Profile Settings</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => { setShowForm(false); setIsEditing(false); }} 
                                className="text-slate-400 hover:text-primary transition-all bg-slate-100 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-800 p-3 rounded-3xl active:scale-90 shadow-sm"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="space-y-10 relative z-10">
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 ml-1">Nama Paket (Mikrotik Profile)</label>
                                <input 
                                    type="text" required 
                                    value={formData.name} 
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                                    className="w-full clean-input text-xl font-black py-5 px-6" 
                                    placeholder="Misal: Paket_10Mbps" 
                                />
                                <p className="text-[10px] text-slate-500 mt-4 ml-1 font-bold italic uppercase tracking-wider opacity-80">* Pastikan nama persis dengan Profile yang ada di Mikrotik</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 ml-1">Rate Limit (Speed)</label>
                                    <div className="relative">
                                        <input 
                                            type="text" required 
                                            value={formData.speed_limit} 
                                            onChange={(e) => setFormData({ ...formData, speed_limit: e.target.value })} 
                                            className="w-full clean-input pl-14 font-mono font-black py-5" 
                                            placeholder="10M/10M" 
                                        />
                                        <Wifi className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-indigo-500/40" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 ml-1">Harga Bulanan</label>
                                    <div className="flex items-center bg-input border border-input-border rounded-2xl overflow-hidden focus-within:ring-4 focus-within:ring-indigo-500/10 focus-within:border-indigo-500/50 transition-all shadow-sm">
                                        <div className="bg-slate-100 dark:bg-white/5 px-6 py-5 border-r border-input-border">
                                            <span className="text-slate-500 font-black text-lg">Rp</span>
                                        </div>
                                        <input 
                                            type="number" required 
                                            value={formData.price} 
                                            onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) })} 
                                            className="w-full bg-transparent p-5 font-mono font-black text-2xl focus:outline-none" 
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row justify-end gap-5 mt-16 pt-10 border-t border-(--glass-border)">
                                <button 
                                    type="button" 
                                    onClick={() => { setShowForm(false); setIsEditing(false); }} 
                                    className="px-10 py-5 rounded-4xl text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest text-[10px] hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
                                >
                                    Batalkan
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={saving}
                                    className={`px-12 py-5 rounded-4xl bg-indigo-600 hover:bg-indigo-500 text-white font-black shadow-2xl shadow-indigo-600/30 transition-all flex items-center justify-center gap-4 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed uppercase tracking-[0.2em] text-[10px]`}
                                >
                                    {saving ? (
                                        <>
                                            <RefreshCw className="w-5 h-5 animate-spin" />
                                            Menyimpan...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-5 h-5" /> {isEditing ? 'Perbarui Paket' : 'Simpan Paket'}
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Content View: Table (Desktop) & Cards (Mobile) */}
            <div className="space-y-6">
                {/* Desktop Table View */}
                <div className="hidden md:block glass rounded-4xl overflow-hidden shadow-2xl border border-(--glass-border)">
                    <div className="p-10 border-b border-(--glass-border) flex flex-col md:flex-row justify-between items-start md:items-center gap-8 bg-white/5">
                        <h4 className="text-2xl font-black text-primary">
                             Database Paket Layanan
                        </h4>
                        <div className="relative w-full md:w-md">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                            <input 
                                type="text" 
                                placeholder="Cari nama paket atau profil..." 
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                className="w-full bg-slate-100 dark:bg-slate-900/50 border-2 border-(--glass-border) rounded-4xl py-4.5 pl-14 pr-6 text-sm font-bold text-primary focus:outline-none focus:border-indigo-500 transition-all shadow-inner"
                            />
                        </div>
                    </div>
                    <div className="overflow-x-auto min-h-[400px]">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-white/2 uppercase text-[10px] tracking-[0.3em] font-black text-slate-500 border-b border-(--glass-border)">
                                    <th className="p-8">Nama Paket (Profile)</th>
                                    <th className="p-8">Kecepatan (Limit)</th>
                                    <th className="p-8">Harga Tagihan</th>
                                    <th className="p-8 text-center">Aksi Manajemen</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-(--glass-border) text-sm">
                                {loading ? (
                                    <tr><td colSpan={4} className="p-32 text-center text-slate-500 animate-pulse font-black uppercase tracking-[0.4em]">Inisialisasi Data...</td></tr>
                                ) : packages.length === 0 ? (
                                    <tr><td colSpan={4} className="p-32 text-center text-slate-500 font-black uppercase tracking-widest opacity-60">Belum ada paket. Silahkan sinkron dari Mikrotik!</td></tr>
                                ) : (
                                    packages
                                        .filter((p: any) => (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()))
                                        .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                                        .map((p: any) => (
                                            <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-white/2 transition-all group">
                                                <td className="p-8">
                                                    <div className="flex items-center gap-5">
                                                        <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border-2 border-indigo-500/10 shadow-inner group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                                                            <Wifi className="w-7 h-7" />
                                                        </div>
                                                        <span className="font-black text-primary text-xl tracking-tight">{p.name}</span>
                                                    </div>
                                                </td>
                                                <td className="p-8">
                                                    <span className="px-6 py-3 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 font-mono font-black text-sm border-2 border-teal-500/10 shadow-sm uppercase tracking-widest">
                                                        {p.speed_limit || p.bandwidth_limit || 'UNLIMITED'}
                                                    </span>
                                                </td>
                                                <td className="p-8">
                                                    <div className="flex flex-col">
                                                        <span className="text-2xl font-black text-primary tracking-tight">Rp {parseInt(p.price).toLocaleString('id-ID')}</span>
                                                        <span className="text-[10px] text-muted font-black uppercase tracking-[0.2em] mt-1.5 opacity-80">Recurring Monthly</span>
                                                    </div>
                                                </td>
                                                <td className="p-8">
                                                    <div className="flex justify-center gap-4">
                                                        <button 
                                                            onClick={() => {
                                                                setIsEditing(true);
                                                                setEditId(p.id);
                                                                setFormData({ 
                                                                    name: p.name, 
                                                                    speed_limit: p.speed_limit || p.bandwidth_limit || '', 
                                                                    price: parseInt(p.price) 
                                                                });
                                                                setShowForm(true);
                                                            }}
                                                            className="p-4 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white border-2 border-blue-500/10 transition-all hover:scale-110 shadow-sm active:scale-95"
                                                            title="Ubah Paket"
                                                        >
                                                            <Edit className="w-5 h-5" />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDelete(p.id, p.name)}
                                                            className="p-4 rounded-2xl bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-600 hover:text-white border-2 border-red-500/10 transition-all hover:scale-110 shadow-sm active:scale-95"
                                                            title="Hapus Paket"
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
                                placeholder="Cari paket..." 
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                className="w-full bg-slate-100 dark:bg-slate-900/50 border-2 border-(--glass-border) rounded-3xl py-4.5 pl-14 pr-6 text-sm font-bold text-primary focus:outline-none focus:border-indigo-500 shadow-inner"
                            />
                        </div>
                    </div>
                    {loading ? (
                        <div className="p-20 text-center text-slate-500 animate-pulse uppercase font-black text-[10px] tracking-[0.3em]">Memuat Database...</div>
                    ) : packages.length === 0 ? (
                        <div className="p-20 text-center text-slate-500 font-black uppercase text-[10px] tracking-widest opacity-60">Tidak ada data paket</div>
                    ) : (
                        packages
                            .filter((p: any) => (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()))
                            .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                            .map((p: any) => (
                                <div key={p.id} className="glass p-8 rounded-4xl space-y-6 shadow-2xl border border-(--glass-border) relative overflow-hidden group">
                                    <div className="flex justify-between items-start relative z-10">
                                        <div className="flex items-center gap-5">
                                            <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border-2 border-indigo-500/10 shadow-inner group-hover:scale-110 transition-transform duration-500">
                                                <Package className="w-8 h-8" />
                                            </div>
                                            <div>
                                                <h4 className="font-black text-primary text-2xl leading-tight tracking-tight">{p.name}</h4>
                                                <div className="flex items-center gap-2 mt-1.5">
                                                    <span className="text-indigo-600 dark:text-indigo-400 font-black">Rp {parseInt(p.price).toLocaleString('id-ID')}</span>
                                                    <span className="text-[9px] text-muted font-black uppercase tracking-widest">/ bulan</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-3">
                                            <button 
                                                onClick={() => {
                                                    setIsEditing(true);
                                                    setEditId(p.id);
                                                    setFormData({ name: p.name, speed_limit: p.speed_limit || p.bandwidth_limit || '', price: parseInt(p.price) });
                                                    setShowForm(true);
                                                }}
                                                className="p-4 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border-2 border-blue-500/10 active:scale-90 transition-all shadow-md"
                                            >
                                                <Edit className="w-5 h-5" />
                                            </button>
                                            <button onClick={() => handleDelete(p.id, p.name)} className="p-4 rounded-2xl bg-red-500/10 text-red-600 dark:text-red-400 border-2 border-red-500/10 active:scale-90 transition-all shadow-md">
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-4xl flex items-center justify-between border-2 border-(--glass-border) shadow-inner relative z-10">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3.5 rounded-2xl bg-teal-500/10 border border-teal-500/20">
                                                <Wifi className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-muted font-black uppercase tracking-[0.2em] mb-1.5 leading-none">Speed Limit</p>
                                                <span className="text-sm font-black text-primary uppercase tracking-widest">{p.speed_limit || p.bandwidth_limit || 'Unlimited'}</span>
                                            </div>
                                        </div>
                                        <div className="w-4 h-4 rounded-full bg-teal-500 shadow-[0_0_20px_rgba(20,184,166,0.6)] animate-pulse"></div>
                                    </div>
                                </div>
                            ))
                    )}
                </div>

                {/* Pagination Controls */}
                {!loading && packages.length > itemsPerPage && (
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-6 pt-12 px-4">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">
                            Displaying <span className="text-primary font-black">{packages.filter((p: any) => (p.name || '').toLowerCase().includes(searchTerm.toLowerCase())).length}</span> Active Plans
                        </p>
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="px-8 py-4 rounded-2xl glass border-2 border-(--glass-border) text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95 shadow-xl shadow-black/5"
                            >
                                Previous
                            </button>
                            <button 
                                onClick={() => setCurrentPage(p => p + 1)}
                                disabled={currentPage >= Math.ceil(packages.filter((p: any) => (p.name || '').toLowerCase().includes(searchTerm.toLowerCase())).length / itemsPerPage)}
                                className="px-8 py-4 rounded-2xl glass border-2 border-(--glass-border) text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95 shadow-xl shadow-black/5"
                            >
                                Next Page
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
