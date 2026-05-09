'use client';

import { useState, useEffect } from 'react';
import { 
    Plus, Search, Server, Trash2, Edit3, 
    Wifi, Activity, Globe, Shield, ExternalLink,
    Cpu, Zap, HardDrive, RefreshCw, Save, ChevronLeft, ChevronRight, X
} from 'lucide-react';
import Swal from 'sweetalert2';
import Link from 'next/link';

import { 
    ResponsiveContainer, AreaChart, Area
} from 'recharts';

const mockSparkline = [
    { v: 40 }, { v: 45 }, { v: 42 }, { v: 48 }, { v: 46 }, { v: 52 }, { v: 50 }
];

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
        <div className="animate-in fade-in duration-700 pb-24 space-y-12">
            {/* Ambient background ornament */}
            <div className="fixed top-1/4 -right-20 w-96 h-96 bg-accent/5 rounded-full blur-[120px] pointer-events-none z-0"></div>
            
            {/* Header Section */}
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-10 mb-16 border-b border-glass-border dark:border-white/5 pb-12">
                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-1 bg-accent rounded-full"></div>
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-accent">Infrastruktur Inti v4.0</span>
                    </div>
                    <h3 className="text-4xl md:text-5xl font-black text-primary flex items-center gap-6 tracking-tighter">
                        <div className="relative">
                            <div className="absolute inset-0 bg-accent rounded-2xl blur-lg opacity-20"></div>
                            <Zap className="w-12 h-12 text-accent relative z-10" />
                        </div>
                        Pusat Kendali OLT
                    </h3>
                    <p className="text-sm font-bold text-muted uppercase tracking-widest opacity-60">Manajemen Distribusi Fiber & Konfigurasi OLT</p>
                </div>
                <button 
                    onClick={() => {
                        setEditMode(false);
                        setCurrentOlt({ name: '', ip_address: '', username: 'admin', password: '', telnet_port: 23, snmp_community: 'public', type: 'EPON' });
                        setShowModal(true);
                    }}
                    className="w-full md:w-auto bg-linear-to-r from-accent to-emerald-600 hover:from-emerald-500 hover:to-emerald-600 text-white font-black py-5 px-10 rounded-2xl transition-all shadow-[0_20px_40px_rgba(16,185,129,0.3)] active:scale-95 flex items-center justify-center gap-3 uppercase tracking-[0.2em] text-[11px] border border-white/10"
                >
                    <Plus className="w-5 h-5" /> Hubungkan OLT Baru
                </button>
            </div>

            {/* Stats Summary - Pro Max Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
                <div className="group bg-surface dark:bg-[#0f172a]/80 backdrop-blur-3xl p-10 rounded-[48px] border border-glass-border dark:border-white/5 hover:border-accent/40 transition-all duration-700 relative overflow-hidden">
                    <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-accent/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                    <div className="flex items-center justify-between gap-8">
                        <div className="flex items-center gap-8">
                            <div className="w-20 h-20 rounded-[32px] bg-accent/10 flex items-center justify-center text-accent border border-accent/20 shadow-2xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 relative z-10">
                                <Server className="w-10 h-10" />
                            </div>
                            <div className="relative z-10">
                                <p className="text-[10px] text-muted font-black uppercase tracking-[0.3em] mb-2 opacity-60">OLT Terhubung</p>
                                <h4 className="text-5xl font-black text-primary dark:text-white tracking-tighter tabular-nums leading-none">{olts.length}</h4>
                            </div>
                        </div>
                        <div className="w-24 h-14 opacity-20 group-hover:opacity-100 transition-all duration-700">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={mockSparkline}>
                                    <Area type="monotone" dataKey="v" stroke="#6366f1" fill="#6366f1" fillOpacity={0.1} strokeWidth={2} isAnimationActive={false} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
                
                <div className="group bg-surface dark:bg-[#0f172a]/80 backdrop-blur-3xl p-10 rounded-[48px] border border-glass-border dark:border-white/5 hover:border-emerald-500/40 transition-all duration-700 relative overflow-hidden">
                    <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-emerald-500/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                    <div className="flex items-center justify-between gap-8">
                        <div className="flex items-center gap-8">
                            <div className="w-20 h-20 rounded-[32px] bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20 shadow-2xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 relative z-10">
                                <Activity className="w-10 h-10" />
                            </div>
                            <div className="relative z-10">
                                <p className="text-[10px] text-muted font-black uppercase tracking-[0.3em] mb-2 opacity-60">Status Jaringan</p>
                                <h4 className="text-3xl font-black text-emerald-500 tracking-tight uppercase leading-none">Normal</h4>
                            </div>
                        </div>
                        <div className="w-24 h-14 opacity-20 group-hover:opacity-100 transition-all duration-700">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={mockSparkline}>
                                    <Area type="monotone" dataKey="v" stroke="#10b981" fill="#10b981" fillOpacity={0.1} strokeWidth={2} isAnimationActive={false} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                <div className="group bg-surface dark:bg-[#0f172a]/80 backdrop-blur-3xl p-10 rounded-[48px] border border-glass-border dark:border-white/5 hover:border-indigo-500/40 transition-all duration-700 relative overflow-hidden">
                    <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-indigo-500/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                    <div className="flex items-center justify-between gap-8">
                        <div className="flex items-center gap-8">
                            <div className="w-20 h-20 rounded-[32px] bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20 shadow-2xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 relative z-10">
                                <Cpu className="w-10 h-10" />
                            </div>
                            <div className="relative z-10">
                                <p className="text-[10px] text-muted font-black uppercase tracking-[0.3em] mb-2 opacity-60">Arsitektur Fabric</p>
                                <h4 className="text-2xl font-black text-primary dark:text-white/80 tracking-tight uppercase leading-none">GPON/EPON</h4>
                            </div>
                        </div>
                        <div className="w-24 h-14 opacity-20 group-hover:opacity-100 transition-all duration-700">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={mockSparkline}>
                                    <Area type="monotone" dataKey="v" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.1} strokeWidth={2} isAnimationActive={false} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>

            {/* List Section */}
            <div className="space-y-8 relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-8 px-2">
                    <div className="space-y-1">
                        <h4 className="text-2xl font-black text-primary dark:text-white uppercase tracking-tighter">Terminal Infrastruktur</h4>
                        <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full bg-accent animate-pulse"></div>
                            <p className="text-[10px] font-black text-muted uppercase tracking-[0.4em]">Hardware Link Synchronized</p>
                        </div>
                    </div>
                    <div className="relative w-full md:w-[450px] group">
                        <div className="absolute inset-0 bg-accent/5 rounded-3xl blur-xl group-focus-within:bg-accent/10 transition-all"></div>
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted group-focus-within:text-accent transition-colors" />
                        <input 
                            type="text" 
                            placeholder="Saring identitas node..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-surface dark:bg-white/5 border border-glass-border dark:border-white/10 rounded-[32px] py-5 pl-16 pr-8 text-sm font-black text-primary dark:text-white focus:outline-none focus:border-accent/40 transition-all placeholder:text-muted placeholder:uppercase placeholder:tracking-widest backdrop-blur-xl shadow-2xl"
                        />
                    </div>
                </div>

                {/* Mobile Grid View (Large Cards) */}
                <div className="grid grid-cols-1 md:hidden gap-8">
                    {loading ? (
                        <div className="py-20 flex flex-col items-center justify-center gap-6 animate-pulse">
                            <RefreshCw className="w-12 h-12 text-accent animate-spin" />
                            <span className="text-[11px] font-black text-muted uppercase tracking-[0.5em]">Scanning Fiber Matrix...</span>
                        </div>
                    ) : filteredOlts.length === 0 ? (
                        <div className="py-20 flex flex-col items-center justify-center gap-6 bg-white/2 rounded-[48px] border border-dashed border-glass-border dark:border-white/10">
                            <Server className="w-12 h-12 text-muted opacity-20" />
                            <span className="text-[10px] font-black text-muted uppercase tracking-[0.5em]">Node Tidak Terdeteksi</span>
                        </div>
                    ) : (
                        filteredOlts.map((olt) => (
                            <div key={olt.id} className="group relative bg-surface dark:bg-[#0f172a]/80 backdrop-blur-3xl p-10 rounded-[48px] border border-glass-border dark:border-white/5 hover:border-accent/40 transition-all duration-500 shadow-2xl active:scale-95 overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                                
                                <div className="flex justify-between items-start mb-10">
                                    <div className="w-20 h-20 rounded-[28px] bg-linear-to-br from-white/5 to-white/2 border border-glass-border dark:border-white/10 flex items-center justify-center text-accent shadow-2xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                                        <Server className="w-10 h-10" />
                                    </div>
                                    <div className="flex flex-col items-end gap-3">
                                        <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-2.5">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                                            <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Normal</span>
                                        </div>
                                        <div className="px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
                                            <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">{olt.type} Node</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3 mb-10">
                                    <h4 className="text-3xl font-black text-primary dark:text-white tracking-tighter uppercase leading-none">{olt.name}</h4>
                                    <p className="text-[10px] font-black text-accent uppercase tracking-[0.3em] underline underline-offset-8 decoration-accent/30">{olt.ip_address}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4 py-8 border-y border-glass-border dark:border-white/5 mb-10">
                                    <div className="space-y-1.5">
                                        <p className="text-[9px] font-black text-muted uppercase tracking-widest">Prinsipal</p>
                                        <p className="text-sm font-bold text-primary dark:text-white flex items-center gap-2">
                                            <Shield className="w-3.5 h-3.5 text-accent/50" /> {olt.username}
                                        </p>
                                    </div>
                                    <div className="space-y-1.5">
                                        <p className="text-[9px] font-black text-muted uppercase tracking-widest">SNMP Comm</p>
                                        <p className="text-sm font-mono font-bold text-primary dark:text-white">{olt.snmp_community}</p>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <Link 
                                        href={`/olts/${olt.id}`}
                                        className="flex-1 py-5 rounded-3xl bg-white/5 hover:bg-white/10 text-primary dark:text-white border border-glass-border dark:border-white/10 flex items-center justify-center gap-3 transition-all active:scale-95"
                                    >
                                        <ExternalLink className="w-5 h-5" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Panel</span>
                                    </Link>
                                    <button 
                                        onClick={() => {
                                            setEditMode(true);
                                            setCurrentOlt(olt);
                                            setShowModal(true);
                                        }}
                                        className="w-16 h-16 rounded-3xl bg-white/5 hover:bg-accent/10 hover:text-accent border border-glass-border dark:border-white/10 flex items-center justify-center transition-all active:scale-95"
                                    >
                                        <Edit3 className="w-5 h-5" />
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(olt.id)}
                                        className="w-16 h-16 rounded-3xl bg-red-500/5 hover:bg-red-500/10 text-red-500 border border-red-500/10 flex items-center justify-center transition-all active:scale-95"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block bg-surface dark:bg-[#0f172a]/80 backdrop-blur-3xl rounded-[48px] border border-glass-border dark:border-white/5 shadow-2xl overflow-hidden">
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse whitespace-nowrap">
                            <thead>
                                <tr className="bg-white/2 text-[10px] font-black text-muted uppercase tracking-[0.4em] border-b border-glass-border dark:border-white/5">
                                    <th className="px-10 py-10">Node Perangkat Keras</th>
                                    <th className="px-10 py-10">Vektor Jaringan</th>
                                    <th className="px-10 py-10">Profil Autentikasi</th>
                                    <th className="px-10 py-10">Status Link</th>
                                    <th className="px-10 py-10 text-right">Orkestrasi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-glass-border dark:divide-white/5">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="py-40 text-center">
                                            <div className="w-10 h-10 border-4 border-accent/20 border-t-accent rounded-full animate-spin mx-auto mb-6 opacity-40"></div>
                                            <span className="text-[11px] font-black text-muted uppercase tracking-[0.5em]">Sinkronisasi Gateway...</span>
                                        </td>
                                    </tr>
                                ) : olts.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-40 text-center text-slate-500 font-black uppercase tracking-widest opacity-40 text-[10px]">Tidak ada node gateway yang terdaftar.</td>
                                    </tr>
                                ) : (
                                    filteredOlts.map((olt) => (
                                        <tr key={olt.id} className="hover:bg-white/2 transition-all group">
                                            <td className="px-10 py-10">
                                                <div className="flex items-center gap-6">
                                                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-accent border border-white/5 shadow-inner group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                                                        <Cpu className="w-8 h-8" />
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-primary dark:text-white text-xl tracking-tighter leading-none mb-2 uppercase">{olt.name}</p>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[9px] font-black uppercase tracking-widest text-accent px-3 py-1 bg-accent/10 rounded-lg border border-accent/20">{olt.type} Fabric</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-10 py-10">
                                                <div className="flex items-center gap-3 font-mono font-black text-sm text-primary/80 dark:text-white/80">
                                                    <Globe className="w-4 h-4 text-accent/40" />
                                                    {olt.ip_address}
                                                </div>
                                                <p className="text-[9px] text-muted font-black uppercase tracking-widest mt-2 opacity-40">Core Protocol v1</p>
                                            </td>
                                            <td className="px-10 py-10">
                                                <div className="space-y-3">
                                                    <div className="text-[10px] text-primary dark:text-white font-black flex items-center gap-3 uppercase tracking-widest">
                                                        <Shield className="w-4 h-4 text-accent/50" /> {olt.username}
                                                    </div>
                                                    <div className="text-[9px] text-muted font-mono font-black uppercase tracking-widest bg-white/5 px-3 py-1 rounded-lg border border-white/5 w-fit">SNMP: {olt.snmp_community}</div>
                                                </div>
                                            </td>
                                            <td className="px-10 py-10">
                                                <div className="flex items-center gap-4 px-5 py-2.5 bg-accent/5 border border-accent/20 rounded-2xl w-fit">
                                                    <div className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.5)]"></div>
                                                    <span className="text-[10px] font-black text-accent uppercase tracking-[0.2em]">Normal</span>
                                                </div>
                                            </td>
                                            <td className="px-10 py-10 text-right">
                                                <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                                    <Link 
                                                        href={`/olts/${olt.id}`}
                                                        className="p-4 bg-white/5 text-muted hover:bg-accent/10 hover:text-accent rounded-2xl border border-white/5 transition-all shadow-xl"
                                                    >
                                                        <ExternalLink className="w-5 h-5" />
                                                    </Link>
                                                    <button 
                                                        onClick={() => {
                                                            setEditMode(true);
                                                            setCurrentOlt(olt);
                                                            setShowModal(true);
                                                        }}
                                                        className="p-4 bg-white/5 text-muted hover:bg-accent/10 hover:text-accent rounded-2xl border border-white/5 transition-all shadow-xl"
                                                    >
                                                        <Edit3 className="w-5 h-5" />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDelete(olt.id)}
                                                        className="p-4 bg-white/5 text-muted hover:bg-red-500/10 hover:text-red-500 rounded-2xl border border-white/5 transition-all shadow-xl"
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

            {/* Modal Form - Pro Max Ultra */}
            {showModal && (
                <div className="fixed inset-0 z-9999 flex items-center justify-center p-4 sm:p-10 bg-slate-950/95 backdrop-blur-2xl animate-in fade-in duration-500">
                    <div className="bg-surface dark:bg-[#0f172a] w-full max-w-4xl rounded-[64px] border border-glass-border dark:border-white/15 shadow-[0_60px_120px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col max-h-[90vh] relative animate-in zoom-in-95 duration-500">
                        <div className="absolute top-0 left-0 right-0 h-2 bg-linear-to-r from-transparent via-accent to-transparent"></div>
                        
                        <div className="p-12 border-b border-glass-border dark:border-white/10 flex justify-between items-center bg-linear-to-b from-white/5 to-transparent">
                            <div className="flex items-center gap-8">
                                <div className="w-20 h-20 rounded-[32px] bg-accent/10 flex items-center justify-center text-accent border border-accent/20 shadow-inner">
                                    {editMode ? <Edit3 className="w-10 h-10" /> : <Plus className="w-10 h-10" />}
                                </div>
                                <div>
                                    <h3 className="text-3xl font-black text-primary dark:text-white tracking-tighter uppercase leading-none mb-3">
                                        {editMode ? 'Ubah Pengaturan OLT' : 'Hubungkan OLT Baru'}
                                    </h3>
                                    <p className="text-accent text-[11px] font-black uppercase tracking-[0.4em] opacity-80 underline underline-offset-8 decoration-accent/30">Infrastruktur Fiber Dunia WiFi</p>
                                </div>
                            </div>
                            <button onClick={() => setShowModal(false)} className="w-16 h-16 bg-white/5 hover:bg-white/10 rounded-[28px] text-primary dark:text-white transition-all flex items-center justify-center border border-glass-border dark:border-white/10 shadow-2xl active:scale-95">
                                <X className="w-8 h-8" />
                            </button>
                        </div>
                        
                        <form onSubmit={handleSave} className="p-12 space-y-12 overflow-y-auto custom-scrollbar flex-1">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                <div className="space-y-5">
                                    <label className="flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.4em] text-muted ml-2">
                                        <div className="w-2 h-2 rounded-full bg-accent"></div>
                                        Alias Node (Infrastruktur)
                                    </label>
                                    <input 
                                        type="text" required
                                        value={currentOlt.name}
                                        onChange={e => setCurrentOlt({...currentOlt, name: e.target.value})}
                                        className="w-full bg-input dark:bg-white/5 border border-input-border dark:border-white/10 rounded-[32px] py-6 px-10 text-2xl font-black text-primary dark:text-white focus:outline-none focus:border-accent/50 focus:bg-white/10 transition-all shadow-inner"
                                        placeholder="OLT-CORE-UTAMA"
                                    />
                                </div>
                                <div className="space-y-5">
                                    <label className="flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.4em] text-muted ml-2">
                                        <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                                        Arsitektur Fabric
                                    </label>
                                    <div className="relative group">
                                        <select 
                                            value={currentOlt.type}
                                            onChange={e => setCurrentOlt({...currentOlt, type: e.target.value})}
                                            className="w-full bg-input dark:bg-white/5 border border-input-border dark:border-white/10 rounded-[32px] py-6 px-10 appearance-none text-xs font-black uppercase tracking-[0.4em] text-accent cursor-pointer focus:outline-none focus:border-accent/50 transition-all shadow-inner"
                                        >
                                            <option value="EPON">EPON (1.25G)</option>
                                            <option value="GPON">GPON (2.5G)</option>
                                        </select>
                                        <Server className="absolute right-10 top-1/2 -translate-y-1/2 w-6 h-6 text-accent/40 group-focus-within:text-accent transition-all" />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                <div className="space-y-5">
                                    <label className="flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.4em] text-muted ml-2">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                        Matriks IP Host
                                    </label>
                                    <div className="relative group">
                                        <input 
                                            type="text" required
                                            value={currentOlt.ip_address}
                                            onChange={e => setCurrentOlt({...currentOlt, ip_address: e.target.value})}
                                            className="w-full bg-input dark:bg-white/5 border border-input-border dark:border-white/10 rounded-[32px] py-6 pl-16 pr-10 font-mono font-black text-2xl text-primary dark:text-white focus:outline-none focus:border-accent/50 transition-all shadow-inner"
                                            placeholder="192.168.x.x"
                                        />
                                        <Globe className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-accent/40 group-focus-within:text-accent transition-all" />
                                    </div>
                                </div>
                                <div className="space-y-5">
                                    <label className="flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.4em] text-muted ml-2">
                                        <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                                        Komunitas SNMP
                                    </label>
                                    <input 
                                        type="text" 
                                        value={currentOlt.snmp_community}
                                        onChange={e => setCurrentOlt({...currentOlt, snmp_community: e.target.value})}
                                        className="w-full bg-input dark:bg-white/5 border border-input-border dark:border-white/10 rounded-[32px] py-6 px-10 text-xl font-black text-primary dark:text-white focus:outline-none focus:border-accent/50 transition-all shadow-inner"
                                        placeholder="public"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                <div className="space-y-5">
                                    <label className="flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.4em] text-muted ml-2">
                                        <div className="w-2 h-2 rounded-full bg-accent"></div>
                                        Prinsipal Otentikasi
                                    </label>
                                    <input 
                                        type="text" 
                                        value={currentOlt.username}
                                        onChange={e => setCurrentOlt({...currentOlt, username: e.target.value})}
                                        className="w-full bg-input dark:bg-white/5 border border-input-border dark:border-white/10 rounded-[32px] py-6 px-10 text-xl font-black text-primary dark:text-white focus:outline-none focus:border-accent/50 transition-all shadow-inner"
                                    />
                                </div>
                                <div className="space-y-5">
                                    <label className="flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.4em] text-muted ml-2">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                        Token Keamanan
                                    </label>
                                    <input 
                                        type="password" 
                                        value={currentOlt.password}
                                        onChange={e => setCurrentOlt({...currentOlt, password: e.target.value})}
                                        className="w-full bg-input dark:bg-white/5 border border-input-border dark:border-white/10 rounded-[32px] py-6 px-10 text-xl font-black text-primary dark:text-white focus:outline-none focus:border-accent/50 transition-all shadow-inner"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-6 pt-12 border-t border-glass-border dark:border-white/10">
                                <button 
                                    type="button" 
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 py-6 rounded-[32px] bg-white/5 hover:bg-white/10 text-muted font-black uppercase tracking-[0.4em] text-[11px] transition-all border border-glass-border dark:border-white/5 active:scale-95 shadow-xl"
                                >
                                    Batalkan Operasi
                                </button>
                                <button 
                                    type="submit" 
                                    className="flex-2 py-6 rounded-[32px] bg-linear-to-r from-accent to-emerald-700 hover:from-accent hover:to-emerald-600 text-white font-black uppercase tracking-[0.4em] text-[11px] shadow-[0_30px_60px_rgba(16,185,129,0.3)] transition-all active:scale-95 flex items-center justify-center gap-5 border border-white/20"
                                >
                                    <Save className="w-6 h-6" />
                                    Simpan Pengaturan OLT
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
