import { useState, useEffect } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
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
        <div className="w-full h-full min-h-[300px] relative">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255, 255, 255, 0.05)" />
                    <XAxis dataKey="time" hide />
                    <YAxis
                        width={45}
                        tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: '800' }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={formatValue}
                        domain={[0, 'auto']}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'rgba(15, 23, 42, 0.9)',
                            backdropFilter: 'blur(12px)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '20px',
                            padding: '15px'
                        }}
                        itemStyle={{ fontSize: '11px', fontWeight: '900', textTransform: 'uppercase' }}
                        labelStyle={{ display: 'none' }}
                        formatter={(val: any) => [formatValue(val)]}
                    />
                    {isBandwidth ? (
                        <>
                            <Line
                                type="monotone"
                                dataKey="rx"
                                stroke="#10b981"
                                strokeWidth={4}
                                dot={false}
                                activeDot={{ r: 6, strokeWidth: 0, fill: '#10b981' }}
                                animationDuration={500}
                            />
                            <Line
                                type="monotone"
                                dataKey="tx"
                                stroke="#3b82f6"
                                strokeWidth={4}
                                dot={false}
                                activeDot={{ r: 6, strokeWidth: 0, fill: '#3b82f6' }}
                                animationDuration={500}
                            />
                        </>
                    ) : (
                        <Line
                            type="monotone"
                            dataKey="value"
                            stroke="#f59e0b"
                            strokeWidth={4}
                            dot={false}
                            animationDuration={500}
                        />
                    )}
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}

