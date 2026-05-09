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
        <div className="animate-in fade-in duration-700 pb-24 space-y-12">
            {/* Ambient background ornament */}
            <div className="fixed top-1/4 -right-20 w-96 h-96 bg-accent/5 rounded-full blur-[120px] pointer-events-none z-0"></div>
            
            {/* Header Section */}
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-10 mb-16 border-b border-white/5 dark:border-white/5 pb-12">
                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-1 bg-accent rounded-full"></div>
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-accent">Node Kontrol v4.0</span>
                    </div>
                    <h3 className="text-4xl md:text-5xl font-black text-primary flex items-center gap-6 tracking-tighter">
                        <div className="relative">
                            <div className="absolute inset-0 bg-accent rounded-2xl blur-lg opacity-20"></div>
                            <Package className="w-12 h-12 text-accent relative z-10" />
                        </div>
                        Katalog Paket
                    </h3>
                    <p className="text-sm font-bold text-muted uppercase tracking-widest opacity-60">Manajemen Matriks Bandwidth & Pricing</p>
                </div>
                <div className="flex flex-wrap gap-4 w-full md:w-auto">
                    <button
                        onClick={handleSync}
                        className="flex-1 md:flex-none bg-surface dark:bg-white/5 hover:bg-white/10 text-primary dark:text-white font-black py-4 px-8 rounded-2xl transition-all border border-glass-border dark:border-white/10 flex items-center justify-center gap-3 uppercase tracking-[0.2em] text-[10px] active:scale-95 shadow-xl"
                    >
                        <RefreshCw className="w-4 h-4" /> Sinkron Node
                    </button>
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="flex-1 md:flex-none bg-linear-to-r from-accent to-indigo-600 hover:from-indigo-500 hover:to-indigo-600 text-white font-black py-4 px-10 rounded-2xl transition-all shadow-[0_20px_40px_rgba(16,185,129,0.3)] active:scale-95 flex items-center justify-center gap-3 uppercase tracking-[0.2em] text-[10px] border border-white/10"
                    >
                        <Plus className="w-4 h-4" /> Buat Paket Baru
                    </button>
                </div>
            </div>

            {showForm && (
                <div className="fixed inset-0 z-9999 flex items-center justify-center p-4 sm:p-6 bg-slate-950/90 backdrop-blur-2xl animate-in fade-in duration-500">
                    <div className="bg-surface dark:bg-[#0f172a] w-full max-w-2xl rounded-[48px] border border-glass-border dark:border-white/15 shadow-[0_50px_100px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-500">
                        <div className="absolute top-0 left-0 right-0 h-1.5 bg-linear-to-r from-transparent via-accent to-transparent"></div>
                        
                        <div className="p-10 border-b border-glass-border dark:border-white/10 flex justify-between items-center bg-linear-to-b from-white/5 to-transparent">
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 rounded-[24px] bg-accent/10 flex items-center justify-center text-accent border border-accent/20 shadow-inner">
                                    {isEditing ? <Edit className="w-8 h-8" /> : <Plus className="w-8 h-8" />}
                                </div>
                                <div>
                                    <h4 className="text-2xl font-black text-primary dark:text-white tracking-tighter uppercase">{isEditing ? 'Ubah Matriks' : 'Inisialisasi Paket'}</h4>
                                    <p className="text-[10px] text-accent font-black uppercase tracking-[0.3em] mt-1.5 opacity-80 underline underline-offset-4 decoration-accent/30">Entry Access Portal</p>
                                </div>
                            </div>
                            <button onClick={() => { setShowForm(false); setIsEditing(false); }} className="w-12 h-12 bg-white/5 hover:bg-white/10 rounded-2xl text-primary dark:text-white transition-all flex items-center justify-center border border-glass-border dark:border-white/10">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        
                        <div className="p-10 custom-scrollbar overflow-y-auto max-h-[70vh]">
                            <form onSubmit={handleSave} className="space-y-10">
                                <div className="space-y-4 group">
                                    <label className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-muted ml-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-accent"></div>
                                        Nama Paket (MikroTik Profile)
                                    </label>
                                    <input 
                                        type="text" required 
                                        value={formData.name} 
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                                        className="w-full bg-input dark:bg-white/5 border border-input-border dark:border-white/10 rounded-[24px] py-5 px-8 text-xl font-black text-primary dark:text-white focus:outline-none focus:border-accent/50 focus:bg-white/10 transition-all shadow-inner" 
                                        placeholder="Gold_50Mbps" 
                                    />
                                    <p className="text-[9px] text-muted font-bold uppercase tracking-widest ml-4 opacity-40 italic">* Sinkronisasi profil routeros diperlukan.</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <label className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-muted ml-1">
                                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                                            Batas Bandwidth
                                        </label>
                                        <div className="relative group">
                                            <input 
                                                type="text" required 
                                                value={formData.speed_limit} 
                                                onChange={(e) => setFormData({ ...formData, speed_limit: e.target.value })} 
                                                className="w-full bg-input dark:bg-white/5 border border-input-border dark:border-white/10 rounded-[24px] py-5 pl-16 pr-8 text-lg font-mono font-black text-accent focus:outline-none focus:border-accent/50 transition-all" 
                                                placeholder="50M/50M" 
                                            />
                                            <Wifi className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-accent/40 group-focus-within:text-accent group-focus-within:scale-110 transition-all" />
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <label className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-muted ml-1">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                            Harga Bulanan
                                        </label>
                                        <div className="flex items-center bg-input dark:bg-white/5 rounded-[24px] overflow-hidden border border-input-border dark:border-white/10 focus-within:border-emerald-500/50 transition-all shadow-inner">
                                            <div className="bg-white/5 px-6 py-5 border-r border-white/10">
                                                <span className="text-emerald-500 font-black text-xs">IDR</span>
                                            </div>
                                            <input 
                                                type="number" required 
                                                value={formData.price} 
                                                onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) })} 
                                                className="w-full bg-transparent py-5 px-8 font-mono font-black text-2xl focus:outline-none text-primary dark:text-white" 
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row justify-end gap-4 pt-10 border-t border-glass-border dark:border-white/10 mt-6">
                                    <button 
                                        type="button" 
                                        onClick={() => { setShowForm(false); setIsEditing(false); }} 
                                        className="flex-1 sm:flex-none px-10 py-5 rounded-[24px] bg-white/5 hover:bg-white/10 text-muted font-black uppercase tracking-[0.3em] text-[10px] transition-all border border-glass-border dark:border-white/5"
                                    >
                                        Batal
                                    </button>
                                    <button 
                                        type="submit" 
                                        disabled={saving}
                                        className="flex-1 sm:flex-none px-12 py-5 rounded-[24px] bg-linear-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-black uppercase tracking-[0.3em] text-[10px] transition-all shadow-[0_20px_40px_rgba(16,185,129,0.2)] flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 border border-white/10"
                                    >
                                        {saving ? (
                                            <RefreshCw className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Zap className="w-4 h-4 text-yellow-400" />
                                        )}
                                        {isEditing ? 'Simpan Matriks' : 'Aktifkan Paket'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Content View */}
            <div className="space-y-12 relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-8 px-2">
                    <div className="space-y-1">
                        <h4 className="text-2xl font-black text-primary dark:text-white uppercase tracking-tighter">Inventory Layanan</h4>
                        <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full bg-accent animate-pulse"></div>
                            <p className="text-[10px] font-black text-muted uppercase tracking-[0.4em]">Live Database Connection</p>
                        </div>
                    </div>
                    <div className="relative w-full md:w-[450px] group">
                        <div className="absolute inset-0 bg-accent/5 rounded-3xl blur-xl group-focus-within:bg-accent/10 transition-all"></div>
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted group-focus-within:text-accent transition-colors" />
                        <input 
                            type="text" 
                            placeholder="Cari katalog paket..." 
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            className="w-full bg-surface dark:bg-white/5 border border-glass-border dark:border-white/10 rounded-[32px] py-5 pl-16 pr-8 text-sm font-black text-primary dark:text-white focus:outline-none focus:border-accent/40 transition-all placeholder:text-muted placeholder:uppercase placeholder:tracking-widest backdrop-blur-xl shadow-2xl"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
                    {loading ? (
                        <div className="col-span-full py-40 flex flex-col items-center justify-center gap-6 animate-pulse">
                            <div className="w-20 h-20 rounded-3xl bg-accent/10 flex items-center justify-center border border-accent/20">
                                <RefreshCw className="w-10 h-10 text-accent animate-spin" />
                            </div>
                            <span className="text-[12px] font-black text-muted uppercase tracking-[0.6em]">Membangun Matriks Katalog...</span>
                        </div>
                    ) : paginatedPackages.length === 0 ? (
                        <div className="col-span-full py-40 flex flex-col items-center justify-center gap-6 bg-white/2 rounded-[48px] border border-dashed border-glass-border dark:border-white/10">
                            <Package className="w-16 h-16 text-muted opacity-20" />
                            <span className="text-[10px] font-black text-muted uppercase tracking-[0.6em]">Katalog Tidak Ditemukan</span>
                        </div>
                    ) : (
                        paginatedPackages.map((p: any) => (
                            <div key={p.id} className="group relative bg-surface dark:bg-[#0f172a]/80 backdrop-blur-3xl p-1 rounded-[32px] border border-glass-border dark:border-white/5 hover:border-accent/40 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] overflow-hidden flex flex-col h-full min-h-[320px]">
                                {/* Animated background gradient */}
                                <div className="absolute inset-0 bg-linear-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                                
                                <div className="p-6 space-y-6 flex-1 flex flex-col relative z-10">
                                    <div className="flex justify-between items-start">
                                        <div className="w-14 h-14 rounded-[20px] bg-linear-to-br from-white/5 to-white/2 border border-glass-border dark:border-white/10 flex items-center justify-center text-accent shadow-2xl group-hover:scale-110 group-hover:bg-accent group-hover:text-white transition-all duration-500">
                                            <Package className="w-7 h-7" />
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                                <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Active</span>
                                            </div>
                                            <button 
                                                onClick={() => {
                                                    setIsEditing(true);
                                                    setEditId(p.id);
                                                    setFormData({ name: p.name, speed_limit: p.speed_limit || p.bandwidth_limit || '', price: parseInt(p.price) });
                                                    setShowForm(true);
                                                }}
                                                className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-muted hover:text-accent border border-glass-border dark:border-white/5 transition-all"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <h4 className="text-xl font-black text-primary dark:text-white tracking-tighter uppercase leading-none group-hover:text-accent transition-colors truncate">{p.name}</h4>
                                        <p className="text-[9px] font-black text-muted uppercase tracking-[0.2em] opacity-60 underline underline-offset-4 decoration-accent/20">Logic Node Matrix</p>
                                    </div>

                                    <div className="flex-1 flex flex-col justify-center py-4 border-y border-glass-border dark:border-white/5 my-1">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                                                    <Wifi className="w-4 h-4 text-indigo-400" />
                                                </div>
                                                <span className="text-[10px] font-black text-muted uppercase tracking-widest">Bandwidth</span>
                                            </div>
                                            <span className="text-[12px] font-mono font-black text-primary dark:text-white bg-white/5 px-3 py-1.5 rounded-xl border border-glass-border dark:border-white/5">{p.speed_limit || p.bandwidth_limit || 'UNLIMITED'}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                                                    <Zap className="w-4 h-4 text-emerald-400" />
                                                </div>
                                                <span className="text-[10px] font-black text-muted uppercase tracking-widest">Pricing</span>
                                            </div>
                                            <span className="text-sm font-black text-emerald-500">Rp {parseInt(p.price).toLocaleString('id-ID')}</span>
                                        </div>
                                    </div>

                                    <div className="pt-2 flex flex-col gap-3">
                                        <button 
                                            onClick={() => handleDelete(p.id, p.name)}
                                            className="w-full py-4 rounded-2xl bg-red-500/5 hover:bg-red-500/10 text-red-500 border border-red-500/10 font-black text-[10px] uppercase tracking-[0.4em] active:scale-95 transition-all flex items-center justify-center gap-3 group/del shadow-inner"
                                        >
                                            <Trash2 className="w-4 h-4 group-hover/del:scale-125 transition-transform" />
                                            Hapus Paket
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-10 pt-16 border-t border-white/5 px-4">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-1 bg-accent/20 rounded-full"></div>
                            <p className="text-[11px] text-muted font-black uppercase tracking-[0.3em]">Halaman <span className="text-accent">{currentPage}</span> dari {totalPages}</p>
                        </div>
                        <div className="flex gap-4 w-full sm:w-auto">
                            <button 
                                disabled={currentPage === 1} 
                                onClick={() => setCurrentPage(prev => prev - 1)}
                                className="flex-1 sm:flex-none px-10 py-5 rounded-[24px] bg-surface dark:bg-white/5 border border-glass-border dark:border-white/10 text-[10px] font-black uppercase tracking-[0.3em] text-muted hover:text-primary dark:hover:text-white disabled:opacity-10 transition-all active:scale-95"
                            >
                                <ChevronLeft className="w-4 h-4 inline mr-2" /> Prev
                            </button>
                            <button 
                                disabled={currentPage === totalPages} 
                                onClick={() => setCurrentPage(prev => prev + 1)}
                                className="flex-1 sm:flex-none px-10 py-5 rounded-[24px] bg-surface dark:bg-white/5 border border-glass-border dark:border-white/10 text-[10px] font-black uppercase tracking-[0.3em] text-muted hover:text-primary dark:hover:text-white disabled:opacity-10 transition-all active:scale-95"
                            >
                                Next <ChevronRight className="w-4 h-4 inline ml-2" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
