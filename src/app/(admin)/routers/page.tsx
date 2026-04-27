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
                title: 'Data Belum Lengkap',
                text: 'IP Address dan Username wajib diisi untuk melakukan test!',
                background: '#1e293b',
                color: '#fff'
            });
            return;
        }

        Swal.fire({
            title: 'Mengetes koneksi...',
            allowOutsideClick: false,
            background: '#1e293b',
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
                    title: 'Koneksi Berhasil!',
                    text: `Terhubung ke API Mikrotik. PPPoE Aktif: ${data.activeSessionCount}. Silakan simpan.`,
                    background: '#1e293b',
                    color: '#fff'
                });
            } else {
                setTestSuccess(false);
                Swal.fire({
                    icon: 'error',
                    title: 'Koneksi Gagal',
                    text: data.error || 'Periksa kembali IP, Username, atau Password.',
                    background: '#1e293b',
                    color: '#fff'
                });
            }
        } catch (err) {
            setTestSuccess(false);
            Swal.fire({ icon: 'error', title: 'Error Jaringan', text: 'Tidak dapat menjangkau server lokal.', background: '#1e293b', color: '#fff' });
        }
    };

    const handleSave = async () => {
        if (!testSuccess && !isEditing) {
            Swal.fire({
                icon: 'warning',
                title: 'Test Koneksi Dulu',
                text: 'Harap lakukan tes koneksi yang berhasil sebelum menyimpan Router.',
                background: '#1e293b',
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
                Swal.fire({ icon: 'success', title: 'Tersimpan!', text: isEditing ? 'Pengaturan router diperbarui.' : 'Router mikrotik baru ditambahkan.', background: '#1e293b', color: '#fff' });
            } else {
                const data = await res.json();
                Swal.fire({ icon: 'error', title: 'Gagal Menyimpan', text: data.error, background: '#1e293b', color: '#fff' });
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: 'Hapus Mikrotik?',
            text: "Data koneksi mikrotik ini akan dihapus permanen!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#f43f5e',
            cancelButtonColor: '#334155',
            confirmButtonText: 'Ya, hapus!',
            background: '#1e293b',
            color: '#fff'
        });

        if (!result.isConfirmed) return;

        try {
            const res = await fetch(`/api/routers?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                fetchRouters();
                Swal.fire({ icon: 'success', title: 'Terhapus!', text: 'Router telah dihapus.', background: '#1e293b', color: '#fff' });
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
            password: '', // Blank
            api_port: router.api_port
        });
        setEditId(router.id);
        setIsEditing(true);
        setTestSuccess(false); // require testing if they want to verify, but allow save anyway
        setShowForm(true);
    };

    const testConnectionExisting = async (router: any) => {
        Swal.fire({ title: `Mengetes koneksi ke ${router.name}...`, allowOutsideClick: false, didOpen: () => { Swal.showLoading(); }, background: '#1e293b', color: '#fff' });

        try {
            const res = await fetch('/api/test-router', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: router.id, host: router.ip_address, user: router.username, password: router.password, port: router.api_port })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                Swal.fire({ icon: 'success', title: 'Koneksi Sukses!', text: `Terhubung dan sinkronisasi aktif. PPPoE Session: ${data.activeSessionCount}`, background: '#1e293b', color: '#fff' });
                fetchRouters();
            } else {
                Swal.fire({ icon: 'error', title: 'Koneksi Terputus (Offline)', text: data.error, background: '#1e293b', color: '#fff' });
                fetchRouters();
            }
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Error Jaringan', text: 'Tidak dapat menjangkau server API lokal.', background: '#1e293b', color: '#fff' });
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
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12">
                <div>
                    <h3 className="text-4xl font-black text-primary flex items-center gap-4">
                        <Wifi className="w-10 h-10 text-teal-600 dark:text-teal-400" />
                        Network Gateways
                    </h3>
                    <p className="text-muted font-medium mt-2 text-sm">Kelola koneksi API Mikrotik untuk sinkronisasi data pelanggan secara realtime.</p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="bg-teal-600 hover:bg-teal-500 text-white font-black py-4.5 px-10 rounded-2xl transition-all shadow-2xl shadow-teal-600/30 hover:scale-105 active:scale-95 flex items-center gap-3 uppercase tracking-[0.2em] text-[10px]"
                >
                    <PlusCircle className="w-5 h-5" /> Tambah Router Baru
                </button>
            </div>

            {/* Content View: Table (Desktop) & Cards (Mobile) */}
            <div className="space-y-8">
                {/* Desktop Table View */}
                <div className="hidden md:block glass rounded-[3rem] overflow-hidden shadow-2xl border border-(--glass-border)">
                    <div className="p-10 border-b border-(--glass-border) flex flex-col md:flex-row justify-between items-start md:items-center gap-8 bg-white/5">
                        <h4 className="text-2xl font-black text-primary">Connected Mikrotik Nodes</h4>
                        <div className="bg-slate-100 dark:bg-white/5 px-6 py-3 rounded-2xl border border-(--glass-border)">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-teal-500" /> System Online & Synced
                            </p>
                        </div>
                    </div>
                    <div className="overflow-x-auto min-h-[350px]">
                        <table className="w-full text-left border-collapse whitespace-nowrap">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-white/2 uppercase text-[10px] tracking-[0.3em] font-black text-slate-500 border-b border-(--glass-border)">
                                    <th className="p-8">Router Profile</th>
                                    <th className="p-8">Connection Info</th>
                                    <th className="p-8">API Credentials</th>
                                    <th className="p-8">Connectivity</th>
                                    <th className="p-8 text-center">Maintenance</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-(--glass-border) text-sm">
                                {loading ? (
                                    <tr><td colSpan={5} className="p-32 text-center text-slate-500">
                                        <div className="flex flex-col items-center gap-6 animate-pulse">
                                            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-teal-600"></div>
                                            <span className="font-black uppercase tracking-[0.3em] text-[10px]">Scanning hardware ports...</span>
                                        </div>
                                    </td></tr>
                                ) : routers.length === 0 ? (
                                    <tr><td colSpan={5} className="p-32 text-center text-slate-500 font-black uppercase tracking-widest opacity-60">Belum ada router yang terdaftar di database.</td></tr>
                                ) : (
                                    routers
                                        .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                                        .map((router: any) => (
                                            <tr key={router.id} className="hover:bg-slate-50 dark:hover:bg-white/2 transition-all group">
                                                <td className="p-8">
                                                    <div className="font-black text-primary text-xl tracking-tight leading-tight group-hover:text-teal-600 transition-colors">{router.name}</div>
                                                    <div className="text-[10px] font-black text-muted mt-2 uppercase tracking-[0.2em] bg-slate-100 dark:bg-white/5 inline-block px-3 py-1 rounded-lg">Hardware Node</div>
                                                </td>
                                                <td className="p-8">
                                                    <div className="font-mono font-black">{router.ip_address}</div>
                                                    <div className="text-[10px] font-black text-slate-500 mt-1 uppercase tracking-widest">API Port: {router.api_port}</div>
                                                </td>
                                                <td className="p-8">
                                                    <div className="text-primary font-black text-sm uppercase tracking-widest">{router.username}</div>
                                                    <div className="text-[10px] font-black text-muted mt-1 uppercase tracking-widest opacity-60">Authenticated Session</div>
                                                </td>
                                                <td className="p-8">
                                                    <span className={`px-5 py-2.5 rounded-[1.25rem] text-[10px] font-black tracking-[0.25em] uppercase border shadow-sm flex items-center w-fit gap-2 ${router.status === 'ONLINE' ? 'bg-teal-500/10 text-teal-600 border-teal-500/20' : 'bg-red-500/10 text-red-600 border-red-500/20'}`}>
                                                        <div className={`w-2 h-2 rounded-full animate-pulse ${router.status === 'ONLINE' ? 'bg-teal-500' : 'bg-red-500'}`}></div>
                                                        {router.status}
                                                    </span>
                                                </td>
                                                <td className="p-8">
                                                    <div className="flex items-center justify-center gap-4">
                                                        <button 
                                                            onClick={() => testConnectionExisting(router)} 
                                                            title="Run Connection Diagnostic" 
                                                            className="p-4 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 hover:bg-teal-600 hover:text-white border-2 border-teal-500/10 hover:scale-110 active:scale-90 transition-all shadow-md"
                                                        >
                                                            <Wifi className="w-5 h-5" />
                                                        </button>
                                                        <button 
                                                            onClick={() => openEditModal(router)} 
                                                            title="Edit Configurations" 
                                                            className="p-4 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white border-2 border-blue-500/10 hover:scale-110 active:scale-90 transition-all shadow-md"
                                                        >
                                                            <Edit className="w-5 h-5" />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDelete(router.id)} 
                                                            title="Delete Gateway Node" 
                                                            className="p-4 rounded-2xl bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-600 hover:text-white border-2 border-red-500/10 hover:scale-110 active:scale-90 transition-all shadow-md"
                                                        >
                                                            <Trash2 className="w-5 h-5" />
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
                        <div className="p-24 text-center text-slate-500 animate-pulse uppercase text-[10px] font-black tracking-[0.3em]">Synching Nodes...</div>
                    ) : routers.length === 0 ? (
                        <div className="p-24 text-center text-slate-500 font-black uppercase text-[10px] tracking-widest opacity-60">Kosong</div>
                    ) : (
                        routers
                            .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                            .map((router: any) => (
                                <div key={router.id} className="glass p-8 rounded-[2.5rem] space-y-8 shadow-2xl border border-(--glass-border) relative overflow-hidden group">
                                    <div className="flex justify-between items-start relative z-10">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-2xl bg-teal-500/10 flex items-center justify-center text-teal-600 dark:text-teal-400 border-2 border-teal-500/20 shadow-inner">
                                                <Wifi className="w-7 h-7" />
                                            </div>
                                            <div>
                                                <h4 className="font-black text-primary text-2xl tracking-tight leading-tight">{router.name}</h4>
                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mt-1">Gateway Node</p>
                                            </div>
                                        </div>
                                        <span className={`px-4 py-2 rounded-2xl text-[9px] font-black uppercase tracking-[0.25em] border shadow-sm ${router.status === 'ONLINE' ? 'bg-teal-500/10 text-teal-600 border-teal-500/20' : 'bg-red-500/10 text-red-600 border-red-500/20'}`}>
                                            {router.status}
                                        </span>
                                    </div>
                                    <div className="bg-slate-100 dark:bg-slate-900/50 p-6 rounded-4xl border-2 border-(--glass-border) space-y-5 shadow-inner relative z-10">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em]">Remote Host</span>
                                            <span className="text-primary font-mono font-black text-sm">{router.ip_address}</span>
                                        </div>
                                        <div className="flex justify-between items-center pt-4 border-t border-(--glass-border)">
                                            <span className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em]">Authorized User</span>
                                            <span className="text-primary font-black text-sm uppercase tracking-widest">{router.username}</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-4 relative z-10">
                                        <button onClick={() => testConnectionExisting(router)} className="flex-1 py-4.5 rounded-2xl bg-teal-500/10 text-teal-600 border-2 border-teal-500/10 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all shadow-lg hover:bg-teal-600 hover:text-white">Diagnostic</button>
                                        <button onClick={() => openEditModal(router)} className="flex-1 py-4.5 rounded-2xl bg-indigo-500/10 text-indigo-600 border-2 border-indigo-500/10 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all shadow-lg hover:bg-indigo-600 hover:text-white">Edit Configuration</button>
                                    </div>
                                    <button onClick={() => handleDelete(router.id)} className="w-full py-4 rounded-2xl bg-red-500/5 text-red-600 border-2 border-red-500/10 text-[9px] font-black uppercase tracking-[0.25em] hover:bg-red-600 hover:text-white transition-all relative z-10">Unregister Node</button>
                                </div>
                            ))
                    )}
                </div>

                {/* Pagination Controls */}
                {!loading && routers.length > itemsPerPage && (
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-8 pt-12 px-4">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">
                            Displaying <span className="text-primary font-black">{routers.length}</span> Gateway Hubs
                        </p>
                        <div className="flex items-center gap-4">
                            <button 
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="px-8 py-4 rounded-2xl glass border-2 border-(--glass-border) text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-primary disabled:opacity-30 transition-all shadow-xl shadow-black/5 active:scale-95"
                            >
                                Previous
                            </button>
                            <button 
                                onClick={() => setCurrentPage(p => p + 1)}
                                disabled={currentPage >= Math.ceil(routers.length / itemsPerPage)}
                                className="px-8 py-4 rounded-2xl glass border-2 border-(--glass-border) text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-primary disabled:opacity-30 transition-all shadow-xl shadow-black/5 active:scale-95"
                            >
                                Next Nodes
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Pop Up Modal Form */}
            {showForm && (
                <div className="fixed inset-0 z-60 flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-500">
                    <div className="glass w-full max-w-3xl p-10 lg:p-14 rounded-[3.5rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] border border-(--glass-border) animate-in zoom-in-95 duration-500 relative overflow-hidden">
                        <div className="absolute -top-40 -right-40 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>
                        
                        <div className="flex justify-between items-center mb-12 border-b border-(--glass-border) pb-10 relative z-10">
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 rounded-3xl bg-teal-500/10 flex items-center justify-center text-teal-600 dark:text-teal-400 border-2 border-teal-500/20 shadow-inner">
                                    {isEditing ? <Edit className="w-8 h-8" /> : <Wifi className="w-8 h-8" />}
                                </div>
                                <div>
                                    <h4 className="text-3xl font-black text-primary tracking-tight">
                                        {isEditing ? 'Update Gateway' : 'Register New Hub'}
                                    </h4>
                                    <p className="text-[10px] text-muted font-black tracking-[0.3em] uppercase mt-1">Mikrotik API Configuration Suite</p>
                                </div>
                            </div>
                            <button onClick={closeModal} className="text-slate-400 hover:text-primary transition-all bg-slate-100 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-800 p-3.5 rounded-2xl active:scale-90 shadow-sm">
                                <X className="w-7 h-7" />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10">
                            <div className="col-span-2">
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] mb-4 ml-1">Friendly Gateway Name</label>
                                <input type="text" name="name" required value={formData.name} onChange={handleFormChange} className="w-full clean-input font-black text-xl py-5 px-8" placeholder="e.g. Core Mikrotik HQ" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] mb-4 ml-1">Remote Host Address (IP)</label>
                                <input type="text" name="ip_address" required value={formData.ip_address} onChange={handleFormChange} className="w-full clean-input font-mono font-black text-lg py-5 px-8" placeholder="10.10.20.1" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] mb-4 ml-1">API Port Protocol</label>
                                <input type="number" name="api_port" required value={formData.api_port} onChange={handleFormChange} className="w-full clean-input font-mono font-black text-lg py-5 px-8" placeholder="8728" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] mb-4 ml-1">Security Principal (User)</label>
                                <input type="text" name="username" required value={formData.username} onChange={handleFormChange} className="w-full clean-input font-mono font-black text-lg py-5 px-8" placeholder="admin_api" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] mb-4 ml-1">{isEditing ? 'Change Access Key' : 'Encryption Key (Pass)'}</label>
                                <input type="password" name="password" value={formData.password} onChange={handleFormChange} className="w-full clean-input font-mono font-black text-lg py-5 px-8" placeholder={isEditing ? 'Leave blank to keep current' : 'Enter password...'} />
                            </div>
                        </div>

                        <div className="mt-14 flex flex-col sm:flex-row justify-between items-center bg-slate-100 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border-2 border-(--glass-border) gap-8 relative z-10 shadow-inner">
                            <button
                                type="button"
                                onClick={handleTestBeforeSave}
                                className={`w-full sm:w-auto px-10 py-5 rounded-2xl transition-all font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-4 active:scale-95 shadow-xl ${testSuccess ? 'bg-teal-500/10 text-teal-600 border-2 border-teal-500/30 shadow-teal-500/5' : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-2 border-indigo-500/20 shadow-indigo-500/5 hover:bg-indigo-500 hover:text-white'}`}
                                disabled={!formData.ip_address || !formData.username}
                            >
                                {testSuccess ? <CheckCircle className="w-5 h-5" /> : <Wifi className="w-5 h-5" />}
                                {testSuccess ? 'Identity Verified' : 'Verify Connection'}
                            </button>

                            <div className="flex gap-4 w-full sm:w-auto">
                                <button type="button" onClick={closeModal} className="flex-1 sm:flex-none px-10 py-5 rounded-2xl hover:bg-slate-200 dark:hover:bg-white/10 transition-colors text-slate-500 dark:text-slate-400 font-black uppercase tracking-[0.2em] text-[10px]">Cancel</button>
                                <button
                                    type="button"
                                    onClick={handleSave}
                                    disabled={!isEditing && !testSuccess}
                                    className={`flex-1 sm:flex-none px-12 py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] transition-all flex items-center justify-center gap-3 shadow-2xl ${(testSuccess || isEditing) ? 'bg-teal-600 hover:bg-teal-500 text-white shadow-teal-600/30 active:scale-95' : 'bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed'}`}
                                >
                                    <Save className="w-5 h-5" />
                                    {isEditing ? 'Commit Changes' : 'Register Node'}
                                </button>
                            </div>
                        </div>

                        {!testSuccess && !isEditing && (
                            <div className="text-center text-[10px] text-slate-500 mt-8 font-black uppercase tracking-[0.3em] opacity-70 flex items-center justify-center gap-2">
                                <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></div>
                                Mandatory: Perform handshake diagnostic before registration
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
