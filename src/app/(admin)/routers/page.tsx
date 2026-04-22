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
        <div className="animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-8">
                <h3 className="text-3xl font-bold text-white">Mikrotik Routers</h3>
                <button
                    onClick={() => setShowForm(true)}
                    className="bg-teal-500 hover:bg-teal-400 text-slate-900 font-semibold py-2.5 px-6 rounded-xl transition-all shadow-[0_0_15px_rgba(20,184,166,0.3)] hover:shadow-[0_0_25px_rgba(20,184,166,0.5)] flex items-center gap-2"
                >
                    <PlusCircle className="w-5 h-5" />
                    Add New Router
                </button>
            </div>

            <div className="glass rounded-2xl border border-white/10 overflow-hidden shadow-xl">
                <div className="overflow-x-auto min-h-[300px]">
                    <table className="w-full text-left border-collapse whitespace-nowrap">
                        <thead>
                            <tr className="border-b border-white/10 bg-white/5 uppercase text-xs tracking-wider font-semibold text-slate-300">
                                <th className="p-4">Name</th>
                                <th className="p-4">IP Address</th>
                                <th className="p-4">Username</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-sm">
                            {loading ? (
                                <tr><td colSpan={5} className="p-8 text-center text-slate-400">Loading routers...</td></tr>
                            ) : routers.length === 0 ? (
                                <tr><td colSpan={5} className="p-8 text-center text-slate-400">No routers added yet.</td></tr>
                            ) : (
                                routers.map((router: any) => (
                                    <tr key={router.id} className="hover:bg-white/5 transition-colors">
                                        <td className="p-4 font-medium text-white">{router.name}</td>
                                        <td className="p-4 text-slate-300 font-mono text-sm">{router.ip_address}:{router.api_port}</td>
                                        <td className="p-4 text-slate-300">{router.username}</td>
                                        <td className="p-4">
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] tracking-widest uppercase font-bold ${router.status === 'ONLINE' ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                                                {router.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-center gap-2">
                                                <button onClick={() => testConnectionExisting(router)} title="Test Ping API" className="p-2.5 rounded-lg bg-teal-500/10 text-teal-400 hover:bg-teal-500/20 transition-all border border-teal-500/30 hover:scale-110 shadow-sm">
                                                    <Wifi className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => openEditModal(router)} title="Edit Router" className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-all border border-blue-500/30 hover:scale-110 shadow-sm">
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleDelete(router.id)} title="Delete Router" className="p-2.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all border border-red-500/30 hover:scale-110 shadow-sm">
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

            {/* Pop Up Modal Form */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-slate-800 w-full max-w-2xl p-6 rounded-3xl border border-white/10 shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                            <h4 className="text-xl font-bold text-white flex items-center gap-2">
                                {isEditing ? <Edit className="text-teal-400" /> : <Wifi className="text-teal-400" />}
                                {isEditing ? 'Ubah Konfigurasi Router' : 'Tambah Router Mikrotik'}
                            </h4>
                            <button onClick={closeModal} className="text-slate-400 hover:text-white transition-colors bg-slate-700/50 hover:bg-slate-700 p-2 rounded-full">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="col-span-2">
                                <label className="block text-sm text-slate-400 mb-1.5 font-medium">Nama Router</label>
                                <input type="text" name="name" required value={formData.name} onChange={handleFormChange} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-teal-400 transition-all shadow-inner" placeholder="Contoh: Mikrotik Pusat" />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1.5 font-medium">IP Address / DNS Host</label>
                                <input type="text" name="ip_address" required value={formData.ip_address} onChange={handleFormChange} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-teal-400 transition-all shadow-inner font-mono" placeholder="192.168.88.1" />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1.5 font-medium">API Port</label>
                                <input type="number" name="api_port" required value={formData.api_port} onChange={handleFormChange} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-teal-400 transition-all shadow-inner font-mono" placeholder="8728" />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1.5 font-medium">Winbox Username</label>
                                <input type="text" name="username" required value={formData.username} onChange={handleFormChange} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-teal-400 transition-all shadow-inner font-mono" placeholder="admin" />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1.5 font-medium">{isEditing ? 'Ubah Password Baru (Kosongkan bila sama)' : 'Winbox Password'}</label>
                                <input type="password" name="password" value={formData.password} onChange={handleFormChange} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-teal-400 transition-all shadow-inner font-mono" placeholder={isEditing ? '********' : 'Kosongkan jika tidak ada password'} />
                            </div>
                        </div>

                        <div className="mt-8 flex justify-between items-center bg-slate-900/50 p-4 rounded-2xl border border-white/5">
                            <button
                                type="button"
                                onClick={handleTestBeforeSave}
                                className="px-5 py-2.5 rounded-xl bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-all font-semibold flex items-center gap-2 disabled:opacity-50"
                                disabled={!formData.ip_address || !formData.username}
                            >
                                {testSuccess ? <CheckCircle className="w-5 h-5" /> : <Wifi className="w-5 h-5" />}
                                {testSuccess ? 'Koneksi Tervalidasi' : 'Test Koneksi'}
                            </button>

                            <div className="flex gap-3">
                                <button type="button" onClick={closeModal} className="px-5 py-2.5 rounded-xl hover:bg-white/10 transition-colors text-slate-300 font-medium">Batal</button>
                                <button
                                    type="button"
                                    onClick={handleSave}
                                    disabled={!isEditing && !testSuccess}
                                    className={`px-8 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 ${(testSuccess || isEditing) ? 'bg-teal-500 hover:bg-teal-400 text-slate-900 shadow-[0_0_15px_rgba(20,184,166,0.3)]' : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'}`}
                                >
                                    <Save className="w-5 h-5" />
                                    {isEditing ? 'Update Router' : 'Simpan Router'}
                                </button>
                            </div>
                        </div>

                        {!testSuccess && !isEditing && (
                            <p className="text-center text-xs text-slate-500 mt-4 italic">
                                * Pendaftaran router baru mewajibkan Anda melakukan klik 'Test Koneksi' dan berhasil.
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
