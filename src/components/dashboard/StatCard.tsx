'use client';

import { LucideIcon } from 'lucide-react';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    subtitle?: string;
    trend?: {
        value: string;
        positive: boolean;
    };
    color?: 'blue' | 'teal' | 'emerald' | 'orange' | 'accent';
    loading?: boolean;
}

export default function StatCard({ 
    title, 
    value, 
    icon: Icon, 
    subtitle, 
    trend, 
    color = 'accent',
    loading 
}: StatCardProps) {
    const colorClasses = {
        blue: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
        teal: 'text-teal-500 bg-teal-500/10 border-teal-500/20',
        emerald: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
        orange: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
        accent: 'text-accent bg-accent/10 border-accent/20'
    };

    return (
        <div className="glass p-6 rounded-4xl border border-(--glass-border) relative overflow-hidden group hover-lift shimmer">
            <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full blur-2xl opacity-20 group-hover:opacity-30 transition-all duration-500 ${color === 'accent' ? 'bg-accent' : `bg-${color}-500`}`}></div>
            
            <div className="flex justify-between items-start mb-4 relative z-10">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-inner ${colorClasses[color]}`}>
                    <Icon className="w-6 h-6" />
                </div>
                {trend && (
                    <span className={`px-2 py-1 text-[10px] font-black uppercase rounded-lg border ${trend.positive ? 'bg-teal-500/10 text-teal-500 border-teal-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                        {trend.value}
                    </span>
                )}
            </div>

            <div className="relative z-10">
                <p className="text-muted text-[10px] font-black uppercase tracking-[0.2em] mb-1">{title}</p>
                <div className="flex items-baseline gap-2">
                    <h3 className="text-3xl font-black text-primary tracking-tight tabular-nums">
                        {loading ? (
                            <span className="inline-block w-16 h-8 bg-muted/10 animate-pulse rounded-lg"></span>
                        ) : value}
                    </h3>
                    {subtitle && <span className="text-[10px] font-bold text-muted uppercase">{subtitle}</span>}
                </div>
            </div>
        </div>
    );
}
