'use client';

import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { PlusCircle, Wifi, X, Save, CheckCircle, Edit, Trash2 } from 'lucide-react';

export default function RoutersPage() {
    const [routers, setRouters] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showForm, setShowForm] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);
    const [formData, setFormData] = useState({ name: '', ip_address: '', username: '', password: '', api_port: 8728 });
    const [testSuccess, setTestSuccess] = useState(false);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    useEffect(() => {
        fetchRouters();
    }, []);

    const fetchRouters = async () => {
        try {
            const res = await fetch('/api/routers');
            const data = await res.json();
            if (res.ok) setRouters(data.routers || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setTestSuccess(false);
    };

    const handleTestBeforeSave = async () => {
        if (!formData.ip_address || !formData.username) {
            Swal.fire({
                icon: 'warning',
                title: 'Data Tidak Lengkap',
                text: 'Alamat IP dan Nama Pengguna wajib diisi untuk diagnostik.',
                background: '#0f172a',
                color: '#fff'
            });
            return;
        }

        Swal.fire({
            title: 'Mendiagnosis Koneksi...',
            allowOutsideClick: false,
            background: '#0f172a',
            color: '#fff',
            didOpen: () => { Swal.showLoading(); }
        });

        try {
            const res = await fetch('/api/test-router', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    host: formData.ip_address,
                    user: formData.username,
                    password: formData.password,
                    port: formData.api_port
                })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setTestSuccess(true);
                Swal.fire({
                    icon: 'success',
                    title: 'Diagnostik Berhasil',
                    text: `Interface terverifikasi. Sesi Aktif: ${data.activeSessionCount}`,
                    background: '#0f172a',
                    color: '#fff'
                });
            } else {
                setTestSuccess(false);
                Swal.fire({
                    icon: 'error',
                    title: 'Kesalahan Diagnostik',
                    text: data.error || 'Infrastruktur tidak terjangkau.',
                    background: '#0f172a',
                    color: '#fff'
                });
            }
        } catch (err) {
            setTestSuccess(false);
            Swal.fire({ icon: 'error', title: 'Kesalahan Jaringan', text: 'Gagal menghubungkan ke bridge.', background: '#0f172a', color: '#fff' });
        }
    };

    const handleSave = async () => {
        if (!testSuccess && !isEditing) {
            Swal.fire({
                icon: 'warning',
                title: 'Diagnostik Diperlukan',
                text: 'Lakukan diagnostik link yang berhasil sebelum pendaftaran.',
                background: '#0f172a',
                color: '#fff'
            });
            return;
        }

        try {
            const payload = isEditing ? { ...formData, id: editId } : formData;
            const res = await fetch('/api/routers', {
                method: isEditing ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                closeModal();
                fetchRouters();
                Swal.fire({ icon: 'success', title: 'Tersinkronisasi', text: isEditing ? 'Profil diperbarui.' : 'Gateway baru berhasil didaftarkan.', background: '#0f172a', color: '#fff' });
            } else {
                const data = await res.json();
                Swal.fire({ icon: 'error', title: 'Gagal Menyimpan', text: data.error, background: '#0f172a', color: '#fff' });
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: 'Hapus Node Gateway?',
            text: "Operasi ini akan memutuskan link infrastruktur.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#f43f5e',
            confirmButtonText: 'Hapus Node',
            cancelButtonText: 'Batal',
            background: '#0f172a',
            color: '#fff'
        });

        if (!result.isConfirmed) return;

        try {
            const res = await fetch(`/api/routers?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                fetchRouters();
                Swal.fire({ icon: 'success', title: 'Terhapus', text: 'Rekaman gateway telah dihapus.', background: '#0f172a', color: '#fff' });
            }
        } catch (err) {
            console.error(err);
        }
    };

    const openEditModal = (router: any) => {
        setFormData({
            name: router.name,
            ip_address: router.ip_address,
            username: router.username,
            password: '', 
            api_port: router.api_port
        });
        setEditId(router.id);
        setIsEditing(true);
        setTestSuccess(false);
        setShowForm(true);
    };

    const testConnectionExisting = async (router: any) => {
        Swal.fire({ title: `Mendiagnosis ${router.name}...`, allowOutsideClick: false, didOpen: () => { Swal.showLoading(); }, background: '#0f172a', color: '#fff' });

        try {
            const res = await fetch('/api/test-router', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: router.id, host: router.ip_address, user: router.username, password: router.password, port: router.api_port })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                Swal.fire({ icon: 'success', title: 'Nominal', text: `Link aktif. Sesi Aktif: ${data.activeSessionCount}`, background: '#0f172a', color: '#fff' });
                fetchRouters();
            } else {
                Swal.fire({ icon: 'error', title: 'Vektor Offline', text: data.error, background: '#0f172a', color: '#fff' });
                fetchRouters();
            }
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Kesalahan Jaringan', text: 'Gagal menghubungkan ke bridge.', background: '#0f172a', color: '#fff' });
            fetchRouters();
        }
    };

    const closeModal = () => {
        setShowForm(false);
        setIsEditing(false);
        setTestSuccess(false);
        setFormData({ name: '', ip_address: '', username: '', password: '', api_port: 8728 });
    };

    return (
        <div className="animate-in fade-in duration-500 pb-20 space-y-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-6 border-b border-(--glass-border) pb-10">
                <div>
                    <h3 className="text-4xl font-bold text-primary flex items-center gap-4 tracking-tight">
                        <Wifi className="w-10 h-10 text-accent" />
                        Matriks Gateway
                    </h3>
                    <p className="text-muted font-medium mt-2">Link API Mikrotik Inti untuk sinkronisasi infrastruktur real-time.</p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="bg-accent hover:bg-accent/90 text-white font-bold py-3.5 px-8 rounded-2xl transition-all shadow-lg active:scale-95 flex items-center gap-3 uppercase tracking-widest text-[10px]"
                >
                    <PlusCircle className="w-5 h-5" /> Daftarkan Gateway
                </button>
            </div>

            <div className="space-y-8">
                {/* Desktop Table View */}
                <div className="hidden md:block glass rounded-4xl overflow-hidden shadow-xl border border-(--glass-border) bg-white/2">
                    <div className="p-10 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-8 bg-white/2">
                        <h4 className="text-2xl font-bold text-primary tracking-tight">Pusat Infrastruktur</h4>
                        <div className="bg-accent/5 px-5 py-2 rounded-xl border border-accent/10">
                            <p className="text-[10px] font-bold text-accent uppercase tracking-widest flex items-center gap-3">
                                <CheckCircle className="w-4 h-4" /> Koneksi Global: Normal
                            </p>
                        </div>
                    </div>
                    <div className="overflow-x-auto min-h-[350px] custom-scrollbar">
                        <table className="w-full text-left border-collapse whitespace-nowrap">
                            <thead>
                                <tr className="bg-white/1 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5">
                                    <th className="px-10 py-8">Node Perangkat Keras</th>
                                    <th className="px-10 py-8">Vektor Jaringan</th>
                                    <th className="px-10 py-8">Profil Autentikasi</th>
                                    <th className="px-10 py-8">Status</th>
                                    <th className="px-10 py-8 text-right">Orkestrasi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-sm">
                                {loading ? (
                                    <tr><td colSpan={5} className="p-32 text-center">
                                        <div className="flex flex-col items-center gap-6 animate-pulse">
                                            <div className="w-10 h-10 border-2 border-accent/20 border-t-accent rounded-full animate-spin"></div>
                                            <span className="font-bold uppercase tracking-widest text-[10px] text-slate-500">Menelusuri infrastruktur...</span>
                                        </div>
                                    </td></tr>
                                ) : routers.length === 0 ? (
                                    <tr><td colSpan={5} className="p-32 text-center text-slate-500 font-bold uppercase tracking-widest opacity-40">Tidak ada node gateway yang teridentifikasi.</td></tr>
                                ) : (
                                    routers
                                        .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                                        .map((router: any) => (
                                            <tr key={router.id} className="hover:bg-white/2 transition-all group">
                                                <td className="px-10 py-8">
                                                    <div className="font-bold text-primary text-xl tracking-tight leading-tight group-hover:text-accent transition-colors">{router.name}</div>
                                                    <div className="text-[9px] font-bold text-muted mt-2 uppercase tracking-widest bg-white/5 inline-block px-3 py-1 rounded-lg border border-white/5">Node Perangkat Keras</div>
                                                </td>
                                                <td className="px-10 py-8">
                                                    <div className="font-mono font-bold text-primary/80">{router.ip_address}</div>
                                                    <div className="text-[10px] font-bold text-slate-600 mt-1 uppercase tracking-widest">Port: {router.api_port}</div>
                                                </td>
                                                <td className="px-10 py-8">
                                                    <div className="text-primary font-bold text-sm uppercase tracking-widest">{router.username}</div>
                                                    <div className="text-[10px] font-bold text-muted mt-1 uppercase tracking-widest opacity-40">Sesi Aman</div>
                                                </td>
                                                <td className="px-10 py-8">
                                                    <span className={`px-4 py-2 rounded-xl text-[9px] font-bold tracking-widest uppercase border flex items-center w-fit gap-3 ${router.status === 'ONLINE' ? 'bg-accent/10 text-accent border-accent/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                                                        <div className={`w-1.5 h-1.5 rounded-full ${router.status === 'ONLINE' ? 'bg-accent animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500'}`}></div>
                                                        {router.status}
                                                    </span>
                                                </td>
                                                <td className="px-10 py-8 text-right">
                                                    <div className="flex items-center justify-end gap-3 opacity-40 group-hover:opacity-100 transition-opacity">
                                                        <button 
                                                            onClick={() => testConnectionExisting(router)} 
                                                            className="p-3 rounded-xl bg-white/5 text-slate-400 hover:bg-accent/10 hover:text-accent border border-white/5 transition-all"
                                                            title="Diagnostik"
                                                        >
                                                            <Wifi className="w-4 h-4" />
                                                        </button>
                                                        <button 
                                                            onClick={() => openEditModal(router)} 
                                                            className="p-3 rounded-xl bg-white/5 text-slate-400 hover:bg-blue-500/10 hover:text-blue-400 border border-white/5 transition-all"
                                                            title="Ubah"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDelete(router.id)} 
                                                            className="p-3 rounded-xl bg-white/5 text-slate-400 hover:bg-red-500/10 hover:text-red-500 border border-white/5 transition-all"
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

                {/* Mobile Card View */}
                <div className="md:hidden grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {loading ? (
                        <div className="col-span-full p-20 text-center text-slate-500 animate-pulse uppercase text-[12px] font-black tracking-[0.3em]">Membangun Matriks...</div>
                    ) : routers.length === 0 ? (
                        <div className="col-span-full p-20 text-center text-slate-500 font-black uppercase text-[12px] tracking-[0.3em] opacity-30">Matriks Node Kosong</div>
                    ) : (
                        routers
                            .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                            .map((router: any) => (
                                <div key={router.id} className="glass p-8 rounded-[40px] border border-white/10 bg-white/2 flex flex-col justify-between shadow-2xl group relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4">
                                        <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border flex items-center gap-2 ${router.status === 'ONLINE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                                            <div className={`w-2 h-2 rounded-full ${router.status === 'ONLINE' ? 'bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]' : 'bg-red-500'}`}></div>
                                            {router.status}
                                        </span>
                                    </div>
                                    
                                    <div className="flex flex-col items-center text-center mt-6">
                                        <div className="w-20 h-20 rounded-[28px] bg-white/5 flex items-center justify-center mb-6 shadow-inner border border-white/5 group-hover:scale-110 transition-transform duration-500">
                                            <Wifi className={`w-10 h-10 ${router.status === 'ONLINE' ? 'text-accent' : 'text-slate-600'}`} />
                                        </div>
                                        <h4 className="font-black text-white text-xl tracking-tight leading-none mb-3 uppercase">{router.name}</h4>
                                        <div className="bg-slate-950/40 px-4 py-2 rounded-xl border border-white/5">
                                            <p className="text-[12px] font-mono text-accent font-black tracking-widest">{router.ip_address}</p>
                                        </div>
                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mt-3 opacity-60">Port: {router.api_port}</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mt-10 pt-8 border-t border-white/5">
                                        <button 
                                            onClick={() => testConnectionExisting(router)} 
                                            className="flex flex-col items-center gap-2 p-4 rounded-3xl bg-white/5 hover:bg-accent/10 transition-all active:scale-90 border border-white/5 group/btn"
                                        >
                                            <Wifi className="w-6 h-6 text-slate-400 group-hover/btn:text-accent" />
                                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest group-hover/btn:text-accent">Test Link</span>
                                        </button>
                                        <button 
                                            onClick={() => openEditModal(router)} 
                                            className="flex flex-col items-center gap-2 p-4 rounded-3xl bg-white/5 hover:bg-blue-500/10 transition-all active:scale-90 border border-white/5 group/btn"
                                        >
                                            <Edit className="w-6 h-6 text-slate-400 group-hover/btn:text-blue-400" />
                                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest group-hover/btn:text-blue-400">Edit Node</span>
                                        </button>
                                    </div>
                                </div>
                            ))
                    )}
                </div>

                {/* Pagination Controls */}
                {!loading && routers.length > itemsPerPage && (
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-8 pt-10 px-4">
                        <p className="text-[10px] font-black text-muted uppercase tracking-[0.3em]">
                            Matrix Identified: <span className="text-primary dark:text-white">{routers.length} Node</span>
                        </p>
                        <div className="flex items-center gap-4">
                            <button 
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="px-8 py-4 rounded-2xl bg-surface dark:bg-white/5 border border-glass-border dark:border-white/10 text-[10px] font-black uppercase tracking-widest text-muted hover:text-primary dark:hover:text-white disabled:opacity-20 transition-all active:scale-95 shadow-xl"
                            >
                                Sebelumnya
                            </button>
                            <button 
                                onClick={() => setCurrentPage(p => p + 1)}
                                disabled={currentPage >= Math.ceil(routers.length / itemsPerPage)}
                                className="px-8 py-4 rounded-2xl bg-surface dark:bg-white/5 border border-glass-border dark:border-white/10 text-[10px] font-black uppercase tracking-widest text-muted hover:text-primary dark:hover:text-white disabled:opacity-20 transition-all active:scale-95 shadow-xl"
                            >
                                Selanjutnya
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal Form - Pro Max Ultra */}
            {showForm && (
                <div className="fixed inset-0 z-9999 flex items-center justify-center p-4 sm:p-10 bg-slate-950/95 backdrop-blur-2xl animate-in fade-in duration-500">
                    <div className="bg-surface dark:bg-[#0f172a] w-full max-w-4xl rounded-[64px] border border-glass-border dark:border-white/15 shadow-[0_60px_120px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col max-h-[90vh] relative animate-in zoom-in-95 duration-500">
                        <div className="absolute top-0 left-0 right-0 h-2 bg-linear-to-r from-transparent via-accent to-transparent"></div>
                        
                        <div className="p-12 border-b border-glass-border dark:border-white/10 flex justify-between items-center bg-linear-to-b from-white/5 to-transparent">
                            <div className="flex items-center gap-8">
                                <div className="w-20 h-20 rounded-[32px] bg-accent/10 flex items-center justify-center text-accent border border-accent/20 shadow-inner">
                                    {isEditing ? <Edit className="w-10 h-10" /> : <PlusCircle className="w-10 h-10" />}
                                </div>
                                <div>
                                    <h3 className="text-3xl font-black text-primary dark:text-white tracking-tighter uppercase leading-none mb-3">
                                        {isEditing ? 'Ubah Matriks Gateway' : 'Inisialisasi Node Gateway'}
                                    </h3>
                                    <p className="text-accent text-[11px] font-black uppercase tracking-[0.4em] opacity-80 underline underline-offset-8 decoration-accent/30">MikroTik RouterOS Layer</p>
                                </div>
                            </div>
                            <button onClick={closeModal} className="w-16 h-16 bg-white/5 hover:bg-white/10 rounded-[28px] text-primary dark:text-white transition-all flex items-center justify-center border border-glass-border dark:border-white/10 shadow-2xl active:scale-95">
                                <X className="w-8 h-8" />
                            </button>
                        </div>

                        <div className="p-12 space-y-12 overflow-y-auto custom-scrollbar flex-1">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                <div className="col-span-1 md:col-span-2 space-y-5">
                                    <label className="flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.4em] text-muted ml-2">
                                        <div className="w-2 h-2 rounded-full bg-accent"></div>
                                        Alias Gateway Jaringan
                                    </label>
                                    <input type="text" name="name" required value={formData.name} onChange={handleFormChange} className="w-full bg-input dark:bg-white/5 border border-input-border dark:border-white/10 rounded-[32px] py-6 px-10 text-2xl font-black text-primary dark:text-white focus:outline-none focus:border-accent/50 focus:bg-white/10 transition-all shadow-inner" placeholder="Contoh: Core-Region-A" />
                                </div>
                                <div className="space-y-5">
                                    <label className="flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.4em] text-muted ml-2">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                        Matriks Host (IP)
                                    </label>
                                    <div className="relative group">
                                        <input type="text" name="ip_address" required value={formData.ip_address} onChange={handleFormChange} className="w-full bg-input dark:bg-white/5 border border-input-border dark:border-white/10 rounded-[32px] py-6 pl-16 pr-10 font-mono font-black text-2xl text-primary dark:text-white focus:outline-none focus:border-accent/50 transition-all shadow-inner" placeholder="192.168.1.1" />
                                        <Wifi className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-accent/40 group-focus-within:text-accent transition-all" />
                                    </div>
                                </div>
                                <div className="space-y-5">
                                    <label className="flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.4em] text-muted ml-2">
                                        <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                                        Port Protokol API
                                    </label>
                                    <input type="number" name="api_port" required value={formData.api_port} onChange={handleFormChange} className="w-full bg-input dark:bg-white/5 border border-input-border dark:border-white/10 rounded-[32px] py-6 px-10 font-mono font-black text-xl text-primary dark:text-white focus:outline-none focus:border-accent/50 transition-all shadow-inner" />
                                </div>
                                <div className="space-y-5">
                                    <label className="flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.4em] text-muted ml-2">
                                        <div className="w-2 h-2 rounded-full bg-accent"></div>
                                        Pengguna Infrastruktur
                                    </label>
                                    <input type="text" name="username" required value={formData.username} onChange={handleFormChange} className="w-full bg-input dark:bg-white/5 border border-input-border dark:border-white/10 rounded-[32px] py-6 px-10 font-mono font-black text-xl text-primary dark:text-white focus:outline-none focus:border-accent/50 transition-all shadow-inner" placeholder="admin" />
                                </div>
                                <div className="space-y-5">
                                    <label className="flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.4em] text-muted ml-2">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                        Token Keamanan
                                    </label>
                                    <input type="password" name="password" value={formData.password} onChange={handleFormChange} className="w-full bg-input dark:bg-white/5 border border-input-border dark:border-white/10 rounded-[32px] py-6 px-10 font-mono font-black text-xl text-primary dark:text-white focus:outline-none focus:border-accent/50 transition-all shadow-inner" placeholder="••••••••" />
                                </div>
                            </div>

                            <div className="bg-surface dark:bg-white/2 p-10 rounded-[48px] border border-glass-border dark:border-white/5 space-y-8 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-3xl"></div>
                                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 relative z-10">
                                    <div className="flex flex-col gap-2">
                                        <span className="text-[12px] font-black text-primary dark:text-white uppercase tracking-[0.3em]">Diagnostik Link Hardware</span>
                                        <span className="text-[10px] text-muted font-bold uppercase tracking-widest">Wajib Sebelum Registrasi Node Baru</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleTestBeforeSave}
                                        className={`w-full md:w-auto px-10 py-5 rounded-[28px] transition-all font-black uppercase tracking-[0.2em] text-[11px] flex items-center justify-center gap-4 active:scale-95 border shadow-2xl ${testSuccess ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' : 'bg-white/5 text-primary dark:text-white border-glass-border dark:border-white/10 hover:bg-white/10'}`}
                                        disabled={!formData.ip_address || !formData.username}
                                    >
                                        {testSuccess ? <CheckCircle className="w-6 h-6" /> : <Wifi className="w-6 h-6" />}
                                        {testSuccess ? 'Matriks Terverifikasi' : 'Inisialisasi Uji Koneksi'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="p-12 border-t border-glass-border dark:border-white/10 flex flex-col sm:flex-row justify-end items-center gap-6 bg-linear-to-t from-white/5 to-transparent relative z-10 shrink-0">
                            <button type="button" onClick={closeModal} className="w-full sm:w-auto px-10 py-6 rounded-3xl text-muted font-black uppercase tracking-[0.4em] text-[11px] hover:bg-white/5 transition-all active:scale-95">Batalkan</button>
                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={!isEditing && !testSuccess}
                                className={`w-full sm:w-auto px-16 py-6 rounded-3xl font-black uppercase tracking-[0.4em] text-[11px] transition-all flex items-center justify-center gap-5 shadow-[0_30px_60px_rgba(16,185,129,0.3)] border border-white/20 ${(testSuccess || isEditing) ? 'bg-linear-to-r from-accent to-emerald-700 hover:from-accent hover:to-emerald-600 text-white active:scale-95' : 'bg-white/5 text-slate-700 cursor-not-allowed border-white/5'}`}
                            >
                                <Save className="w-6 h-6" />
                                {isEditing ? 'Perbarui Node Gateway' : 'Daftarkan Node Sekarang'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
