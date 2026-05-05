'use client';

import { Terminal, RefreshCw } from 'lucide-react';

interface LogViewerProps {
    logs: any[];
    selectedRouter: string;
    routers: any[];
    onRouterChange: (id: string) => void;
}

export default function LogViewer({ logs, selectedRouter, routers, onRouterChange }: LogViewerProps) {
    return (
        <div className="p-8 rounded-[32px] bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-white/5">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-6 border-b border-slate-100 dark:border-white/5 pb-8">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent border border-accent/20 shadow-inner">
                        <Terminal className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-primary">Live Router Logs</h3>
                        <p className="text-[10px] text-muted font-bold mt-1 uppercase tracking-widest opacity-60">Real-time syslog stream</p>
                    </div>
                </div>
                <div className="relative group w-full md:w-auto md:min-w-[200px]">
                    <select
                        value={selectedRouter}
                        onChange={(e) => onRouterChange(e.target.value)}
                        className="clean-input w-full font-bold appearance-none cursor-pointer pr-10 text-sm"
                        suppressHydrationWarning
                    >
                        {routers.map((r: any) => <option key={r.id} value={r.id} className="dark:bg-slate-900">{r.name}</option>)}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted group-hover:text-accent transition-colors">
                        <RefreshCw className="w-4 h-4" />
                    </div>
                </div>
            </div>

            <div className="bg-slate-950 dark:bg-black/40 rounded-3xl border border-white/5 overflow-hidden shadow-2xl font-mono relative">
                {/* Terminal Header */}
                <div className="bg-slate-900/80 dark:bg-black/60 px-5 py-3.5 flex items-center gap-3 border-b border-white/5 backdrop-blur-md">
                    <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500/60 shadow-[0_0_8px_rgba(239,68,68,0.2)]"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-orange-500/60 shadow-[0_0_8px_rgba(249,115,22,0.2)]"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500/60 shadow-[0_0_8px_rgba(34,197,94,0.2)]"></div>
                    </div>
                    <span className="text-[10px] text-slate-500 font-black tracking-[0.2em] ml-4 uppercase opacity-40">admin@mikrotik:~ syslog stream</span>
                </div>
                
                <div className="h-[400px] overflow-y-auto scrollbar-hide p-4 sm:p-6 space-y-2">
                    {logs.length === 0 ? (
                        <div className="text-slate-600 text-center h-full flex flex-col items-center justify-center">
                            <div className="relative">
                                <RefreshCw className="w-10 h-10 animate-spin mb-4 text-accent/20" />
                                <div className="absolute inset-0 w-10 h-10 bg-accent/5 blur-xl rounded-full"></div>
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Connecting to syslog pipe...</span>
                        </div>
                    ) : (
                        <div className="text-[11px] sm:text-[13px] leading-relaxed">
                            {logs.map((log: any, idx) => (
                                <div key={log['.id'] || idx} className="flex flex-col lg:flex-row lg:items-start hover:bg-white/5 px-3 py-2.5 rounded-2xl transition-all group gap-2 lg:gap-4 border-b border-white/5 last:border-0">
                                    <div className="flex shrink-0 gap-3 items-center">
                                        <span className="text-accent font-mono font-bold opacity-70 whitespace-nowrap">[{log.time}]</span>
                                        <span className={`font-black uppercase tracking-wider px-2 py-0.5 rounded-md text-[9px] ${
                                            log.topics?.includes('pppoe') ? 'bg-teal-500/10 text-teal-500' : 
                                            log.topics?.includes('info') ? 'bg-blue-500/10 text-blue-500' : 
                                            log.topics?.includes('error') ? 'bg-red-500/10 text-red-500' :
                                            'bg-accent/10 text-accent'
                                        }`}>{log.topics}</span>
                                    </div>
                                    <span className={`flex-1 wrap-break-word font-medium ${
                                        log.topics?.includes('error') ? 'text-red-400' :
                                        log.topics?.includes('warning') ? 'text-orange-400' : 'text-slate-300'
                                    }`}>
                                        {log.message}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                
                {/* Terminal Footer Gradient Overlay */}
                <div className="absolute bottom-0 left-0 right-0 h-12 bg-linear-to-t from-slate-950 dark:from-black to-transparent pointer-events-none"></div>
            </div>
        </div>
    );
}
