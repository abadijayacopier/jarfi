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
        <div className="glass p-6 rounded-4xl overflow-hidden">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-(--glass-border) pb-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-muted/10 flex items-center justify-center text-muted border border-(--glass-border) shadow-inner">
                        <Terminal className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-primary">Live Router Logs</h3>
                        <p className="text-xs text-muted font-bold mt-1 uppercase tracking-tight">Real-time syslog stream</p>
                    </div>
                </div>
                <div className="relative group min-w-[200px]">
                    <select
                        value={selectedRouter}
                        onChange={(e) => onRouterChange(e.target.value)}
                        className="clean-input w-full font-bold appearance-none cursor-pointer pr-10"
                    >
                        {routers.map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted group-hover:text-accent transition-colors">
                        <RefreshCw className="w-4 h-4" />
                    </div>
                </div>
            </div>

            <div className="bg-slate-950 rounded-2xl border border-white/5 overflow-hidden shadow-2xl font-mono relative">
                {/* Terminal Header */}
                <div className="bg-slate-900/50 px-4 py-2.5 flex items-center gap-2 border-b border-white/5 backdrop-blur-md">
                    <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-orange-500/80"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500/80"></div>
                    </div>
                    <span className="text-[10px] text-slate-500 font-black tracking-widest ml-4 uppercase opacity-60">admin@mikrotik:~ syslog stream</span>
                </div>
                
                <div className="h-[400px] overflow-y-auto scrollbar-hide p-5 space-y-1.5">
                    {logs.length === 0 ? (
                        <div className="text-slate-600 text-center h-full flex flex-col items-center justify-center">
                            <div className="relative">
                                <RefreshCw className="w-10 h-10 animate-spin mb-4 text-accent/20" />
                                <div className="absolute inset-0 w-10 h-10 bg-accent/5 blur-xl rounded-full"></div>
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Connecting to syslog pipe...</span>
                        </div>
                    ) : (
                        <div className="text-[12px] leading-relaxed">
                            {logs.map((log: any, idx) => (
                                <div key={log['.id'] || idx} className="flex hover:bg-white/5 px-2 py-0.5 rounded transition-colors group">
                                    <span className="text-slate-600 w-24 shrink-0 font-medium opacity-60">[{log.time}]</span>
                                    <span className={`w-32 shrink-0 font-bold ${
                                        log.topics?.includes('pppoe') ? 'text-teal-500/80' : 
                                        log.topics?.includes('info') ? 'text-blue-500/80' : 
                                        'text-accent/80'
                                    }`}>{log.topics}:</span>
                                    <span className={`flex-1 break-all ${
                                        log.topics?.includes('error') ? 'text-red-400 font-bold' :
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
                <div className="absolute bottom-0 left-0 right-0 h-12 bg-linear-to-t from-slate-950 to-transparent pointer-events-none"></div>
            </div>
        </div>
    );
}
