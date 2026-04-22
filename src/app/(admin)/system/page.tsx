'use client';

import { useState, useEffect } from 'react';
import { 
    Activity, Cpu, Server, Clock, HardDrive, Wifi, 
    ArrowDown, ArrowUp, RefreshCw, BarChart3, Zap, Pulse
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
        <div className="space-y-6 animate-in fade-in duration-700 pb-20">
            {/* Top Bar / Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-10">
                <div>
                    <h2 className="text-3xl font-black text-white flex items-center gap-3">
                        <Activity className="w-8 h-8 text-indigo-500" />
                        Network Core Monitoring
                    </h2>
                    <p className="text-slate-400 font-medium mt-1">Real-time Advanced Performance Analytics (APM) for ISP Infrastructure</p>
                </div>
                
                <div className="flex flex-wrap gap-3 glass p-2 rounded-2xl border border-white/5 shadow-2xl">
                    <div className="flex items-center gap-2 px-4 py-2 bg-slate-900/50 rounded-xl border border-white/5">
                        <Server className="w-4 h-4 text-slate-500" />
                        <select value={selectedRouter} onChange={e => setSelectedRouter(e.target.value)} className="bg-transparent text-white text-xs font-black uppercase tracking-tight focus:outline-none">
                            {routers.map((r: any) => <option key={r.id} value={r.id} className="bg-slate-900">{r.name}</option>)}
                        </select>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-slate-900/50 rounded-xl border border-white/5">
                        <Wifi className="w-4 h-4 text-slate-500" />
                        <select value={selectedInterface} onChange={e => setSelectedInterface(e.target.value)} className="bg-transparent text-white text-xs font-black uppercase tracking-tight focus:outline-none">
                            {interfaces.length === 0 ? <option>Loading...</option> : interfaces.map(i => <option key={i} value={i} className="bg-slate-900">{i}</option>)}
                        </select>
                    </div>
                    <div className="px-4 py-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Live: 2s</span>
                    </div>
                </div>
            </div>

            {/* Main Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="glass p-6 rounded-3xl border border-white/10 relative overflow-hidden group">
                    <div className="absolute -right-6 -top-6 w-20 h-20 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all"></div>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">Throughput RX (Down)</p>
                    <div className="flex items-baseline gap-2">
                        <h4 className="text-3xl font-black text-white">{formatMbps(currentStats.rx)}</h4>
                        <span className="text-emerald-400 text-xs font-bold">Mbps</span>
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-[10px] text-slate-400 font-bold">
                        <ArrowDown className="w-3 h-3 text-emerald-400 animate-bounce" /> Real-time Inbound
                    </div>
                </div>
                
                <div className="glass p-6 rounded-3xl border border-white/10 relative overflow-hidden group">
                    <div className="absolute -right-6 -top-6 w-20 h-20 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-all"></div>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">Throughput TX (Up)</p>
                    <div className="flex items-baseline gap-2">
                        <h4 className="text-3xl font-black text-white">{formatMbps(currentStats.tx)}</h4>
                        <span className="text-indigo-400 text-xs font-bold">Mbps</span>
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-[10px] text-slate-400 font-bold">
                        <ArrowUp className="w-3 h-3 text-indigo-400 animate-bounce" /> Real-time Outbound
                    </div>
                </div>

                <div className="glass p-6 rounded-3xl border border-white/10 relative overflow-hidden group">
                    <div className="absolute -right-6 -top-6 w-20 h-20 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-all"></div>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">Network Latency (8.8.8.8)</p>
                    <div className="flex items-baseline gap-2">
                        <h4 className="text-3xl font-black text-white">{currentStats.latency}</h4>
                        <span className="text-amber-400 text-xs font-bold">ms</span>
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-[10px] text-slate-400 font-bold">
                        <RefreshCw className="w-3 h-3 text-amber-400 animate-spin-slow" /> ICMP Echo Request
                    </div>
                </div>

                <div className="glass p-6 rounded-3xl border border-white/10 relative overflow-hidden group">
                    <div className="absolute -right-6 -top-6 w-20 h-20 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/10 transition-all"></div>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">Resource Allocation (CPU)</p>
                    <div className="flex items-baseline gap-2">
                        <h4 className="text-3xl font-black text-white">{currentStats.cpu}</h4>
                        <span className="text-purple-400 text-xs font-bold">%</span>
                    </div>
                    <div className="mt-4 w-full bg-slate-900 rounded-full h-1 relative overflow-hidden">
                        <div className="absolute h-full bg-purple-500 transition-all duration-1000" style={{ width: `${currentStats.cpu}%` }}></div>
                    </div>
                </div>
            </div>

            {/* Large Bandwidth Chart */}
            <div className="glass p-8 rounded-4xl border border-white/10 shadow-3xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                    <Wifi className="w-64 h-64 text-indigo-500" />
                </div>
                <div className="flex justify-between items-center mb-8 relative z-10">
                    <div>
                        <h3 className="text-xl font-black text-white uppercase tracking-tight">Main Bandwidth Analytics</h3>
                        <p className="text-xs text-slate-500 font-bold mt-1 uppercase tracking-widest">Interface: {selectedInterface || 'Detecting...'}</p>
                    </div>
                    <div className="flex gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Download (RX)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-pink-500"></div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Upload (TX)</span>
                        </div>
                    </div>
                </div>
                <div className="h-[400px] relative z-10">
                    <AdvancedMonitorChart data={bwHistory} type="bandwidth" />
                </div>
            </div>

            {/* Bottom Grid Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass p-8 rounded-4xl border border-white/10 shadow-2xl">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                            <Zap className="w-4 h-4 text-amber-400" /> Latency Consistency
                        </h3>
                        <span className="text-[10px] font-black text-slate-500">ms / 2s interval</span>
                    </div>
                    <div className="h-[250px]">
                        <AdvancedMonitorChart data={latencyHistory} type="latency" title="Ping Jitter Analytics" />
                    </div>
                </div>

                <div className="glass p-8 rounded-4xl border border-white/10 shadow-2xl">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                            <BarChart3 className="w-4 h-4 text-purple-400" /> Router OS Health
                        </h3>
                        <span className="text-[10px] font-black text-slate-500">CPU & RAM Percentage</span>
                    </div>
                    <div className="h-[250px]">
                        <AdvancedMonitorChart 
                            data={resourceHistory.map(h => ({ ...h, value: h.cpu }))} 
                            type="resources" 
                            title="CPU Thread Load Monitoring" 
                        />
                    </div>
                </div>
            </div>

            {/* System Info Footer */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-900/50 border border-white/5 p-4 rounded-2xl">
                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Board Name</p>
                    <p className="text-xs font-black text-white truncate">{currentStats.board || '-'}</p>
                </div>
                <div className="bg-slate-900/50 border border-white/5 p-4 rounded-2xl">
                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">RouterOS Version</p>
                    <p className="text-xs font-black text-white">v{currentStats.version}</p>
                </div>
                <div className="bg-slate-900/50 border border-white/5 p-4 rounded-2xl">
                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Architecture</p>
                    <p className="text-xs font-black text-white truncate uppercase">{currentStats.architecture}</p>
                </div>
                <div className="bg-slate-900/50 border border-white/5 p-4 rounded-2xl">
                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">System Uptime</p>
                    <p className="text-xs font-black text-emerald-400">{currentStats.uptime}</p>
                </div>
            </div>
        </div>
    );
}
