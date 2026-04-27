'use client';

import { useState, useEffect } from 'react';
import { 
    Users, Wifi, Wallet, AlertTriangle, 
    RefreshCw, Server, Activity, Terminal, ShieldAlert 
} from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const AdvancedMonitorChart = dynamic(() => import('@/components/AdvancedMonitorChart'), { ssr: false });

export default function Dashboard() {
    const [stats, setStats] = useState({ 
        totalCustomers: 0, 
        activePppoe: 0, 
        expectedRevenue: 0, 
        unpaidTotal: 0, 
        unpaidCount: 0, 
        customersWithoutPackage: 0,
        routerStats: [] 
    });
    const [loading, setLoading] = useState(true);
    const [logs, setLogs] = useState<any[]>([]);
    const [selectedLogRouter, setSelectedLogRouter] = useState<string>('');
    const [chartData, setChartData] = useState<any[]>([]);

    useEffect(() => {
        fetchStats();
    }, []);

    useEffect(() => {
        if (stats.routerStats.length > 0 && !selectedLogRouter) {
            setSelectedLogRouter((stats.routerStats[0] as any).id.toString());
        }
    }, [stats.routerStats]);

    useEffect(() => {
        if (!selectedLogRouter) return;
        const fetchLogs = async () => {
            try {
                const res = await fetch(`/api/mikrotik/logs?router_id=${selectedLogRouter}`, { cache: 'no-store' });
                if (res.ok) {
                    const data = await res.json();
                    setLogs(data.logs || []);
                }
            } catch (e) { }
        };
        fetchLogs();
        const logInterval = setInterval(fetchLogs, 3000);
        return () => clearInterval(logInterval);
    }, [selectedLogRouter]);

    const fetchStats = async () => {
        try {
            const res = await fetch('/api/dashboard/stats');
            const data = await res.json();
            if (res.ok) {
                setStats(data);
                // Update chart data
                const now = new Date();
                const timeStr = `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;
                setChartData(prev => {
                    const newData = [...prev, { 
                        time: timeStr, 
                        tx: data.totalTx,
                        rx: data.totalRx
                    }];
                    if (newData.length > 40) return newData.slice(1);
                    return newData;
                });
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const interval = setInterval(fetchStats, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h2 className="text-3xl font-extrabold text-white flex items-center gap-3">
                        <Activity className="w-8 h-8 text-indigo-400" />
                        Dashboard Utama
                    </h2>
                    <p className="text-slate-400 mt-1 font-medium">Status NOC, Finansial, & Pemantauan Perangkat (Real-Time)</p>
                </div>
                <button 
                    onClick={fetchStats} 
                    className="glass px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest text-white hover:bg-indigo-600 border border-white/10 hover:border-indigo-500 transition-all flex items-center gap-2 active:scale-95 shadow-xl"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-300' : 'text-indigo-400'}`} />
                    Refresh Data
                </button>
            </div>

            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="glass p-6 rounded-3xl border border-(--glass-border) shadow-xl relative overflow-hidden group hover:scale-[1.02] transition-all duration-300">
                    <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all duration-500"></div>
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 border border-blue-500/20 shadow-inner">
                            <Users className="w-6 h-6" />
                        </div>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Total Pelanggan</p>
                    <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{loading ? '...' : stats.totalCustomers}</p>
                </div>
                
                <div className="glass p-6 rounded-3xl border border-teal-500/20 dark:border-teal-500/30 shadow-[0_0_20px_rgba(20,184,166,0.05)] dark:shadow-[0_0_20px_rgba(20,184,166,0.1)] relative overflow-hidden group">
                    <div className="absolute -right-6 -top-6 w-24 h-24 bg-teal-500/10 rounded-full blur-2xl group-hover:bg-teal-500/20 transition-all duration-500"></div>
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-teal-500/10 flex items-center justify-center text-teal-600 dark:text-teal-400 border border-teal-500/20 shadow-inner">
                            <Wifi className="w-6 h-6" />
                        </div>
                        <span className="px-2 py-1 text-[9px] font-black uppercase rounded bg-teal-500/10 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400 shadow-[0_0_10px_rgba(20,184,166,0.3)] animate-pulse">Live</span>
                    </div>
                    <p className="text-teal-600 dark:text-teal-300 text-xs font-black uppercase tracking-widest mb-1">Sesi PPPoE Aktif</p>
                    <p className="text-3xl font-black text-teal-600 dark:text-teal-400">{loading ? '...' : stats.activePppoe}</p>
                </div>

                <div className="glass p-6 rounded-3xl border border-emerald-500/20 dark:border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.05)] dark:shadow-[0_0_20px_rgba(16,185,129,0.1)] relative overflow-hidden group">
                    <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all duration-500"></div>
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-inner">
                            <Wallet className="w-6 h-6" />
                        </div>
                    </div>
                    <p className="text-emerald-600 dark:text-emerald-300 text-xs font-black uppercase tracking-widest mb-1">Estimasi Pemasukan</p>
                    <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">Rp {loading ? '...' : parseInt(stats.expectedRevenue as any).toLocaleString('id-ID')}</p>
                </div>

                <div className="glass p-6 rounded-3xl border border-orange-500/20 dark:border-orange-500/30 shadow-[0_0_20px_rgba(249,115,22,0.05)] dark:shadow-[0_0_20px_rgba(249,115,22,0.1)] relative overflow-hidden group">
                    <div className="absolute -right-6 -top-6 w-24 h-24 bg-orange-500/10 rounded-full blur-2xl group-hover:bg-orange-500/20 transition-all duration-500"></div>
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-600 dark:text-orange-400 border border-orange-500/20 shadow-inner">
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-black text-orange-600 dark:text-orange-400 bg-orange-500/10 px-2 py-1 rounded-lg">{loading ? '...' : stats.unpaidCount} Tagihan</span>
                    </div>
                    <p className="text-orange-600 dark:text-orange-300 text-xs font-black uppercase tracking-widest mb-1">Belum Dibayar</p>
                    <p className="text-3xl font-black text-orange-600 dark:text-orange-400">Rp {loading ? '...' : parseInt(stats.unpaidTotal as any).toLocaleString('id-ID')}</p>
                </div>
            </div>

            {/* Real-time Traffic Chart Section */}
            <div className="pt-4">
                <div className="glass p-6 rounded-3xl overflow-hidden relative group">
                    <div className="absolute -right-20 -top-20 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl group-hover:bg-indigo-600/20 transition-all duration-1000"></div>
                    <div className="flex justify-between items-center mb-6 relative z-10">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 dark:text-indigo-400 border border-indigo-500/20">
                                <Activity className="w-6 h-6 animate-pulse" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-primary">Traffic Sesi Aktif</h3>
                                <p className="text-xs text-muted font-bold uppercase tracking-widest">Real-Time User Performance Monitoring</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="text-[10px] font-black bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-full border border-indigo-500/30">Auto Refresh: 5s</span>
                        </div>
                    </div>
                    
                    <div className="relative z-10 h-[300px]">
                        {chartData.length < 2 ? (
                            <div className="h-full flex items-center justify-center text-slate-500 italic uppercase text-[10px] font-black tracking-widest animate-pulse">
                                Mengumpulkan Data Pertama...
                            </div>
                        ) : (
                            <AdvancedMonitorChart data={chartData} />
                        )}
                    </div>
                </div>
            </div>

            {/* Warning if customers have no package */}
            {!loading && stats.customersWithoutPackage > 0 && (
                <div className="mt-8 mb-4 animate-in slide-in-from-top duration-500">
                    <div className="bg-amber-500/10 border border-amber-500/20 p-6 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden group">
                        <div className="absolute -right-10 -bottom-10 opacity-5 group-hover:scale-110 transition-transform duration-700">
                            <ShieldAlert className="w-48 h-48 text-amber-500" />
                        </div>
                        <div className="flex items-center gap-6 relative z-10">
                            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-500 border border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.2)] animate-pulse">
                                <ShieldAlert className="w-8 h-8" />
                            </div>
                            <div className="text-center md:text-left">
                                <h4 className="text-xl font-black text-amber-600 dark:text-amber-400">Peringatan: Paket Belum Diatur</h4>
                                <p className="text-sm text-slate-500 dark:text-slate-400 font-bold mt-1">Ditemukan <span className="text-amber-500 underline">{stats.customersWithoutPackage} pelanggan</span> yang belum memiliki Paket (Rp 0).</p>
                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-wider font-black opacity-60">Tagihan akan otomatis Rp 0 jika Paket Internet belum dipilih.</p>
                            </div>
                        </div>
                        <Link href="/customers" className="px-8 py-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-2xl shadow-lg shadow-amber-500/20 transition-all hover:scale-105 active:scale-95 uppercase tracking-widest text-xs relative z-10">
                            Atur Paket Pelanggan
                        </Link>
                    </div>
                </div>
            )}

            {/* Router Status Section */}
            <div className="pt-8">
                <h3 className="text-xl font-bold text-primary mb-6 flex items-center gap-3">
                    <Server className="w-6 h-6 text-indigo-500 dark:text-indigo-400" />
                    Status Node Router (Live API)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {loading ? (
                        <div className="glass p-10 rounded-3xl text-center col-span-1 md:col-span-2 xl:col-span-3">
                            <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-slate-400 text-xs font-black uppercase tracking-widest animate-pulse">Menghubungkan ke API Mikrotik...</p>
                        </div>
                    ) : (
                        stats.routerStats.map((router: any) => (
                            <div key={router.id} className="glass p-6 rounded-3xl relative overflow-hidden transition-all hover:scale-[1.01] hover:bg-white/5 dark:hover:bg-white/5 group">
                                {router.error ? (
                                    <>
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-600 dark:text-red-400 border border-red-500/20 shadow-inner">
                                                    <Server className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-lg text-primary">{router.name}</h4>
                                                    <p className="text-xs text-red-500 dark:text-red-400 font-bold tracking-widest uppercase">Koneksi Terputus</p>
                                                </div>
                                            </div>
                                            <span className="px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30">Offline</span>
                                        </div>
                                        <p className="text-[11px] font-medium text-muted leading-relaxed bg-slate-100 dark:bg-slate-900/50 p-4 rounded-2xl border border-(--glass-border)">
                                            Tidak dapat mengakses Mikrotik API. Pastikan router dalam kondisi hidup, port API tidak diblokir, dan IP address sesuai.
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <div className="absolute -bottom-10 -right-10 p-6 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity duration-500">
                                            <Server className="w-32 h-32 text-indigo-500" />
                                        </div>
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-teal-500/10 flex items-center justify-center text-teal-600 dark:text-teal-400 border border-teal-500/20 shadow-inner group-hover:scale-110 transition-transform duration-300">
                                                    <Server className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-lg text-primary">{router.name}</h4>
                                                    <p className="text-[10px] text-muted font-bold tracking-widest uppercase leading-none mt-0.5">{router.version || 'RouterOS'}</p>
                                                </div>
                                            </div>
                                            <span className="px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded bg-teal-500/10 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400 border border-teal-500/30 shadow-sm">Online</span>
                                        </div>

                                        <div className="space-y-4 relative z-10">
                                            <div className="bg-slate-100/50 dark:bg-slate-900/40 p-4 rounded-2xl border border-(--glass-border) shadow-inner">
                                                <div className="flex justify-between items-center mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <Activity className="w-3.5 h-3.5 text-orange-500" />
                                                        <span className="text-[10px] font-black text-muted uppercase tracking-widest">CPU Load</span>
                                                    </div>
                                                    <span className={`text-[10px] font-black tracking-widest ${parseInt(router.cpu_load) > 80 ? 'text-red-500' : 'text-teal-500'}`}>{router.cpu_load}%</span>
                                                </div>
                                                <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                                    <div className={`h-full transition-all duration-1000 ease-out rounded-full ${parseInt(router.cpu_load) > 80 ? 'bg-red-500' : 'bg-linear-to-r from-teal-500 to-orange-500'}`} style={{ width: `${router.cpu_load}%` }}></div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="bg-slate-100/50 dark:bg-slate-900/40 p-4 rounded-2xl border border-(--glass-border)">
                                                    <p className="text-[9px] text-muted font-black uppercase tracking-widest mb-1">Uptime</p>
                                                    <p className="text-sm font-black text-primary">{router.uptime || 'N/A'}</p>
                                                </div>
                                                <div className="bg-slate-100/50 dark:bg-slate-900/40 p-4 rounded-2xl border border-(--glass-border)">
                                                    <p className="text-[9px] text-muted font-black uppercase tracking-widest mb-1">User Aktif</p>
                                                    <p className="text-sm font-black text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                                                        {router.activeUsers || '0'} <span className="text-[10px] text-muted font-medium">Sesi</span>
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Mikrotik Terminal Logs */}
            <div className="pt-8">
                <div className="glass p-6 rounded-3xl overflow-hidden">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-(--glass-border) pb-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 border border-(--glass-border) shadow-inner">
                                <Terminal className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-extrabold text-primary">Live Router Log</h3>
                                <p className="text-xs text-muted font-medium mt-1">Sistem Logging Real-Time dari Mikrotik</p>
                            </div>
                        </div>
                        <select
                            value={selectedLogRouter}
                            onChange={(e) => setSelectedLogRouter(e.target.value)}
                            className="clean-input min-w-[200px] font-bold appearance-none cursor-pointer"
                        >
                            {stats.routerStats.map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
                        </select>
                    </div>

                    <div className="bg-slate-950 rounded-2xl border border-white/5 overflow-hidden shadow-2xl font-mono relative">
                        {/* Fake terminal header buttons */}
                        <div className="bg-slate-900 px-4 py-2 flex items-center gap-2 border-b border-white/5">
                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            <span className="text-[10px] text-slate-500 font-black tracking-widest ml-4 uppercase">admin@routeros:~</span>
                        </div>
                        
                        <div className="h-[400px] overflow-y-auto scrollbar-hide p-4">
                            {logs.length === 0 ? (
                                <div className="text-slate-600 text-center h-full flex flex-col items-center justify-center">
                                    <RefreshCw className="w-8 h-8 animate-spin mb-4" />
                                    <span className="text-xs font-bold uppercase tracking-widest">Menunggu data log...</span>
                                </div>
                            ) : (
                                <div className="space-y-1 text-[13px]">
                                    {logs.map((log: any, idx) => (
                                        <div key={log['.id'] || idx} className="flex hover:bg-white/5 px-2 py-1 rounded transition-colors group">
                                            <span className="text-slate-500 w-24 shrink-0 font-medium">[{log.time}]</span>
                                            <span className="text-indigo-400 w-32 shrink-0 font-bold">{log.topics}:</span>
                                            <span className={`flex-1 break-all ${
                                                log.topics?.includes('error') ? 'text-red-400 font-bold' :
                                                log.topics?.includes('warning') ? 'text-orange-400' : 'text-slate-300'
                                            }`}>
                                                {log.message}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            
            <style jsx global>{`
                @keyframes shimmer {
                    100% { transform: translateX(100%); }
                }
            `}</style>
        </div>
    );
}
