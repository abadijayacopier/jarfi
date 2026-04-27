'use client';

import { useState, useEffect } from 'react';
import { 
    Plus, Search, Server, Trash2, Edit3, 
    Wifi, Activity, Globe, Shield, ExternalLink,
    Cpu, Zap, HardDrive, RefreshCw, Save
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
        <div className="space-y-12 animate-in fade-in duration-500 pb-20">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12">
                <div>
                    <h2 className="text-4xl font-black text-primary flex items-center gap-5 tracking-tight">
                        <Zap className="w-12 h-12 text-indigo-600 dark:text-indigo-400 fill-indigo-600/10" />
                        OLT Infrastructure
                    </h2>
                    <p className="text-muted font-medium mt-2 text-sm">Integrasi Core Fiber Optic & Monitoring ONU/ONT Pelanggan.</p>
                </div>
                
                <button 
                    onClick={() => {
                        setEditMode(false);
                        setCurrentOlt({ name: '', ip_address: '', username: 'admin', password: '', telnet_port: 23, snmp_community: 'public', type: 'EPON' });
                        setShowModal(true);
                    }}
                    className="px-10 py-5 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl shadow-2xl shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95 flex items-center gap-3 uppercase tracking-[0.2em] text-[10px]"
                >
                    <Plus className="w-5 h-5" />
                    Register OLT Node
                </button>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="glass p-10 rounded-[3rem] flex items-center gap-10 shadow-2xl border border-(--glass-border) group hover:border-indigo-500/30 transition-all">
                    <div className="w-20 h-20 rounded-3xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border-2 border-indigo-500/20 shadow-inner group-hover:scale-110 transition-all">
                        <Server className="w-10 h-10" />
                    </div>
                    <div>
                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mb-2">Total Deployments</p>
                        <h4 className="text-4xl font-black text-primary tracking-tighter">{olts.length} <span className="text-sm font-bold text-muted ml-1 tracking-widest uppercase">Units</span></h4>
                    </div>
                </div>
                <div className="glass p-10 rounded-[3rem] flex items-center gap-10 shadow-2xl border border-(--glass-border) group hover:border-emerald-500/30 transition-all">
                    <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border-2 border-emerald-500/20 shadow-inner group-hover:scale-110 transition-all">
                        <Activity className="w-10 h-10" />
                    </div>
                    <div>
                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mb-2">Network Health</p>
                        <h4 className="text-4xl font-black text-emerald-600 dark:text-emerald-400 tracking-tighter uppercase">Optimal</h4>
                    </div>
                </div>
                <div className="glass p-10 rounded-[3rem] flex items-center gap-10 shadow-2xl border border-(--glass-border) group hover:border-slate-500/30 transition-all">
                    <div className="w-20 h-20 rounded-3xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500 dark:text-slate-400 border-2 border-(--glass-border) shadow-inner group-hover:scale-110 transition-all">
                        <HardDrive className="w-10 h-10" />
                    </div>
                    <div>
                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mb-2">Driver Status</p>
                        <h4 className="text-3xl font-black text-primary tracking-tighter uppercase">V3 Native</h4>
                    </div>
                </div>
            </div>

            {/* Search & List */}
            <div className="glass rounded-[3.5rem] overflow-hidden shadow-2xl border border-(--glass-border)">
                <div className="p-12 border-b border-(--glass-border) flex flex-col md:flex-row justify-between items-center gap-10 bg-white/5">
                    <h4 className="text-2xl font-black text-primary tracking-tight">Active OLT Hardware</h4>
                    <div className="relative w-full md:w-[450px]">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 w-6 h-6" />
                        <input 
                            type="text" 
                            placeholder="Cari OLT (Nama / IP)..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-100 dark:bg-slate-900/50 border-2 border-(--glass-border) rounded-3xl py-5 pl-16 pr-8 text-primary focus:outline-none focus:border-indigo-500 transition-all font-bold text-sm shadow-inner"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto min-h-[400px]">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-white/2 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] border-b border-(--glass-border)">
                                <th className="px-12 py-10 text-left">Node Architecture</th>
                                <th className="px-12 py-10 text-left">Network Identity</th>
                                <th className="px-12 py-10 text-left">Access Matrix</th>
                                <th className="px-12 py-10 text-left">Session Status</th>
                                <th className="px-12 py-10 text-right">Maintenance Hub</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-(--glass-border)">
                            {filteredOlts.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-12 py-32 text-center text-slate-500 uppercase font-black text-[10px] tracking-[0.4em] animate-pulse">
                                        Scan complete: Zero OLT nodes identified.
                                    </td>
                                </tr>
                            ) : (
                                filteredOlts.map((olt) => (
                                    <tr key={olt.id} className="hover:bg-slate-50 dark:hover:bg-white/2 transition-all group">
                                        <td className="px-12 py-10">
                                            <div className="flex items-center gap-6">
                                                <div className="w-16 h-16 rounded-[1.25rem] bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border-2 border-(--glass-border) shadow-md group-hover:scale-110 group-hover:rotate-3 transition-all">
                                                    <Server className="w-8 h-8" />
                                                </div>
                                                <div>
                                                    <p className="font-black text-primary text-2xl tracking-tighter leading-tight">{olt.name}</p>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400 px-3 py-1 bg-indigo-500/10 rounded-lg border border-indigo-500/20">{olt.type} Node</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-12 py-10">
                                            <div className="flex items-center gap-3 font-mono font-black">
                                                <Globe className="w-5 h-5 text-slate-400" />
                                                {olt.ip_address}
                                            </div>
                                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">Management VLAN ID: 1</p>
                                        </td>
                                        <td className="px-12 py-10">
                                            <div className="space-y-3">
                                                <div className="text-[10px] text-muted font-black flex items-center gap-3 uppercase tracking-[0.2em]">
                                                    <Shield className="w-4 h-4 text-emerald-500" /> {olt.username}
                                                </div>
                                                <div className="text-[10px] text-slate-500 font-mono font-black uppercase tracking-widest bg-slate-100 dark:bg-white/5 px-2 py-1 rounded-md w-fit">SNMP: {olt.snmp_community}</div>
                                            </div>
                                        </td>
                                        <td className="px-12 py-10">
                                            <div className="flex items-center gap-3 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-[1.25rem] w-fit">
                                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                                                <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.3em]">Operational</span>
                                            </div>
                                        </td>
                                        <td className="px-12 py-10 text-right">
                                            <div className="flex justify-end gap-4 opacity-0 group-hover:opacity-100 transition-all translate-x-8 group-hover:translate-x-0">
                                                <Link 
                                                    href={`/olts/${olt.id}`}
                                                    title="Open Diagnostic Suite"
                                                    className="p-4 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all shadow-xl active:scale-90 border-2 border-indigo-500/10"
                                                >
                                                    <ExternalLink className="w-5 h-5" />
                                                </Link>
                                                <button 
                                                    onClick={() => {
                                                        setEditMode(true);
                                                        setCurrentOlt(olt);
                                                        setShowModal(true);
                                                    }}
                                                    title="Modify Configurations"
                                                    className="p-4 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-2xl hover:bg-amber-500 hover:text-white transition-all shadow-xl active:scale-90 border-2 border-amber-500/10"
                                                >
                                                    <Edit3 className="w-5 h-5" />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(olt.id)}
                                                    title="Decommission Hardware"
                                                    className="p-4 bg-red-500/10 text-red-600 dark:text-red-400 rounded-2xl hover:bg-red-600 hover:text-white transition-all shadow-xl active:scale-90 border-2 border-red-500/10"
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

            {/* Modal Form */}
            {showModal && (
                <div className="fixed inset-0 z-60 flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-500">
                    <div className="glass w-full max-w-3xl rounded-[3.5rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] border border-(--glass-border) relative z-10 overflow-hidden animate-in zoom-in-95 duration-500">
                        <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
                        
                        <div className="p-12 border-b border-(--glass-border) bg-slate-100/50 dark:bg-slate-900/50 flex justify-between items-center">
                            <div className="flex items-center gap-6">
                                <div className="p-5 rounded-3xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-2 border-indigo-500/20 shadow-inner">
                                    {editMode ? <Edit3 className="w-8 h-8" /> : <Plus className="w-8 h-8" />}
                                </div>
                                <div>
                                    <h3 className="text-3xl font-black text-primary tracking-tight">
                                        {editMode ? 'Update Node Config' : 'Register OLT Node'}
                                    </h3>
                                    <p className="text-muted text-[10px] font-black uppercase tracking-[0.3em] mt-2 ml-1">Hardware Interface Protocol Suite</p>
                                </div>
                            </div>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-primary transition-all p-3.5 bg-slate-100 dark:bg-slate-800 rounded-2xl active:scale-90 shadow-sm">
                                <RefreshCw className="w-7 h-7 rotate-45" />
                            </button>
                        </div>
                        
                        <form onSubmit={handleSave} className="p-12 space-y-10">
                            <div className="grid grid-cols-2 gap-10">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 ml-1">Friendly Node Name</label>
                                    <input 
                                        type="text" 
                                        required
                                        value={currentOlt.name}
                                        onChange={e => setCurrentOlt({...currentOlt, name: e.target.value})}
                                        className="w-full clean-input text-lg font-black py-5 px-8"
                                        placeholder="e.g. OLT-CORE-EAST"
                                    />
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 ml-1">Hardware Architecture</label>
                                    <div className="relative">
                                        <select 
                                            value={currentOlt.type}
                                            onChange={e => setCurrentOlt({...currentOlt, type: e.target.value})}
                                            className="w-full clean-input appearance-none text-xs font-black uppercase tracking-[0.3em] py-5 px-8 cursor-pointer"
                                        >
                                            <option value="EPON">EPON NATIVE (1.25G)</option>
                                            <option value="GPON">GPON FLEX (2.5G)</option>
                                        </select>
                                        <Server className="absolute right-8 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-500 pointer-events-none" />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-10">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 ml-1">Network Host (IP)</label>
                                    <input 
                                        type="text" 
                                        required
                                        value={currentOlt.ip_address}
                                        onChange={e => setCurrentOlt({...currentOlt, ip_address: e.target.value})}
                                        className="w-full clean-input font-mono font-black text-lg py-5 px-8"
                                        placeholder="10.20.30.40"
                                    />
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 ml-1">SNMP Community Key</label>
                                    <input 
                                        type="text" 
                                        value={currentOlt.snmp_community}
                                        onChange={e => setCurrentOlt({...currentOlt, snmp_community: e.target.value})}
                                        className="w-full clean-input text-lg font-black py-5 px-8"
                                        placeholder="public"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-10">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 ml-1">Management Principal</label>
                                    <input 
                                        type="text" 
                                        value={currentOlt.username}
                                        onChange={e => setCurrentOlt({...currentOlt, username: e.target.value})}
                                        className="w-full clean-input text-lg font-black py-5 px-8"
                                    />
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 ml-1">Authentication Secret</label>
                                    <input 
                                        type="password" 
                                        value={currentOlt.password}
                                        onChange={e => setCurrentOlt({...currentOlt, password: e.target.value})}
                                        className="w-full clean-input text-lg font-black py-5 px-8"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-8 pt-10 border-t border-(--glass-border)">
                                <button 
                                    type="button" 
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 py-5 rounded-4xl text-slate-500 font-black uppercase tracking-[0.3em] text-[10px] hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
                                >
                                    Abort
                                </button>
                                <button 
                                    type="submit" 
                                    className="flex-[1.5] py-5 rounded-4xl bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-[0.3em] text-[10px] shadow-2xl shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-4"
                                >
                                    <Save className="w-5 h-5" />
                                    Commit Hardware Registration
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
