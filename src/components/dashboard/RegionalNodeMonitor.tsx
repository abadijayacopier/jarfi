'use client';

import { Server, Wifi, WifiOff, Activity, Globe } from 'lucide-react';
import Link from 'next/link';

interface RegionalNodeMonitorProps {
    routers: any[];
    loading: boolean;
}

export default function RegionalNodeMonitor({ routers, loading }: RegionalNodeMonitorProps) {
    if (loading) {
        return (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 animate-pulse">
                {Array(6).fill(0).map((_, i) => (
                    <div key={i} className="h-24 bg-white/5 rounded-3xl border border-white/5"></div>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                    <Globe className="w-4 h-4 text-accent" />
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Status Lokasi WiFi</h3>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Online</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Offline</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {routers.map((router) => (
                    <Link 
                        key={router.id} 
                        href="/routers"
                        className={`group p-5 rounded-3xl border transition-all duration-500 flex flex-col items-center justify-center gap-3 relative overflow-hidden ${
                            router.error 
                                ? 'bg-red-500/5 border-red-500/20 hover:bg-red-500/10' 
                                : 'bg-emerald-500/5 border-emerald-500/20 hover:bg-emerald-500/10 hover:border-emerald-500/40'
                        }`}
                    >
                        {/* Background light effect */}
                        <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-700 ${
                            router.error ? 'bg-red-500' : 'bg-emerald-500'
                        }`}></div>

                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 ${
                            router.error 
                                ? 'bg-red-500/20 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]' 
                                : 'bg-emerald-500/20 text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                        }`}>
                            {router.error ? <WifiOff className="w-5 h-5" /> : <Wifi className="w-5 h-5" />}
                        </div>

                        <div className="text-center relative z-10">
                            <p className="text-[10px] font-black text-primary dark:text-white uppercase tracking-tight truncate max-w-[100px]">
                                {router.name}
                            </p>
                            <p className={`text-[7px] font-black uppercase tracking-[0.2em] mt-1 ${
                                router.error ? 'text-red-500/60' : 'text-emerald-500/60'
                            }`}>
                                {router.error ? 'DOWN' : 'ACTIVE'}
                            </p>
                        </div>

                        {/* Status Pulse */}
                        <div className={`absolute top-3 right-3 w-1.5 h-1.5 rounded-full ${
                            router.error ? 'bg-red-500' : 'bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                        }`}></div>
                    </Link>
                ))}

                {/* Quick Add Node Button */}
                <Link 
                    href="/routers"
                    className="p-5 rounded-3xl border border-dashed border-white/10 bg-white/2 hover:bg-white/5 hover:border-white/20 transition-all flex flex-col items-center justify-center gap-2 group"
                >
                    <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-slate-500 group-hover:text-accent transition-colors">
                        <Activity className="w-4 h-4" />
                    </div>
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Tambah Lokasi</span>
                </Link>
            </div>
        </div>
    );
}
