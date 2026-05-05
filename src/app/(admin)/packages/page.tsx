'use client';

import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { Package, RefreshCw, Plus, Trash2, Edit, Save, X, Search, Wifi, ChevronLeft, ChevronRight, Zap } from 'lucide-react';

export default function PackagesPage() {
    const [packages, setPackages] = useState([]);
    const [routers, setRouters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    const [showForm, setShowForm] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);
    const [formData, setFormData] = useState({ name: '', speed_limit: '', price: 0 });

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
            Swal.fire({ icon: 'error', title: 'Gateway Tidak Ditemukan', text: 'Silakan tambahkan node router terlebih dahulu.', background: '#0f172a', color: '#fff' });
            return;
        }

        const { value: routerId } = await Swal.fire({
            title: 'Pilih Node',
            text: 'Pilih gateway untuk menyinkronkan profil PPPoE',
            input: 'select',
            inputOptions: Object.fromEntries(routers.map((r: any) => [r.id, r.name])),
            inputPlaceholder: '-- Pilih Gateway --',
            showCancelButton: true,
            cancelButtonText: 'Batal',
            background: '#0f172a',
            color: '#fff',
            confirmButtonColor: '#10b981'
        });

        if (!routerId) return;

        Swal.fire({ title: 'Menyinkronkan...', text: 'Membangun Koneksi Node...', allowOutsideClick: false, background: '#0f172a', color: '#fff', didOpen: () => { Swal.showLoading(); } });

        try {
            const res = await fetch('/api/packages/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ router_id: routerId })
            });
            const data = await res.json();
            if (res.ok) {
                Swal.fire({ icon: 'success', title: 'Sinkronisasi Berhasil', text: data.message, background: '#0f172a', color: '#fff' });
                fetchPackages();
            } else {
                Swal.fire({ icon: 'error', title: 'Sinkronisasi Gagal', text: data.error, background: '#0f172a', color: '#fff' });
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
                    text: 'Definisi paket telah diperbarui.', 
                    background: '#0f172a', 
                    color: '#fff', 
                    timer: 1500, 
                    showConfirmButton: false 
                });
            } else {
                const data = await res.json();
                Swal.fire({ icon: 'error', title: 'Gagal', text: data.error || 'Terjadi kesalahan sistem.', background: '#0f172a', color: '#fff' });
            }
        } catch (err) {
            console.error(err);
            Swal.fire({ icon: 'error', title: 'Kesalahan Jaringan', text: 'Koneksi terputus.', background: '#0f172a', color: '#fff' });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: number, name: string) => {
        const result = await Swal.fire({
            title: `Hapus Paket ${name}?`,
            text: "Peringatan: Tindakan ini permanen dan dapat mempengaruhi akun yang terhubung.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Ya, Hapus Paket',
            cancelButtonText: 'Batal',
            background: '#0f172a',
            color: '#fff'
        });

        if (result.isConfirmed) {
            try {
                const res = await fetch(`/api/packages/manage?id=${id}`, { method: 'DELETE' });
                if (res.ok) {
                    Swal.fire({ icon: 'success', title: 'Paket Dihapus', text: 'Katalog diperbarui.', background: '#0f172a', color: '#fff' });
                    fetchPackages();
                }
            } catch (err) { console.error(err); }
        }
    };

    const filteredPackages = packages.filter((p: any) => (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()));
    const totalPages = Math.ceil(filteredPackages.length / itemsPerPage);
    const paginatedPackages = filteredPackages.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div className="animate-in fade-in duration-500 pb-20 space-y-12">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-16 border-b border-(--glass-border) pb-10">
                <div className="space-y-2">
                    <h3 className="text-4xl font-bold text-primary flex items-center gap-5 tracking-tight">
                        <Package className="w-10 h-10 text-accent fill-accent/5" />
                        Pusat Paket Internet
                    </h3>
                    <p className="text-label mt-2">Manajemen Profil & Katalog Layanan Node</p>
                </div>
                <div className="flex flex-wrap gap-4">
                    <button
                        onClick={handleSync}
                        className="bg-accent/5 hover:bg-accent/10 text-accent font-bold py-3 px-6 rounded-2xl transition-all border border-accent/10 flex items-center gap-3 uppercase tracking-widest text-[10px]"
                    >
                        <RefreshCw className="w-4 h-4" /> Sinkron Node
                    </button>
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="bg-accent hover:bg-accent/90 text-white font-bold py-3 px-8 rounded-2xl transition-all shadow-lg active:scale-95 flex items-center gap-3 uppercase tracking-widest text-[10px]"
                    >
                        <Plus className="w-4 h-4" /> Buat Paket
                    </button>
                </div>
            </div>

            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-slate-900 w-full max-w-3xl rounded-4xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[95vh] animate-in zoom-in-95 duration-300">
                        <div className="p-10 border-b border-white/5 flex justify-between items-center bg-white/2">
                            <div className="flex items-center gap-5">
                                <div className="w-14 h-14 rounded-2xl bg-accent/5 flex items-center justify-center text-accent border border-accent/10">
                                    {isEditing ? <Edit className="w-7 h-7" /> : <Plus className="w-7 h-7" />}
                                </div>
                                <div>
                                    <h4 className="text-2xl font-bold text-white tracking-tight">{isEditing ? 'Ubah Matriks Paket' : 'Buat Paket Baru'}</h4>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Inteligensi Profil Infrastruktur</p>
                                </div>
                            </div>
                            <button onClick={() => { setShowForm(false); setIsEditing(false); }} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-slate-500 transition-colors">
                                <X className="w-7 h-7" />
                            </button>
                        </div>
                        
                        <div className="p-10 bg-slate-900/50">
                            <form onSubmit={handleSave} className="space-y-8">
                                <div className="space-y-3">
                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Identifikasi Paket (Sesuai Profil)</label>
                                    <input 
                                        type="text" required 
                                        value={formData.name} 
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                                        className="w-full clean-input py-4 px-6 text-lg font-bold" 
                                        placeholder="Contoh: Gold_50Mbps" 
                                    />
                                    <p className="text-[9px] text-slate-600 font-medium uppercase tracking-widest ml-1 opacity-60">* Harus sesuai dengan identifikasi profil di RouterOS.</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Batas Bandwidth</label>
                                        <div className="relative">
                                            <input 
                                                type="text" required 
                                                value={formData.speed_limit} 
                                                onChange={(e) => setFormData({ ...formData, speed_limit: e.target.value })} 
                                                className="w-full clean-input py-4 pl-14 pr-6 text-sm font-mono font-bold" 
                                                placeholder="50M/50M" 
                                            />
                                            <Wifi className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-accent/30" />
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Harga Langganan Bulanan</label>
                                        <div className="flex items-center glass rounded-2xl overflow-hidden border border-white/5 bg-white/2 focus-within:border-accent/30 transition-all">
                                            <div className="bg-white/5 px-6 py-4 border-r border-white/5">
                                                <span className="text-slate-500 font-bold text-xs">IDR</span>
                                            </div>
                                            <input 
                                                type="number" required 
                                                value={formData.price} 
                                                onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) })} 
                                                className="w-full bg-transparent py-4 px-6 font-mono font-bold text-xl focus:outline-none text-white" 
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-6 pt-10 border-t border-white/5 mt-6">
                                    <button 
                                        type="button" 
                                        onClick={() => { setShowForm(false); setIsEditing(false); }} 
                                        className="px-8 py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 font-bold uppercase tracking-widest text-[10px] transition-all"
                                    >
                                        Batal
                                    </button>
                                    <button 
                                        type="submit" 
                                        disabled={saving}
                                        className="px-10 py-4 rounded-2xl bg-accent hover:bg-accent/90 text-white font-bold uppercase tracking-widest text-[10px] transition-all shadow-xl flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                                    >
                                        {saving ? (
                                            <RefreshCw className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Save className="w-4 h-4" />
                                        )}
                                        {isEditing ? 'Simpan Perubahan' : 'Inisialisasi Paket'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Content View */}
            <div className="space-y-8">
                <div className="hidden lg:block glass rounded-4xl overflow-hidden shadow-xl bg-white/2 border border-(--glass-border)">
                    <div className="p-10 border-b border-(--glass-border) flex flex-col md:flex-row justify-between items-start md:items-center gap-8 bg-white/2">
                        <div>
                            <h4 className="text-2xl font-bold text-primary tracking-tight uppercase">Paket Internet</h4>
                            <p className="text-label mt-1">Katalog Layanan Digital</p>
                        </div>
                        <div className="relative w-full md:w-[400px]">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input 
                                type="text" 
                                placeholder="Saring katalog..." 
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                className="clean-input w-full py-4 pl-18 pr-6 text-sm font-bold"
                            />
                        </div>
                    </div>
                    <div className="overflow-x-auto min-h-[400px] custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white/1 text-label border-b border-white/5">
                                    <th className="px-8 py-5">Identifikasi Paket</th>
                                    <th className="px-8 py-5">Matriks Bandwidth</th>
                                    <th className="px-8 py-5">Harga / Bln</th>
                                    <th className="px-8 py-5 text-right">Orkestrasi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-sm">
                                {loading ? (
                                    <tr><td colSpan={4} className="p-32 text-center text-slate-500 font-bold tracking-widest uppercase animate-pulse">Menginisialisasi Katalog...</td></tr>
                                ) : paginatedPackages.length === 0 ? (
                                    <tr><td colSpan={4} className="p-32 text-center text-slate-500 font-bold uppercase tracking-widest text-[10px] opacity-40">Rekaman katalog kosong.</td></tr>
                                ) : (
                                    paginatedPackages.map((p: any) => (
                                        <tr key={p.id} className="hover:bg-white/2 transition-all group">
                                            <td className="px-8 py-3">
                                                <div className="flex items-center gap-5">
                                                    <div className="w-10 h-10 rounded-2xl bg-accent/5 flex items-center justify-center text-accent border border-accent/10 group-hover:scale-110 transition-all">
                                                        <Package className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-black text-primary uppercase tracking-tight">{p.name}</div>
                                                        <p className="text-[10px] font-bold text-muted uppercase tracking-[0.2em] mt-1 opacity-50">Node Logika PPPoE</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-3">
                                                <span className="px-3 py-1 rounded-lg bg-accent/5 text-accent border border-accent/10 text-[10px] font-mono font-bold tracking-widest">
                                                    {p.speed_limit || p.bandwidth_limit || 'UNLIMITED'}
                                                </span>
                                            </td>
                                            <td className="px-8 py-3">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-primary">Rp {parseInt(p.price).toLocaleString('id-ID')}</span>
                                                    <span className="text-label mt-1 opacity-40 italic">Vektor Pendapatan</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-3 text-right">
                                                <div className="flex justify-end gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
                                                    <button 
                                                        onClick={() => {
                                                            setIsEditing(true);
                                                            setEditId(p.id);
                                                            setFormData({ name: p.name, speed_limit: p.speed_limit || p.bandwidth_limit || '', price: parseInt(p.price) });
                                                            setShowForm(true);
                                                        }}
                                                        className="p-2.5 rounded-xl bg-white/2 text-slate-400 hover:bg-accent/10 hover:text-accent border border-white/5 transition-all"
                                                        title="Ubah"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDelete(p.id, p.name)}
                                                        className="p-2.5 rounded-xl bg-white/2 text-slate-400 hover:bg-red-500/10 hover:text-red-500 border border-white/5 transition-all"
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
                <div className="lg:hidden space-y-6">
                    {paginatedPackages.map((p: any) => (
                    <div key={p.id} className="glass p-8 rounded-4xl border border-(--glass-border) space-y-6 bg-white/2 shadow-xl relative group overflow-hidden">
                        <div className="flex justify-between items-start relative z-10">
                            <div className="flex items-center gap-5">
                                <div className="w-14 h-14 rounded-2xl bg-accent/5 flex items-center justify-center text-accent border border-accent/10">
                                    <Package className="w-7 h-7" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-white text-lg tracking-tight leading-tight">{p.name}</h4>
                                    <p className="text-[10px] text-accent font-bold tracking-widest uppercase mt-1">Rp {parseInt(p.price).toLocaleString('id-ID')}</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => {
                                    setIsEditing(true);
                                    setEditId(p.id);
                                    setFormData({ name: p.name, speed_limit: p.speed_limit || p.bandwidth_limit || '', price: parseInt(p.price) });
                                    setShowForm(true);
                                }}
                                className="p-4 rounded-2xl bg-white/5 text-slate-400 border border-white/5"
                            >
                                <Edit className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="bg-slate-950/40 p-5 rounded-3xl flex items-center justify-between border border-white/5">
                            <div className="flex items-center gap-4">
                                <Wifi className="w-5 h-5 text-accent/40" />
                                <div>
                                    <p className="text-[8px] uppercase font-bold text-slate-600 tracking-widest">Batas Kecepatan</p>
                                    <span className="text-xs font-mono font-bold text-slate-200">{p.speed_limit || p.bandwidth_limit || 'Unlimited'}</span>
                                </div>
                            </div>
                            <div className="w-2 h-2 rounded-full bg-accent shadow-[0_0_10px_rgba(16,185,129,0.4)] animate-pulse"></div>
                        </div>
                        <button onClick={() => handleDelete(p.id, p.name)} className="w-full py-4 rounded-2xl bg-red-500/5 text-red-600 border border-red-500/10 font-bold text-[9px] uppercase tracking-widest active:scale-95 transition-all">Hapus Paket</button>
                    </div>
                    ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-8 pt-10 border-t border-white/5">
                        <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">Halaman <span className="text-primary">{currentPage}</span> dari {totalPages}</p>
                        <div className="flex gap-4">
                            <button 
                                disabled={currentPage === 1} 
                                onClick={() => setCurrentPage(prev => prev - 1)}
                                className="px-6 py-3.5 rounded-xl bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-primary disabled:opacity-20 transition-all active:scale-95"
                            >
                                Sebelumnya
                            </button>
                            <button 
                                disabled={currentPage === totalPages} 
                                onClick={() => setCurrentPage(prev => prev + 1)}
                                className="px-6 py-3.5 rounded-xl bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-primary disabled:opacity-20 transition-all active:scale-95"
                            >
                                Selanjutnya
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
