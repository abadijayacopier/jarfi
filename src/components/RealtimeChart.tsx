'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

export default function RealtimeChart({ data }: { data: any[] }) {
    return (
        <div className="w-full h-[300px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                    <defs>
                        <linearGradient id="colorTx" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorRx" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis 
                        dataKey="time" 
                        hide 
                    />
                    <YAxis 
                        hide 
                        domain={[0, 'auto']}
                    />
                    <Tooltip 
                        contentStyle={{ 
                            backgroundColor: '#0f172a', 
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '12px',
                            color: '#fff'
                        }}
                        itemStyle={{ fontWeight: 'bold', fontSize: '12px' }}
                        formatter={(value: any) => [`${parseFloat(value).toFixed(2)} Mbps`]}
                    />
                    <Area 
                        name="Upload (TX)"
                        type="monotone" 
                        dataKey="tx" 
                        stroke="#ec4899" 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#colorTx)" 
                        animationDuration={1000}
                    />
                    <Area 
                        name="Download (RX)"
                        type="monotone" 
                        dataKey="rx" 
                        stroke="#6366f1" 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#colorRx)" 
                        animationDuration={1000}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
