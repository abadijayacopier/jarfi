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
        const interval = setInterval(fetchStats, 5000);
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

    return (
        <div className="space-y-12 animate-in fade-in duration-1000 pb-24 px-4 md:px-0">
            {/* Hero Section */}
            <div className="pt-6 md:pt-10">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8 mb-12 border-b border-white/5 pb-12 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-64 h-64 bg-accent/5 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
                    <div className="max-w-3xl space-y-4 relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-accent animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.5)]"></div>
                            <span className="text-[10px] font-black text-accent uppercase tracking-[0.3em]">Ikhtisar Operasi NOC</span>
                        </div>
                        <h2 className="text-4xl md:text-6xl xl:text-7xl font-black text-primary tracking-tight leading-[0.9] uppercase">
                            Inteligensi <br />
                            <span className="text-accent text-gradient">Jaringan.</span>
                        </h2>
                    </div>
                    <div className="flex flex-col items-start lg:items-end gap-2 relative z-10 w-full lg:w-auto">
                        <span className="text-label">Estimasi Pendapatan Bulanan</span>
                        <div className="text-3xl md:text-5xl font-black tracking-tighter text-primary tabular-nums">
                            {loading ? '...' : `Rp ${parseInt(stats.expectedRevenue as any).toLocaleString('id-ID')}`}
                        </div>
                        <div className="flex items-center gap-2 mt-4 px-4 py-2 bg-accent/10 rounded-xl border border-accent/20 backdrop-blur-md">
                            <TrendingUp className="w-3.5 h-3.5 text-accent" />
                            <span className="text-label text-accent opacity-100">Pertumbuhan Terverifikasi</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                    <div className="glass p-8 rounded-[40px] flex flex-col justify-between min-h-[220px] hover:border-accent/30 transition-all duration-500 group bg-white/5 dark:bg-slate-900/50 border border-white/10 dark:border-white/5 shadow-2xl relative overflow-hidden backdrop-blur-xl">
                        <div className="absolute -right-10 -bottom-10 opacity-[0.03] group-hover:opacity-[0.08] transition-all duration-700 pointer-events-none">
                            <Users className="w-48 h-48 text-accent" />
                        </div>
                        <div className="flex justify-between items-start relative z-10">
                            <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center text-accent border border-accent/20 group-hover:scale-110 transition-transform shadow-inner">
                                <Users className="w-7 h-7" />
                            </div>
                            <span className="text-[10px] font-black text-muted uppercase tracking-[0.2em]">Total Basis Data</span>
                        </div>
                        <div className="relative z-10">
                            <div className="text-5xl font-black tracking-tighter mb-1 tabular-nums text-primary">{loading ? '...' : stats.totalCustomers}</div>
                            <p className="text-[10px] text-muted font-black uppercase tracking-[0.2em]">Pelanggan Terdaftar</p>
                        </div>
                    </div>

                    <div className="glass p-8 rounded-[40px] flex flex-col justify-between min-h-[220px] hover:border-accent/30 transition-all duration-500 group bg-white/5 dark:bg-slate-900/50 border border-white/10 dark:border-white/5 shadow-2xl relative overflow-hidden backdrop-blur-xl">
                        <div className="absolute -right-10 -bottom-10 opacity-[0.03] group-hover:opacity-[0.08] transition-all duration-700 pointer-events-none">
                            <Wifi className="w-48 h-48 text-accent" />
                        </div>
                        <div className="flex justify-between items-start relative z-10">
                            <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center text-accent border border-accent/20 group-hover:scale-110 transition-transform shadow-inner">
                                <Wifi className="w-7 h-7" />
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"></div>
                                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Status Matriks Real-time</span>
                            </div>
                        </div>
                        <div className="relative z-10">
                            <div className="text-5xl font-black tracking-tighter mb-1 tabular-nums text-accent">{loading ? '...' : stats.activePppoe}</div>
                            <p className="text-[10px] text-muted font-black uppercase tracking-[0.2em]">Sesi PPPoE Aktif</p>
                        </div>
                    </div>

                    <div className="glass p-8 rounded-[40px] flex flex-col justify-between min-h-[220px] hover:border-amber-500/30 transition-all duration-500 group bg-white/5 dark:bg-slate-900/50 border border-white/10 dark:border-white/5 shadow-2xl relative overflow-hidden backdrop-blur-xl sm:col-span-2 lg:col-span-1">
                        <div className="absolute -right-10 -bottom-10 opacity-[0.03] group-hover:opacity-[0.08] transition-all duration-700 pointer-events-none">
                            <Wallet className="w-48 h-48 text-amber-500" />
                        </div>
                        <div className="flex justify-between items-start relative z-10">
                            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20 group-hover:scale-110 transition-transform shadow-inner">
                                <Wallet className="w-7 h-7" />
                            </div>
                            <span className="text-[10px] font-black text-muted uppercase tracking-[0.2em]">Tertunda</span>
                        </div>
                        <div className="relative z-10">
                            <div className="text-5xl font-black tracking-tighter mb-1 tabular-nums text-amber-500">{loading ? '...' : stats.unpaidCount}</div>
                            <p className="text-[10px] text-muted font-black uppercase tracking-[0.2em]">Tagihan Belum Terbayar</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Traffic Analytics Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 glass p-10 rounded-4xl relative overflow-hidden group min-h-[450px] bg-white/2 border border-(--glass-border) shadow-xl">
                    <div className="absolute -right-20 -top-20 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[100px] group-hover:bg-accent/8 transition-all duration-1000"></div>
                    
                    <div className="flex justify-between items-center mb-10 relative z-10">
                        <div>
                            <h3 className="text-2xl font-bold text-primary tracking-tight">Throughput Real-time</h3>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1">Matriks Beban Infrastruktur</p>
                        </div>
                        <div className="flex gap-6">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-accent"></div>
                                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Unggah (TX)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-slate-700"></div>
                                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Unduh (RX)</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="relative z-10 h-[300px]">
                        {chartData.length < 2 ? (
                            <div className="h-full flex items-center justify-center">
                                <div className="flex flex-col items-center gap-3 animate-pulse">
                                    <Activity className="w-6 h-6 text-accent/50" />
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Menginisialisasi Telemetri...</span>
                                </div>
                            </div>
                        ) : (
                            <AdvancedMonitorChart data={chartData} />
                        )}
                    </div>
                </div>

                <div className="flex flex-col gap-8">
                    {/* Sync Card */}
                    <div className="glass p-8 rounded-4xl flex flex-col justify-center items-center text-center space-y-5 hover:border-accent/30 transition-all duration-500 bg-white/2 border border-(--glass-border) shadow-xl">
                        <button 
                            onClick={fetchStats} 
                            disabled={loading}
                            className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center text-accent hover:scale-110 transition-all active:scale-95 shadow-lg shadow-accent/5 border border-accent/20 disabled:opacity-50"
                        >
                            <RefreshCw className={`w-6 h-6 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                        <div>
                            <h4 className="font-bold text-primary text-[11px] uppercase tracking-wider">Sinkronisasi Cloud</h4>
                            <p className="text-[9px] text-slate-500 font-bold mt-1 uppercase tracking-widest">Perbarui Status Operasi</p>
                        </div>
                    </div>

                    {/* Critical Alerts */}
                    {!loading && stats.customersWithoutPackage > 0 ? (
                        <div className="bg-amber-500/5 border border-amber-500/20 p-8 rounded-4xl space-y-6 flex-1 flex flex-col justify-between shadow-xl shadow-amber-500/5">
                            <div className="flex items-center gap-5">
                                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20 shadow-inner">
                                    <ShieldAlert className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-amber-600 text-[11px] uppercase tracking-wider">Konflik Status</h4>
                                    <p className="text-[9px] text-slate-500 font-bold mt-1 uppercase tracking-widest">{stats.customersWithoutPackage} Node Tanpa Paket</p>
                                </div>
                            </div>
                            <Link href="/customers" className="w-full py-4 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 font-bold rounded-xl transition-all text-center uppercase tracking-widest text-[9px] border border-amber-500/20 shadow-lg">
                                Selesaikan Konflik
                            </Link>
                        </div>
                    ) : (
                        <div className="bg-accent/5 border border-accent/20 p-8 rounded-4xl space-y-6 flex-1 flex flex-col justify-center items-center text-center shadow-xl shadow-accent/5 group">
                            <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center text-accent border border-accent/20 shadow-inner group-hover:scale-110 transition-transform duration-700">
                                <ShieldAlert className="w-8 h-8" />
                            </div>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] leading-relaxed">Integritas Infrastruktur <br /> <span className="text-accent">Terverifikasi Aman</span></p>
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
