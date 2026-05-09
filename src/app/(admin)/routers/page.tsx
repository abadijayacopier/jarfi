'use client';

import { useState, useEffect } from 'react';
import { 
    Plus, Search, Wifi, Trash2, Edit3, 
    Activity, Globe, Shield, ExternalLink,
    Cpu, Zap, RefreshCw, Save, X, CheckCircle, 
    ChevronLeft, ChevronRight
} from 'lucide-react';
import Swal from 'sweetalert2';
import Link from 'next/link';

// Custom Router Icon for branding consistency
const RouterIcon = ({ className }: { className?: string }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="24" 
        height="24" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={className}
    >
        <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
        <path d="M6 18h.01" />
        <path d="M10 18h.01" />
        <path d="M14 18h.01" />
        <path d="M18 18h.01" />
        <path d="M12 2v12" />
        <path d="m9 5 3-3 3 3" />
    </svg>
);

import { 
    ResponsiveContainer, AreaChart, Area
} from 'recharts';

const mockSparkline = [
    { v: 40 }, { v: 45 }, { v: 42 }, { v: 48 }, { v: 46 }, { v: 52 }, { v: 50 }
];

export default function RoutersPage() {
    const [routers, setRouters] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [testSuccess, setTestSuccess] = useState(false);
    const [currentRouter, setCurrentRouter] = useState<any>({
        name: '', ip_address: '', username: 'admin', password: '', 
        api_port: 8728
    });

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    const fetchRouters = async () => {
        try {
            const res = await fetch('/api/routers');
            const data = await res.json();
            if (res.ok) setRouters(data.routers || []);
        } catch (e) { }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchRouters(); }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!testSuccess && !editMode) {
            Swal.fire({
                icon: 'warning',
                title: 'Diagnostik Diperlukan',
                text: 'Lakukan diagnostik link yang berhasil sebelum pendaftaran.',
                background: '#0f172a',
                color: '#fff'
            });
            return;
        }

        setLoading(true);
        try {
            const method = editMode ? 'PUT' : 'POST';
            const res = await fetch('/api/routers', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(currentRouter)
            });
            if (res.ok) {
                Swal.fire({ icon: 'success', title: 'Tersinkronisasi', text: editMode ? 'Profil gateway telah diperbarui.' : 'Node gateway baru berhasil didaftarkan.', background: '#0f172a', color: '#fff' });
                setShowModal(false);
                fetchRouters();
            }
        } catch (e) { }
        finally { setLoading(false); }
    };

    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: 'Hentikan Node Gateway?',
            text: "KRITIS: Integrasi ini akan dihapus secara permanen dari matriks infrastruktur.",
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
                const res = await fetch(`/api/routers?id=${id}`, { method: 'DELETE' });
                if (res.ok) {
                    Swal.fire({ icon: 'success', title: 'Node Dihentikan', text: 'Catatan gateway telah dihapus.', background: '#0f172a', color: '#fff' });
                    fetchRouters();
                }
            } catch (e) { }
            finally { setLoading(false); }
        }
    };

    const handleTestConnection = async () => {
        if (!currentRouter.ip_address || !currentRouter.username) {
            Swal.fire({ icon: 'warning', title: 'Data Tidak Lengkap', text: 'Alamat IP dan Nama Pengguna wajib diisi.', background: '#0f172a', color: '#fff' });
            return;
        }

        Swal.fire({ title: 'Mendiagnosis Koneksi...', allowOutsideClick: false, background: '#0f172a', color: '#fff', didOpen: () => { Swal.showLoading(); } });

        try {
            const res = await fetch('/api/test-router', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    host: currentRouter.ip_address,
                    user: currentRouter.username,
                    password: currentRouter.password,
                    port: currentRouter.api_port
                })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setTestSuccess(true);
                Swal.fire({ icon: 'success', title: 'Diagnostik Berhasil', text: `Link terverifikasi. Sesi Aktif: ${data.activeSessionCount}`, background: '#0f172a', color: '#fff' });
            } else {
                setTestSuccess(false);
                Swal.fire({ icon: 'error', title: 'Kesalahan Diagnostik', text: data.error || 'Gateway tidak terjangkau.', background: '#0f172a', color: '#fff' });
            }
        } catch (err) {
            setTestSuccess(false);
            Swal.fire({ icon: 'error', title: 'Kesalahan Jaringan', text: 'Gagal menghubungkan ke bridge.', background: '#0f172a', color: '#fff' });
        }
    };

    const filteredRouters = routers.filter(r => 
        r.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        r.ip_address.includes(searchTerm)
    );

    return (
        <div className="animate-in fade-in duration-700 pb-24 space-y-12">
            {/* Ambient background ornament */}
            <div className="fixed top-1/4 -right-20 w-96 h-96 bg-accent/5 rounded-full blur-[120px] pointer-events-none z-0"></div>
            
            {/* Header Section */}
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 border-b border-glass-border dark:border-white/5 pb-8">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-1 bg-accent rounded-full"></div>
                        <span className="text-[9px] font-black uppercase tracking-[0.3em] text-accent">Gateway Core v4.0</span>
                    </div>
                    <h3 className="text-3xl md:text-4xl font-black text-primary flex items-center gap-4 tracking-tighter">
                        <div className="relative">
                            <div className="absolute inset-0 bg-accent rounded-xl blur-md opacity-20"></div>
                            <Wifi className="w-8 h-8 text-accent relative z-10" />
                        </div>
                        Router Dunia WiFi
                    </h3>
                    <p className="text-[10px] font-bold text-muted uppercase tracking-widest opacity-60">Pusat Kendali MikroTik & Sinkronisasi Jaringan</p>
                </div>
                <button 
                    onClick={() => {
                        setEditMode(false);
                        setTestSuccess(false);
                        setCurrentRouter({ name: '', ip_address: '', username: 'admin', password: '', api_port: 8728 });
                        setShowModal(true);
                    }}
                    className="w-full md:w-auto bg-linear-to-r from-accent to-emerald-600 hover:from-emerald-500 hover:to-emerald-600 text-white font-black py-5 px-10 rounded-2xl transition-all shadow-[0_20px_40px_rgba(16,185,129,0.3)] active:scale-95 flex items-center justify-center gap-3 uppercase tracking-[0.2em] text-[11px] border border-white/10"
                >
                    <Plus className="w-5 h-5" /> Daftarkan Gateway Baru
                </button>
            </div>

            {/* Stats Summary - Compact Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                <div className="group bg-surface dark:bg-[#0f172a]/80 backdrop-blur-3xl p-6 rounded-[32px] border border-glass-border dark:border-white/5 hover:border-accent/40 transition-all duration-700 relative overflow-hidden">
                    <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-accent/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                    <div className="flex items-center justify-between gap-6">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 rounded-[24px] bg-accent/10 flex items-center justify-center text-accent border border-accent/20 shadow-xl group-hover:scale-110 transition-all duration-500 relative z-10">
                                <RouterIcon className="w-8 h-8" />
                            </div>
                            <div className="relative z-10">
                                <p className="text-[9px] text-muted font-black uppercase tracking-[0.2em] mb-1 opacity-60">Gateway Aktif</p>
                                <h4 className="text-3xl font-black text-primary dark:text-white tracking-tighter tabular-nums leading-none">{routers.length}</h4>
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
                
                <div className="group bg-surface dark:bg-[#0f172a]/80 backdrop-blur-3xl p-6 rounded-[32px] border border-glass-border dark:border-white/5 hover:border-emerald-500/40 transition-all duration-700 relative overflow-hidden">
                    <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                    <div className="flex items-center justify-between gap-6">
                        <div className="flex items-center gap-6">
                                                    <div className="flex items-center gap-6">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-500 border border-emerald-500/30">
                                    <Plus className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-white uppercase tracking-tight">Hubungkan MikroTik Baru</h3>
                                    <p className="text-[9px] font-black text-accent uppercase tracking-[0.2em] opacity-80 mt-1">Integrasi RouterOS Dunia WiFi</p>
                                </div>
                            </div>
                        </div>
                        <div className="w-20 h-12 opacity-20 group-hover:opacity-100 transition-all duration-700">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={mockSparkline}>
                                    <Area type="monotone" dataKey="v" stroke="#10b981" fill="#10b981" fillOpacity={0.1} strokeWidth={2} isAnimationActive={false} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                <div className="group bg-surface dark:bg-[#0f172a]/80 backdrop-blur-3xl p-6 rounded-[32px] border border-glass-border dark:border-white/5 hover:border-indigo-500/40 transition-all duration-700 relative overflow-hidden">
                    <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                    <div className="flex items-center justify-between gap-6">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 rounded-[24px] bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20 shadow-xl group-hover:scale-110 transition-all duration-500 relative z-10">
                                <Cpu className="w-8 h-8" />
                            </div>
                            <div className="relative z-10">
                                <p className="text-[9px] text-muted font-black uppercase tracking-[0.2em] mb-1 opacity-60">Sistem Operasi</p>
                                <h4 className="text-2xl font-black text-primary dark:text-white/80 tracking-tight uppercase leading-none">MikroTik</h4>
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
                        <h4 className="text-2xl font-black text-primary dark:text-white uppercase tracking-tighter">MikroTik Terintegrasi</h4>
                        <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full bg-accent animate-pulse"></div>
                            <p className="text-[10px] font-black text-muted uppercase tracking-[0.4em]">API Link Synchronized</p>
                        </div>
                    </div>
                    <div className="relative w-full md:w-[450px] group">
                        <div className="absolute inset-0 bg-accent/5 rounded-3xl blur-xl group-focus-within:bg-accent/10 transition-all"></div>
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted group-focus-within:text-accent transition-colors" />
                        <input 
                            type="text" 
                            placeholder="Saring identitas perangkat..."
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
                            <span className="text-[11px] font-black text-muted uppercase tracking-[0.5em]">Mencari Perangkat...</span>
                        </div>
                    ) : filteredRouters.length === 0 ? (
                        <div className="py-20 flex flex-col items-center justify-center gap-6 bg-white/2 rounded-[48px] border border-dashed border-glass-border dark:border-white/10">
                            <Wifi className="w-12 h-12 text-muted opacity-20" />
                            <span className="text-[10px] font-black text-muted uppercase tracking-[0.5em]">Tidak Terdeteksi</span>
                        </div>
                    ) : (
                        filteredRouters.map((router) => (
                            <div key={router.id} className="group relative bg-surface dark:bg-[#0f172a]/80 backdrop-blur-3xl p-10 rounded-[48px] border border-glass-border dark:border-white/5 hover:border-accent/40 transition-all duration-500 shadow-2xl active:scale-95 overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                                
                                <div className="flex justify-between items-start mb-10">
                                    <div className="w-20 h-20 rounded-[28px] bg-linear-to-br from-white/5 to-white/2 border border-glass-border dark:border-white/10 flex items-center justify-center text-accent shadow-2xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                                        <Wifi className="w-10 h-10" />
                                    </div>
                                    <div className="flex flex-col items-end gap-3">
                                        <div className={`px-4 py-2 border rounded-full flex items-center gap-2.5 ${router.status === 'ONLINE' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
                                            <div className={`w-2 h-2 rounded-full ${router.status === 'ONLINE' ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500'}`}></div>
                                            <span className="text-[9px] font-black uppercase tracking-widest">{router.status}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3 mb-10">
                                    <h4 className="text-3xl font-black text-primary dark:text-white tracking-tighter uppercase leading-none">{router.name}</h4>
                                    <p className="text-[10px] font-black text-accent uppercase tracking-[0.3em] underline underline-offset-8 decoration-accent/30">{router.ip_address}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4 py-8 border-y border-glass-border dark:border-white/5 mb-10">
                                    <div className="space-y-1.5">
                                        <p className="text-[9px] font-black text-muted uppercase tracking-widest">Auth Principal</p>
                                        <p className="text-sm font-bold text-primary dark:text-white flex items-center gap-2">
                                            <Shield className="w-3.5 h-3.5 text-accent/50" /> {router.username}
                                        </p>
                                    </div>
                                    <div className="space-y-1.5">
                                        <p className="text-[9px] font-black text-muted uppercase tracking-widest">Protocol Port</p>
                                        <p className="text-sm font-mono font-bold text-primary dark:text-white">{router.api_port}</p>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <button 
                                        onClick={() => {
                                            setEditMode(true);
                                            setCurrentRouter(router);
                                            setTestSuccess(false);
                                            setShowModal(true);
                                        }}
                                        className="flex-1 py-5 rounded-3xl bg-white/5 hover:bg-accent/10 hover:text-accent text-primary dark:text-white border border-glass-border dark:border-white/10 flex items-center justify-center gap-3 transition-all active:scale-95"
                                    >
                                        <Edit3 className="w-5 h-5" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Edit</span>
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(router.id)}
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
                                    <th className="px-10 py-10">Identitas MikroTik</th>
                                    <th className="px-10 py-10">Vektor Jaringan</th>
                                    <th className="px-10 py-10">Otentikasi</th>
                                    <th className="px-10 py-10">Status Link</th>
                                    <th className="px-10 py-10 text-right">Orkestrasi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-glass-border dark:divide-white/5">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="py-40 text-center">
                                            <div className="w-10 h-10 border-4 border-accent/20 border-t-accent rounded-full animate-spin mx-auto mb-6 opacity-40"></div>
                                            <span className="text-[11px] font-black text-muted uppercase tracking-[0.5em]">Synchronizing...</span>
                                        </td>
                                    </tr>
                                ) : routers.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-40 text-center text-slate-500 font-black uppercase tracking-widest opacity-40 text-[10px]">Tidak ada MikroTik terdaftar.</td>
                                    </tr>
                                ) : (
                                    filteredRouters
                                        .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                                        .map((router) => (
                                        <tr key={router.id} className="hover:bg-white/2 transition-all group">
                                            <td className="px-10 py-10">
                                                <div className="flex items-center gap-6">
                                                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-accent border border-white/5 shadow-inner group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                                                        <Wifi className="w-8 h-8" />
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-primary dark:text-white text-xl tracking-tighter leading-none mb-2 uppercase">{router.name}</p>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[9px] font-black uppercase tracking-widest text-accent px-3 py-1 bg-accent/10 rounded-lg border border-accent/20">RouterOS</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-10 py-10">
                                                <div className="flex items-center gap-3 font-mono font-black text-sm text-primary/80 dark:text-white/80">
                                                    <Globe className="w-4 h-4 text-accent/40" />
                                                    {router.ip_address}
                                                </div>
                                                <p className="text-[9px] text-muted font-black uppercase tracking-widest mt-2 opacity-40">API Port: {router.api_port}</p>
                                            </td>
                                            <td className="px-10 py-10">
                                                <div className="space-y-3">
                                                    <div className="text-[10px] text-primary dark:text-white font-black flex items-center gap-3 uppercase tracking-widest">
                                                        <Shield className="w-4 h-4 text-accent/50" /> {router.username}
                                                    </div>
                                                    <div className="text-[9px] text-muted font-mono font-black uppercase tracking-widest bg-white/5 px-3 py-1 rounded-lg border border-white/5 w-fit">Encrypted Token</div>
                                                </div>
                                            </td>
                                            <td className="px-10 py-10">
                                                <div className={`flex items-center gap-4 px-5 py-2.5 border rounded-2xl w-fit ${router.status === 'ONLINE' ? 'bg-accent/5 border-accent/20 text-accent' : 'bg-red-500/5 border-red-500/20 text-red-500'}`}>
                                                    <div className={`w-2.5 h-2.5 rounded-full ${router.status === 'ONLINE' ? 'bg-accent animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.5)]' : 'bg-red-500'}`}></div>
                                                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">{router.status}</span>
                                                </div>
                                            </td>
                                            <td className="px-10 py-10 text-right">
                                                <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                                    <button 
                                                        onClick={() => {
                                                            setEditMode(true);
                                                            setCurrentRouter(router);
                                                            setTestSuccess(false);
                                                            setShowModal(true);
                                                        }}
                                                        className="p-4 bg-white/5 text-muted hover:bg-accent/10 hover:text-accent rounded-2xl border border-white/5 transition-all shadow-xl"
                                                    >
                                                        <Edit3 className="w-5 h-5" />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDelete(router.id)}
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

                {/* Pagination Controls */}
                {!loading && routers.length > itemsPerPage && (
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-8 pt-10 px-4">
                        <p className="text-[10px] font-black text-muted uppercase tracking-[0.3em]">
                            Devices: <span className="text-primary dark:text-white">{routers.length}</span>
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

            {/* Modal Form */}
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
                                        {editMode ? 'Ubah MikroTik' : 'Inisialisasi MikroTik'}
                                    </h3>
                                    <p className="text-accent text-[11px] font-black uppercase tracking-[0.4em] opacity-80 underline underline-offset-8 decoration-accent/30">RouterOS Layer</p>
                                </div>
                            </div>
                            <button onClick={() => setShowModal(false)} className="w-16 h-16 bg-white/5 hover:bg-white/10 rounded-[28px] text-primary dark:text-white transition-all flex items-center justify-center border border-glass-border dark:border-white/10 shadow-2xl active:scale-95">
                                <X className="w-8 h-8" />
                            </button>
                        </div>
                        
                        <form onSubmit={handleSave} className="p-12 space-y-12 overflow-y-auto custom-scrollbar flex-1">
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-accent"></div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nama MikroTik (Contoh: Magetan-01)</label>
                                </div>
                                <input 
                                    type="text" required
                                    value={currentRouter.name}
                                    onChange={e => setCurrentRouter({...currentRouter, name: e.target.value})}
                                    className="w-full bg-slate-900/50 border border-white/5 rounded-2xl px-6 py-4 text-white font-bold placeholder:text-slate-600 focus:outline-none focus:border-accent/40 transition-all"
                                    placeholder="CORE-GATEWAY-01"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-accent"></div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Alamat IP MikroTik</label>
                                    </div>
                                    <div className="relative">
                                        <Globe className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-accent opacity-40" />
                                        <input 
                                            type="text" required
                                            value={currentRouter.ip_address}
                                            onChange={e => setCurrentRouter({...currentRouter, ip_address: e.target.value})}
                                            className="w-full bg-slate-900/50 border border-white/5 rounded-2xl pl-16 pr-6 py-4 text-white font-bold placeholder:text-slate-600 focus:outline-none focus:border-accent/40 transition-all"
                                            placeholder="192.168.x.x"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">API Port</label>
                                    </div>
                                    <input 
                                        type="number" required
                                        value={currentRouter.api_port}
                                        onChange={e => setCurrentRouter({...currentRouter, api_port: parseInt(e.target.value)})}
                                        className="w-full bg-slate-900/50 border border-white/5 rounded-2xl px-6 py-4 text-white font-bold placeholder:text-slate-600 focus:outline-none focus:border-accent/40 transition-all"
                                        placeholder="8728"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-accent"></div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Username</label>
                                    </div>
                                    <input 
                                        type="text" 
                                        value={currentRouter.username}
                                        onChange={e => setCurrentRouter({...currentRouter, username: e.target.value})}
                                        className="w-full bg-slate-900/50 border border-white/5 rounded-2xl px-6 py-4 text-white font-bold placeholder:text-slate-600 focus:outline-none focus:border-accent/40 transition-all"
                                    />
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Password</label>
                                    </div>
                                    <input 
                                        type="password" 
                                        value={currentRouter.password}
                                        onChange={e => setCurrentRouter({...currentRouter, password: e.target.value})}
                                        className="w-full bg-slate-900/50 border border-white/5 rounded-2xl px-6 py-4 text-white font-bold placeholder:text-slate-600 focus:outline-none focus:border-accent/40 transition-all"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            <div className="bg-surface dark:bg-white/2 p-10 rounded-[48px] border border-glass-border dark:border-white/5 space-y-8 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-3xl"></div>
                                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 relative z-10">
                                    <div className="flex flex-col gap-2">
                                        <span className="text-[12px] font-black text-primary dark:text-white uppercase tracking-[0.3em]">Diagnostik Link</span>
                                        <span className="text-[10px] text-muted font-bold uppercase tracking-widest">Wajib Sebelum Pendaftaran</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleTestConnection}
                                        className={`w-full md:w-auto px-10 py-5 rounded-[28px] transition-all font-black uppercase tracking-[0.2em] text-[11px] flex items-center justify-center gap-4 active:scale-95 border shadow-2xl ${testSuccess ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' : 'bg-white/5 text-primary dark:text-white border-glass-border dark:border-white/10 hover:bg-white/10'}`}
                                        disabled={!currentRouter.ip_address || !currentRouter.username}
                                    >
                                        {testSuccess ? <CheckCircle className="w-6 h-6" /> : <Wifi className="w-6 h-6" />}
                                        {testSuccess ? 'Terverifikasi' : 'Uji Koneksi'}
                                    </button>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-6 pt-12 border-t border-glass-border dark:border-white/10">
                                <button 
                                    type="button" 
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 py-6 rounded-[32px] bg-white/5 hover:bg-white/10 text-muted font-black uppercase tracking-[0.4em] text-[11px] transition-all border border-glass-border dark:border-white/5 active:scale-95 shadow-xl"
                                >
                                    Batalkan
                                </button>
                                <button 
                                    type="submit" 
                                    className="flex-2 py-6 rounded-[32px] bg-linear-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white p-5 font-black text-[12px] uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 border border-white/20"
                                >
                                    <Save className="w-5 h-5" />
                                    Simpan Pengaturan MikroTik
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
