'use client';

import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { Wifi, PlusCircle, Printer, Trash2, Eye } from 'lucide-react';
import Link from 'next/link';

export default function VouchersPage() {
    const [vouchers, setVouchers] = useState([]);
    const [routers, setRouters] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showAddForm, setShowAddForm] = useState(false);
    const [formData, setFormData] = useState({ router_id: '', quantity: 10, price: 5000, profile: '', prefix: 'VC-' });
    const [profiles, setProfiles] = useState([]);
    const [loadingProfiles, setLoadingProfiles] = useState(false);
    const [generating, setGenerating] = useState(false);

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

    return (
        <div className="animate-in fade-in duration-500 pb-10">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h3 className="text-3xl font-bold text-white flex items-center gap-3">
                        <Wifi className="w-8 h-8 text-teal-400" />
                        Hotspot Vouchers
                    </h3>
                    <p className="text-slate-400 mt-1">Generate massal *user* hotspot ke mikrotik untuk bisnis eceran.</p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={handleDeleteAll}
                        className="bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold py-2.5 px-6 rounded-xl transition-all border border-red-500/20 flex items-center gap-2"
                    >
                        <Trash2 className="w-5 h-5" />
                        Kosongkan Database
                    </button>
                    <button
                        onClick={() => setShowAddForm(!showAddForm)}
                        className="bg-teal-500 hover:bg-teal-400 text-slate-900 font-bold py-2.5 px-6 rounded-xl transition-all shadow-[0_0_15px_rgba(20,184,166,0.3)] hover:shadow-[0_0_25px_rgba(20,184,166,0.5)] flex items-center gap-2"
                    >
                        <PlusCircle className="w-5 h-5" />
                        {showAddForm ? 'Tutup Form' : 'Batch Generate Baru'}
                    </button>
                </div>
            </div>

            {showAddForm && (
                <div className="glass p-8 rounded-3xl mb-8 border border-white/20 animate-in slide-in-from-top-4 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                        <Wifi className="w-32 h-32 text-white" />
                    </div>
                    <h4 className="text-xl font-black text-white mb-6 flex items-center gap-2">
                        <PlusCircle className="text-teal-400" /> Instruksi Generate Voucher
                    </h4>
                    <form onSubmit={handleGenerate} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
                        <div>
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Pilih Router Mikrotik</label>
                            <select required value={formData.router_id} onChange={(e) => setFormData({ ...formData, router_id: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-2xl p-4 text-white focus:outline-none focus:border-teal-400 transition-all">
                                <option value="">-- Pilih Router --</option>
                                {routers.map((r: any) => <option key={r.id} value={r.id}>{r.name} ({r.ip_address})</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Jumlah Voucher</label>
                            <input type="number" required min="1" max="500" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })} className="w-full bg-slate-900 border border-slate-700 rounded-2xl p-4 text-white focus:outline-none focus:border-teal-400 transition-all font-mono" />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Harga Jual (Rp)</label>
                            <input type="number" required value={formData.price} onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) })} className="w-full bg-slate-900 border border-slate-700 rounded-2xl p-4 text-white focus:outline-none focus:border-teal-400 transition-all font-mono" />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Profil Hotspot (Dari Mikrotik)</label>
                            <select 
                                required 
                                value={formData.profile} 
                                onChange={(e) => setFormData({ ...formData, profile: e.target.value })} 
                                className="w-full bg-slate-900 border border-slate-700 rounded-2xl p-4 text-white focus:outline-none focus:border-teal-400 transition-all"
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
                        <div>
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Prefix Kode</label>
                            <input type="text" value={formData.prefix} onChange={(e) => setFormData({ ...formData, prefix: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-2xl p-4 text-white focus:outline-none focus:border-teal-400 transition-all font-mono" placeholder="VC-" />
                        </div>
                        <div className="lg:col-span-3 flex justify-end mt-4 pt-6 border-t border-white/5">
                            <button type="submit" disabled={generating} className="px-10 py-4 rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-900 font-black shadow-lg shadow-teal-500/20 transition-all disabled:opacity-50 flex items-center gap-2">
                                <Wifi className="w-6 h-6" /> Mulai Generate & Injeksi
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Screen Area - Tabel Admin */}
            <div className="glass rounded-4xl border border-white/10 overflow-hidden shadow-2xl">
                <div className="flex justify-between items-center p-6 border-b border-white/10 bg-white/5">
                    <h4 className="text-xl font-black text-white flex items-center gap-3">
                         Database Voucher
                    </h4>
                    <Link href="/vouchers/print" className="bg-indigo-600 hover:bg-indigo-500 px-6 py-3 rounded-xl text-sm text-white font-black transition flex items-center gap-2 shadow-lg shadow-indigo-600/20">
                        <Printer className="w-5 h-5" /> Preview & Cetak Vouchers
                    </Link>
                </div>
                <div className="overflow-x-auto min-h-[300px]">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/5 uppercase text-[10px] tracking-widest font-black text-slate-400">
                                <th className="p-5">Kode Voucher</th>
                                <th className="p-5">Password</th>
                                <th className="p-5">Router</th>
                                <th className="p-5">Profil</th>
                                <th className="p-5">Harga</th>
                                <th className="p-5 text-center">Status</th>
                                <th className="p-5 text-right">Tanggal</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-sm">
                            {loading ? (
                                <tr><td colSpan={7} className="p-20 text-center text-slate-500">
                                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-500 mx-auto mb-4"></div>
                                    Menghubungkan ke database...
                                </td></tr>
                            ) : vouchers.length === 0 ? (
                                <tr><td colSpan={7} className="p-20 text-center text-slate-500">
                                    <Wifi className="w-16 h-16 mx-auto mb-4 opacity-20" />
                                    Belum ada voucher yang terdaftar di database lokal.
                                </td></tr>
                            ) : (
                                vouchers.map((v: any) => (
                                    <tr key={v.id} className="hover:bg-white/5 transition-all group">
                                        <td className="p-5 font-mono font-black text-teal-400 text-lg tracking-widest group-hover:scale-110 transition-transform origin-left">{v.code}</td>
                                        <td className="p-5 font-mono text-slate-300 font-bold">{v.password}</td>
                                        <td className="p-5 text-slate-400 font-medium">{v.router_name}</td>
                                        <td className="p-5">
                                            <span className="px-2 py-1 bg-indigo-500/10 text-indigo-400 text-[10px] font-black uppercase rounded-lg border border-indigo-500/20">{v.profile}</span>
                                        </td>
                                        <td className="p-5 font-bold text-white">Rp {parseInt(v.price).toLocaleString('id-ID')}</td>
                                        <td className="p-5 text-center">
                                            <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black tracking-widest uppercase border ${v.status === 'AVAILABLE' ? 'bg-teal-500/10 text-teal-400 border-teal-500/20 shadow-[0_0_10px_rgba(20,184,166,0.1)]' : 'bg-slate-500/10 text-slate-500 border-slate-500/20'}`}>
                                                {v.status === 'AVAILABLE' ? 'Ready' : 'Used'}
                                            </span>
                                        </td>
                                        <td className="p-5 text-right text-[11px] text-slate-500 font-bold uppercase tracking-tight">
                                            {new Date(v.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
