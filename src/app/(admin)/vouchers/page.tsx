'use client';

import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { Wifi, PlusCircle, Printer, Trash2 } from 'lucide-react';

export default function VouchersPage() {
    const [vouchers, setVouchers] = useState([]);
    const [routers, setRouters] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showAddForm, setShowAddForm] = useState(false);
    const [formData, setFormData] = useState({ router_id: '', quantity: 10, price: 5000, profile: 'default', prefix: 'VC-' });
    const [generating, setGenerating] = useState(false);

    useEffect(() => {
        fetchVouchers();
        fetchRouters();
    }, []);

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

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="animate-in fade-in duration-500 pb-10">
            <div className="flex justify-between items-center mb-8 print:hidden">
                <div>
                    <h3 className="text-3xl font-bold text-white flex items-center gap-3">
                        <Wifi className="w-8 h-8 text-teal-400" />
                        Hotspot Vouchers
                    </h3>
                    <p className="text-slate-400 mt-1">Generate massal *user* hotspot ke mikrotik untuk bisnis eceran.</p>
                </div>
                <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="bg-teal-500 hover:bg-teal-400 text-slate-900 font-bold py-2.5 px-6 rounded-xl transition-all shadow-[0_0_15px_rgba(20,184,166,0.3)] hover:shadow-[0_0_25px_rgba(20,184,166,0.5)] flex items-center gap-2"
                >
                    <PlusCircle className="w-5 h-5" />
                    {showAddForm ? 'Tutup Form' : 'Batch Generate Baru'}
                </button>
            </div>

            {showAddForm && (
                <div className="glass p-6 rounded-2xl mb-8 border border-white/20 animate-in slide-in-from-top-4 print:hidden">
                    <h4 className="text-xl font-semibold text-white mb-4 border-b border-white/10 pb-3">Instruksi Generate Voucher ke Mikrotik</h4>
                    <form onSubmit={handleGenerate} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        <div>
                            <label className="block text-sm text-slate-400 mb-1.5 font-medium">Pilih Hotspot Server (Mikrotik)</label>
                            <select required value={formData.router_id} onChange={(e) => setFormData({ ...formData, router_id: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-teal-400 transition-colors">
                                <option value="">-- Pilih Router --</option>
                                {routers.map((r: any) => <option key={r.id} value={r.id}>{r.name} ({r.ip_address})</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm text-slate-400 mb-1.5 font-medium">Mau Cetak Berapa Lembar/Voucher?</label>
                            <input type="number" required min="1" max="100" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-teal-400 transition-colors" />
                            <p className="text-xs text-slate-500 mt-1">Disarankan maksimal 50-100 per sekali proses.</p>
                        </div>
                        <div>
                            <label className="block text-sm text-slate-400 mb-1.5 font-medium">Harga Voucher / Lembar (Rp)</label>
                            <input type="number" required value={formData.price} onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) })} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-teal-400 transition-colors" />
                        </div>
                        <div>
                            <label className="block text-sm text-slate-400 mb-1.5 font-medium">Profil Target Hotspot Mikrotik</label>
                            <input type="text" required value={formData.profile} onChange={(e) => setFormData({ ...formData, profile: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-teal-400 transition-colors" placeholder="Contoh: harian_3000" />
                            <p className="text-xs text-slate-500 mt-1">Sengaja dibuat input teks agar bebas ketik profil apapun di Mikrotik Anda.</p>
                        </div>
                        <div>
                            <label className="block text-sm text-slate-400 mb-1.5 font-medium">Awalan Kode / Prefix (Opsional)</label>
                            <input type="text" value={formData.prefix} onChange={(e) => setFormData({ ...formData, prefix: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-teal-400 transition-colors" placeholder="Misal: VIP-" />
                        </div>
                        <div className="lg:col-span-3 flex justify-end mt-2 border-t border-white/10 pt-4">
                            <button type="submit" disabled={generating} className="px-8 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-900 font-bold transition-all disabled:opacity-50 flex items-center gap-2">
                                <Wifi className="w-5 h-5" /> Simpan & Injeksi ke Mikrotik Secepatnya
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Printable Area - Tampilan Voucher ala Kartu */}
            <h3 className="hidden print:block text-2xl font-bold mb-6 text-slate-800 text-center uppercase">VOUCHER INTERNET HOTSPOT</h3>
            <div className="hidden print:grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                {vouchers.map((v: any, index) => (
                    <div key={`print-${index}`} className="border-2 border-dashed border-slate-400 p-4 text-center rounded-xl bg-white text-slate-800 break-inside-avoid">
                        <div className="font-bold text-lg mb-2 bg-slate-100 py-1">{v.profile.toUpperCase()}</div>
                        <div className="text-sm">KODE LOGIN</div>
                        <div className="font-mono text-2xl font-black">{v.code}</div>
                        <div className="text-sm mt-2">PASSWORD</div>
                        <div className="font-mono font-bold text-lg">{v.password}</div>
                        <div className="mt-3 text-xs font-semibold text-slate-500 border-t pt-2">Rp {parseInt(v.price).toLocaleString('id-ID')} / {v.status === 'AVAILABLE' ? 'Aktif' : 'Terpakai'}</div>
                    </div>
                ))}
            </div>

            {/* Screen Area - Tabel Admin */}
            <div className="glass rounded-2xl border border-white/10 overflow-hidden print:hidden">
                <div className="flex justify-between items-center p-4 border-b border-white/10">
                    <h4 className="text-lg font-bold text-white">Database Voucher Global</h4>
                    <button onClick={handlePrint} className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-sm text-white font-semibold transition flex items-center gap-2 border border-white/5 shadow-md">
                        <Printer className="w-4 h-4" /> Cetak (Print) Desain Mini Card
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/5 uppercase text-xs tracking-wider font-semibold text-slate-300">
                                <th className="p-4">Kode Voucher</th>
                                <th className="p-4">Password</th>
                                <th className="p-4">Router Host</th>
                                <th className="p-4">Profil Layanan</th>
                                <th className="p-4">Harga Jual</th>
                                <th className="p-4 text-center">Status</th>
                                <th className="p-4 text-right">Tgl Cetak</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-sm">
                            {loading ? (
                                <tr><td colSpan={7} className="p-8 text-center text-slate-400">Loading tabel data...</td></tr>
                            ) : vouchers.length === 0 ? (
                                <tr><td colSpan={7} className="p-8 text-center text-slate-400">Anda belum pernah men-generate voucher apapun.</td></tr>
                            ) : (
                                vouchers.map((v: any) => (
                                    <tr key={v.id} className="hover:bg-white/5 transition-colors">
                                        <td className="p-4 font-mono font-bold text-teal-400 text-lg tracking-widest">{v.code}</td>
                                        <td className="p-4 font-mono text-slate-300 font-semibold">{v.password}</td>
                                        <td className="p-4 text-slate-300">{v.router_name}</td>
                                        <td className="p-4 font-black uppercase text-indigo-400 text-xs tracking-wide">{v.profile}</td>
                                        <td className="p-4 font-semibold">Rp {parseInt(v.price).toLocaleString('id-ID')}</td>
                                        <td className="p-4 text-center">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${v.status === 'AVAILABLE' ? 'bg-green-500/20 text-green-400 border border-green-500/30 shadow-[0_0_8px_rgba(34,197,94,0.3)]' : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'}`}>
                                                {v.status === 'AVAILABLE' ? 'Belum Terpakai' : 'Sudah Terpakai'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right text-xs text-slate-400 font-medium">
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
