'use client';

import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { RefreshCw, X, DownloadCloud, Edit, Trash2, ShieldAlert, Search, Users, Wifi, Calendar, Activity, Zap, ArrowDown, ArrowUp } from 'lucide-react';

export default function CustomersPage() {
    const [customers, setCustomers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [routers, setRouters] = useState([]);
    const [packages, setPackages] = useState([]);
    const [pppProfiles, setPppProfiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [showForm, setShowForm] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);
    const [formData, setFormData] = useState({ user_id: '', name: '', phone: '', router_id: '', package_id: '', pppoe_username: '', pppoe_password: '', due_date: 1 });

    const [showImportModal, setShowImportModal] = useState(false);
    const [importRouterId, setImportRouterId] = useState('');
    const [mikrotikSecrets, setMikrotikSecrets] = useState([]);
    const [importing, setImporting] = useState(false);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    // Real-time traffic
    const [trafficData, setTrafficData] = useState<any[]>([]);
    const [trafficLoading, setTrafficLoading] = useState(false);

    useEffect(() => {
        fetchCustomers();
        fetchRoutersAndPackages();
    }, []);

    // Auto-refresh traffic every 5s for real-time feel
    useEffect(() => {
        if (routers.length > 0) {
            fetchAllTraffic();
            const timer = setInterval(fetchAllTraffic, 5000);
            return () => clearInterval(timer);
        }
    }, [routers]);

    const fetchAllTraffic = async () => {
        setTrafficLoading(true);
        try {
            const allTraffic: any[] = [];
            for (const r of routers as any[]) {
                try {
                    const res = await fetch(`/api/mikrotik/traffic?router_id=${r.id}`);
                    const data = await res.json();
                    if (res.ok && data.traffic) {
                        allTraffic.push(...data.traffic);
                    }
                } catch { /* skip unavailable routers */ }
            }
            
            setTrafficData(prev => {
                return allTraffic.map(curr => {
                    const prevData = prev.find(p => p.name === curr.name);
                    let rxSpeed = 0;
                    let txSpeed = 0;
                    if (prevData && curr.rxBytes && prevData.rxBytes) {
                        // interval = 5 seconds
                        const rxDiff = Math.max(0, curr.rxBytes - prevData.rxBytes);
                        const txDiff = Math.max(0, curr.txBytes - prevData.txBytes);
                        rxSpeed = (rxDiff * 8) / (5 * 1000); // Kbps
                        txSpeed = (txDiff * 8) / (5 * 1000); // Kbps
                    }
                    return { ...curr, rxSpeed, txSpeed };
                });
            });
        } catch (err) { console.error(err); }
        finally { setTrafficLoading(false); }
    };

    const getTrafficInfo = (pppoeUsername: string) => {
        return trafficData.find(t => t.name === pppoeUsername);
    };

    useEffect(() => {
        if (formData.router_id) {
            fetch(`/api/mikrotik/profiles?routerId=${formData.router_id}&type=ppp`)
                .then(res => res.json())
                .then(data => setPppProfiles(data.profiles || []))
                .catch(() => setPppProfiles([]));
        } else {
            setPppProfiles([]);
        }
    }, [formData.router_id]);

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
            user_id: c.user_id || '',
            name: c.name || '',
            phone: c.phone || '',
            router_id: c.router_id ? c.router_id.toString() : '',
            package_id: c.package_id ? c.package_id.toString() : '',
            pppoe_username: c.pppoe_username || '',
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
                                        mikrotikSecrets.map((s: any, idx: number) => (
                                            <tr key={s.id || `secret-${idx}`} className="hover:bg-white/5 transition-colors">
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
                            <label className="block text-sm text-slate-400 mb-1">Pilih Profil Mikrotik (Live)</label>
                            <select 
                                required 
                                value={packages.find((p: any) => p.id.toString() === formData.package_id)?.name || ''} 
                                onChange={(e) => {
                                    const selectedProfileName = e.target.value;
                                    const matchingPackage = packages.find((p: any) => p.name === selectedProfileName);
                                    if (matchingPackage) {
                                        setFormData({ ...formData, package_id: (matchingPackage as any).id.toString() });
                                    } else {
                                        Swal.fire({
                                            icon: 'warning',
                                            title: 'Paket Tidak Ditemukan',
                                            text: `Profil "${selectedProfileName}" belum terdaftar sebagai Paket di JARFI. Silakan sinkronkan paket di menu Pengaturan ISP dulu agar penagihan otomatis berjalan.`,
                                            background: '#1e293b',
                                            color: '#fff'
                                        });
                                    }
                                }} 
                                className="w-full bg-slate-900/50 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-indigo-400 transition-colors shadow-inner font-bold"
                            >
                                <option value="">-- Deteksi Profile Router --</option>
                                {pppProfiles.map((p: any) => (
                                    <option key={p.name} value={p.name}>{p.name} {p['rate-limit'] ? `(${p['rate-limit']})` : ''}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">Paket Internet (Sistem Penagihan)</label>
                            <select required value={formData.package_id} onChange={(e) => setFormData({ ...formData, package_id: e.target.value })} className="w-full bg-slate-900/50 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-indigo-400 transition-colors shadow-inner">
                                <option value="">-- Pilih Paket --</option>
                                {packages.map((p: any) => <option key={p.id} value={p.id}>{p.name} - Rp {parseInt(p.price).toLocaleString()}</option>)}
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

            {/* Content View: Table (Desktop) & Cards (Mobile) */}
            <div className="space-y-4">
                {/* Desktop Table View */}
                <div className="hidden md:block glass rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
                    <div className="p-6 border-b border-white/10 bg-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <h4 className="text-xl font-bold text-white">Database Pelanggan</h4>
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input 
                                type="text" 
                                placeholder="Cari nama, username, atau nomor WA..." 
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
                                    <th className="p-5">Customer</th>
                                    <th className="p-5">PPPoE User</th>
                                    <th className="p-5">Paket</th>
                                    <th className="p-5">Router</th>
                                    <th className="p-5">Status Akun</th>
                                    <th className="p-5">Koneksi</th>
                                    <th className="p-5 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-sm">
                                {loading ? (
                                    <tr><td colSpan={7} className="p-20 text-center text-slate-500 animate-pulse font-bold tracking-widest uppercase">Memuat Data...</td></tr>
                                ) : customers.length === 0 ? (
                                    <tr><td colSpan={7} className="p-20 text-center text-slate-500">Tidak ada pelanggan ditemukan.</td></tr>
                                ) : (
                                    customers
                                        .filter((c: any) => 
                                            (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                                            (c.pppoe_username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                                            (c.phone && c.phone.includes(searchTerm))
                                        )
                                        .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                                        .map((c: any) => (
                                            <tr key={c.id} className="hover:bg-white/5 transition-all group">
                                                <td className="p-5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20 shadow-inner">
                                                            <Users className="w-5 h-5" />
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-white text-base leading-tight">{c.name}</p>
                                                            <p className="text-[11px] text-slate-500 font-medium">ID: #{c.id} | {c.phone || '-'}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-5">
                                                    <p className="text-white font-mono font-bold">{c.pppoe_username}</p>
                                                </td>
                                                <td className="p-5">
                                                    {c.package_name ? (
                                                        <span className="px-3 py-1.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[11px] font-black uppercase tracking-wider">
                                                            {c.package_name}
                                                        </span>
                                                    ) : (
                                                        <span className="px-3 py-1.5 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 w-fit">
                                                            <ShieldAlert className="w-3.5 h-3.5" /> Tanpa Paket
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="p-5">
                                                    <div className="flex items-center gap-2 text-slate-400">
                                                        <Wifi className="w-3.5 h-3.5 text-slate-500" />
                                                        <span className="text-xs font-bold">{c.router_name}</span>
                                                    </div>
                                                </td>
                                                <td className="p-5">
                                                    <span className={`px-2.5 py-1.5 rounded-full text-[10px] uppercase font-black tracking-widest ${c.status === 'ACTIVE' ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30' : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'}`}>
                                                        {c.status}
                                                    </span>
                                                </td>
                                                <td className="p-5">
                                                    {(() => {
                                                        const traffic = getTrafficInfo(c.pppoe_username);
                                                        if (traffic) {
                                                            return (
                                                                <div className="flex flex-col gap-2">
                                                                    <div className="flex items-center gap-2.5">
                                                                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)] animate-pulse"></div>
                                                                        <div>
                                                                            <p className="text-emerald-400 font-black text-[10px] uppercase tracking-wider">Online</p>
                                                                            <p className="text-slate-500 text-[10px] font-bold">{traffic.uptime} | {traffic.address}</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center gap-3 text-[10px] font-bold">
                                                                        <span className="text-blue-400 flex items-center gap-1" title="Download"><ArrowDown className="w-3 h-3"/> {traffic.txSpeed > 1000 ? (traffic.txSpeed / 1000).toFixed(2) + ' Mbps' : traffic.txSpeed?.toFixed(1) + ' Kbps'}</span>
                                                                        <span className="text-green-400 flex items-center gap-1" title="Upload"><ArrowUp className="w-3 h-3"/> {traffic.rxSpeed > 1000 ? (traffic.rxSpeed / 1000).toFixed(2) + ' Mbps' : traffic.rxSpeed?.toFixed(1) + ' Kbps'}</span>
                                                                    </div>
                                                                </div>
                                                            );
                                                        }
                                                        return (
                                                            <div className="flex items-center gap-2.5">
                                                                <div className="w-2.5 h-2.5 rounded-full bg-slate-600"></div>
                                                                <span className="text-slate-600 font-bold text-[10px] uppercase tracking-wider">Offline</span>
                                                            </div>
                                                        );
                                                    })()}
                                                </td>
                                                <td className="p-5 text-right">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button onClick={() => openEditForm(c)} title="Edit Profil" className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 hover:scale-110 transition-all">
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                        <button onClick={() => handleIsolir(c.id, c.name)} title="Isolir" className="p-2.5 rounded-xl bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 border border-orange-500/20 hover:scale-110 transition-all">
                                                            <ShieldAlert className="w-4 h-4" />
                                                        </button>
                                                        <button onClick={() => handleDelete(c.id, c.name)} title="Hapus" className="p-2.5 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 hover:scale-110 transition-all">
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
                                placeholder="Cari pelanggan..." 
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-indigo-500"
                            />
                        </div>
                    </div>
                    {loading ? (
                        <div className="p-10 text-center text-slate-500 animate-pulse">Memuat...</div>
                    ) : customers.length === 0 ? (
                        <div className="p-10 text-center text-slate-500">Kosong</div>
                    ) : (
                        customers
                            .filter((c: any) => 
                                (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                                (c.pppoe_username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                                (c.phone && c.phone.includes(searchTerm))
                            )
                            .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                            .map((c: any) => (
                                <div key={c.id} className="glass p-5 rounded-3xl border border-white/10 space-y-4 shadow-xl">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20 shadow-inner">
                                                <Users className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h4 className="font-black text-white text-lg leading-tight">{c.name}</h4>
                                                <p className="text-xs text-slate-500 font-bold tracking-wider">#{c.id} | {c.phone || 'No Phone'}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => openEditForm(c)} className="p-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 active:scale-95 transition-all">
                                                <Edit className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/5">
                                        <div className="bg-slate-900/50 p-3 rounded-2xl">
                                            <p className="text-[9px] uppercase font-black text-slate-500 mb-1">Username</p>
                                            <p className="font-mono text-xs text-slate-200 truncate">{c.pppoe_username}</p>
                                        </div>
                                        <div className="bg-slate-900/50 p-3 rounded-2xl">
                                            <p className="text-[9px] uppercase font-black text-slate-500 mb-1">Paket</p>
                                            <p className="font-black text-xs text-indigo-400 truncate uppercase">{c.package_name || 'N/A'}</p>
                                        </div>
                                    </div>
                                    <div className="bg-indigo-500/5 p-3 rounded-2xl flex items-center justify-between border border-white/5">
                                        <span className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Router: {c.router_name}</span>
                                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${c.status === 'ACTIVE' ? 'text-teal-400' : 'text-orange-400'}`}>
                                            {c.status}
                                        </span>
                                    </div>
                                    {/* Connection Status */}
                                    {(() => {
                                        const traffic = getTrafficInfo(c.pppoe_username);
                                        return (
                                            <div className={`p-3 rounded-2xl flex flex-col gap-2 border ${traffic ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-slate-900/30 border-white/5'}`}>
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-3 h-3 rounded-full ${traffic ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)] animate-pulse' : 'bg-slate-600'}`}></div>
                                                    <div className="flex-1">
                                                        <p className={`font-black text-[10px] uppercase tracking-wider ${traffic ? 'text-emerald-400' : 'text-slate-600'}`}>{traffic ? 'Online' : 'Offline'}</p>
                                                        {traffic && <p className="text-slate-500 text-[10px] font-bold">Uptime: {traffic.uptime} | IP: {traffic.address}</p>}
                                                    </div>
                                                </div>
                                                {traffic && (
                                                    <div className="flex items-center gap-4 text-[10px] font-bold pt-1">
                                                        <span className="text-blue-400 flex items-center gap-1"><ArrowDown className="w-3 h-3"/> {traffic.txSpeed > 1000 ? (traffic.txSpeed / 1000).toFixed(2) + ' Mbps' : traffic.txSpeed?.toFixed(1) + ' Kbps'}</span>
                                                        <span className="text-green-400 flex items-center gap-1"><ArrowUp className="w-3 h-3"/> {traffic.rxSpeed > 1000 ? (traffic.rxSpeed / 1000).toFixed(2) + ' Mbps' : traffic.rxSpeed?.toFixed(1) + ' Kbps'}</span>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })()}
                                    <div className="flex gap-2 pt-2">
                                        <button onClick={() => handleIsolir(c.id, c.name)} className="flex-1 py-3 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2">
                                            <ShieldAlert className="w-3 h-3" /> Isolir
                                        </button>
                                        <button onClick={() => handleDelete(c.id, c.name)} className="flex-1 py-3 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2">
                                            <Trash2 className="w-3 h-3" /> Hapus
                                        </button>
                                    </div>
                                </div>
                            ))
                    )}
                </div>

                {/* Pagination Controls */}
                {!loading && customers.length > 0 && (
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-8 px-2">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                            Showing <span className="text-white">{(currentPage - 1) * itemsPerPage + 1}</span> - <span className="text-white">{Math.min(currentPage * itemsPerPage, customers.filter((c: any) => (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || (c.pppoe_username || '').toLowerCase().includes(searchTerm.toLowerCase())).length)}</span> 
                            {" "} of <span className="text-white">{customers.filter((c: any) => (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || (c.pppoe_username || '').toLowerCase().includes(searchTerm.toLowerCase())).length}</span> Entries
                        </p>
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="px-5 py-2.5 rounded-xl glass border border-white/10 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                                Prev
                            </button>
                            <div className="hidden sm:flex gap-1">
                                {[...Array(Math.ceil(customers.filter((c: any) => (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || (c.pppoe_username || '').toLowerCase().includes(searchTerm.toLowerCase())).length / itemsPerPage))].map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setCurrentPage(i + 1)}
                                        className={`w-10 h-10 rounded-xl font-black text-xs transition-all ${currentPage === i + 1 ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 border border-indigo-400/50' : 'glass border border-white/10 text-slate-500 hover:text-white'}`}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                            </div>
                            <button 
                                onClick={() => setCurrentPage(p => Math.min(Math.ceil(customers.filter((c: any) => (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || (c.pppoe_username || '').toLowerCase().includes(searchTerm.toLowerCase())).length / itemsPerPage), p + 1))}
                                disabled={currentPage === Math.ceil(customers.filter((c: any) => (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || (c.pppoe_username || '').toLowerCase().includes(searchTerm.toLowerCase())).length / itemsPerPage)}
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
