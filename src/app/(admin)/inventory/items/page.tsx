'use client';

import { useState, useEffect, useRef } from 'react';
import { 
    Package, Search, PlusCircle, Trash2, Edit, Box, Filter, Loader2, 
    ChevronLeft, ChevronRight, FileSpreadsheet, Download, Printer, X, 
    QrCode, FileDown, Upload, FileJson, CheckCircle2, AlertCircle
} from 'lucide-react';
import Swal from 'sweetalert2';

export default function InventoryItemsPage() {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [editingItem, setEditingItem] = useState<any>(null);
    const [formData, setFormData] = useState({
        item_name: '',
        category: 'Hardware',
        stock: 0,
        unit: 'pcs',
        price_per_unit: 0,
        min_stock: 5
    });

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [labelConfig, setLabelConfig] = useState({
        size: '5x5', // '5x5', 'a4', 'thermal'
        qty: 1
    });

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
                    title: editingItem ? 'Termodifikasi' : 'Terdaftar',
                    text: `Matriks item ${formData.item_name} telah disinkronkan ke gudang.`,
                    background: '#0f172a',
                    color: '#fff',
                    timer: 1500,
                    showConfirmButton: false
                });
                setIsModalOpen(false);
                setEditingItem(null);
                setFormData({ item_name: '', category: 'Hardware', stock: 0, unit: 'pcs', price_per_unit: 0, min_stock: 5 });
                fetchItems();
            }
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Kegagalan Matriks', text: 'Gagal melakukan sinkronisasi gudang.', background: '#0f172a', color: '#fff' });
        }
    };

    const handleDelete = async (id: number, name: string) => {
        const result = await Swal.fire({
            title: 'Hapus Matriks?',
            text: `Hapus identitas ${name} dari gudang?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#f43f5e',
            cancelButtonText: 'Batal',
            confirmButtonText: 'Hapus Permanen',
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

    const exportToExcel = () => {
        const headers = ['ID', 'Nama Barang', 'Kategori', 'Stok', 'Satuan', 'Harga', 'Total Nilai'];
        const csvRows = [headers.join(',')];
        
        filteredItems.forEach(item => {
            const row = [
                `INV-${item.id}`,
                `"${item.item_name}"`,
                item.category,
                item.stock,
                item.unit,
                item.price_per_unit,
                item.stock * item.price_per_unit
            ];
            csvRows.push(row.join(','));
        });

        const csvContent = "\uFEFF" + csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `STOK_BARANG_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    const printLabel = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=INV-${selectedItem.id}`;
        
        let styles = '';
        if (labelConfig.size === '5x5') {
            styles = `
                @page { size: 50mm 50mm; margin: 0; }
                body { margin: 0; padding: 0; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: white; }
                .label { width: 50mm; height: 50mm; padding: 5mm; box-sizing: border-box; text-align: center; border: 0.1mm solid #eee; display: flex; flex-direction: column; align-items: center; justify-content: center; }
            `;
        } else if (labelConfig.size === 'thermal') {
            styles = `
                @page { size: 58mm auto; margin: 0; }
                body { margin: 0; padding: 5mm; font-family: sans-serif; background: white; }
                .label { width: 48mm; text-align: center; }
            `;
        }

        printWindow.document.write(`
            <html>
                <head>
                    <title>Print Label - ${selectedItem.item_name}</title>
                    <style>
                        ${styles}
                        .qr { width: 100px; height: 100px; margin-bottom: 10px; }
                        .name { font-weight: bold; font-size: 12px; text-transform: uppercase; margin-bottom: 4px; }
                        .id { font-size: 10px; color: #666; font-family: monospace; letter-spacing: 1px; }
                        .brand { font-size: 8px; color: #999; margin-top: 10px; font-weight: bold; text-transform: uppercase; }
                    </style>
                </head>
                <body>
                    <div class="label">
                        <img src="${qrUrl}" class="qr" onload="window.print(); window.close();" />
                        <div class="name">${selectedItem.item_name}</div>
                        <div class="id">INV-${selectedItem.id.toString().padStart(4, '0')}</div>
                        <div class="brand">Sahabat Network</div>
                    </div>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const text = event.target?.result as string;
            const lines = text.split('\n');
            const headers = lines[0].split(',');
            
            let successCount = 0;
            for (let i = 1; i < lines.length; i++) {
                if (!lines[i].trim()) continue;
                const values = lines[i].split(',');
                const payload = {
                    item_name: values[1]?.replace(/"/g, ''),
                    category: values[2],
                    stock: parseInt(values[3]),
                    unit: values[4],
                    price_per_unit: parseInt(values[5]),
                    min_stock: parseInt(values[6]) || 5
                };

                try {
                    await fetch('/api/inventory', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                    successCount++;
                } catch (e) {}
            }

            Swal.fire({
                icon: 'success',
                title: 'Import Selesai',
                text: `${successCount} item telah diimpor ke matriks gudang.`,
                background: '#0f172a',
                color: '#fff'
            });
            fetchItems();
        };
        reader.readAsText(file);
    };

    const fileInputRef = useRef<HTMLInputElement>(null);

    const filteredItems = items.filter(item => 
        item.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const paginatedItems = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

    return (
        <div className="animate-in fade-in duration-500 pb-20 space-y-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12 border-b border-white/5 pb-10">
                <div>
                    <h3 className="text-heading flex items-center gap-5">
                        <Box className="w-10 h-10 text-accent" />
                        Logistik & Stok Barang
                    </h3>
                    <p className="text-label mt-2">Matriks Aset & Manajemen Infrastruktur Jaringan</p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={() => { setEditingItem(null); setFormData({ item_name: '', category: 'Hardware', stock: 0, unit: 'pcs', price_per_unit: 0, min_stock: 5 }); setIsModalOpen(true); }}
                        className="bg-accent hover:bg-accent/90 text-white font-black py-4 px-10 rounded-2xl transition-all shadow-xl active:scale-95 flex items-center gap-3 uppercase tracking-widest text-[10px]"
                    >
                        <PlusCircle className="w-5 h-5" />
                        Tambah Item Baru
                    </button>
                </div>
            </div>

            {/* Modal: Add/Edit Item */}
            {isModalOpen && (
                <div className="fixed inset-0 z-100 flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="glass w-full max-w-4xl p-10 md:p-14 rounded-[48px] border border-white/10 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300">
                        <button onClick={() => setIsModalOpen(false)} className="absolute top-8 right-8 p-3 hover:bg-white/5 rounded-2xl transition-all">
                            <X className="w-6 h-6 text-muted" />
                        </button>
                        
                        <div className="flex items-center gap-6 mb-12">
                            <div className="w-16 h-16 rounded-3xl bg-accent/5 flex items-center justify-center text-accent border border-accent/10 shadow-inner">
                                <PlusCircle className="w-8 h-8" />
                            </div>
                            <div>
                                <h4 className="text-3xl font-black text-primary tracking-tight uppercase">
                                    {editingItem ? 'Modifikasi Aset' : 'Registrasi Aset Baru'}
                                </h4>
                                <p className="text-label mt-1">Lengkapi parameter teknis gudang</p>
                            </div>
                        </div>

                        <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Nomenklatur Barang</label>
                                <input type="text" required value={formData.item_name} onChange={(e) => setFormData({ ...formData, item_name: e.target.value })} className="w-full clean-input py-4 font-bold text-sm" placeholder="RB4011iGS+5AS..." />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Klasifikasi</label>
                                <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full clean-input py-4 font-bold text-sm appearance-none">
                                    <option value="Hardware">Hardware (Router/OLT)</option>
                                    <option value="Cable">Kabel/Dropcore/FO</option>
                                    <option value="Passive">Pasif (ODP/Splitter)</option>
                                    <option value="Tools">Alat Kerja (Splicer/OPM)</option>
                                    <option value="Office">ATK & Kantor</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Kuantitas</label>
                                    <input type="number" required value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) })} className="w-full clean-input py-4 font-bold text-sm text-center" />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Satuan</label>
                                    <input type="text" required value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} className="w-full clean-input py-4 font-bold text-sm text-center" placeholder="pcs" />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Nilai Satuan (IDR)</label>
                                <input type="number" required value={formData.price_per_unit} onChange={(e) => setFormData({ ...formData, price_per_unit: parseInt(e.target.value) })} className="w-full clean-input py-4 font-bold text-sm" />
                            </div>
                            <div className="space-y-3 md:col-span-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Batas Stok Minimal (Alert Threshold)</label>
                                <input type="number" required value={formData.min_stock} onChange={(e) => setFormData({ ...formData, min_stock: parseInt(e.target.value) })} className="w-full clean-input py-4 font-bold text-sm" />
                            </div>
                            
                            <div className="md:col-span-2 flex gap-4 mt-10">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-5 glass border border-white/5 text-slate-500 font-black rounded-2xl hover:bg-white/5 transition-all uppercase tracking-widest text-[11px]">
                                    Batalkan
                                </button>
                                <button type="submit" className="flex-2 py-5 bg-accent text-white font-black rounded-2xl shadow-xl shadow-accent/20 hover:bg-accent/90 transition-all uppercase tracking-widest text-[11px] flex items-center justify-center gap-3">
                                    <CheckCircle2 className="w-5 h-5" />
                                    Simpan ke Matriks
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Print Label */}
            {isPrintModalOpen && (
                <div className="fixed inset-0 z-110 flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-300">
                    <div className="glass w-full max-w-lg p-12 rounded-[40px] border border-white/10 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300 text-center">
                        <button onClick={() => setIsPrintModalOpen(false)} className="absolute top-8 right-8 p-3 hover:bg-white/5 rounded-2xl transition-all">
                            <X className="w-6 h-6 text-muted" />
                        </button>

                        <div className="w-24 h-24 rounded-3xl bg-accent/5 flex items-center justify-center text-accent border border-accent/10 shadow-inner mx-auto mb-8">
                            <QrCode className="w-12 h-12" />
                        </div>
                        
                        <h4 className="text-2xl font-black text-primary tracking-tight uppercase mb-2">Cetak Label QR</h4>
                        <p className="text-label mb-10">{selectedItem?.item_name}</p>

                        <div className="grid grid-cols-2 gap-4 mb-10">
                            <button 
                                onClick={() => setLabelConfig({...labelConfig, size: '5x5'})}
                                className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 ${labelConfig.size === '5x5' ? 'border-accent bg-accent/5 text-primary' : 'border-white/5 text-muted hover:bg-white/5'}`}
                            >
                                <span className="font-black text-xs uppercase tracking-widest">Stiker 5x5</span>
                                <span className="text-[10px] opacity-60">Matriks Presisi</span>
                            </button>
                            <button 
                                onClick={() => setLabelConfig({...labelConfig, size: 'thermal'})}
                                className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 ${labelConfig.size === 'thermal' ? 'border-accent bg-accent/5 text-primary' : 'border-white/5 text-muted hover:bg-white/5'}`}
                            >
                                <span className="font-black text-xs uppercase tracking-widest">Termal 58mm</span>
                                <span className="text-[10px] opacity-60">Bluetooth/Nirkabel</span>
                            </button>
                        </div>

                        <button 
                            onClick={printLabel}
                            className="w-full py-5 bg-accent text-white font-black rounded-2xl shadow-xl shadow-accent/20 hover:bg-accent/90 transition-all uppercase tracking-widest text-[11px] flex items-center justify-center gap-4"
                        >
                            <Printer className="w-5 h-5" />
                            Eksekusi Cetak
                        </button>
                    </div>
                </div>
            )}

            <div className="space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                        <input
                            type="text"
                            placeholder="CARI MATRIKS BARANG..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full h-14 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-2xl pl-18 pr-6 font-black text-xs uppercase tracking-widest focus:border-accent/50 transition-all shadow-sm outline-none"
                        />
                    </div>
                    <div className="flex items-center gap-4">
                        <button onClick={exportToExcel} className="h-14 px-8 bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/10 rounded-2xl flex items-center gap-4 text-emerald-500 transition-all shadow-sm group active:scale-95">
                            <FileSpreadsheet className="w-5 h-5" />
                            <span className="text-[11px] font-black uppercase tracking-widest">Excel</span>
                        </button>
                        <button onClick={() => window.print()} className="h-14 px-8 bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/10 rounded-2xl flex items-center gap-4 text-rose-500 transition-all shadow-sm group active:scale-95">
                            <FileDown className="w-5 h-5" />
                            <span className="text-[11px] font-black uppercase tracking-widest">PDF Report</span>
                        </button>
                        <div className="h-8 w-px bg-white/5 mx-2"></div>
                        <button onClick={() => fileInputRef.current?.click()} className="h-14 px-8 bg-accent/5 hover:bg-accent/10 border border-accent/10 rounded-2xl flex items-center gap-4 text-accent transition-all shadow-sm group active:scale-95">
                            <Upload className="w-5 h-5" />
                            <span className="text-[11px] font-black uppercase tracking-widest">Import</span>
                        </button>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleImport} 
                            accept=".csv" 
                            className="hidden" 
                        />
                    </div>
                </div>

                <div className="glass rounded-[48px] overflow-hidden border border-white/10 bg-white dark:bg-slate-900/50 shadow-2xl backdrop-blur-xl">
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse min-w-[1000px]">
                            <thead>
                                <tr className="bg-slate-50/50 dark:bg-white/2 border-b border-slate-100 dark:border-white/5">
                                    <th className="px-8 py-5 text-label">Nomenklatur Barang</th>
                                    <th className="px-8 py-5 text-label">Klasifikasi</th>
                                    <th className="px-8 py-5 text-label text-center">Stok Gudang</th>
                                    <th className="px-8 py-5 text-label">Nilai Satuan</th>
                                    <th className="px-8 py-5 text-label">Ekuitas Aset</th>
                                    <th className="px-8 py-5 text-label text-right">Manajemen</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="p-32 text-center">
                                            <div className="flex flex-col items-center gap-6 animate-pulse">
                                                <Loader2 className="w-12 h-12 animate-spin text-accent" />
                                                <span className="text-label">Menyinkronkan Matriks Gudang...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : paginatedItems.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="p-32 text-center text-label">Tidak ada matriks aset ditemukan.</td>
                                    </tr>
                                ) : (
                                    paginatedItems.map((item) => (
                                        <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-white/2 transition-all group">
                                            <td className="px-8 py-3">
                                                <div className="flex items-center gap-5">
                                                    <div className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-white/5 flex items-center justify-center text-muted group-hover:bg-accent group-hover:text-white transition-all shadow-inner">
                                                        <Package className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <p className="text-value uppercase">{item.item_name}</p>
                                                        <p className="text-label mt-1.5 opacity-40">ID: INV-{item.id.toString().padStart(4, '0')}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-3">
                                                <span className="px-4 py-2 bg-white/5 text-slate-500 text-[10px] font-black uppercase rounded-xl border border-white/5 tracking-widest">{item.category}</span>
                                            </td>
                                            <td className="px-8 py-3 text-center">
                                                <div className="flex flex-col items-center">
                                                    <div className={`px-4 py-2 rounded-xl font-black text-xs tracking-tight ${item.stock <= item.min_stock ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'}`}>
                                                        {item.stock} {item.unit}
                                                    </div>
                                                    {item.stock <= item.min_stock && (
                                                        <span className="text-[8px] font-black text-red-500 uppercase mt-2 tracking-widest animate-pulse">Alert!</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-8 py-3">
                                                <p className="text-value tracking-tighter">Rp {parseInt(item.price_per_unit).toLocaleString('id-ID')}</p>
                                            </td>
                                            <td className="px-8 py-3">
                                                <p className="text-value text-accent tracking-tighter font-black">Rp {(item.stock * item.price_per_unit).toLocaleString('id-ID')}</p>
                                            </td>
                                            <td className="px-8 py-3 text-right">
                                                <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all">
                                                    <button onClick={() => { setSelectedItem(item); setIsPrintModalOpen(true); }} className="p-3.5 rounded-2xl bg-white dark:bg-white/5 text-slate-400 hover:text-accent border border-slate-100 dark:border-white/5 transition-all shadow-lg active:scale-90" title="Cetak Label QR">
                                                        <QrCode className="w-4.5 h-4.5" />
                                                    </button>
                                                    <button onClick={() => { setEditingItem(item); setFormData(item); setIsModalOpen(true); }} className="p-3.5 rounded-2xl bg-white dark:bg-white/5 text-slate-400 hover:text-blue-500 border border-slate-100 dark:border-white/5 transition-all shadow-lg active:scale-90" title="Edit">
                                                        <Edit className="w-4.5 h-4.5" />
                                                    </button>
                                                    <button onClick={() => handleDelete(item.id, item.item_name)} className="p-3.5 rounded-2xl bg-white dark:bg-white/5 text-slate-400 hover:text-red-500 border border-slate-100 dark:border-white/5 transition-all shadow-lg active:scale-90" title="Hapus">
                                                        <Trash2 className="w-4.5 h-4.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="p-10 border-t border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50/30 dark:bg-white/2">
                        <p className="text-label">
                            Menampilkan <span className="text-primary">{paginatedItems.length}</span> dari <span className="text-primary">{filteredItems.length}</span> Barang
                        </p>
                        <div className="flex gap-4">
                            <button 
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl hover:bg-slate-50 dark:hover:bg-white/5 text-muted disabled:opacity-30 transition-all shadow-sm active:scale-95"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button 
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl hover:bg-slate-50 dark:hover:bg-white/5 text-muted disabled:opacity-30 transition-all shadow-sm active:scale-95"
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
