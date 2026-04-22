'use client';

import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { Ticket, PlusCircle, Trash2, ArrowLeft, Zap, Clock, Users, Save } from 'lucide-react';
import Link from 'next/link';

export default function HotspotProfilesPage() {
    const [routers, setRouters] = useState([]);
    const [selectedRouter, setSelectedRouter] = useState('');
    const [profiles, setProfiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        rateLimit: '1M/1M',
        sessionTimeout: '01:00:00',
        sharedUsers: 1
    });

    useEffect(() => {
        fetchRouters();
    }, []);

    useEffect(() => {
        if (selectedRouter) fetchProfiles();
    }, [selectedRouter]);

    const fetchRouters = async () => {
        try {
            const res = await fetch('/api/routers');
            const data = await res.json();
            if (res.ok) {
                setRouters(data.routers);
                if (data.routers.length > 0) setSelectedRouter(data.routers[0].id.toString());
            }
        } catch (err) { console.error(err); }
    };

    const fetchProfiles = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/mikrotik/profiles?routerId=${selectedRouter}`);
            const data = await res.json();
            if (res.ok) setProfiles(data.profiles);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const handleCreateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/mikrotik/profiles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, routerId: selectedRouter })
            });
            if (res.ok) {
                Swal.fire({ icon: 'success', title: 'Profil Dibuat!', background: '#1e293b', color: '#fff' });
                setShowAddForm(false);
                fetchProfiles();
            } else {
                const data = await res.json();
                Swal.fire({ icon: 'error', title: 'Gagal!', text: data.error, background: '#1e293b', color: '#fff' });
            }
        } catch (err) { console.error(err); }
    };

    const handleDeleteProfile = async (profileId: string, name: string) => {
        if (name === 'default') return Swal.fire({ icon: 'error', title: 'Ops!', text: 'Profil default tidak boleh dihapus.', background: '#1e293b', color: '#fff' });

        const result = await Swal.fire({
            title: 'Hapus Profil?',
            text: `Profil "${name}" akan dihapus dari Mikrotik.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            background: '#1e293b',
            color: '#fff'
        });

        if (result.isConfirmed) {
            try {
                const res = await fetch(`/api/mikrotik/profiles?routerId=${selectedRouter}&profileId=${profileId}`, { method: 'DELETE' });
                if (res.ok) {
                    fetchProfiles();
                    Swal.fire({ icon: 'success', title: 'Terhapus!', background: '#1e293b', color: '#fff' });
                }
            } catch (err) { console.error(err); }
        }
    };

    return (
        <div className="animate-in fade-in duration-500 pb-10">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <Link href="/vouchers" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-2 text-sm font-bold uppercase tracking-widest">
                        <ArrowLeft className="w-4 h-4" /> Kembali ke Vouchers
                    </Link>
                    <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-4">
                        <Ticket className="text-indigo-500 w-10 h-10" /> Profil Hotspot
                    </h1>
                    <p className="text-slate-400 mt-1 font-medium">Manajemen paket durasi dan kecepatan internet</p>
                </div>
                <button 
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="bg-linear-to-r from-indigo-600 to-blue-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-3 hover:scale-105 transition-all shadow-lg shadow-indigo-500/20"
                >
                    <PlusCircle className="w-5 h-5" /> Buat Profil Baru
                </button>
            </div>

            {/* Router Selector */}
            <div className="glass p-6 rounded-3xl mb-8 border border-white/5 flex items-center gap-6">
                <div className="flex items-center gap-3 text-slate-400">
                    <Zap className="w-5 h-5 text-yellow-400" />
                    <span className="font-bold uppercase text-xs tracking-widest">Pilih Router:</span>
                </div>
                <select 
                    value={selectedRouter}
                    onChange={(e) => setSelectedRouter(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-white font-bold focus:outline-none focus:border-indigo-500"
                >
                    {routers.map((r: any) => (
                        <option key={r.id} value={r.id}>{r.name} ({r.ip_address})</option>
                    ))}
                </select>
            </div>

            {showAddForm && (
                <div className="glass p-8 rounded-4xl mb-8 border border-indigo-500/30 animate-in slide-in-from-top duration-300 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
                        <PlusCircle className="w-40 h-40 text-indigo-500" />
                    </div>
                    <h3 className="text-2xl font-black text-white mb-8 flex items-center gap-3">
                        <PlusCircle className="text-indigo-400" /> Buat Paket Baru
                    </h3>
                    <form onSubmit={handleCreateProfile} className="grid grid-cols-1 md:grid-cols-4 gap-6 relative z-10">
                        <div>
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Nama Profil</label>
                            <input 
                                type="text" required 
                                value={formData.name} 
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                                className="w-full bg-slate-900 border border-slate-700 rounded-2xl p-4 text-white focus:outline-none focus:border-indigo-500 transition-all" 
                                placeholder="Misal: 1_JAM_HEBAT"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Limit Kecepatan</label>
                            <input 
                                type="text" required 
                                value={formData.rateLimit} 
                                onChange={(e) => setFormData({ ...formData, rateLimit: e.target.value })} 
                                className="w-full bg-slate-900 border border-slate-700 rounded-2xl p-4 text-white focus:outline-none focus:border-indigo-500 transition-all font-mono" 
                                placeholder="RX/TX (Misal: 1M/1M)"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Durasi (Timeout)</label>
                            <input 
                                type="text" required 
                                value={formData.sessionTimeout} 
                                onChange={(e) => setFormData({ ...formData, sessionTimeout: e.target.value })} 
                                className="w-full bg-slate-900 border border-slate-700 rounded-2xl p-4 text-white focus:outline-none focus:border-indigo-500 transition-all font-mono" 
                                placeholder="HH:MM:SS (Misal: 01:00:00)"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Shared Users</label>
                            <input 
                                type="number" required 
                                value={formData.sharedUsers} 
                                onChange={(e) => setFormData({ ...formData, sharedUsers: parseInt(e.target.value) })} 
                                className="w-full bg-slate-900 border border-slate-700 rounded-2xl p-4 text-white focus:outline-none focus:border-indigo-500 transition-all"
                            />
                        </div>
                        <div className="md:col-span-4 flex justify-end gap-4 mt-4">
                            <button type="button" onClick={() => setShowAddForm(false)} className="px-8 py-4 rounded-2xl font-bold text-slate-400 hover:text-white transition-colors">Batal</button>
                            <button type="submit" className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black flex items-center gap-3 hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/20">
                                <Save className="w-5 h-5" /> Simpan Profil
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="glass rounded-4xl border border-white/10 overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/5 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-white/10">
                                <th className="p-6">Nama Profil</th>
                                <th className="p-6"><div className="flex items-center gap-2"><Zap className="w-3 h-3" /> Rate Limit</div></th>
                                <th className="p-6"><div className="flex items-center gap-2"><Clock className="w-3 h-3" /> Session Timeout</div></th>
                                <th className="p-6"><div className="flex items-center gap-2"><Users className="w-3 h-3" /> Shared</div></th>
                                <th className="p-6 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr><td colSpan={5} className="p-20 text-center text-slate-500 font-bold uppercase tracking-widest animate-pulse">Menarik data profil dari Mikrotik...</td></tr>
                            ) : profiles.length === 0 ? (
                                <tr><td colSpan={5} className="p-20 text-center text-slate-500">Tidak ada profil ditemukan.</td></tr>
                            ) : (
                                profiles.map((p: any) => (
                                    <tr key={p['.id']} className="hover:bg-white/5 transition-all group">
                                        <td className="p-6">
                                            <span className="text-lg font-black text-white group-hover:text-indigo-400 transition-colors">{p.name}</span>
                                        </td>
                                        <td className="p-6 font-mono text-slate-400 font-bold">{p['rate-limit'] || '-'}</td>
                                        <td className="p-6 font-mono text-slate-400 font-bold">{p['session-timeout'] || '-'}</td>
                                        <td className="p-6 text-slate-400 font-bold">{p['shared-users'] || '1'}</td>
                                        <td className="p-6">
                                            <div className="flex justify-center">
                                                <button 
                                                    onClick={() => handleDeleteProfile(p['.id'], p.name)}
                                                    className={`p-3 rounded-xl transition-all ${p.name === 'default' ? 'opacity-20 cursor-not-allowed text-slate-500' : 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20'}`}
                                                    disabled={p.name === 'default'}
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
        </div>
    );
}
