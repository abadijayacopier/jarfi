'use client';

import { useState, useEffect } from 'react';
import { Package, Search, PlusCircle, Trash2, Edit, AlertCircle, Box, Filter, Loader2, ChevronLeft, ChevronRight, FileSpreadsheet } from 'lucide-react';
import Swal from 'sweetalert2';

export default function InventoryPage() {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);
    const [formData, setFormData] = useState({
        item_name: '',
        category: 'Hardware',
        stock: 0,
        unit: 'pcs',
        price_per_unit: 0,
        min_stock: 5
    });

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    useEffect(() => {
        fetchItems();
    }, []);

    const fetchItems = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/inventory');
            const data = await res.json();
            if (res.ok) setItems(data.items || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const method = editingItem ? 'PUT' : 'POST';
        const payload = editingItem ? { ...formData, id: editingItem.id } : formData;

        try {
            const res = await fetch('/api/inventory', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                Swal.fire({
                    icon: 'success',
                    title: editingItem ? 'Diperbarui' : 'Ditambahkan',
                    text: `Item ${formData.item_name} berhasil ${editingItem ? 'diperbarui' : 'disimpan'}.`,
                    background: '#0f172a',
                    color: '#fff'
                });
                setShowForm(false);
                setEditingItem(null);
                setFormData({ item_name: '', category: 'Hardware', stock: 0, unit: 'pcs', price_per_unit: 0, min_stock: 5 });
                fetchItems();
            }
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Gagal', text: 'Terjadi kesalahan sistem.', background: '#0f172a', color: '#fff' });
        }
    };

    const handleDelete = async (id: number, name: string) => {
        const result = await Swal.fire({
            title: 'Hapus Item?',
            text: `Apakah Anda yakin ingin menghapus ${name}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#f43f5e',
            cancelButtonText: 'Batal',
            confirmButtonText: 'Hapus',
            background: '#0f172a',
            color: '#fff'
        });

        if (result.isConfirmed) {
            try {
                const res = await fetch(`/api/inventory?id=${id}`, { method: 'DELETE' });
                if (res.ok) fetchItems();
            } catch (err) {
                console.error(err);
            }
        }
    };

    const filteredItems = items.filter(item => 
        item.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const paginatedItems = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

    return (
        <div className="animate-in fade-in duration-500 pb-20 space-y-12">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12 border-b border-white/5 pb-10">
                <div>
                    <h3 className="text-4xl font-black text-slate-800 dark:text-white flex items-center gap-5 tracking-tight uppercase">
                        <Box className="w-10 h-10 text-accent" />
                        Inventaris Barang
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 font-bold mt-2 uppercase text-[10px] tracking-[0.2em] opacity-60">Pengelolaan Aset & Stok Infrastruktur ISP</p>
                </div>
                <button
                    onClick={() => { setEditingItem(null); setShowForm(!showForm); }}
                    className="bg-accent hover:bg-accent/90 text-white font-black py-4 px-10 rounded-2xl transition-all shadow-xl active:scale-95 flex items-center gap-3 uppercase tracking-widest text-[10px]"
                >
                    <PlusCircle className="w-5 h-5" />
                    {showForm ? 'Batalkan' : 'Tambah Barang'}
                </button>
            </div>

            {showForm && (
                <div className="glass p-10 rounded-[40px] border border-white/10 bg-white/5 dark:bg-slate-900/50 animate-in slide-in-from-top-6 duration-500 shadow-2xl relative overflow-hidden backdrop-blur-xl mb-12">
                    <h4 className="text-xl font-black text-slate-800 dark:text-white mb-8 flex items-center gap-3 uppercase tracking-tighter">
                        <Edit className="w-6 h-6 text-accent" />
                        {editingItem ? 'Edit Item' : 'Barang Baru'}
                    </h4>
                    <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
                        <div className="space-y-3">
                            <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Nama Barang</label>
                            <input type="text" required value={formData.item_name} onChange={(e) => setFormData({ ...formData, item_name: e.target.value })} className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-6 font-bold text-slate-800 dark:text-white focus:border-accent/50 outline-none transition-all" placeholder="Contoh: Router MikroTik RB4011" />
                        </div>
                        <div className="space-y-3">
                            <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Kategori</label>
                            <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-6 font-bold text-slate-800 dark:text-white focus:border-accent/50 outline-none transition-all">
                                <option value="Hardware" className="bg-slate-900">Hardware</option>
                                <option value="Cable" className="bg-slate-900">Kabel/Dropcore</option>
                                <option value="Passive" className="bg-slate-900">Pasif (ODP/Splitter)</option>
                                <option value="Office" className="bg-slate-900">Kantor</option>
                                <option value="Tools" className="bg-slate-900">Alat Kerja</option>
                            </select>
                        </div>
                        <div className="space-y-3">
                            <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Stok Awal</label>
                            <input type="number" required value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) })} className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-6 font-bold text-slate-800 dark:text-white focus:border-accent/50 outline-none transition-all" />
                        </div>
                        <div className="space-y-3">
                            <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Satuan</label>
                            <input type="text" required value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-6 font-bold text-slate-800 dark:text-white focus:border-accent/50 outline-none transition-all" placeholder="pcs, meter, roll" />
                        </div>
                        <div className="space-y-3">
                            <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Harga Satuan (Rp)</label>
                            <input type="number" required value={formData.price_per_unit} onChange={(e) => setFormData({ ...formData, price_per_unit: parseInt(e.target.value) })} className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-6 font-bold text-slate-800 dark:text-white focus:border-accent/50 outline-none transition-all" />
                        </div>
                        <div className="space-y-3">
                            <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Stok Minimal (Alert)</label>
                            <input type="number" required value={formData.min_stock} onChange={(e) => setFormData({ ...formData, min_stock: parseInt(e.target.value) })} className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-6 font-bold text-slate-800 dark:text-white focus:border-accent/50 outline-none transition-all" />
                        </div>
                        <div className="lg:col-span-3 flex justify-end gap-5 mt-10 border-t border-white/5 pt-10">
                            <button type="submit" className="bg-accent text-white font-black py-4 px-12 rounded-2xl shadow-xl hover:bg-accent/90 transition-all uppercase tracking-widest text-[10px]">
                                Simpan Data
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="CARI BARANG ATAU KATEGORI..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full h-14 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-2xl pl-16 pr-6 font-black text-xs uppercase tracking-widest focus:border-accent/50 transition-all shadow-sm outline-none"
                        />
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="h-14 px-6 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-2xl flex items-center gap-3 text-slate-500 hover:text-accent transition-all shadow-sm">
                            <Filter className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Filter</span>
                        </button>
                        <button className="h-14 px-6 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-2xl flex items-center gap-3 text-slate-500 hover:text-emerald-500 transition-all shadow-sm">
                            <FileSpreadsheet className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Ekspor</span>
                        </button>
                    </div>
                </div>

                <div className="glass rounded-[40px] overflow-hidden border border-white/10 bg-white dark:bg-slate-900/50 shadow-2xl backdrop-blur-xl">
                    <div className="overflow-x-auto min-h-[400px]">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 dark:bg-white/2 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] border-b border-slate-100 dark:border-white/5">
                                    <th className="px-8 py-8">Nama Barang</th>
                                    <th className="px-8 py-8">Kategori</th>
                                    <th className="px-8 py-8 text-center">Stok</th>
                                    <th className="px-8 py-8">Harga Satuan</th>
                                    <th className="px-8 py-8">Total Nilai</th>
                                    <th className="px-8 py-8 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="p-32 text-center">
                                            <div className="flex flex-col items-center gap-6 animate-pulse">
                                                <Loader2 className="w-12 h-12 animate-spin text-accent" />
                                                <span className="font-black uppercase tracking-widest text-[10px] text-slate-500">Menyinkronkan Gudang...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : paginatedItems.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="p-32 text-center text-slate-400 uppercase font-black text-[10px] tracking-widest opacity-40">Tidak ada barang ditemukan.</td>
                                    </tr>
                                ) : (
                                    paginatedItems.map((item) => (
                                        <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-white/2 transition-all group">
                                            <td className="px-8 py-7">
                                                <div className="flex items-center gap-5">
                                                    <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-400 group-hover:bg-accent group-hover:text-white transition-all shadow-inner">
                                                        <Package className="w-6 h-6" />
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-slate-800 dark:text-white uppercase tracking-tight text-sm leading-none">{item.item_name}</p>
                                                        <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-2 opacity-60">ID: INV-{item.id.toString().padStart(4, '0')}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-7">
                                                <span className="px-4 py-1.5 bg-white/5 dark:bg-white/5 text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase rounded-xl border border-white/5 tracking-widest">{item.category}</span>
                                            </td>
                                            <td className="px-8 py-7 text-center">
                                                <div className="flex flex-col items-center">
                                                    <div className={`px-4 py-1.5 rounded-xl font-black text-sm tracking-tighter ${item.stock <= item.min_stock ? 'bg-red-500 text-white shadow-lg shadow-red-500/20 animate-pulse' : 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'}`}>
                                                        {item.stock} {item.unit}
                                                    </div>
                                                    {item.stock <= item.min_stock && (
                                                        <span className="text-[8px] font-black text-red-500 uppercase mt-2 tracking-widest">STOK RENDAH!</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-8 py-7">
                                                <p className="font-black text-slate-800 dark:text-white text-sm tracking-tighter">Rp {parseInt(item.price_per_unit).toLocaleString('id-ID')}</p>
                                            </td>
                                            <td className="px-8 py-7">
                                                <p className="font-black text-accent text-sm tracking-tighter">Rp {(item.stock * item.price_per_unit).toLocaleString('id-ID')}</p>
                                            </td>
                                            <td className="px-8 py-7 text-right">
                                                <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all">
                                                    <button onClick={() => { setEditingItem(item); setFormData(item); setShowForm(true); }} className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 text-slate-400 hover:text-accent border border-white/5 transition-all shadow-lg active:scale-90" title="Edit">
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => handleDelete(item.id, item.item_name)} className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 text-slate-400 hover:text-red-500 border border-white/5 transition-all shadow-lg active:scale-90" title="Hapus">
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

                    {/* Pagination */}
                    <div className="p-10 border-t border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50/30 dark:bg-white/2">
                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">
                            Menampilkan <span className="text-slate-800 dark:text-white">{paginatedItems.length}</span> dari <span className="text-slate-800 dark:text-white">{filteredItems.length}</span> Barang
                        </p>
                        <div className="flex gap-4">
                            <button 
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl hover:bg-slate-50 dark:hover:bg-white/5 text-slate-400 disabled:opacity-30 transition-all shadow-sm active:scale-95"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button 
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl hover:bg-slate-50 dark:hover:bg-white/5 text-slate-400 disabled:opacity-30 transition-all shadow-sm active:scale-95"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
