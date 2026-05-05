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
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12 border-b border-(--glass-border) pb-10">
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
                <div className="md:hidden space-y-6">
                    {loading ? (
                        <div className="p-20 text-center text-slate-500 animate-pulse uppercase text-[10px] font-bold tracking-widest">Sinkronisasi Node...</div>
                    ) : routers.length === 0 ? (
                        <div className="p-20 text-center text-slate-500 font-bold uppercase text-[10px] tracking-widest opacity-40">Matriks Kosong</div>
                    ) : (
                        routers
                            .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                            .map((router: any) => (
                                <div key={router.id} className="glass p-8 rounded-4xl space-y-8 shadow-xl border border-(--glass-border) bg-white/2 relative overflow-hidden group">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-accent/5 flex items-center justify-center text-accent border border-accent/10">
                                                <Wifi className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-primary text-xl tracking-tight leading-tight">{router.name}</h4>
                                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Gateway</p>
                                            </div>
                                        </div>
                                        <span className={`px-3 py-1.5 rounded-xl text-[9px] font-bold uppercase tracking-widest border ${router.status === 'ONLINE' ? 'bg-accent/10 text-accent border-accent/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                                            {router.status}
                                        </span>
                                    </div>
                                    <div className="bg-slate-950/40 p-6 rounded-3xl border border-white/5 space-y-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Vektor Host</span>
                                            <span className="text-primary font-mono font-bold text-sm">{router.ip_address}</span>
                                        </div>
                                        <div className="flex justify-between items-center pt-4 border-t border-white/5">
                                            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Terautentikasi</span>
                                            <span className="text-primary font-bold text-xs uppercase tracking-widest">{router.username}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <button onClick={() => testConnectionExisting(router)} className="flex-1 py-4 rounded-2xl bg-accent/5 text-accent border border-accent/10 font-bold text-[10px] uppercase tracking-widest">Diagnostik</button>
                                        <button onClick={() => openEditModal(router)} className="flex-1 py-4 rounded-2xl bg-white/5 text-slate-400 border border-white/5 font-bold text-[10px] uppercase tracking-widest">Ubah</button>
                                    </div>
                                </div>
                            ))
                    )}
                </div>

                {/* Pagination Controls */}
                {!loading && routers.length > itemsPerPage && (
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-8 pt-10 px-4">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                            Identifikasi Matriks: <span className="text-primary font-bold">{routers.length} Node</span>
                        </p>
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="px-6 py-3.5 rounded-xl glass border border-white/5 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-primary disabled:opacity-20 transition-all active:scale-95"
                            >
                                Sebelumnya
                            </button>
                            <button 
                                onClick={() => setCurrentPage(p => p + 1)}
                                disabled={currentPage >= Math.ceil(routers.length / itemsPerPage)}
                                className="px-6 py-3.5 rounded-xl glass border border-white/5 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-primary disabled:opacity-20 transition-all active:scale-95"
                            >
                                Node Selanjutnya
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal Form */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-slate-900 w-full max-w-2xl p-10 lg:p-12 rounded-4xl shadow-2xl border border-white/10 animate-in zoom-in-95 duration-300 relative overflow-hidden">
                        <div className="absolute -top-40 -right-40 w-96 h-96 bg-accent/5 rounded-full blur-3xl pointer-events-none"></div>
                        
                        <div className="flex justify-between items-center mb-10 border-b border-white/5 pb-8 relative z-10">
                            <div className="flex items-center gap-6">
                                <div className="w-14 h-14 rounded-2xl bg-accent/5 flex items-center justify-center text-accent border border-accent/10 shadow-inner">
                                    {isEditing ? <Edit className="w-6 h-6" /> : <Wifi className="w-6 h-6" />}
                                </div>
                                <div>
                                    <h4 className="text-2xl font-bold text-white tracking-tight">
                                        {isEditing ? 'Ubah Gateway' : 'Daftarkan Node'}
                                    </h4>
                                    <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase mt-1">Konfigurasi API Infrastruktur</p>
                                </div>
                            </div>
                            <button onClick={closeModal} className="text-slate-500 hover:text-white transition-all bg-white/5 p-3 rounded-xl active:scale-90">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                            <div className="col-span-2">
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 ml-1">Alias Gateway</label>
                                <input type="text" name="name" required value={formData.name} onChange={handleFormChange} className="w-full clean-input font-bold text-lg py-5 px-6" placeholder="Identifikasi node..." />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 ml-1">Matriks Host (IP)</label>
                                <input type="text" name="ip_address" required value={formData.ip_address} onChange={handleFormChange} className="w-full clean-input font-mono font-bold text-base py-5 px-6" placeholder="10.0.0.1" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 ml-1">Port Protokol</label>
                                <input type="number" name="api_port" required value={formData.api_port} onChange={handleFormChange} className="w-full clean-input font-mono font-bold text-base py-5 px-6" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 ml-1">Pengguna Terautentikasi</label>
                                <input type="text" name="username" required value={formData.username} onChange={handleFormChange} className="w-full clean-input font-mono font-bold text-base py-5 px-6" placeholder="admin" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 ml-1">Token Akses</label>
                                <input type="password" name="password" value={formData.password} onChange={handleFormChange} className="w-full clean-input font-mono font-bold text-base py-5 px-6" placeholder="••••••••" />
                            </div>
                        </div>

                        <div className="mt-12 flex flex-col sm:flex-row justify-between items-center bg-white/1 p-8 rounded-3xl border border-white/5 gap-8 relative z-10">
                            <button
                                type="button"
                                onClick={handleTestBeforeSave}
                                className={`w-full sm:w-auto px-10 py-4 rounded-2xl transition-all font-bold uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 active:scale-95 ${testSuccess ? 'bg-accent/10 text-accent border border-accent/20' : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10'}`}
                                disabled={!formData.ip_address || !formData.username}
                            >
                                {testSuccess ? <CheckCircle className="w-4 h-4" /> : <Wifi className="w-4 h-4" />}
                                {testSuccess ? 'Link Terverifikasi' : 'Verifikasi Link'}
                            </button>

                            <div className="flex gap-4 w-full sm:w-auto">
                                <button type="button" onClick={closeModal} className="flex-1 sm:flex-none px-8 py-4 rounded-2xl text-slate-500 font-bold uppercase tracking-widest text-[10px] hover:bg-white/5">Batal</button>
                                <button
                                    type="button"
                                    onClick={handleSave}
                                    disabled={!isEditing && !testSuccess}
                                    className={`flex-1 sm:flex-none px-10 py-4 rounded-2xl font-bold uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-3 ${(testSuccess || isEditing) ? 'bg-accent hover:bg-accent/90 text-white shadow-lg active:scale-95' : 'bg-white/5 text-slate-600 cursor-not-allowed'}`}
                                >
                                    <Save className="w-4 h-4" />
                                    {isEditing ? 'Simpan' : 'Daftarkan'}
                                </button>
                            </div>
                        </div>

                        {!testSuccess && !isEditing && (
                            <div className="text-center text-[9px] text-slate-600 mt-6 font-bold uppercase tracking-widest opacity-40">
                                Diagnostik link wajib dilakukan sebelum pendaftaran perangkat keras
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
