'use client';

import { Server, Activity } from 'lucide-react';

interface RouterStatusProps {
    router: {
        id: number;
        name: string;
        error?: boolean;
        version?: string;
        cpu_load?: string;
        uptime?: string;
        activeUsers?: number;
    };
    loading?: boolean;
}

export default function RouterStatus({ router, loading }: RouterStatusProps) {
    if (loading) {
        return (
            <div className="glass p-6 rounded-4xl animate-pulse">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-muted/10"></div>
                    <div className="flex-1 space-y-2">
                        <div className="h-4 bg-muted/10 rounded w-2/3"></div>
                        <div className="h-3 bg-muted/10 rounded w-1/3"></div>
                    </div>
                </div>
                <div className="space-y-3">
                    <div className="h-12 bg-muted/10 rounded-2xl"></div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="h-12 bg-muted/10 rounded-2xl"></div>
                        <div className="h-12 bg-muted/10 rounded-2xl"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="glass p-8 rounded-4xl relative overflow-hidden group hover:border-accent/30 transition-all duration-500 shadow-sm hover:shadow-xl">
            {router.error ? (
                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-red-500/5 flex items-center justify-center text-red-500 border border-red-500/10 shadow-sm">
                                <Server className="w-6 h-6" />
                            </div>
                            <div>
                                <h4 className="font-black text-lg text-primary tracking-tight">{router.name}</h4>
                                <p className="text-[9px] text-red-500/60 font-black tracking-[0.2em] uppercase">Status: Disconnected</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-red-500/5 p-5 rounded-3xl border border-red-500/10">
                        <p className="text-[11px] font-bold text-red-600/80 leading-relaxed italic">
                            Connection timeout. Verify network routes and API credentials.
                        </p>
                    </div>
                </div>
            ) : (
                <>
                    <div className="absolute -bottom-10 -right-10 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                        <Server className="w-32 h-32 text-accent" />
                    </div>
                    
                    <div className="flex justify-between items-start mb-8 relative z-10">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-slate-500/5 flex items-center justify-center text-accent border border-white/5 shadow-inner group-hover:scale-105 transition-transform duration-500">
                                <Server className="w-7 h-7" />
                            </div>
                            <div>
                                <h4 className="font-black text-xl text-primary tracking-tighter">{router.name}</h4>
                                <p className="text-[9px] text-muted font-black tracking-[0.3em] uppercase mt-1">{router.version || 'RouterOS Core'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                            <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Online</span>
                        </div>
                    </div>

                    <div className="space-y-6 relative z-10">
                        <div className="space-y-3">
                            <div className="flex justify-between items-end">
                                <span className="text-[10px] font-black text-muted uppercase tracking-widest">Process Load</span>
                                <span className={`text-lg font-black tracking-tighter tabular-nums ${parseInt(router.cpu_load || '0') > 80 ? 'text-red-500' : 'text-primary'}`}>{router.cpu_load}%</span>
                            </div>
                            <div className="w-full bg-slate-500/5 h-1.5 rounded-full overflow-hidden">
                                <div 
                                    className={`h-full transition-all duration-1000 ease-out rounded-full ${parseInt(router.cpu_load || '0') > 80 ? 'bg-red-500' : 'bg-accent'}`} 
                                    style={{ width: `${router.cpu_load}%` }}
                                ></div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-500/5 p-5 rounded-3xl border border-white/5">
                                <p className="text-[9px] text-muted font-black uppercase tracking-widest mb-1.5">Runtime</p>
                                <p className="text-xs font-black text-primary truncate tabular-nums">{router.uptime || '00:00:00'}</p>
                            </div>
                            <div className="bg-slate-500/5 p-5 rounded-3xl border border-white/5">
                                <p className="text-[9px] text-muted font-black uppercase tracking-widest mb-1.5">Traffic Density</p>
                                <p className="text-xs font-black text-accent tabular-nums">
                                    {router.activeUsers || '0'} <span className="text-[10px] text-muted/60 uppercase font-bold ml-1">Sessions</span>
                                </p>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
