'use client';

import { useState, useEffect } from 'react';
import { 
    Users, Wifi, Wallet, AlertTriangle, 
    RefreshCw, Server, Activity, Terminal, ShieldAlert, TrendingUp, Zap, ArrowUpRight
} from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

// Modular Components
import StatCard from '@/components/dashboard/StatCard';
import RouterStatus from '@/components/dashboard/RouterStatus';
import LogViewer from '@/components/dashboard/LogViewer';
import RegionalNodeMonitor from '@/components/dashboard/RegionalNodeMonitor';

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
        const interval = setInterval(fetchStats, 3000); // 3 seconds for real-time telemetry
        return () => clearInterval(interval);
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
        const logInterval = setInterval(fetchLogs, 15000); // 15 seconds
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

    return (
        <div className="space-y-12 animate-in fade-in duration-1000 pb-24 px-4 md:px-0">
            {/* Hero Section */}
            <div>
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8 mb-6 border-b border-white/5 pb-12 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-64 h-64 bg-accent/5 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
                    <div className="max-w-3xl space-y-4 relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-accent animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.5)]"></div>
                            <span className="text-[10px] font-black text-accent uppercase tracking-[0.3em]">Pusat Kendali Jaringan</span>
                        </div>
                        <h2 className="text-2xl sm:text-3xl md:text-4xl xl:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-[0.95] uppercase break-words">
                            Ekosistem <br className="hidden sm:block" />
                            <span className="text-emerald-500 bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-500">Dunia WiFi.</span>
                        </h2>
                    </div>
                    <div className="flex flex-col items-start lg:items-end gap-2 relative z-10 w-full lg:w-auto">
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Estimasi Pendapatan Bulanan</span>
                        <div className="text-xl sm:text-2xl md:text-4xl font-black tracking-tighter text-slate-900 dark:text-white tabular-nums drop-shadow-2xl">
                            {loading ? '...' : `Rp ${parseInt(stats.expectedRevenue as any).toLocaleString('id-ID')}`}
                        </div>
                        <div className="flex items-center gap-2 mt-6 px-4 py-2 bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full border border-emerald-500/20 backdrop-blur-xl shadow-lg shadow-emerald-500/5">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></div>
                            <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest leading-none">Arus Kas Terverifikasi</span>
                        </div>
                    </div>
                </div>

                <div className="mb-12">
                    <RegionalNodeMonitor routers={stats.routerStats} loading={loading} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
                    <div className="glass p-4 md:p-6 rounded-2xl md:rounded-[32px] flex flex-col justify-between min-h-[140px] md:min-h-[180px] hover:border-accent/30 transition-all duration-500 group bg-white/5 dark:bg-slate-900/50 border border-white/10 dark:border-white/5 shadow-2xl relative overflow-hidden backdrop-blur-xl">
                        <div className="absolute -right-8 -bottom-8 opacity-[0.03] group-hover:opacity-[0.08] transition-all duration-700 pointer-events-none">
                            <Users className="w-24 md:w-36 h-24 md:h-36 text-accent" />
                        </div>
                        <div className="flex justify-between items-start relative z-10">
                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-accent/10 flex items-center justify-center text-accent border border-accent/20 group-hover:scale-110 transition-transform shadow-inner">
                                <Users className="w-5 h-5 md:w-6 md:h-6" />
                            </div>
                            <span className="text-[8px] md:text-[9px] font-black text-muted uppercase tracking-[0.2em]">Total Pelanggan</span>
                        </div>
                        <div className="relative z-10 mt-3 md:mt-0">
                            <div className="text-2xl md:text-4xl font-black tracking-tighter mb-0.5 tabular-nums text-primary">{loading ? '...' : stats.totalCustomers}</div>
                            <p className="text-[8px] md:text-[9px] text-muted font-black uppercase tracking-[0.2em]">Basis Data Terdaftar</p>
                        </div>
                    </div>

                    <div className="glass p-4 md:p-6 rounded-2xl md:rounded-[32px] flex flex-col justify-between min-h-[140px] md:min-h-[180px] hover:border-accent/30 transition-all duration-500 group bg-white/5 dark:bg-slate-900/50 border border-white/10 dark:border-white/5 shadow-2xl relative overflow-hidden backdrop-blur-xl">
                        <div className="absolute -right-8 -bottom-8 opacity-[0.03] group-hover:opacity-[0.08] transition-all duration-700 pointer-events-none">
                            <Wifi className="w-24 md:w-36 h-24 md:h-36 text-accent" />
                        </div>
                        <div className="flex justify-between items-start relative z-10">
                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-accent/10 flex items-center justify-center text-accent border border-accent/20 group-hover:scale-110 transition-transform shadow-inner">
                                <Wifi className="w-5 h-5 md:w-6 md:h-6" />
                            </div>
                            <div className="hidden sm:flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"></div>
                                <span className="text-[8px] md:text-[9px] font-black text-white/40 uppercase tracking-widest">Real-time</span>
                            </div>
                        </div>
                        <div className="relative z-10 mt-3 md:mt-0">
                            <div className="text-2xl md:text-4xl font-black tracking-tighter mb-0.5 tabular-nums text-accent">{loading ? '...' : stats.activePppoe}</div>
                            <p className="text-[8px] md:text-[9px] text-muted font-black uppercase tracking-[0.2em]">Sesi PPPoE Aktif</p>
                        </div>
                    </div>

                    <div className="p-4 md:p-6 rounded-2xl md:rounded-[32px] flex flex-col justify-between min-h-[140px] md:min-h-[180px] hover:border-amber-500/30 transition-all duration-500 group bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 shadow-2xl relative overflow-hidden col-span-2 lg:col-span-1">
                        <div className="absolute -right-8 -bottom-8 opacity-[0.03] group-hover:opacity-[0.08] transition-all duration-700 pointer-events-none">
                            <Wallet className="w-24 md:w-36 h-24 md:h-36 text-amber-500" />
                        </div>
                        <div className="flex justify-between items-start relative z-10">
                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20 group-hover:scale-110 transition-transform shadow-inner">
                                <Wallet className="w-5 h-5 md:w-6 md:h-6" />
                            </div>
                            <span className="text-[8px] md:text-[9px] font-black text-muted uppercase tracking-[0.2em]">Invois Tertunda</span>
                        </div>
                        <div className="relative z-10 mt-3 md:mt-0">
                            <div className="text-2xl md:text-4xl font-black tracking-tighter mb-0.5 tabular-nums text-amber-500">{loading ? '...' : stats.unpaidCount}</div>
                            <p className="text-[8px] md:text-[9px] text-muted font-black uppercase tracking-[0.2em]">Menunggu Pembayaran</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Traffic Analytics Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 p-8 sm:p-12 rounded-[3rem] relative overflow-hidden group min-h-[500px] bg-white dark:bg-slate-950 border border-slate-100 dark:border-white/5 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.08)] dark:shadow-none">
                    <div className="absolute -right-20 -top-20 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[100px] group-hover:bg-accent/8 transition-all duration-1000"></div>
                    
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-6 relative z-10">
                        <div className="flex items-center gap-6">
                            <div>
                                <h3 className="text-2xl font-black text-primary tracking-tighter uppercase">Throughput Jaringan</h3>
                                <p className="text-[10px] text-muted font-bold uppercase tracking-[0.2em] mt-1 opacity-60">Matriks Real-time NOC</p>
                            </div>
                            <select 
                                value={selectedLogRouter}
                                onChange={(e) => setSelectedLogRouter(e.target.value)}
                                className="bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest text-primary focus:outline-none focus:border-accent/40"
                            >
                                <option value="">Seluruh Jaringan</option>
                                {stats.routerStats.map((r: any) => (
                                    <option key={r.id} value={r.id}>{r.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex gap-4 p-2 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-white/5 rounded-xl shadow-sm border border-slate-100 dark:border-white/5">
                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]"></div>
                                <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">Unggah</span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-white/5 rounded-xl shadow-sm border border-slate-100 dark:border-white/5">
                                <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.5)]"></div>
                                <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">Unduh</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="relative z-10 h-[300px]">
                        {chartData.length < 2 ? (
                            <div className="h-full flex items-center justify-center">
                                <div className="flex flex-col items-center gap-4 animate-pulse">
                                    <div className="w-16 h-16 rounded-3xl bg-accent/10 flex items-center justify-center text-accent">
                                        <Activity className="w-8 h-8" />
                                    </div>
                                    <span className="text-[10px] font-black text-muted uppercase tracking-[0.3em]">Sinkronisasi Gelombang...</span>
                                </div>
                            </div>
                        ) : (
                            <AdvancedMonitorChart data={chartData} />
                        )}
                    </div>
                </div>

                <div className="flex flex-col gap-8">
                    {/* Sync Card */}
                    <div className="p-10 rounded-[40px] flex flex-col justify-center items-center text-center space-y-6 hover:border-accent/30 transition-all duration-500 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 shadow-2xl relative overflow-hidden group">
                        <div className="absolute inset-0 bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                        <button 
                            onClick={fetchStats} 
                            disabled={loading}
                            className="w-20 h-20 rounded-[32px] bg-accent/10 flex items-center justify-center text-accent hover:scale-110 transition-all active:scale-90 shadow-2xl shadow-accent/10 border border-accent/20 disabled:opacity-50 relative z-10"
                        >
                            <RefreshCw className={`w-8 h-8 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                        <div className="relative z-10">
                            <h4 className="font-black text-primary text-xs uppercase tracking-[0.2em]">Pusat Komando</h4>
                            <p className="text-[9px] text-muted font-bold mt-2 uppercase tracking-[0.3em] opacity-60">Sinkronisasi Cloud Aktif</p>
                        </div>
                    </div>

                    {/* Critical Alerts */}
                    {!loading && stats.customersWithoutPackage > 0 ? (
                        <div className="bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 p-10 rounded-4xl space-y-8 flex-1 flex flex-col justify-between shadow-xl shadow-amber-500/5 relative overflow-hidden group">
                            <div className="absolute -right-10 -bottom-10 opacity-[0.05] group-hover:opacity-[0.1] transition-all duration-700">
                                <ShieldAlert className="w-48 h-48 text-amber-500" />
                            </div>
                            <div className="flex items-center gap-6 relative z-10">
                                <div className="w-16 h-16 rounded-[28px] bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20 shadow-inner">
                                    <ShieldAlert className="w-8 h-8" />
                                </div>
                                <div>
                                    <h4 className="font-black text-amber-600 dark:text-amber-500 text-xs uppercase tracking-[0.2em]">Integritas</h4>
                                    <p className="text-[10px] text-muted font-bold mt-1 uppercase tracking-[0.2em]">{stats.customersWithoutPackage} Masalah Terdeteksi</p>
                                </div>
                            </div>
                            <Link href="/customers" className="w-full py-5 bg-amber-500 text-white font-black rounded-2xl transition-all text-center uppercase tracking-[0.3em] text-[10px] shadow-lg shadow-amber-500/20 active:scale-95 relative z-10">
                                Perbaiki Sekarang
                            </Link>
                        </div>
                    ) : (
                        <div className="bg-accent/5 dark:bg-accent/10 border border-accent/20 p-10 rounded-4xl space-y-8 flex-1 flex flex-col justify-center items-center text-center shadow-xl shadow-accent/5 group relative overflow-hidden">
                            <div className="absolute inset-0 bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                            <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center text-accent border border-accent/20 shadow-inner group-hover:scale-110 transition-transform duration-700 relative z-10">
                                <ShieldAlert className="w-10 h-10" />
                            </div>
                            <p className="text-[11px] text-muted font-black uppercase tracking-[0.25em] leading-relaxed relative z-10">Infrastruktur <br /> <span className="text-accent">Teroptimalisasi</span></p>
                        </div>
                    )}
                </div>
            </div>

            {/* Network Infrastructure Nodes */}
            <div className="space-y-10">
                <div className="flex items-center justify-between border-b border-(--glass-border) pb-6">
                    <div>
                        <h3 className="text-2xl font-bold text-primary tracking-tight">Infrastruktur Inti</h3>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1">Performa Node Aktif</p>
                    </div>
                    <Link href="/routers" className="text-[10px] font-bold text-accent uppercase tracking-widest hover:underline flex items-center gap-2">
                        Lihat Matriks <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                    {loading ? (
                        Array(3).fill(0).map((_, i) => <RouterStatus key={i} router={{} as any} loading={true} />)
                    ) : (
                        stats.routerStats.map((router: any) => (
                            <RouterStatus key={router.id} router={router} />
                        ))
                    )}
                </div>
            </div>

            {/* Support Tickets Overview */}
            <div className="space-y-10">
                <div className="flex items-center justify-between border-b border-(--glass-border) pb-6">
                    <div>
                        <h3 className="text-2xl font-bold text-primary tracking-tight">Pusat Bantuan</h3>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1">Tiket Troubleshooting Aktif</p>
                    </div>
                    <Link href="/tickets" className="text-[10px] font-bold text-accent uppercase tracking-widest hover:underline flex items-center gap-2">
                        Buka Semua Tiket <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="p-8 rounded-[40px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 shadow-2xl flex items-center justify-center min-h-[150px] group overflow-hidden relative">
                        <div className="absolute inset-0 bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                        <div className="text-center relative z-10">
                            <p className="text-[11px] font-black text-muted uppercase tracking-[0.4em] mb-4">Sistem Troubleshooting</p>
                            <Link href="/tickets" className="px-8 py-3 bg-accent text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-accent/20 active:scale-95 transition-all inline-block">
                                Kelola Tiket Masuk
                            </Link>
                        </div>
                    </div>
                    <div className="p-8 rounded-[40px] bg-emerald-500/5 dark:bg-emerald-500/5 border border-emerald-500/10 shadow-2xl flex flex-col justify-center items-center text-center space-y-4">
                        <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                            <Activity className="w-8 h-8" />
                        </div>
                        <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest leading-relaxed">Semua Layanan <br /> Beroperasi Normal</p>
                    </div>
                </div>
            </div>

            {/* Operations Console */}
            <div className="glass rounded-4xl overflow-hidden bg-white/2 border border-(--glass-border) shadow-xl">
                <div className="p-8 border-b border-(--glass-border) bg-white/2">
                    <div className="flex items-center gap-4">
                        <Terminal className="w-5 h-5 text-accent" />
                        <h4 className="text-xl font-bold text-primary tracking-tight">Konsol Inti Sistem</h4>
                    </div>
                </div>
                <LogViewer 
                    logs={logs}
                    routers={stats.routerStats}
                    selectedRouter={selectedLogRouter}
                    onRouterChange={setSelectedLogRouter}
                />
            </div>
        </div>
    );
}
