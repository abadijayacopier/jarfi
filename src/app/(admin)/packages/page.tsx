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
        <div className="animate-in fade-in duration-500 pb-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h3 className="text-3xl font-bold text-white flex items-center gap-3">
                        <Package className="w-8 h-8 text-indigo-400" />
                        Manajemen Paket Internet
                    </h3>
                    <p className="text-slate-400 mt-1">Kelola harga dan kecepatan untuk setiap paket layanan ISP Anda.</p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={handleSync}
                        className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 font-bold py-2.5 px-6 rounded-xl transition-all border border-blue-500/20 flex items-center gap-2"
                    >
                        <RefreshCw className="w-5 h-5" /> Sinkron dari Mikrotik
                    </button>
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="bg-indigo-500 hover:bg-indigo-400 text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-lg flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" /> Tambah Paket Manual
                    </button>
                </div>
            </div>

            {/* Pop Up Modal Form */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="bg-slate-800 w-full max-w-2xl p-8 rounded-4xl border border-white/10 shadow-2xl animate-in zoom-in-95 duration-200 relative overflow-hidden">
                        {/* Background Decoration */}
                        <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
                        
                        <div className="flex justify-between items-center mb-8 relative z-10">
                            <h4 className="text-2xl font-black text-white flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                                    {isEditing ? <Edit className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
                                </div>
                                {isEditing ? 'Ubah Paket Internet' : 'Tambah Paket Baru'}
                            </h4>
                            <button 
                                onClick={() => { setShowForm(false); setIsEditing(false); }} 
                                className="text-slate-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 p-2.5 rounded-xl border border-white/5"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="space-y-6 relative z-10">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2.5 ml-1">Nama Paket (Mikrotik Profile)</label>
                                <input 
                                    type="text" required 
                                    value={formData.name} 
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                                    className="w-full bg-slate-900/50 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-indigo-500 transition-all shadow-inner text-lg font-bold" 
                                    placeholder="Misal: Paket_10Mbps" 
                                />
                                <p className="text-[10px] text-slate-500 mt-2 ml-1 italic">* Pastikan nama persis dengan Profile Name di Winbox</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2.5 ml-1">Rate Limit (Speed)</label>
                                    <div className="relative">
                                        <input 
                                            type="text" required 
                                            value={formData.speed_limit} 
                                            onChange={(e) => setFormData({ ...formData, speed_limit: e.target.value })} 
                                            className="w-full bg-slate-900/50 border border-white/10 rounded-2xl p-4 pl-12 text-white focus:outline-none focus:border-indigo-500 transition-all shadow-inner font-mono font-bold" 
                                            placeholder="10M/10M" 
                                        />
                                        <Wifi className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-500/50" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2.5 ml-1">Harga Bulanan</label>
                                    <div className="relative">
                                        <input 
                                            type="number" required 
                                            value={formData.price} 
                                            onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) })} 
                                            className="w-full bg-slate-900/50 border border-white/10 rounded-2xl p-4 pl-12 text-white focus:outline-none focus:border-indigo-500 transition-all shadow-inner font-mono font-bold text-xl" 
                                        />
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">Rp</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-4 mt-10 pt-6 border-t border-white/5">
                                <button 
                                    type="button" 
                                    onClick={() => { setShowForm(false); setIsEditing(false); }} 
                                    className="px-8 py-4 rounded-2xl text-slate-400 hover:text-white font-bold transition-colors"
                                >
                                    Batal
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={saving}
                                    className={`px-10 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black shadow-xl shadow-indigo-600/20 transition-all flex items-center gap-3 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed`}
                                >
                                    {saving ? (
                                        <>
                                            <RefreshCw className="w-6 h-6 animate-spin" />
                                            Menyimpan...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-6 h-6" /> {isEditing ? 'Update Paket' : 'Simpan Paket'}
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Content View: Table (Desktop) & Cards (Mobile) */}
            <div className="space-y-4">
                {/* Desktop Table View */}
                <div className="hidden md:block glass rounded-4xl border border-white/10 overflow-hidden shadow-2xl">
                    <div className="p-6 border-b border-white/10 bg-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <h4 className="text-xl font-bold text-white flex items-center gap-3">
                             Database Paket Layanan
                        </h4>
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input 
                                type="text" 
                                placeholder="Cari nama paket..." 
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-2.5 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all shadow-inner"
                            />
                        </div>
                    </div>
                    <div className="overflow-x-auto min-h-[300px]">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white/5 uppercase text-[10px] tracking-widest font-black text-slate-400 border-b border-white/5">
                                    <th className="p-5">Nama Paket (Mikrotik Profile)</th>
                                    <th className="p-5">Kecepatan (Limit)</th>
                                    <th className="p-5">Harga Tagihan</th>
                                    <th className="p-5 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-sm">
                                {loading ? (
                                    <tr><td colSpan={4} className="p-20 text-center text-slate-400">Loading...</td></tr>
                                ) : packages.length === 0 ? (
                                    <tr><td colSpan={4} className="p-20 text-center text-slate-500">Belum ada paket. Klik sinkron dari Mikrotik!</td></tr>
                                ) : (
                                    packages
                                        .filter((p: any) => (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()))
                                        .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                                        .map((p: any) => (
                                            <tr key={p.id} className="hover:bg-white/5 transition-all group">
                                                <td className="p-5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20 shadow-inner">
                                                            <Wifi className="w-5 h-5" />
                                                        </div>
                                                        <span className="font-bold text-white text-lg">{p.name}</span>
                                                    </div>
                                                </td>
                                                <td className="p-5 font-mono text-teal-400 font-bold">{p.speed_limit || p.bandwidth_limit || 'Tidak Ada Limit'}</td>
                                                <td className="p-5">
                                                    <span className="text-xl font-black text-white">Rp {parseInt(p.price).toLocaleString('id-ID')}</span>
                                                    <span className="text-[10px] text-slate-500 block">per bulan</span>
                                                </td>
                                                <td className="p-5 text-center">
                                                    <div className="flex justify-center gap-2">
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
                                                            className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 transition-all hover:scale-110 shadow-sm"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDelete(p.id, p.name)}
                                                            className="p-2.5 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 transition-all hover:scale-110 shadow-sm"
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

                {/* Mobile Card View */}
                <div className="md:hidden space-y-4">
                    <div className="glass p-4 rounded-2xl border border-white/10 mb-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input 
                                type="text" 
                                placeholder="Cari paket..." 
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-indigo-500 shadow-inner"
                            />
                        </div>
                    </div>
                    {loading ? (
                        <div className="p-10 text-center text-slate-500 animate-pulse uppercase font-black text-xs tracking-widest">Memuat...</div>
                    ) : packages.length === 0 ? (
                        <div className="p-10 text-center text-slate-500">Kosong</div>
                    ) : (
                        packages
                            .filter((p: any) => (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()))
                            .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                            .map((p: any) => (
                                <div key={p.id} className="glass p-5 rounded-3xl border border-white/10 space-y-4 shadow-xl">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20 shadow-inner">
                                                <Package className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h4 className="font-black text-white text-lg leading-tight">{p.name}</h4>
                                                <p className="text-xs text-slate-500 font-bold tracking-wider">Rp {parseInt(p.price).toLocaleString('id-ID')} / bln</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => {
                                                    setIsEditing(true);
                                                    setEditId(p.id);
                                                    setFormData({ name: p.name, speed_limit: p.speed_limit || p.bandwidth_limit || '', price: parseInt(p.price) });
                                                    setShowForm(true);
                                                }}
                                                className="p-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 active:scale-95 transition-all"
                                            >
                                                <Edit className="w-5 h-5" />
                                            </button>
                                            <button onClick={() => handleDelete(p.id, p.name)} className="p-3 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 active:scale-95 transition-all">
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="bg-slate-900/50 p-4 rounded-2xl flex items-center justify-between border border-white/5">
                                        <div className="flex items-center gap-2">
                                            <Wifi className="w-4 h-4 text-teal-400" />
                                            <span className="text-[10px] font-black text-teal-400 uppercase tracking-[0.2em]">{p.speed_limit || p.bandwidth_limit || 'No Limit'}</span>
                                        </div>
                                        <div className="w-2 h-2 rounded-full bg-teal-500 shadow-[0_0_10px_rgba(20,184,166,0.5)]"></div>
                                    </div>
                                </div>
                            ))
                    )}
                </div>

                {/* Pagination Controls */}
                {!loading && packages.length > itemsPerPage && (
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-8 px-2">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                            Total <span className="text-white">{packages.filter((p: any) => (p.name || '').toLowerCase().includes(searchTerm.toLowerCase())).length}</span> Paket Tersedia
                        </p>
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="px-5 py-2.5 rounded-xl glass border border-white/10 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                                Prev
                            </button>
                            <button 
                                onClick={() => setCurrentPage(p => p + 1)}
                                disabled={currentPage >= Math.ceil(packages.filter((p: any) => (p.name || '').toLowerCase().includes(searchTerm.toLowerCase())).length / itemsPerPage)}
                                className="px-5 py-2.5 rounded-xl glass border border-white/10 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
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
