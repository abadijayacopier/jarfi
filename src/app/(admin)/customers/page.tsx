'use client';

import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { RefreshCw, X, DownloadCloud, Edit, Trash2, ShieldAlert } from 'lucide-react';

export default function CustomersPage() {
    const [customers, setCustomers] = useState([]);
    const [routers, setRouters] = useState([]);
    const [packages, setPackages] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showForm, setShowForm] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);
    const [formData, setFormData] = useState({ user_id: '', name: '', phone: '', router_id: '', package_id: '', pppoe_username: '', pppoe_password: '', due_date: 1 });

    const [showImportModal, setShowImportModal] = useState(false);
    const [importRouterId, setImportRouterId] = useState('');
    const [mikrotikSecrets, setMikrotikSecrets] = useState([]);
    const [importing, setImporting] = useState(false);

    useEffect(() => {
        fetchCustomers();
        fetchRoutersAndPackages();
    }, []);

    const fetchCustomers = async () => {
        try {
            const res = await fetch('/api/customers');
            const data = await res.json();
            if (res.ok) setCustomers(data.customers || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchRoutersAndPackages = async () => {
        try {
            const [rRes, pRes] = await Promise.all([fetch('/api/routers'), fetch('/api/packages')]);
            if (rRes.ok) setRouters((await rRes.json()).routers || []);
            if (pRes.ok) setPackages((await pRes.json()).packages || []);
        } catch (error) {
            console.error(error);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                router_id: formData.router_id ? parseInt(formData.router_id) : null,
                package_id: formData.package_id ? parseInt(formData.package_id) : null,
                due_date: parseInt(formData.due_date as any),
                ...(isEditing && { id: editId })
            };

            Swal.fire({ title: 'Menyimpan...', text: 'Singkronisasi ke Database & Mikrotik', allowOutsideClick: false, background: '#1e293b', color: '#fff', didOpen: () => { Swal.showLoading(); } });

            const res = await fetch('/api/customers', {
                method: isEditing ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                closeForm();
                fetchCustomers();
                Swal.fire({ icon: 'success', title: 'Berhasil', text: isEditing ? 'Data pelanggan dan pengaturan PPPoE terbarui!' : 'Pelanggan baru terdaftar dan masuk PPPoE Mikrotik!', background: '#1e293b', color: '#fff' });
            } else {
                const data = await res.json();
                Swal.fire({ icon: 'error', title: 'Gagal', text: data.error || 'Terjadi kesalahan sistem', background: '#1e293b', color: '#fff' });
            }
        } catch (err) {
            console.error(err);
        }
    };

    const openEditForm = (c: any) => {
        setFormData({
            user_id: c.user_id,
            name: c.name,
            phone: c.phone || '',
            router_id: c.router_id ? c.router_id.toString() : '',
            package_id: c.package_id ? c.package_id.toString() : '',
            pppoe_username: c.pppoe_username,
            pppoe_password: '', // blank by default for edit for security
            due_date: c.due_date || 1
        });
        setEditId(c.id);
        setIsEditing(true);
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id: number, name: string) => {
        const result = await Swal.fire({
            title: `Hapus Pelanggan ${name}?`,
            text: "Perhatian: Pelanggan akan DIHAPUS PERMANEN dari database dan akun PPPoE-nya juga akan DIMUSNAHKAN dari Mikrotik Pusat!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#334155',
            confirmButtonText: 'Ya, Hapus Total!',
            background: '#1e293b',
            color: '#fff'
        });

        if (result.isConfirmed) {
            Swal.fire({ title: 'Menghapus...', text: 'Membersihkan data dari Database & RouterOS...', allowOutsideClick: false, background: '#1e293b', color: '#fff', didOpen: () => { Swal.showLoading(); } });
            try {
                const res = await fetch(`/api/customers?id=${id}`, { method: 'DELETE' });
                if (res.ok) {
                    Swal.fire({ icon: 'success', title: 'Terhapus', text: 'Koneksi pelanggan berhasil disapu bersih dari Mikrotik dan sistem.', background: '#1e293b', color: '#fff' });
                    fetchCustomers();
                } else {
                    const data = await res.json();
                    Swal.fire({ icon: 'error', title: 'Gagal', text: data.error, background: '#1e293b', color: '#fff' });
                }
            } catch (err) {
                Swal.fire({ icon: 'error', title: 'Error API', text: 'Gagal menghubungi server.', background: '#1e293b', color: '#fff' });
            }
        }
    };

    const handleIsolir = async (id: number, name: string) => {
        const result = await Swal.fire({
            title: `Isolir pelanggan ${name}?`,
            text: "Aksi ini mengubah profil PPPoE di Mikrotik untuk memutus internet pelanggan.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#f97316',
            cancelButtonColor: '#334155',
            confirmButtonText: 'Ya, Isolir!',
            background: '#1e293b',
            color: '#fff'
        });

        if (result.isConfirmed) {
            Swal.fire({ title: 'Diproses...', text: 'Memutus jaringan via RouterOS secara langsung...', allowOutsideClick: false, background: '#1e293b', color: '#fff', didOpen: () => { Swal.showLoading(); } });

            try {
                const res = await fetch('/api/mikrotik/isolate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ customer_id: id })
                });
                const data = await res.json();
                if (res.ok) {
                    Swal.fire({ icon: 'success', title: 'Terisolir', text: 'Koneksi berhasil diputus.', background: '#1e293b', color: '#fff' });
                    fetchCustomers();
                } else {
                    Swal.fire({ icon: 'error', title: 'Gagal', text: data.error, background: '#1e293b', color: '#fff' });
                }
            } catch (err) {
                Swal.fire({ icon: 'error', title: 'Error API', text: 'Gagal terhubung ke Server lokal', background: '#1e293b', color: '#fff' });
            }
        }
    };

    const fetchMikrotikSecrets = async (routerId: string) => {
        if (!routerId) return;
        setImportRouterId(routerId);
        Swal.fire({ title: 'Menarik data Live...', text: 'Membaca daftar Secret PPPoE langsung dari Mikrotik', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); }, background: '#1e293b', color: '#fff' });

        try {
            const res = await fetch(`/api/mikrotik/secrets?router_id=${routerId}`);
            const data = await res.json();
            if (res.ok) {
                setMikrotikSecrets(data.secrets || []);
                Swal.close();
            } else {
                Swal.fire({ icon: 'error', title: 'Gagal', text: data.error, background: '#1e293b', color: '#fff' });
            }
        } catch {
            Swal.fire({ icon: 'error', title: 'Error API', text: 'Gagal terhubung ke Mikrotik API', background: '#1e293b', color: '#fff' });
        }
    };

    const handleSyncSecrets = async () => {
        const unsynced = mikrotikSecrets.filter((s: any) => !s.is_synced);
        if (unsynced.length === 0) return;

        setImporting(true);
        Swal.fire({ title: 'Menyinkronkan Database...', text: `Menarik ${unsynced.length} akun...`, allowOutsideClick: false, didOpen: () => { Swal.showLoading(); }, background: '#1e293b', color: '#fff' });

        try {
            const res = await fetch('/api/mikrotik/secrets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ router_id: importRouterId, secrets: unsynced })
            });
            const data = await res.json();
            if (res.ok) {
                setShowImportModal(false);
                fetchCustomers();
                Swal.fire({ icon: 'success', title: 'Sinkronisasi Berhasil!', text: `${data.count} Pelanggan PPPoE Mikrotik telah dideteksi ke Database JARFI.`, background: '#1e293b', color: '#fff' });
            } else {
                Swal.fire({ icon: 'error', title: 'Gagal', text: data.error, background: '#1e293b', color: '#fff' });
            }
        } catch {
            Swal.fire({ icon: 'error', title: 'Error Sync', text: 'Terjadi kesalahan sistem saat menyimpan ke MySQL', background: '#1e293b', color: '#fff' });
        } finally {
            setImporting(false);
            setMikrotikSecrets([]);
            setImportRouterId('');
        }
    };

    const closeForm = () => {
        setShowForm(false);
        setIsEditing(false);
        setEditId(null);
        setFormData({ user_id: '', name: '', phone: '', router_id: '', package_id: '', pppoe_username: '', pppoe_password: '', due_date: 1 });
    };

    return (
        <div className="animate-in fade-in duration-500 pb-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h3 className="text-3xl font-bold text-white">Daftar Pelanggan</h3>
                    <p className="text-slate-400 mt-1">Data pelanggan & sinkronisasi PPPoE Mikrotik</p>
                </div>
                <div className="flex flex-wrap gap-4">
                    <button
                        onClick={() => setShowImportModal(true)}
                        className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 font-bold py-2.5 px-5 rounded-xl transition-all border border-blue-500/30 shadow-md flex items-center gap-2"
                    >
                        <RefreshCw className="w-5 h-5" /> Live Mikrotik
                    </button>
                    <button
                        onClick={() => showForm ? closeForm() : setShowForm(true)}
                        className={`${showForm ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-indigo-500 hover:bg-indigo-400 text-white'} font-bold py-2.5 px-6 rounded-xl transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)] hover:shadow-[0_0_25px_rgba(99,102,241,0.5)] flex items-center gap-2`}
                    >
                        {showForm ? 'Batal' : '+ Pelanggan Baru'}
                    </button>
                </div>
            </div>

            {showImportModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-slate-800 w-full max-w-4xl p-6 rounded-3xl border border-white/10 shadow-2xl flex flex-col max-h-[90vh]">
                        <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                            <h4 className="text-xl font-bold text-white flex items-center gap-2">
                                <RefreshCw className="text-blue-400" />
                                Sinkronisasi PPPoE Live
                            </h4>
                            <button
                                onClick={() => { setShowImportModal(false); setMikrotikSecrets([]); setImportRouterId(''); }}
                                className="text-slate-400 hover:text-white transition-colors bg-slate-700/50 hover:bg-slate-700 p-2 rounded-full"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm text-slate-400 mb-1.5 font-medium">1. Pilih Router Target untuk Memindai Akun PPPoE</label>
                            <select onChange={(e) => fetchMikrotikSecrets(e.target.value)} value={importRouterId} className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-blue-400 transition-colors shadow-inner">
                                <option value="">-- Pilih Router --</option>
                                {routers.map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
                            </select>
                        </div>

                        <div className="flex-1 overflow-y-auto min-h-[350px] border border-white/10 rounded-xl bg-slate-900/50 relative">
                            <table className="w-full text-left border-collapse">
                                <thead className="sticky top-0 bg-slate-800 border-b border-white/10 shadow-sm z-10">
                                    <tr className="uppercase text-xs tracking-wider font-semibold text-slate-300">
                                        <th className="p-4">PPPoE Name</th>
                                        <th className="p-4">Password</th>
                                        <th className="p-4">Profile</th>
                                        <th className="p-4 text-center">Status DB</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5 text-sm">
                                    {mikrotikSecrets.length === 0 ? (
                                        <tr key="empty-secrets"><td colSpan={4} className="p-12 text-center text-slate-500 font-medium">Pilih router di atas agar sistem bisa mendeteksi isi mikrotiknya sekarang juga.</td></tr>
                                    ) : (
                                        mikrotikSecrets.map((s: any) => (
                                            <tr key={s.id} className="hover:bg-white/5 transition-colors">
                                                <td className="p-4 font-mono font-bold text-white text-lg">{s.name}</td>
                                                <td className="p-4 font-mono text-slate-400">{s.password || '-'}</td>
                                                <td className="p-4 text-blue-400 font-bold uppercase text-xs">{s.profile}</td>
                                                <td className="p-4 text-center">
                                                    {s.is_synced ? (
                                                        <span className="px-3 py-1.5 rounded-full bg-slate-500/20 text-slate-400 text-xs font-bold whitespace-nowrap border border-slate-500/30">Terdaftar</span>
                                                    ) : (
                                                        <span className="px-3 py-1.5 rounded-full bg-green-500/20 text-green-400 text-xs font-bold whitespace-nowrap border border-green-500/30 shadow-[0_0_10px_rgba(34,197,94,0.3)]">Baru!</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-6 flex justify-between items-center bg-slate-900/50 p-4 rounded-xl border border-white/5">
                            <p className="text-sm text-slate-400">Total: <span className="font-bold text-white px-2">{mikrotikSecrets.length} akun</span> | <span className="font-bold text-green-400 px-1">{mikrotikSecrets.filter((s: any) => !s.is_synced).length} belum disinkronisasi</span></p>
                            <button
                                type="button"
                                onClick={handleSyncSecrets}
                                disabled={importing || mikrotikSecrets.filter((s: any) => !s.is_synced).length === 0}
                                className="px-6 py-3 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                <DownloadCloud className="w-5 h-5" />
                                {mikrotikSecrets.filter((s: any) => !s.is_synced).length > 0 ? `Sinkron ${mikrotikSecrets.filter((s: any) => !s.is_synced).length} Akun` : 'Sudah Sinkron'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showForm && (
                <div className="glass p-6 rounded-2xl mb-8 border border-white/20 animate-in slide-in-from-top-4 shadow-xl">
                    <h4 className="text-xl font-semibold text-white mb-4 border-b border-white/10 pb-2 flex items-center gap-2">
                        {isEditing ? <Edit className="w-5 h-5 text-indigo-400" /> : <RefreshCw className="w-5 h-5 text-indigo-400" />}
                        {isEditing ? 'Edit Profil & Sinkronisasi PPPoE' : 'Registrasi Pelanggan & Sinkronisasi API'}
                    </h4>
                    <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">Nama Lengkap</label>
                            <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full bg-slate-900/50 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-indigo-400 transition-colors shadow-inner" />
                        </div>
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">Nomor WhatsApp</label>
                            <input type="text" required value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full bg-slate-900/50 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-indigo-400 transition-colors shadow-inner" />
                        </div>
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">Pilih Router Mikrotik {isEditing && <span className="text-orange-400 text-[10px] ml-2">(Locked)</span>}</label>
                            <select required value={formData.router_id} disabled={isEditing} onChange={(e) => setFormData({ ...formData, router_id: e.target.value })} className="w-full bg-slate-900/50 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-indigo-400 transition-colors shadow-inner disabled:opacity-50">
                                <option value="">-- Pilih Router --</option>
                                {routers.map((r: any) => <option key={r.id} value={r.id}>{r.name} ({r.ip_address})</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">PPPoE Username {isEditing && <span className="text-orange-400 text-[10px] ml-2">(Locked)</span>}</label>
                            <input type="text" required value={formData.pppoe_username} disabled={isEditing} onChange={(e) => setFormData({ ...formData, pppoe_username: e.target.value })} className="w-full bg-slate-900/50 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-indigo-400 transition-colors shadow-inner disabled:opacity-50 font-mono" />
                        </div>
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">{isEditing ? 'Ubah Sandi PPPoE (Kosongkan bila tidak diubah)' : 'PPPoE Password'}</label>
                            <input type="text" required={!isEditing} value={formData.pppoe_password} onChange={(e) => setFormData({ ...formData, pppoe_password: e.target.value })} className="w-full bg-slate-900/50 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-indigo-400 transition-colors shadow-inner font-mono" placeholder={isEditing ? '******' : ''} />
                        </div>
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">Paket Internet</label>
                            <select required value={formData.package_id} onChange={(e) => setFormData({ ...formData, package_id: e.target.value })} className="w-full bg-slate-900/50 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-indigo-400 transition-colors shadow-inner">
                                <option value="">-- Paket --</option>
                                {packages.map((p: any) => <option key={p.id} value={p.id}>{p.name} - Rp {p.price}</option>)}
                            </select>
                        </div>
                        <div className="lg:col-span-3 flex justify-end gap-3 mt-2">
                            <button type="button" onClick={closeForm} className="px-6 py-3 rounded-xl bg-transparent hover:bg-slate-800 text-slate-300 font-medium transition-colors border border-transparent hover:border-slate-700">Tutup Batal</button>
                            <button type="submit" className="px-8 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold transition-colors shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                                {isEditing ? 'Update & Sinkron Mikrotik' : 'Pendaftaran PPPoE Baru'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="glass rounded-2xl border border-white/10 overflow-hidden shadow-xl">
                <div className="overflow-x-auto min-h-[300px]">
                    <table className="w-full text-left border-collapse whitespace-nowrap">
                        <thead>
                            <tr className="border-b border-white/10 bg-white/5 uppercase text-xs tracking-wider font-semibold text-slate-300">
                                <th className="p-4">Customer</th>
                                <th className="p-4">PPPoE Account</th>
                                <th className="p-4">Router</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-center">Aksi (Terhubung API)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-sm">
                            {loading ? (
                                <tr><td colSpan={5} className="p-8 text-center text-slate-400">Loading customers...</td></tr>
                            ) : customers.length === 0 ? (
                                <tr key="empty-customers"><td colSpan={5} className="p-8 text-center text-slate-400">No customers found.</td></tr>
                            ) : (
                                customers.map((c: any) => (
                                    <tr key={c.id} className="hover:bg-white/5 transition-colors">
                                        <td className="p-4">
                                            <p className="font-bold text-white text-base">{c.name}</p>
                                            <p className="text-xs text-slate-400">ID: #{c.id} | Ph: {c.phone}</p>
                                        </td>
                                        <td className="p-4">
                                            <p className="text-white font-mono font-bold">{c.pppoe_username}</p>
                                            {c.package_name ? (
                                                <p className="text-[10px] font-black uppercase tracking-wide text-indigo-400 mt-1">{c.package_name}</p>
                                            ) : (
                                                <p className="text-[10px] font-black uppercase tracking-wide text-red-500 mt-1 flex items-center gap-1">
                                                    <ShieldAlert className="w-3 h-3" /> TANPA PAKET
                                                </p>
                                            )}
                                        </td>
                                        <td className="p-4 text-slate-300">
                                            <span className="bg-slate-800 border border-slate-700 px-2 py-1 rounded text-xs">{c.router_name}</span>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2.5 py-1.5 rounded-full text-[10px] uppercase font-bold tracking-widest ${c.status === 'ACTIVE' ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30' : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'}`}>
                                                {c.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-center gap-2">
                                                <button onClick={() => openEditForm(c)} title="Edit Nama & Sandi Mikrotik" className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-all border border-blue-500/30 hover:scale-110 shadow-sm">
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleIsolir(c.id, c.name)} title="Isolir Pelanggan" className="p-2.5 rounded-lg bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 transition-all border border-orange-500/30 hover:scale-110 shadow-sm">
                                                    <ShieldAlert className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleDelete(c.id, c.name)} title="Hapus Permanen Akun" className="p-2.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all border border-red-500/30 hover:scale-110 shadow-sm">
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
        </div>
    );
}
