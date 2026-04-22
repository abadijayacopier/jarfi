'use client';

import { useState, useEffect } from 'react';
import { 
    Plus, Search, Server, Trash2, Edit3, 
    Wifi, Activity, Globe, Shield, ExternalLink,
    Cpu, Zap, HardDrive, RefreshCw
} from 'lucide-react';
import Swal from 'sweetalert2';
import Link from 'next/link';

export default function OLTManagementPage() {
    const [olts, setOlts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [currentOlt, setCurrentOlt] = useState<any>({
        name: '', ip_address: '', username: 'admin', password: '', 
        telnet_port: 23, snmp_community: 'public', type: 'EPON'
    });

    const fetchOlts = async () => {
        try {
            const res = await fetch('/api/olts');
            const data = await res.json();
            setOlts(data.olts || []);
        } catch (e) { }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchOlts(); }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const method = editMode ? 'PUT' : 'POST';
            const res = await fetch('/api/olts', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(currentOlt)
            });
            if (res.ok) {
                Swal.fire({ icon: 'success', title: 'Tersimpan', text: 'Data OLT berhasil diperbarui.', background: '#1e293b', color: '#fff' });
                setShowModal(false);
                fetchOlts();
            }
        } catch (e) { }
        finally { setLoading(false); }
    };

    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: 'Hapus OLT?',
            text: "Data integrasi OLT ini akan dihapus permanen.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#334155',
            confirmButtonText: 'Ya, Hapus!',
            background: '#1e293b',
            color: '#fff'
        });

        if (result.isConfirmed) {
            setLoading(true);
            try {
                const res = await fetch(`/api/olts?id=${id}`, { method: 'DELETE' });
                if (res.ok) {
                    Swal.fire({ icon: 'success', title: 'Terhapus', text: 'OLT berhasil dihapus.', background: '#1e293b', color: '#fff' });
                    fetchOlts();
                }
            } catch (e) { }
            finally { setLoading(false); }
        }
    };

    const filteredOlts = olts.filter(o => 
        o.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        o.ip_address.includes(searchTerm)
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                <div>
                    <h2 className="text-3xl font-black text-white flex items-center gap-3">
                        <Zap className="w-8 h-8 text-indigo-400" />
                        EPON/GPON OLT Integration
                    </h2>
                    <p className="text-slate-400 font-medium mt-1">Kelola perangkat Fiber Optic Core & Pantau Status ONU/ONT Pelanggan</p>
                </div>
                
                <button 
                    onClick={() => {
                        setEditMode(false);
                        setCurrentOlt({ name: '', ip_address: '', username: 'admin', password: '', telnet_port: 23, snmp_community: 'public', type: 'EPON' });
                        setShowModal(true);
                    }}
                    className="px-6 py-4 bg-indigo-500 hover:bg-indigo-400 text-white font-black rounded-2xl shadow-xl shadow-indigo-500/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-3 uppercase tracking-widest text-xs"
                >
                    <Plus className="w-5 h-5" />
                    Tambah OLT Baru
                </button>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass p-6 rounded-3xl border border-white/10 flex items-center gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20 shadow-inner">
                        <Server className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Total Perangkat OLT</p>
                        <h4 className="text-3xl font-black text-white">{olts.length}</h4>
                    </div>
                </div>
                <div className="glass p-6 rounded-3xl border border-emerald-500/20 flex items-center gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20 shadow-inner">
                        <Zap className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">ONU Status (Simulated)</p>
                        <h4 className="text-3xl font-black text-emerald-400">Online</h4>
                    </div>
                </div>
                <div className="glass p-6 rounded-3xl border border-white/10 flex items-center gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/20 shadow-inner">
                        <Activity className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Active Traffic</p>
                        <h4 className="text-3xl font-black text-white">Monitoring...</h4>
                    </div>
                </div>
            </div>

            {/* Search & List */}
            <div className="glass rounded-[2.5rem] border border-white/10 overflow-hidden shadow-3xl">
                <div className="p-8 border-b border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                        <input 
                            type="text" 
                            placeholder="Cari OLT (Nama / IP)..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-900/50 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-indigo-500 transition-all font-medium"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-slate-950/30 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                                <th className="px-8 py-6 text-left">Nama & Tipe</th>
                                <th className="px-8 py-6 text-left">Alamat IP</th>
                                <th className="px-8 py-6 text-left">Credentials</th>
                                <th className="px-8 py-6 text-left">Status</th>
                                <th className="px-8 py-6 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredOlts.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center text-slate-500 uppercase font-black text-xs tracking-widest animate-pulse">
                                        Tidak ada OLT yang terintegrasi.
                                    </td>
                                </tr>
                            ) : (
                                filteredOlts.map((olt) => (
                                    <tr key={olt.id} className="hover:bg-white/5 transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-indigo-400 border border-white/5">
                                                    <Server className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-white text-lg">{olt.name}</p>
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 px-2 py-0.5 bg-indigo-500/10 rounded-md">{olt.type}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2 text-slate-300 font-mono">
                                                <Globe className="w-4 h-4 text-slate-500" />
                                                {olt.ip_address}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="space-y-1">
                                                <p className="text-xs text-slate-400 flex items-center gap-2">
                                                    <Shield className="w-3 h-3" /> {olt.username}
                                                </p>
                                                <p className="text-[10px] text-slate-500 font-mono">SNMP: {olt.snmp_community}</p>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                                                <span className="text-xs font-black text-emerald-400 uppercase tracking-widest">Active Integrasi</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Link 
                                                    href={`/olts/${olt.id}`}
                                                    className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl hover:bg-indigo-500 hover:text-white transition-all shadow-xl"
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                </Link>
                                                <button 
                                                    onClick={() => {
                                                        setEditMode(true);
                                                        setCurrentOlt(olt);
                                                        setShowModal(true);
                                                    }}
                                                    className="p-3 bg-amber-500/10 text-amber-400 rounded-xl hover:bg-amber-500 hover:text-white transition-all shadow-xl"
                                                >
                                                    <Edit3 className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(olt.id)}
                                                    className="p-3 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-xl"
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

            {/* Modal Form */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
                    <div className="glass w-full max-w-2xl rounded-[2.5rem] border border-white/10 shadow-3xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-8 border-b border-white/5 bg-slate-900/50">
                            <h3 className="text-2xl font-black text-white flex items-center gap-3">
                                {editMode ? <Edit3 className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
                                {editMode ? 'Edit Konfigurasi OLT' : 'Integrasi OLT Baru'}
                            </h3>
                            <p className="text-slate-400 text-sm mt-1">Masukkan parameter akses ke perangkat OLT Anda.</p>
                        </div>
                        
                        <form onSubmit={handleSave} className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Nama Perangkat</label>
                                    <input 
                                        type="text" 
                                        required
                                        value={currentOlt.name}
                                        onChange={e => setCurrentOlt({...currentOlt, name: e.target.value})}
                                        className="w-full bg-slate-900/50 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-indigo-500 font-medium"
                                        placeholder="Contoh: OLT-CORE-01"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Tipe OLT</label>
                                    <select 
                                        value={currentOlt.type}
                                        onChange={e => setCurrentOlt({...currentOlt, type: e.target.value})}
                                        className="w-full bg-slate-900/50 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-indigo-500 font-medium appearance-none"
                                    >
                                        <option value="EPON">EPON (1.25G)</option>
                                        <option value="GPON">GPON (2.5G)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">IP Address</label>
                                    <input 
                                        type="text" 
                                        required
                                        value={currentOlt.ip_address}
                                        onChange={e => setCurrentOlt({...currentOlt, ip_address: e.target.value})}
                                        className="w-full bg-slate-900/50 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-indigo-500 font-mono"
                                        placeholder="192.168.1.100"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">SNMP Community</label>
                                    <input 
                                        type="text" 
                                        value={currentOlt.snmp_community}
                                        onChange={e => setCurrentOlt({...currentOlt, snmp_community: e.target.value})}
                                        className="w-full bg-slate-900/50 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-indigo-500 font-medium"
                                        placeholder="public"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Username (Admin)</label>
                                    <input 
                                        type="text" 
                                        value={currentOlt.username}
                                        onChange={e => setCurrentOlt({...currentOlt, username: e.target.value})}
                                        className="w-full bg-slate-900/50 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-indigo-500"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Password</label>
                                    <input 
                                        type="password" 
                                        value={currentOlt.password}
                                        onChange={e => setCurrentOlt({...currentOlt, password: e.target.value})}
                                        className="w-full bg-slate-900/50 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-indigo-500"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button 
                                    type="button" 
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 py-4 rounded-2xl bg-slate-800 text-slate-400 font-bold hover:bg-slate-700 transition-all"
                                >
                                    Batal
                                </button>
                                <button 
                                    type="submit" 
                                    className="flex-2 py-4 rounded-2xl bg-indigo-500 text-white font-black uppercase tracking-widest shadow-xl shadow-indigo-500/20 hover:bg-indigo-400 transition-all"
                                >
                                    Simpan Konfigurasi OLT
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
