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
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 mb-16 border-b border-(--glass-border) pb-10">
                <div className="space-y-2">
                    <h3 className="text-heading flex items-center gap-5">
                        <Activity className="w-10 h-10 text-accent fill-accent/5" />
                        Monitor Sistem
                    </h3>
                    <p className="text-label mt-2 opacity-100">Metrik Performa & Telemetri Infrastruktur Jaringan secara Real-time.</p>
                </div>
                
                <div className="flex flex-wrap gap-4 glass p-3 rounded-4xl border border-(--glass-border) bg-white/2 shadow-xl items-center">
                    <div className="flex items-center gap-3 px-5 py-2.5 bg-white/5 rounded-2xl border border-white/5">
                        <Server className="w-4 h-4 text-accent/50" />
                        <select 
                            value={selectedRouter} 
                            onChange={e => setSelectedRouter(e.target.value)} 
                            className="bg-transparent text-primary text-[10px] font-bold uppercase tracking-widest focus:outline-none cursor-pointer appearance-none"
                        >
                            {routers.map((r: any) => <option key={r.id} value={r.id} className="bg-slate-900">{r.name}</option>)}
                        </select>
                    </div>
                    <div className="flex items-center gap-3 px-5 py-2.5 bg-white/5 rounded-2xl border border-white/5">
                        <Wifi className="w-4 h-4 text-accent/50" />
                        <select 
                            value={selectedInterface} 
                            onChange={e => setSelectedInterface(e.target.value)} 
                            className="bg-transparent text-primary text-[10px] font-bold uppercase tracking-widest focus:outline-none cursor-pointer appearance-none"
                        >
                            {interfaces.length === 0 ? <option>MEMERIKSA...</option> : interfaces.map(i => <option key={i} value={i} className="bg-slate-900">{i}</option>)}
                        </select>
                    </div>
                    <div className="px-5 py-2.5 bg-accent/10 rounded-2xl border border-accent/20 flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-accent shadow-[0_0_12px_rgba(16,185,129,0.5)] animate-pulse"></div>
                        <span className="text-[10px] font-bold text-accent uppercase tracking-widest">Koneksi Aktif</span>
                    </div>
                </div>
            </div>

            {/* Core Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {[
                    { label: 'Downlink (RX)', value: formatMbps(currentStats.rx), unit: 'Mbps', icon: ArrowDown, color: 'accent', detail: 'Ingress Real-time' },
                    { label: 'Uplink (TX)', value: formatMbps(currentStats.tx), unit: 'Mbps', icon: ArrowUp, color: 'sky-500', detail: 'Egress Real-time' },
                    { label: 'Latensi', value: currentStats.latency, unit: 'ms', icon: Zap, color: 'amber-500', detail: 'Respon ICMP' },
                    { label: 'Beban Inti', value: currentStats.cpu, unit: '%', icon: Cpu, color: 'purple-500', detail: 'Vektor Pemrosesan' }
                ].map((stat, idx) => (
                    <div key={idx} className="glass p-8 rounded-4xl border border-(--glass-border) bg-white/2 relative overflow-hidden group hover:scale-[1.02] transition-all duration-500 shadow-xl">
                        <div className={`absolute -right-8 -top-8 w-24 h-24 bg-${stat.color}/5 rounded-full blur-3xl group-hover:bg-${stat.color}/10 transition-all duration-700`}></div>
                        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-4">{stat.label}</p>
                        <div className="flex items-baseline gap-3">
                            <h4 className="text-5xl font-bold text-primary tracking-tighter">{stat.value}</h4>
                            <span className={`text-${stat.color} text-[10px] font-bold uppercase tracking-widest`}>{stat.unit}</span>
                        </div>
                        <div className="mt-8 flex items-center gap-3 text-[10px] text-slate-500 font-bold uppercase tracking-widest opacity-60">
                            <stat.icon className={`w-4 h-4 text-${stat.color} ${stat.icon === Zap ? 'animate-pulse' : ''}`} /> {stat.detail}
                        </div>
                    </div>
                ))}
            </div>

            {/* Throughput Analytics */}
            <div className="glass p-12 rounded-4xl border border-(--glass-border) bg-white/2 shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform duration-1000">
                    <Activity className="w-96 h-96 text-accent" />
                </div>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-8 relative z-10">
                    <div>
                        <h3 className="text-2xl font-bold text-primary tracking-tight">Analitik Throughput</h3>
                        <p className="text-[10px] text-muted font-bold mt-2 uppercase tracking-widest">Vektor Antarmuka: {selectedInterface || 'Memeriksa Node...'}</p>
                    </div>
                    <div className="flex flex-wrap gap-8 bg-white/2 px-8 py-4 rounded-2xl border border-white/5">
                        <div className="flex items-center gap-4">
                            <div className="w-3 h-3 rounded-full bg-accent shadow-[0_0_10px_rgba(16,185,129,0.4)]"></div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Downlink</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="w-3 h-3 rounded-full bg-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.4)]"></div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Uplink</span>
                        </div>
                    </div>
                </div>
                <div className="h-[500px] relative z-10 w-full rounded-3xl overflow-hidden border border-white/5 bg-slate-950/20">
                    <AdvancedMonitorChart data={bwHistory} type="bandwidth" />
                </div>
            </div>

            {/* Sub Metrics Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                <div className="glass p-10 rounded-4xl border border-(--glass-border) bg-white/2 shadow-xl">
                    <div className="flex justify-between items-center mb-10">
                        <h3 className="text-[10px] font-bold text-primary uppercase tracking-widest flex items-center gap-4">
                            <div className="p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/10">
                                <Zap className="w-4 h-4 text-amber-500" />
                            </div>
                            Analisis Latensi
                        </h3>
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest px-3 py-1 bg-white/2 rounded-lg border border-white/5">Siaran Langsung</span>
                    </div>
                    <div className="h-[350px] rounded-3xl overflow-hidden border border-white/5">
                        <AdvancedMonitorChart data={latencyHistory} type="latency" />
                    </div>
                </div>

                <div className="glass p-10 rounded-4xl border border-(--glass-border) bg-white/2 shadow-xl">
                    <div className="flex justify-between items-center mb-10">
                        <h3 className="text-[10px] font-bold text-primary uppercase tracking-widest flex items-center gap-4">
                            <div className="p-2.5 rounded-xl bg-purple-500/5 border border-purple-500/10">
                                <BarChart3 className="w-4 h-4 text-purple-500" />
                            </div>
                            Vektor Infrastruktur
                        </h3>
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest px-3 py-1 bg-white/2 rounded-lg border border-white/5">Beban CPU</span>
                    </div>
                    <div className="h-[350px] rounded-3xl overflow-hidden border border-white/5">
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
