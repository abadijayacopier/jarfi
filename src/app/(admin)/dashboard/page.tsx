'use client';

import { useState, useEffect } from 'react';

export default function Dashboard() {
    const [stats, setStats] = useState({ totalCustomers: 0, activePppoe: 0, routerStats: [] });
    const [loading, setLoading] = useState(true);
    const [logs, setLogs] = useState<any[]>([]);
    const [selectedLogRouter, setSelectedLogRouter] = useState<string>('');

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
        setLoading(true);
        try {
            const res = await fetch('/api/dashboard/stats');
            const data = await res.json();
            if (res.ok) setStats(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-3xl font-bold text-white">Dashboard Admin</h2>
                    <p className="text-slate-400 mt-1">Status CPU, Uptime, & Total User Terhubung Secara Real-Time dari Mikrotik</p>
                </div>
                <button onClick={fetchStats} className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-sm text-white transition flex items-center gap-2 border border-white/5">
                    <span className="material-symbols-outlined text-sm">refresh</span> Refresh / Tarik Data Router
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="glass p-6 rounded-2xl border border-white/10">
                    <p className="text-slate-400 text-sm mb-1">Total Pelanggan Terdaftar</p>
                    <p className="text-3xl font-black text-white">{loading ? '...' : stats.totalCustomers}</p>
                </div>
                <div className="glass p-6 rounded-2xl border border-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.1)]">
                    <p className="text-indigo-300 text-sm mb-1">Sesi PPPoE Aktif (Real-Time)</p>
                    <p className="text-3xl font-black text-indigo-400">{loading ? '...' : stats.activePppoe}</p>
                </div>
                <div className="glass p-6 rounded-2xl border border-teal-500/30 shadow-[0_0_20px_rgba(20,184,166,0.1)]">
                    <p className="text-teal-300 text-sm mb-1">Estimasi Pemasukan</p>
                    <p className="text-3xl font-black text-teal-400">Rp {(stats.totalCustomers * 150000).toLocaleString('id-ID')}</p>
                </div>
                <div className="glass p-6 rounded-2xl border border-white/10">
                    <p className="text-slate-400 text-sm mb-1">Router Database Terdata</p>
                    <p className="text-3xl font-black text-white">{loading ? '...' : stats.routerStats.length}</p>
                </div>
            </div>

            <h3 className="text-xl font-bold text-white mt-10 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-teal-400">podcasts</span>
                Pemantauan Node Router Mikrotik (Live)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {loading ? (
                    <div className="text-slate-400 col-span-3">Menarik data dari API router di latar belakang...</div>
                ) : stats.routerStats.length === 0 ? (
                    <div className="text-slate-400 col-span-3">Belum ada router di database.</div>
                ) : (
                    stats.routerStats.map((router: any) => (
                        <div key={router.id} className="glass p-6 rounded-2xl border border-white/10 relative overflow-hidden transition-all hover:border-white/20 hover:bg-white/[0.07]">
                            {router.error ? (
                                <>
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h4 className="font-bold text-lg text-white">{router.name}</h4>
                                            <p className="text-xs text-slate-400">Gagal Tersambung</p>
                                        </div>
                                        <span className="px-2 py-1 text-[10px] font-bold uppercase rounded bg-red-500/20 text-red-400">Offline / Timeout</span>
                                    </div>
                                    <p className="text-sm text-red-300 mb-2">Pastikan router dalam kondisi hidup, port API tidak ditutup, dan memiliki IP publik/routing yang tepat.</p>
                                </>
                            ) : (
                                <>
                                    <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
                                        <span className="material-symbols-outlined text-7xl">router</span>
                                    </div>
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h4 className="font-bold text-lg text-white">{router.name}</h4>
                                            <p className="text-xs text-slate-400">v{router.version}</p>
                                        </div>
                                        <span className="px-2 py-1 text-[10px] font-bold uppercase rounded bg-teal-500/20 text-teal-400 shadow-[0_0_10px_rgba(20,184,166,0.3)]">API Online</span>
                                    </div>

                                    <div className="space-y-5">
                                        <div>
                                            <div className="flex justify-between text-xs mb-1.5 font-medium">
                                                <span className="text-slate-300">Live CPU Load</span>
                                                <span className="text-white">{router.cpu}%</span>
                                            </div>
                                            <div className="w-full bg-slate-800 rounded-full h-2">
                                                <div className={`h-full rounded-full transition-all duration-1000 ${router.cpu > 80 ? 'bg-red-500' : 'bg-teal-500'}`} style={{ width: `${router.cpu}%` }}></div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/10">
                                            <div>
                                                <p className="text-xs text-slate-500 font-medium">Lama Hidup (Uptime)</p>
                                                <p className="text-sm font-black text-white mt-0.5">{router.uptime}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500 font-medium">User PPPoE Aktif</p>
                                                <p className="text-sm font-black text-indigo-400 mt-0.5">{router.activeUsers} Sesi Koneksi</p>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Mikrotik Live Logs */}
            <div className="mt-10 mb-8 pt-6 border-t border-white/5">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-blue-400">terminal</span>
                        Live RouterOS Activity Logs
                    </h3>
                    <select
                        value={selectedLogRouter}
                        onChange={(e) => setSelectedLogRouter(e.target.value)}
                        className="bg-slate-800 border border-slate-700 text-white text-sm rounded-lg focus:outline-none focus:border-indigo-400 p-2.5 shadow-inner min-w-[200px] font-semibold"
                    >
                        {stats.routerStats.map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                </div>

                <div className="glass rounded-xl border border-slate-700 overflow-hidden bg-black/60 shadow-inner">
                    <div className="flex bg-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-widest px-4 py-3 border-b border-slate-700">
                        <div className="w-1/4 sm:w-1/6">Waktu Kejadian</div>
                        <div className="w-1/4 sm:w-1/5 hidden sm:block">Topik / Modul</div>
                        <div className="flex-1">Detail Pesan Sistem Mikrotik</div>
                    </div>
                    <div className="h-[350px] overflow-y-auto font-mono text-[13px] scrollbar-hide">
                        {logs.length === 0 ? (
                            <div className="text-slate-500 text-center p-8 flex flex-col items-center justify-center h-full">
                                <span className="material-symbols-outlined text-4xl mb-2 opacity-50">history</span>
                                Menarik data log mikrotik...
                            </div>
                        ) : (
                            logs.map((log: any, idx) => (
                                <div
                                    key={log['.id'] || idx}
                                    className={`flex px-4 py-2 hover:bg-slate-800/80 border-b border-white/5 transition-colors ${log.topics?.includes('error') ? 'text-red-400 bg-red-500/5' :
                                        log.topics?.includes('warning') ? 'text-orange-400' : 'text-slate-300'
                                        }`}
                                >
                                    <div className="w-1/4 sm:w-1/6 text-slate-500 truncate pr-2 shrink-0">{log.time}</div>
                                    <div className="w-1/4 sm:w-1/5 hidden sm:block text-indigo-400 truncate pr-2 font-bold shrink-0">{log.topics}</div>
                                    <div className="flex-1 text-wrap break-all pr-2">{log.message}</div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
