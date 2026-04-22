'use client';

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
    const isBandwidth = type === 'bandwidth';
    const isLatency = type === 'latency';

    // Formatting helper
    const formatValue = (val: any) => {
        const num = parseFloat(val);
        if (isNaN(num)) return '0';
        
        if (isBandwidth) {
            if (num > 1000000) return `${(num / 1000000).toFixed(1)}M`;
            if (num > 1000) return `${(num / 1000).toFixed(1)}K`;
            return `${num.toFixed(1)}b`;
        }
        if (isLatency) return `${num.toFixed(0)}ms`;
        return `${num.toFixed(0)}%`;
    };

    return (
        <div className="w-full h-full min-h-[250px] relative">
            {title && (
                <div className="absolute top-0 left-0 z-10">
                    <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-4">{title}</h5>
                </div>
            )}
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                        <linearGradient id={`color1_${type}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={isBandwidth ? "#6366f1" : isLatency ? "#f59e0b" : "#a855f7"} stopOpacity={0.2}/>
                            <stop offset="95%" stopColor={isBandwidth ? "#6366f1" : isLatency ? "#f59e0b" : "#a855f7"} stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id={`color2_${type}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ec4899" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis 
                        dataKey="time" 
                        hide 
                    />
                    <YAxis 
                        tick={{ fill: '#475569', fontSize: 10, fontWeight: 'bold' }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={formatValue}
                        domain={[0, 'auto']}
                    />
                    <Tooltip 
                        contentStyle={{ 
                            backgroundColor: '#0f172a', 
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '12px',
                            color: '#fff',
                            fontSize: '11px',
                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                        }}
                        itemStyle={{ fontWeight: 'bold', padding: '2px 0' }}
                        labelStyle={{ display: 'none' }}
                        cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2 }}
                        formatter={(val: any) => [formatValue(val)]}
                    />
                    {isBandwidth ? (
                        <>
                            <Area 
                                name="Download (RX)"
                                type="monotone" 
                                dataKey="rx" 
                                stroke="#6366f1" 
                                strokeWidth={2}
                                fillOpacity={1} 
                                fill={`url(#color1_${type})`} 
                                isAnimationActive={true}
                                animationDuration={1000}
                            />
                            <Area 
                                name="Upload (TX)"
                                type="monotone" 
                                dataKey="tx" 
                                stroke="#ec4899" 
                                strokeWidth={2}
                                fillOpacity={1} 
                                fill={`url(#color2_${type})`} 
                                isAnimationActive={true}
                                animationDuration={1000}
                            />
                        </>
                    ) : (
                        <Area 
                            name={isLatency ? "Latency" : "Usage"}
                            type="monotone" 
                            dataKey="value" 
                            stroke={isLatency ? "#f59e0b" : "#a855f7"} 
                            strokeWidth={2}
                            fillOpacity={1} 
                            fill={`url(#color1_${type})`} 
                            isAnimationActive={true}
                            animationDuration={1000}
                        />
                    )}
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
