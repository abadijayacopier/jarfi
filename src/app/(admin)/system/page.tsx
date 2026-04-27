'use client';

import { useState, useEffect } from 'react';
import { 
    Activity, Cpu, Server, Clock, HardDrive, Wifi, 
    ArrowDown, ArrowUp, RefreshCw, BarChart3, Zap
} from 'lucide-react';
import dynamic from 'next/dynamic';

const AdvancedMonitorChart = dynamic(() => import('@/components/AdvancedMonitorChart'), { ssr: false });

export default function SystemMonitorPage() {
    const [routers, setRouters] = useState([]);
    const [interfaces, setInterfaces] = useState([]);
    const [selectedRouter, setSelectedRouter] = useState('');
    const [selectedInterface, setSelectedInterface] = useState('');

    const [bwHistory, setBwHistory] = useState<any[]>([]);
    const [latencyHistory, setLatencyHistory] = useState<any[]>([]);
    const [resourceHistory, setResourceHistory] = useState<any[]>([]);
    const [currentStats, setCurrentStats] = useState<any>({ 
        rx: 0, tx: 0, cpu: 0, uptime: '0s', freeMem: 0, totalMem: 1, 
        percentMem: 0, board: '', version: '', architecture: '', cpuModel: '', latency: 0 
    });

    useEffect(() => {
        fetch('/api/routers').then(r => r.json()).then(d => {
            if (d.routers?.length > 0) {
                setRouters(d.routers);
                setSelectedRouter(d.routers[0].id.toString());
            }
        });
    }, []);

    useEffect(() => {
        if (selectedRouter) {
            fetch(`/api/system/bandwidth?router_id=${selectedRouter}&command=interfaces`)
                .then(r => r.json())
                .then(d => {
                    if (d.interfaces) {
                        setInterfaces(d.interfaces);
                        if (d.interfaces.length > 0) setSelectedInterface(d.interfaces[0]);
                    }
                });
        }
    }, [selectedRouter]);

    useEffect(() => {
        if (!selectedRouter || !selectedInterface) return;

        const fetchLiveData = async () => {
            try {
                const res = await fetch(`/api/system/bandwidth?router_id=${selectedRouter}&interface=${selectedInterface}`, { cache: 'no-store' });
                if (res.ok) {
                    const data = await res.json();
                    if (data.rx !== undefined) {
                        setCurrentStats(data);
                        const now = new Date().toLocaleTimeString();
                        setBwHistory(prev => [...prev, { time: now, rx: data.rx, tx: data.tx }].slice(-40));
                        setLatencyHistory(prev => [...prev, { time: now, value: data.latency }].slice(-40));
                        setResourceHistory(prev => [...prev, { time: now, cpu: data.cpu, mem: data.percentMem }].slice(-40));
                    }
                }
            } catch (e) { }
        };

        fetchLiveData();
        const intervalId = setInterval(fetchLiveData, 2000);
        return () => clearInterval(intervalId);
    }, [selectedRouter, selectedInterface]);

    const formatMbps = (bps: number) => (bps / 1000000).toFixed(2);
    const formatMB = (bytes: number) => (bytes / 1024 / 1024).toFixed(1);

    if (!routers.length) return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6">
            <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
            <p className="text-slate-500 uppercase font-black text-xs tracking-widest animate-pulse">Menghubungkan ke Jaringan...</p>
        </div>
    );

    return (
        <div className="animate-in fade-in duration-700 pb-20 space-y-10">
            {/* Top Bar / Header */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 mb-12">
                <div>
                    <h2 className="text-4xl font-black text-primary flex items-center gap-4">
                        <Activity className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                        Infrastructure Monitoring
                    </h2>
                    <p className="text-muted font-medium mt-2">Real-time Advanced Performance Analytics (APM) for ISP Core Infrastructure</p>
                </div>
                
                <div className="flex flex-wrap gap-4 glass p-3 rounded-4xl border border-(--glass-border) shadow-2xl items-center">
                    <div className="flex items-center gap-3 px-5 py-3 bg-slate-100 dark:bg-slate-900/50 rounded-2xl border border-(--glass-border) shadow-inner">
                        <Server className="w-4 h-4 text-slate-500" />
                        <select 
                            value={selectedRouter} 
                            onChange={e => setSelectedRouter(e.target.value)} 
                            className="bg-transparent text-primary text-[10px] font-black uppercase tracking-widest focus:outline-none cursor-pointer"
                        >
                            {routers.map((r: any) => <option key={r.id} value={r.id} className="bg-white dark:bg-slate-900">{r.name}</option>)}
                        </select>
                    </div>
                    <div className="flex items-center gap-3 px-5 py-3 bg-slate-100 dark:bg-slate-900/50 rounded-2xl border border-(--glass-border) shadow-inner">
                        <Wifi className="w-4 h-4 text-slate-500" />
                        <select 
                            value={selectedInterface} 
                            onChange={e => setSelectedInterface(e.target.value)} 
                            className="bg-transparent text-primary text-[10px] font-black uppercase tracking-widest focus:outline-none cursor-pointer"
                        >
                            {interfaces.length === 0 ? <option>Loading...</option> : interfaces.map(i => <option key={i} value={i} className="bg-white dark:bg-slate-900">{i}</option>)}
                        </select>
                    </div>
                    <div className="px-5 py-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 flex items-center gap-3 shadow-sm">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse"></div>
                        <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Streaming: 2s</span>
                    </div>
                </div>
            </div>

            {/* Main Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <div className="glass p-8 rounded-[2.5rem] border border-(--glass-border) relative overflow-hidden group hover:scale-[1.02] transition-all duration-500 shadow-xl">
                    <div className="absolute -right-8 -top-8 w-24 h-24 bg-emerald-500/5 rounded-full blur-3xl group-hover:bg-emerald-500/10 transition-all duration-700"></div>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-4">Throughput RX (Down)</p>
                    <div className="flex items-baseline gap-3">
                        <h4 className="text-4xl font-black text-primary tracking-tight">{formatMbps(currentStats.rx)}</h4>
                        <span className="text-emerald-500 dark:text-emerald-400 text-xs font-black uppercase tracking-widest">Mbps</span>
                    </div>
                    <div className="mt-6 flex items-center gap-2 text-[10px] text-slate-500 font-black uppercase tracking-widest">
                        <ArrowDown className="w-4 h-4 text-emerald-500 animate-bounce" /> Real-time Inbound
                    </div>
                </div>
                
                <div className="glass p-8 rounded-[2.5rem] border border-(--glass-border) relative overflow-hidden group hover:scale-[1.02] transition-all duration-500 shadow-xl">
                    <div className="absolute -right-8 -top-8 w-24 h-24 bg-indigo-500/5 rounded-full blur-3xl group-hover:bg-indigo-500/10 transition-all duration-700"></div>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-4">Throughput TX (Up)</p>
                    <div className="flex items-baseline gap-3">
                        <h4 className="text-4xl font-black text-primary tracking-tight">{formatMbps(currentStats.tx)}</h4>
                        <span className="text-indigo-600 dark:text-indigo-400 text-xs font-black uppercase tracking-widest">Mbps</span>
                    </div>
                    <div className="mt-6 flex items-center gap-2 text-[10px] text-slate-500 font-black uppercase tracking-widest">
                        <ArrowUp className="w-4 h-4 text-indigo-600 dark:text-indigo-400 animate-bounce" /> Real-time Outbound
                    </div>
                </div>

                <div className="glass p-8 rounded-[2.5rem] border border-(--glass-border) relative overflow-hidden group hover:scale-[1.02] transition-all duration-500 shadow-xl">
                    <div className="absolute -right-8 -top-8 w-24 h-24 bg-amber-500/5 rounded-full blur-3xl group-hover:bg-amber-500/10 transition-all duration-700"></div>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-4">Ping Latency (8.8.8.8)</p>
                    <div className="flex items-baseline gap-3">
                        <h4 className="text-4xl font-black text-primary tracking-tight">{currentStats.latency}</h4>
                        <span className="text-amber-500 dark:text-amber-400 text-xs font-black uppercase tracking-widest">ms</span>
                    </div>
                    <div className="mt-6 flex items-center gap-2 text-[10px] text-slate-500 font-black uppercase tracking-widest">
                        <RefreshCw className="w-4 h-4 text-amber-500 animate-spin-slow" /> ICMP Echo Dynamic
                    </div>
                </div>

                <div className="glass p-8 rounded-[2.5rem] border border-(--glass-border) relative overflow-hidden group hover:scale-[1.02] transition-all duration-500 shadow-xl">
                    <div className="absolute -right-8 -top-8 w-24 h-24 bg-purple-500/5 rounded-full blur-3xl group-hover:bg-purple-500/10 transition-all duration-700"></div>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-4">CPU Thread Load</p>
                    <div className="flex items-baseline gap-3">
                        <h4 className="text-4xl font-black text-primary tracking-tight">{currentStats.cpu}</h4>
                        <span className="text-purple-600 dark:text-purple-400 text-xs font-black uppercase tracking-widest">%</span>
                    </div>
                    <div className="mt-6 w-full bg-slate-100 dark:bg-slate-900 rounded-full h-1.5 relative overflow-hidden shadow-inner">
                        <div 
                            className="absolute h-full bg-linear-to-r from-purple-500 to-indigo-500 transition-all duration-1000 rounded-full" 
                            style={{ width: `${currentStats.cpu}%` }}
                        ></div>
                    </div>
                </div>
            </div>

            {/* Large Bandwidth Chart */}
            <div className="glass p-10 lg:p-12 rounded-[3.5rem] border border-(--glass-border) shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] relative overflow-hidden">
                <div className="absolute top-0 right-0 p-12 opacity-[0.03] dark:opacity-[0.05] pointer-events-none">
                    <Wifi className="w-96 h-96 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6 relative z-10">
                    <div>
                        <h3 className="text-2xl font-black text-primary tracking-tight">Advanced Bandwidth Analytics</h3>
                        <p className="text-[10px] text-muted font-black mt-2 uppercase tracking-[0.2em]">Active Monitor: Interface {selectedInterface || 'Searching...'}</p>
                    </div>
                    <div className="flex flex-wrap gap-6 bg-slate-100/50 dark:bg-slate-900/50 px-6 py-3 rounded-2xl border border-(--glass-border) shadow-inner">
                        <div className="flex items-center gap-3">
                            <div className="w-4 h-4 rounded-full bg-indigo-600 shadow-[0_0_10px_rgba(79,70,229,0.4)]"></div>
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Down (RX)</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-4 h-4 rounded-full bg-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.4)]"></div>
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Up (TX)</span>
                        </div>
                    </div>
                </div>
                <div className="h-[450px] relative z-10 w-full">
                    <AdvancedMonitorChart data={bwHistory} type="bandwidth" />
                </div>
            </div>

            {/* Bottom Grid Charts */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                <div className="glass p-10 rounded-[3rem] border border-(--glass-border) shadow-2xl">
                    <div className="flex justify-between items-center mb-10">
                        <h3 className="text-sm font-black text-primary uppercase tracking-[0.2em] flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-amber-500/10">
                                <Zap className="w-5 h-5 text-amber-500" />
                            </div>
                            Latency Jitter Analysis
                        </h3>
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-3 py-1 bg-slate-100 dark:bg-white/5 rounded-full">ms / real-time</span>
                    </div>
                    <div className="h-[300px]">
                        <AdvancedMonitorChart data={latencyHistory} type="latency" title="ICMP Performance Data" />
                    </div>
                </div>

                <div className="glass p-10 rounded-[3rem] border border-(--glass-border) shadow-2xl">
                    <div className="flex justify-between items-center mb-10">
                        <h3 className="text-sm font-black text-primary uppercase tracking-[0.2em] flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-purple-500/10">
                                <BarChart3 className="w-5 h-5 text-purple-500" />
                            </div>
                            Resource Health Check
                        </h3>
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-3 py-1 bg-slate-100 dark:bg-white/5 rounded-full">CPU & RAM Metrics</span>
                    </div>
                    <div className="h-[300px]">
                        <AdvancedMonitorChart 
                            data={resourceHistory.map(h => ({ ...h, value: h.cpu }))} 
                            type="resources" 
                            title="System Load Distribution" 
                        />
                    </div>
                </div>
            </div>

            {/* System Info Footer */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-slate-100 dark:bg-slate-900/40 border border-(--glass-border) p-6 rounded-4xl shadow-inner group hover:bg-white dark:hover:bg-slate-900/60 transition-all">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 group-hover:text-indigo-500 transition-colors">Board Specification</p>
                    <p className="text-sm font-black text-primary truncate tracking-tight">{currentStats.board || 'GENERIC MIKROTIK'}</p>
                </div>
                <div className="bg-slate-100 dark:bg-slate-900/40 border border-(--glass-border) p-6 rounded-4xl shadow-inner group hover:bg-white dark:hover:bg-slate-900/60 transition-all">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 group-hover:text-indigo-500 transition-colors">Firmware Kernel</p>
                    <p className="text-sm font-black text-primary tracking-tight">RouterOS v{currentStats.version || '6.xx+'}</p>
                </div>
                <div className="bg-slate-100 dark:bg-slate-900/40 border border-(--glass-border) p-6 rounded-4xl shadow-inner group hover:bg-white dark:hover:bg-slate-900/60 transition-all">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 group-hover:text-indigo-500 transition-colors">Processor Architecture</p>
                    <p className="text-sm font-black text-primary truncate uppercase tracking-tight">{currentStats.architecture || 'X86 / TILE'}</p>
                </div>
                <div className="bg-slate-100 dark:bg-slate-900/40 border border-(--glass-border) p-6 rounded-4xl shadow-inner group hover:bg-white dark:hover:bg-slate-900/60 transition-all">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 group-hover:text-indigo-500 transition-colors">Operational Uptime</p>
                    <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 tracking-tight">{currentStats.uptime || '00:00:00'}</p>
                </div>
            </div>
        </div>
    );
}
