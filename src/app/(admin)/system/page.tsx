'use client';

import { useState, useEffect } from 'react';
import { Activity, Cpu, Server, Clock, HardDrive, Wifi, ArrowDown, ArrowUp } from 'lucide-react';

export default function SystemMonitorPage() {
    const [routers, setRouters] = useState([]);
    const [interfaces, setInterfaces] = useState([]);
    const [selectedRouter, setSelectedRouter] = useState('');
    const [selectedInterface, setSelectedInterface] = useState('');

    const [bwHistory, setBwHistory] = useState<any[]>([]);
    const [currentStats, setCurrentStats] = useState<any>({ rx: 0, tx: 0, cpu: 0, uptime: '0s', freeMem: 0, totalMem: 1, percentMem: 0, board: '', version: '', architecture: '', cpuModel: '' });

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
                        setBwHistory(prev => [...prev, { rx: data.rx, tx: data.tx }].slice(-35));
                    }
                }
            } catch (e) { }
        };

        fetchLiveData();
        const intervalId = setInterval(fetchLiveData, 1500);
        return () => clearInterval(intervalId);
    }, [selectedRouter, selectedInterface]);

    if (!routers.length) return <div className="p-8 text-center text-slate-400 flex flex-col items-center gap-4 mt-20"><Activity className="w-10 h-10 animate-spin text-blue-500" />Mencari Mikrotik yang terhubung...</div>;

    const formatMbps = (bps: number) => (bps / 1000000).toFixed(2);
    const formatMB = (bytes: number) => (bytes / 1024 / 1024).toFixed(1);
    const maxBw = Math.max(...bwHistory.map(h => Math.max(h.rx, h.tx)), 1000000);

    return (
        <div className="animate-in fade-in duration-500 pb-10">
            <div className="mb-8 border-b border-white/5 pb-4">
                <h3 className="text-3xl font-bold text-white flex items-center gap-3">
                    <Server className="w-8 h-8 text-indigo-400 animate-pulse" />
                    Mikrotik RouterOS Monitor
                </h3>
                <p className="text-slate-400 mt-1">Pemantauan performa CPU, Memori, dan Grafik Bandwidth langsung dari detak jantung Mikrotik.</p>
            </div>

            {/* Mikrotik ISP Bandwidth */}
            <div className="glass p-6 rounded-2xl border border-white/10 mb-8 overflow-hidden bg-slate-900/60 shadow-xl transition-all">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <div>
                        <h4 className="text-xl font-bold text-white flex items-center gap-2">
                            <Wifi className="w-6 h-6 text-indigo-400" />
                            Live Router Traffic (Bandwidth)
                        </h4>
                        <p className="text-sm text-slate-400 mt-1">Lalu lintas jaringan riil per *Interface* Mikrotik</p>
                    </div>

                    <div className="flex flex-wrap gap-4">
                        <select value={selectedRouter} onChange={e => setSelectedRouter(e.target.value)} className="bg-slate-800 border border-slate-700 text-white text-sm rounded-lg focus:outline-none focus:border-indigo-400 p-2 min-w-[150px] shadow-inner font-semibold">
                            {routers.map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
                        </select>
                        <select value={selectedInterface} onChange={e => setSelectedInterface(e.target.value)} className="bg-slate-800 border border-slate-700 text-white text-sm rounded-lg focus:outline-none focus:border-indigo-400 p-2 min-w-[120px] shadow-inner font-semibold">
                            {interfaces.length === 0 ? <option>Loading...</option> : interfaces.map(i => <option key={i} value={i}>{i}</option>)}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-6">
                    <div className="bg-slate-800/50 p-6 rounded-xl border border-green-500/20 text-center md:text-left transition-colors">
                        <div className="flex items-center justify-center md:justify-start gap-2 text-green-400 font-bold mb-2">
                            <ArrowDown className="w-5 h-5 animate-bounce" /> Download Rate (RX)
                        </div>
                        <p className="text-4xl md:text-5xl font-black text-white tracking-widest tabular-nums drop-shadow-md">{formatMbps(currentStats.rx)} <span className="text-lg text-slate-500 font-semibold font-sans tracking-normal">Mbps</span></p>
                    </div>

                    <div className="bg-slate-800/50 p-6 rounded-xl border border-blue-500/20 text-center md:text-left transition-colors">
                        <div className="flex items-center justify-center md:justify-start gap-2 text-blue-400 font-bold mb-2">
                            <ArrowUp className="w-5 h-5 animate-bounce" /> Upload Rate (TX)
                        </div>
                        <p className="text-4xl md:text-5xl font-black text-white tracking-widest tabular-nums drop-shadow-md">{formatMbps(currentStats.tx)} <span className="text-lg text-slate-500 font-semibold font-sans tracking-normal">Mbps</span></p>
                    </div>
                </div>

                {/* Real-time Graph Visualizer */}
                <div className="relative h-48 w-full bg-slate-950 rounded-xl border border-slate-800 overflow-hidden flex items-end">
                    <div className="absolute top-4 left-4 text-[10px] text-slate-600 font-bold font-mono">{(maxBw / 1000000).toFixed(0)} M</div>
                    <div className="absolute top-1/2 left-4 text-[10px] text-slate-600 font-bold font-mono">{(maxBw / 2000000).toFixed(0)} M</div>
                    <div className="absolute bottom-4 left-4 text-[10px] text-slate-600 font-bold font-mono">0 M</div>

                    <div className="absolute top-0 w-full border-t border-slate-800/50 border-dashed z-0"></div>
                    <div className="absolute top-1/2 w-full border-t border-slate-800/50 border-dashed z-0"></div>

                    <div className="flex items-end w-full h-full pb-0 pt-6 gap-px justify-end px-2 z-10">
                        {bwHistory.map((point, index) => {
                            const rxH = Math.max((point.rx / maxBw) * 100, 1);
                            const txH = Math.max((point.tx / maxBw) * 100, 1);
                            return (
                                <div key={index} className="flex-1 flex flex-col justify-end h-full opacity-90 hover:opacity-100 min-w-[5px] group relative">
                                    <div className="w-full bg-blue-500/80 transition-all duration-300 rounded-t-sm" style={{ height: `${txH}%` }}></div>
                                    <div className="w-full bg-green-500/80 transition-all duration-300" style={{ height: `${rxH}%` }}></div>
                                    <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 px-2 py-1 rounded text-[10px] font-bold text-white whitespace-nowrap z-50 pointer-events-none shadow-lg border border-slate-700">
                                        ↓ {formatMbps(point.rx)} | ↑ {formatMbps(point.tx)}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="glass p-6 rounded-2xl border border-white/10 relative overflow-hidden transition-all hover:border-white/20 flex flex-col z-20">
                    <div className="absolute top-0 right-0 w-full h-full bg-linear-to-b from-indigo-500/5 to-transparent -z-10 pointer-events-none"></div>
                    <p className="text-slate-400 text-sm font-medium flex items-center gap-2 mb-3"><Cpu className="w-5 h-5 text-purple-400 animate-pulse" /> Beban CPU Mikrotik</p>
                    <h4 className="text-4xl font-black text-white mt-1 drop-shadow-md">{currentStats.cpu}%</h4>

                    <div className="w-full bg-slate-800 rounded-full h-2 mb-4 mt-2 shadow-inner border border-white/5">
                        <div className={`h-full rounded-full transition-all duration-1000 ${currentStats.cpu > 80 ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]' : 'bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.8)]'}`} style={{ width: `${currentStats.cpu}%` }}></div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-auto border-t border-white/5 pt-4">
                        <div>
                            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Board Name</p>
                            <p className="text-sm font-black text-purple-400 truncate">{currentStats.board || '-'}</p>
                        </div>
                        <div>
                            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Architecture / CPU</p>
                            <p className="text-sm font-black text-white capitalize break-all">{currentStats.architecture} {currentStats.cpuModel}</p>
                        </div>
                    </div>
                </div>

                <div className="glass p-6 rounded-2xl border border-white/10 relative overflow-hidden transition-all hover:border-white/20 flex flex-col z-20">
                    <div className="absolute top-0 right-0 w-full h-full bg-linear-to-b from-orange-500/5 to-transparent -z-10 pointer-events-none"></div>
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-slate-400 text-sm font-medium flex items-center gap-2"><HardDrive className="w-5 h-5 text-orange-400 animate-pulse" /> Memori Mikrotik (RAM)</p>
                            <h4 className="text-4xl font-black text-white mt-1 drop-shadow-md">{currentStats.percentMem}%</h4>
                        </div>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2 mb-2 shadow-inner border border-white/5">
                        <div className={`h-full rounded-full transition-all duration-1000 ${currentStats.percentMem > 80 ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]' : 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.8)]'}`} style={{ width: `${currentStats.percentMem}%` }}></div>
                    </div>
                    <p className="text-xs text-slate-400 font-bold mt-auto border-t border-white/5 pt-4">
                        Bebas Tersisa: <span className="text-white">{formatMB(currentStats.freeMem)} MB</span> / {formatMB(currentStats.totalMem)} MB
                    </p>
                </div>

                <div className="glass p-6 rounded-2xl border border-white/10 relative overflow-hidden transition-all hover:border-white/20 flex flex-col z-20">
                    <div className="absolute top-0 right-0 w-full h-full bg-linear-to-b from-pink-500/5 to-transparent -z-10 pointer-events-none"></div>
                    <div className="absolute -right-4 -bottom-4 opacity-5 pointer-events-none">
                        <Server className="w-48 h-48" />
                    </div>
                    <p className="text-slate-400 text-sm font-medium flex items-center gap-2 mb-3"><Clock className="w-5 h-5 text-pink-400 animate-pulse" /> RouterOS Uptime</p>
                    <h4 className="text-2xl lg:text-3xl font-black text-pink-400 drop-shadow-md leading-tight">{currentStats.uptime}</h4>

                    <div className="mt-auto border-t border-white/5 pt-4">
                        <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">RouterOS Version</p>
                        <p className="text-sm font-black text-white">v{currentStats.version}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
