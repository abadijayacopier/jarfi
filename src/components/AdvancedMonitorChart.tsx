import { useState, useEffect } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer
} from 'recharts';

export default function AdvancedMonitorChart({
    data,
    type = 'bandwidth',
    title
}: {
    data: any[],
    type?: 'bandwidth' | 'latency' | 'resources',
    title?: string
}) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);

    const isBandwidth = type === 'bandwidth';
    const isLatency = type === 'latency';

    const formatValue = (val: any) => {
        const num = parseFloat(val);
        if (isNaN(num)) return '0';

        if (isBandwidth) {
            if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
            if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
            return `${num.toFixed(1)}b`;
        }
        if (isLatency) return `${num.toFixed(0)}ms`;
        return `${num.toFixed(0)}%`;
    };

    if (!mounted) return <div className="w-full h-full bg-white/5 rounded-3xl animate-pulse" />;

    return (
        <div className="w-full h-full min-h-[350px] relative mt-4">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorRx" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorTx" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid 
                        strokeDasharray="4 4" 
                        vertical={false} 
                        stroke="currentColor" 
                        className="text-slate-200 dark:text-slate-800 opacity-50" 
                    />
                    <XAxis dataKey="time" hide />
                    <YAxis
                        tick={{ fill: 'currentColor', fontSize: 10, fontWeight: '800' }}
                        className="text-slate-400 dark:text-slate-600"
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={formatValue}
                        domain={[0, 'auto']}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'rgba(15, 23, 42, 0.95)',
                            backdropFilter: 'blur(20px)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '24px',
                            padding: '20px',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                        }}
                        itemStyle={{ fontSize: '12px', fontWeight: '900', textTransform: 'uppercase', marginBottom: '4px' }}
                        labelStyle={{ display: 'none' }}
                        formatter={(val: any) => [formatValue(val)]}
                    />
                    {isBandwidth ? (
                        <>
                            <Area
                                type="monotone"
                                dataKey="rx"
                                stroke="#10b981"
                                strokeWidth={4}
                                fillOpacity={1}
                                fill="url(#colorRx)"
                                activeDot={{ r: 8, strokeWidth: 0, fill: '#10b981' }}
                                animationDuration={1000}
                            />
                            <Area
                                type="monotone"
                                dataKey="tx"
                                stroke="#3b82f6"
                                strokeWidth={4}
                                fillOpacity={1}
                                fill="url(#colorTx)"
                                activeDot={{ r: 8, strokeWidth: 0, fill: '#3b82f6' }}
                                animationDuration={1000}
                            />
                        </>
                    ) : (
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke="#f59e0b"
                            strokeWidth={4}
                            fillOpacity={1}
                            fill="url(#colorValue)"
                            activeDot={{ r: 8, strokeWidth: 0, fill: '#f59e0b' }}
                            animationDuration={1000}
                        />
                    )}
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}

