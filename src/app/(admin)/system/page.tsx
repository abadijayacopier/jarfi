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

    if (!routers.length) return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6">
            <div className="w-12 h-12 border-4 border-accent/10 border-t-accent rounded-full animate-spin"></div>
            <p className="text-slate-500 uppercase font-bold text-[10px] tracking-widest animate-pulse">Membangun Tautan Gateway...</p>
        </div>
    );

    return (
        <div className="animate-in fade-in duration-500 pb-20 space-y-12">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-10 border-b border-slate-200 dark:border-white/5 pb-8">
                <div className="space-y-1">
                    <h3 className="text-2xl font-black flex items-center gap-4 text-slate-800 dark:text-white uppercase tracking-tight">
                        <Activity className="w-8 h-8 text-accent" />
                        Monitoring
                    </h3>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest opacity-60">Metrik Performa & Telemetri Real-time</p>
                </div>
                
                <div className="flex flex-wrap gap-3 glass p-2.5 rounded-3xl border border-slate-200 dark:border-white/5 bg-white/40 dark:bg-slate-900/40 shadow-lg items-center backdrop-blur-xl">
                    <div className="flex items-center gap-2.5 px-4 py-2 bg-slate-100 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/5">
                        <Server className="w-3.5 h-3.5 text-accent/50" />
                        <select 
                            value={selectedRouter} 
                            onChange={e => setSelectedRouter(e.target.value)} 
                            className="bg-transparent text-slate-700 dark:text-slate-200 text-[9px] font-black uppercase tracking-widest focus:outline-none cursor-pointer appearance-none"
                        >
                            {routers.map((r: any) => <option key={r.id} value={r.id} className="bg-slate-900">{r.name}</option>)}
                        </select>
                    </div>
                    <div className="flex items-center gap-2.5 px-4 py-2 bg-slate-100 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/5">
                        <Wifi className="w-3.5 h-3.5 text-accent/50" />
                        <select 
                            value={selectedInterface} 
                            onChange={e => setSelectedInterface(e.target.value)} 
                            className="bg-transparent text-slate-700 dark:text-slate-200 text-[9px] font-black uppercase tracking-widest focus:outline-none cursor-pointer appearance-none"
                        >
                            {interfaces.length === 0 ? <option>MEMERIKSA...</option> : interfaces.map(i => <option key={i} value={i} className="bg-slate-900">{i}</option>)}
                        </select>
                    </div>
                    <div className="px-4 py-2 bg-accent/10 rounded-xl border border-accent/20 flex items-center gap-2.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-accent shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse"></div>
                        <span className="text-[9px] font-black text-accent uppercase tracking-widest">Live Connection</span>
                    </div>
                </div>
            </div>

            {/* Core Metrics Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Downlink (RX)', value: formatMbps(currentStats.rx), unit: 'Mbps', icon: ArrowDown, color: 'accent', detail: 'Ingress' },
                    { label: 'Uplink (TX)', value: formatMbps(currentStats.tx), unit: 'Mbps', icon: ArrowUp, color: 'blue-500', detail: 'Egress' },
                    { label: 'Latensi', value: currentStats.latency, unit: 'ms', icon: Zap, color: 'amber-500', detail: 'ICMP' },
                    { label: 'Beban Inti', value: currentStats.cpu, unit: '%', icon: Cpu, color: 'purple-500', detail: 'CPU' }
                ].map((stat, idx) => (
                    <div key={idx} className="bg-white dark:bg-slate-900/50 p-6 rounded-[28px] border border-slate-200 dark:border-white/5 relative overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-500 shadow-sm backdrop-blur-xl">
                        <div className={`absolute -right-6 -top-6 w-16 h-16 bg-${stat.color}/5 rounded-full blur-2xl group-hover:bg-${stat.color}/10 transition-all duration-700`}></div>
                        <p className="text-slate-400 dark:text-slate-500 text-[8px] font-black uppercase tracking-widest mb-2">{stat.label}</p>
                        <div className="flex items-baseline gap-2">
                            <h4 className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter">{stat.value}</h4>
                            <span className={`text-${stat.color} text-[8px] font-black uppercase tracking-widest opacity-60`}>{stat.unit}</span>
                        </div>
                        <div className="mt-4 flex items-center gap-2 text-[8px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest opacity-40">
                            <stat.icon className={`w-3.5 h-3.5 text-${stat.color} ${stat.icon === Zap ? 'animate-pulse' : ''}`} /> {stat.detail}
                        </div>
                    </div>
                ))}
            </div>

            {/* Throughput Analytics */}
            <div className="bg-white dark:bg-slate-900/50 p-8 rounded-[32px] border border-slate-200 dark:border-white/5 shadow-xl relative overflow-hidden group backdrop-blur-xl">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-6 relative z-10">
                    <div>
                        <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">Analitik Throughput</h3>
                        <p className="text-[9px] text-slate-400 dark:text-slate-500 font-black mt-1 uppercase tracking-widest">Interface: {selectedInterface || 'Memeriksa Node...'}</p>
                    </div>
                    <div className="flex gap-6 bg-slate-50 dark:bg-white/5 px-6 py-3 rounded-xl border border-slate-200 dark:border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="w-2.5 h-2.5 rounded-full bg-accent shadow-[0_0_8px_rgba(16,185,129,0.4)]"></div>
                            <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Downlink</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]"></div>
                            <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Uplink</span>
                        </div>
                    </div>
                </div>
                <div className="h-[380px] relative z-10 w-full rounded-[24px] overflow-hidden border border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-slate-950/30 backdrop-blur-sm">
                    <AdvancedMonitorChart data={bwHistory} type="bandwidth" />
                </div>
            </div>

            {/* Sub Metrics Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                <div className="bg-white dark:bg-slate-900/50 p-6 rounded-[28px] border border-slate-200 dark:border-white/5 shadow-xl backdrop-blur-xl">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-[9px] font-black text-slate-800 dark:text-white uppercase tracking-widest flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-amber-500/5 border border-amber-500/10">
                                <Zap className="w-3.5 h-3.5 text-amber-500" />
                            </div>
                            Analisis Latensi
                        </h3>
                        <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-2.5 py-1 bg-slate-50 dark:bg-white/5 rounded-md border border-slate-200 dark:border-white/5">Siaran Langsung</span>
                    </div>
                    <div className="h-[250px] rounded-2xl overflow-hidden border border-slate-100 dark:border-white/5 bg-slate-50/30 dark:bg-slate-950/20">
                        <AdvancedMonitorChart data={latencyHistory} type="latency" />
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900/50 p-6 rounded-[28px] border border-slate-200 dark:border-white/5 shadow-xl backdrop-blur-xl">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-[9px] font-black text-slate-800 dark:text-white uppercase tracking-widest flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-purple-500/5 border border-purple-500/10">
                                <BarChart3 className="w-3.5 h-3.5 text-purple-500" />
                            </div>
                            Vektor Infrastruktur
                        </h3>
                        <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-2.5 py-1 bg-slate-50 dark:bg-white/5 rounded-md border border-slate-200 dark:border-white/5">Beban CPU</span>
                    </div>
                    <div className="h-[250px] rounded-2xl overflow-hidden border border-slate-100 dark:border-white/5 bg-slate-50/30 dark:bg-slate-950/20">
                        <AdvancedMonitorChart 
                            data={resourceHistory.map(h => ({ ...h, value: h.cpu }))} 
                            type="resources" 
                        />
                    </div>
                </div>
            </div>

            {/* Node Metadata Footer */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {[
                    { label: 'Spek Perangkat Keras', value: currentStats.board || 'CORE-NODE-X', sub: 'Identifikasi Matriks' },
                    { label: 'Versi Kernel', value: `Build v${currentStats.version || '6.xx+'}`, sub: 'Kernel Perangkat Lunak' },
                    { label: 'Arsitektur', value: currentStats.architecture || 'X86 / TILE', sub: 'Fabrik Prosesor' },
                    { label: 'Kontinuitas Sistem', value: currentStats.uptime || '00:00:00', sub: 'Vektor Uptime', highlight: true }
                ].map((meta, idx) => (
                    <div key={idx} className="bg-white/1 border border-(--glass-border) p-8 rounded-4xl shadow-inner group hover:bg-white/2 transition-all duration-500">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 group-hover:text-accent transition-colors">{meta.label}</p>
                        <p className={`text-base font-bold ${meta.highlight ? 'text-accent' : 'text-primary'} tracking-tight truncate`}>{meta.value}</p>
                        <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest mt-2 opacity-40">{meta.sub}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
