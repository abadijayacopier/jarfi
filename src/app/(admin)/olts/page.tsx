'use client';

import { useState, useEffect } from 'react';
import { 
    Plus, Search, Server, Trash2, Edit3, 
    Wifi, Activity, Globe, Shield, ExternalLink,
    Cpu, Zap, HardDrive, RefreshCw, Save, ChevronLeft, ChevronRight, X
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
                Swal.fire({ icon: 'success', title: 'Tindakan Berhasil', text: 'Node infrastruktur telah diperbarui.', background: '#0f172a', color: '#fff' });
                setShowModal(false);
                fetchOlts();
            }
        } catch (e) { }
        finally { setLoading(false); }
    };

    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: 'Hentikan Node OLT?',
            text: "KRITIS: Integrasi ini akan dihapus secara permanen dari sistem.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Ya, Hentikan Node',
            cancelButtonText: 'Batal',
            background: '#0f172a',
            color: '#fff'
        });

        if (result.isConfirmed) {
            setLoading(true);
            try {
                const res = await fetch(`/api/olts?id=${id}`, { method: 'DELETE' });
                if (res.ok) {
                    Swal.fire({ icon: 'success', title: 'Node Dihentikan', text: 'Catatan infrastruktur telah dihapus.', background: '#0f172a', color: '#fff' });
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
        <div className="animate-in fade-in duration-500 pb-20 space-y-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-6 border-b border-(--glass-border) pb-10">
                <div className="space-y-2">
                    <h3 className="text-4xl font-bold text-primary flex items-center gap-5 tracking-tight">
                        <Zap className="w-10 h-10 text-accent fill-accent/5" />
                        Matriks OLT
                    </h3>
                    <p className="text-muted font-medium text-lg">Manajemen Core Fiber & Inteligensia Distribusi.</p>
                </div>
                <button 
                    onClick={() => {
                        setEditMode(false);
                        setCurrentOlt({ name: '', ip_address: '', username: 'admin', password: '', telnet_port: 23, snmp_community: 'public', type: 'EPON' });
                        setShowModal(true);
                    }}
                    className="bg-accent hover:bg-accent/90 text-white font-bold py-3.5 px-8 rounded-2xl transition-all shadow-lg active:scale-95 flex items-center gap-3 uppercase tracking-widest text-[10px]"
                >
                    <Plus className="w-4 h-4" /> Daftarkan Node
                </button>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                <div className="glass p-10 rounded-[48px] flex items-center gap-10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/10 bg-linear-to-br from-white/5 to-transparent group hover:border-accent/40 transition-all duration-700 relative overflow-hidden">
                    <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-accent/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                    <div className="w-20 h-20 rounded-[32px] bg-accent/10 flex items-center justify-center text-accent border border-accent/20 shadow-2xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 relative z-10">
                        <Server className="w-10 h-10" />
                    </div>
                    <div className="relative z-10">
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mb-3 opacity-60">Node Terpasang</p>
                        <h4 className="text-5xl font-black text-white tracking-tighter tabular-nums">{olts.length}</h4>
                    </div>
                </div>
                
                <div className="glass p-10 rounded-[48px] flex items-center gap-10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/10 bg-linear-to-br from-white/5 to-transparent group hover:border-emerald-500/40 transition-all duration-700 relative overflow-hidden">
                    <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-emerald-500/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                    <div className="w-20 h-20 rounded-[32px] bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20 shadow-2xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 relative z-10">
                        <Activity className="w-10 h-10" />
                    </div>
                    <div className="relative z-10">
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mb-3 opacity-60">Status Jaringan</p>
                        <h4 className="text-3xl font-black text-emerald-400 tracking-tight uppercase">Normal</h4>
                    </div>
                </div>

                <div className="glass p-10 rounded-[48px] flex items-center gap-10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/10 bg-linear-to-br from-white/5 to-transparent group hover:border-accent/40 transition-all duration-700 relative overflow-hidden">
                    <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-accent/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                    <div className="w-20 h-20 rounded-[32px] bg-white/5 flex items-center justify-center text-slate-400 border border-white/10 shadow-2xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 relative z-10">
                        <HardDrive className="w-10 h-10" />
                    </div>
                    <div className="relative z-10">
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mb-3 opacity-60">Fabric Inti</p>
                        <h4 className="text-2xl font-black text-white/80 tracking-tight uppercase leading-none">Serat Hibrida</h4>
                    </div>
                </div>
            </div>

            {/* List Section */}
            <div className="glass rounded-4xl overflow-hidden shadow-xl bg-white/2 border border-(--glass-border)">
                <div className="p-10 border-b border-(--glass-border) flex flex-col md:flex-row justify-between items-center gap-8 bg-white/2">
                    <div>
                        <h4 className="text-2xl font-bold text-primary tracking-tight">Inventaris Inti</h4>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Terminal Infrastruktur</p>
                    </div>
                    <div className="relative w-full md:w-[400px]">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                        <input 
                            type="text" 
                            placeholder="Saring identitas node..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="clean-input w-full py-4 pl-14 pr-6 text-sm font-bold"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto min-h-[400px] custom-scrollbar">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-white/1 text-[9px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5">
                                <th className="px-10 py-8 text-left">Matriks Node</th>
                                <th className="px-10 py-8 text-left">ID Jaringan</th>
                                <th className="px-10 py-8 text-left">Vektor Akses</th>
                                <th className="px-10 py-8 text-left">Status Link</th>
                                <th className="px-10 py-8 text-right">Orkestrasi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredOlts.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-32 text-center text-slate-500 uppercase font-bold text-[10px] tracking-widest opacity-40">
                                        Tidak ada node infrastruktur aktif yang teridentifikasi.
                                    </td>
                                </tr>
                            ) : (
                                filteredOlts.map((olt) => (
                                    <tr key={olt.id} className="hover:bg-white/2 transition-all group">
                                        <td className="px-10 py-8">
                                            <div className="flex items-center gap-6">
                                                <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-accent border border-white/5 shadow-inner group-hover:scale-110 transition-all">
                                                    <Server className="w-7 h-7" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-primary text-xl tracking-tight leading-tight">{olt.name}</p>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <span className="text-[9px] font-bold uppercase tracking-widest text-accent px-3 py-1 bg-accent/5 rounded-lg border border-accent/10">{olt.type} Fabric</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8">
                                            <div className="flex items-center gap-3 font-mono font-bold text-sm text-primary/70">
                                                <Globe className="w-3.5 h-3.5 text-accent/30" />
                                                {olt.ip_address}
                                            </div>
                                            <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest mt-1 opacity-40">VLAN 1 Protocol</p>
                                        </td>
                                        <td className="px-10 py-8">
                                            <div className="space-y-3">
                                                <div className="text-[10px] text-muted font-bold flex items-center gap-3 uppercase tracking-widest">
                                                    <Shield className="w-4 h-4 text-accent/50" /> {olt.username}
                                                </div>
                                                <div className="text-[9px] text-slate-600 font-mono font-bold uppercase tracking-widest bg-white/2 px-3 py-1 rounded-lg border border-white/5 w-fit">SNMP: {olt.snmp_community}</div>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8">
                                            <div className="flex items-center gap-4 px-4 py-2 bg-accent/5 border border-accent/10 rounded-xl w-fit">
                                                <div className="w-2 h-2 rounded-full bg-accent animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.4)]"></div>
                                                <span className="text-[9px] font-bold text-accent uppercase tracking-widest">Normal</span>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8 text-right">
                                            <div className="flex justify-end gap-3 opacity-40 group-hover:opacity-100 transition-opacity">
                                                <Link 
                                                    href={`/olts/${olt.id}`}
                                                    className="p-3 bg-white/2 text-slate-400 hover:bg-accent/10 hover:text-accent rounded-xl border border-white/5 transition-all"
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                </Link>
                                                <button 
                                                    onClick={() => {
                                                        setEditMode(true);
                                                        setCurrentOlt(olt);
                                                        setShowModal(true);
                                                    }}
                                                    className="p-3 bg-white/2 text-slate-400 hover:bg-accent/10 hover:text-accent rounded-xl border border-white/5 transition-all"
                                                >
                                                    <Edit3 className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(olt.id)}
                                                    className="p-3 bg-white/2 text-slate-400 hover:bg-red-500/10 hover:text-red-500 rounded-xl border border-white/5 transition-all"
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
                <div className="fixed inset-0 z-1000 flex items-center justify-center p-4 sm:p-8 bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-300">
                    <div className="bg-slate-900 w-full max-w-4xl rounded-4xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[95vh] animate-in zoom-in-95 duration-300">
                        <div className="p-10 border-b border-white/5 bg-white/2 flex justify-between items-center">
                            <div className="flex items-center gap-6">
                                <div className="p-5 rounded-2xl bg-accent/5 text-accent border border-accent/10">
                                    {editMode ? <Edit3 className="w-8 h-8" /> : <Plus className="w-8 h-8" />}
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-white tracking-tight">
                                        {editMode ? 'Ubah Vektor Perangkat Keras' : 'Daftarkan Node OLT'}
                                    </h3>
                                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-2 ml-1">Suite Konfigurasi Antarmuka Perangkat Keras</p>
                                </div>
                            </div>
                            <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-white transition-colors p-3 bg-white/5 rounded-xl">
                                <X className="w-7 h-7" />
                            </button>
                        </div>
                        
                        <form onSubmit={handleSave} className="p-10 space-y-10 bg-slate-900/50 overflow-y-auto custom-scrollbar">
                            <div className="grid grid-cols-2 gap-10">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Alias Node</label>
                                    <input 
                                        type="text" required
                                        value={currentOlt.name}
                                        onChange={e => setCurrentOlt({...currentOlt, name: e.target.value})}
                                        className="w-full clean-input text-lg font-bold py-5 px-8"
                                        placeholder="OLT-CORE-UTAMA"
                                    />
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Arsitektur Fabric</label>
                                    <div className="relative">
                                        <select 
                                            value={currentOlt.type}
                                            onChange={e => setCurrentOlt({...currentOlt, type: e.target.value})}
                                            className="w-full clean-input appearance-none text-xs font-bold uppercase tracking-widest py-5 px-8 cursor-pointer"
                                        >
                                            <option value="EPON">EPON (1.25G)</option>
                                            <option value="GPON">GPON (2.5G)</option>
                                        </select>
                                        <Server className="absolute right-8 top-1/2 -translate-y-1/2 w-5 h-5 text-accent/50 pointer-events-none" />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-10">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Matriks IP Host</label>
                                    <input 
                                        type="text" required
                                        value={currentOlt.ip_address}
                                        onChange={e => setCurrentOlt({...currentOlt, ip_address: e.target.value})}
                                        className="w-full clean-input font-mono font-bold text-lg py-5 px-8"
                                        placeholder="192.168.x.x"
                                    />
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Komunitas SNMP</label>
                                    <input 
                                        type="text" 
                                        value={currentOlt.snmp_community}
                                        onChange={e => setCurrentOlt({...currentOlt, snmp_community: e.target.value})}
                                        className="w-full clean-input text-lg font-bold py-5 px-8"
                                        placeholder="public"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-10">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Prinsipal Otentikasi</label>
                                    <input 
                                        type="text" 
                                        value={currentOlt.username}
                                        onChange={e => setCurrentOlt({...currentOlt, username: e.target.value})}
                                        className="w-full clean-input text-lg font-bold py-5 px-8"
                                    />
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Token Keamanan</label>
                                    <input 
                                        type="password" 
                                        value={currentOlt.password}
                                        onChange={e => setCurrentOlt({...currentOlt, password: e.target.value})}
                                        className="w-full clean-input text-lg font-bold py-5 px-8"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-8 pt-10 border-t border-white/5">
                                <button 
                                    type="button" 
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 py-4 rounded-3xl bg-white/5 text-slate-500 font-bold uppercase tracking-widest text-[10px] hover:bg-white/10 transition-all"
                                >
                                    Batal
                                </button>
                                <button 
                                    type="submit" 
                                    className="flex-[1.5] py-4 rounded-3xl bg-accent hover:bg-accent/90 text-white font-bold uppercase tracking-widest text-[10px] shadow-xl transition-all active:scale-95 flex items-center justify-center gap-4"
                                >
                                    <Save className="w-5 h-5" />
                                    Simpan Integrasi Perangkat Keras
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
