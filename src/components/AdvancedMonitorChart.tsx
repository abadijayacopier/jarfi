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
                    <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted mb-4">{title}</h5>
                </div>
            )}
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                        <linearGradient id={`color1_${type}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={isBandwidth ? "#0ea5e9" : isLatency ? "#f59e0b" : "#10b981"} stopOpacity={0.3}/>
                            <stop offset="95%" stopColor={isBandwidth ? "#0ea5e9" : isLatency ? "#f59e0b" : "#10b981"} stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id={`color2_${type}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.05)" />
                    <XAxis 
                        dataKey="time" 
                        hide 
                    />
                    <YAxis 
                        tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: '800' }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={formatValue}
                        domain={[0, 'auto']}
                    />
                    <Tooltip 
                        contentStyle={{ 
                            backgroundColor: 'rgba(15, 23, 42, 0.8)', 
                            backdropFilter: 'blur(12px)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '16px',
                            color: '#fff',
                            fontSize: '11px',
                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
                            padding: '12px'
                        }}
                        itemStyle={{ fontWeight: '900', padding: '4px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                        labelStyle={{ display: 'none' }}
                        cursor={{ stroke: 'rgba(14, 165, 233, 0.2)', strokeWidth: 2 }}
                        formatter={(val: any) => [formatValue(val)]}
                    />
                    {isBandwidth ? (
                        <>
                            <Area 
                                name="Download (RX)"
                                type="monotone" 
                                dataKey="rx" 
                                stroke="#0ea5e9" 
                                strokeWidth={3}
                                fillOpacity={1} 
                                fill={`url(#color1_${type})`} 
                                isAnimationActive={true}
                                animationDuration={1000}
                            />
                            <Area 
                                name="Upload (TX)"
                                type="monotone" 
                                dataKey="tx" 
                                stroke="#10b981" 
                                strokeWidth={3}
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
                            stroke={isLatency ? "#f59e0b" : "#10b981"} 
                            strokeWidth={3}
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

