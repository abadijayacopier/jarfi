'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, Polyline, useMap, CircleMarker, LayersControl, Circle, Tooltip as LeafletTooltip } from 'react-leaflet';
import L, { LeafletMouseEvent } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
    Activity, Cpu, Zap, Signal, Info, Navigation, Wifi, Map as MapIcon, 
    Layers, Settings2, MousePointer2, Plus, Trash2, Copy, Send, 
    LineChart, Shield, Server, ArrowUpRight, ArrowDownLeft, Box, Clock, UserCheck, Layout
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Swal from 'sweetalert2';

// NOC Dark Theme Icons with Industrial Signal Coding
const getNodeIcon = (type: string, status: 'normal' | 'warning' | 'critical' | 'offline' = 'normal', color: string = '', isSelected: boolean = false) => {
    // Industrial Color Matrix
    const statusColors = {
        normal: '#10b981',   // Emerald (Stable)
        warning: '#f59e0b',  // Amber (Degraded)
        critical: '#ef4444', // Red (LOS/Fault)
        offline: '#64748b'   // Slate (Power Off)
    };
    
    const finalColor = color || statusColors[status];
    const isError = status === 'critical' || status === 'warning';

    return L.divIcon({
        html: `
            <div class="relative flex items-center justify-center">
                <div class="w-6 h-6 rounded-[8px] border-2 ${isSelected ? 'border-indigo-400 scale-125' : 'border-white/20'} shadow-[0_0_20px_${finalColor}] flex items-center justify-center transition-all duration-500 overflow-hidden" style="background-color: ${finalColor}dd; backdrop-filter: blur(8px);">
                    ${type === 'ODP' ? 
                        '<div class="w-2.5 h-2.5 bg-white rounded-full shadow-[0_0_10px_white]"></div>' : 
                        '<div class="w-1.5 h-3 bg-white/40 rounded-full"></div>'}
                </div>
                ${isError ? `<div class="absolute -inset-2 rounded-full bg-${status === 'critical' ? 'red' : 'amber'}-500/20 animate-ping opacity-50"></div>` : ''}
                ${isSelected ? '<div class="absolute -inset-3 rounded-xl bg-indigo-500/10 animate-pulse border border-indigo-500/20"></div>' : ''}
            </div>
        `,
        className: 'custom-node-icon',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
    });
};

const getUserLocationIcon = () => {
    return L.divIcon({
        html: `
            <div class="relative flex items-center justify-center">
                <div class="w-5 h-5 bg-blue-500 rounded-full border-2 border-white shadow-[0_0_20px_rgba(59,130,246,0.9)] z-50"></div>
                <div class="absolute w-16 h-16 bg-blue-500/10 rounded-full animate-ping"></div>
            </div>
        `,
        className: 'user-location-icon',
        iconSize: [20, 20],
        iconAnchor: [10, 10]
    });
};

const getServerIcon = () => {
    return L.divIcon({
        html: `
            <div class="relative flex items-center justify-center">
                <div class="w-12 h-12 bg-indigo-600 rounded-3xl border-2 border-indigo-400 shadow-[0_0_40px_rgba(99,102,241,0.6)] flex items-center justify-center text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="8" x="2" y="2" rx="2" ry="2"/><rect width="20" height="8" x="2" y="14" rx="2" ry="2"/><line x1="6" x2="6.01" y1="6" y2="6"/><line x1="6" x2="6.01" y1="18" y2="18"/></svg>
                </div>
            </div>
        `,
        className: 'server-icon',
        iconSize: [48, 48],
        iconAnchor: [24, 24]
    });
};

// Helper to calculate distance in meters
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // meters
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return Math.round(R * c);
};

export interface NetworkMapProps {
    odps: any[];
    customers: any[];
    controls: {
        showOdpTooltip: boolean;
        showOdpLines: boolean;
        showUserLines: boolean;
        showServerOlt: boolean;
        showOltOdp: boolean;
        editOdpLines: boolean;
        editUserLines: boolean;
        addOdpMode: boolean;
    };
    onLinkUpdate?: (sourceId: number, targetId: number, type: 'ODP_TO_USER' | 'ODP_TO_ODP') => void;
    onDeleteOdp?: (id: number) => void;
    onNodeMove?: (id: number, type: 'ODP' | 'USER', lat: number, lng: number) => void;
    onMapClick?: (lat: number, lng: number) => void;
    center?: [number, number];
    userPos?: [number, number] | null;
    zoom?: number;
    mapStyle?: string;
}

function ChangeView({ center, zoom }: { center: [number, number], zoom: number }) {
    const map = useMap();
    useEffect(() => {
        if (map && center && center.length === 2 && !isNaN(center[0]) && !isNaN(center[1])) {
            try {
                // Ensure map is still mounted and has a valid container
                if (map.getContainer()) {
                    map.setView(center, zoom, { animate: true });
                }
            } catch (err) {
                console.warn('Map View Update Failed:', err);
            }
        }
    }, [center, zoom, map]);
    return null;
}

export default function NetworkMap({ odps, customers, controls, onLinkUpdate, onDeleteOdp, onNodeMove, onMapClick, center = [-6.2088, 106.8456], userPos, zoom = 13, mapStyle = 'dark' }: NetworkMapProps) {
    const [mounted, setMounted] = useState(false);
    const [selectedNode, setSelectedNode] = useState<{ id: number, type: 'ODP' | 'USER', lat: number, lng: number } | null>(null);
    const [mousePos, setMousePos] = useState<[number, number] | null>(null);
    const [liveTraffic, setLiveTraffic] = useState(Array.from({ length: 20 }, (_, i) => ({ time: i, tx: 0, rx: 0 })));

    useEffect(() => {
        setMounted(true);
        const interval = setInterval(() => {
            setLiveTraffic(prev => {
                const next = [...prev.slice(1), { 
                    time: prev[prev.length - 1].time + 1, 
                    tx: Math.floor(Math.random() * 5000000), 
                    rx: Math.floor(Math.random() * 8000000) 
                }];
                return next;
            });
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        setSelectedNode(null);
    }, [controls.editOdpLines, controls.editUserLines, controls.addOdpMode]);

    const getSignalStatus = (rx: number, status: string): 'normal' | 'warning' | 'critical' | 'offline' => {
        if (status === 'offline') return 'offline';
        if (rx <= -15 && rx >= -24) return 'normal';
        if (rx < -24 && rx >= -27) return 'warning';
        if (rx < -27 || rx === -40) return 'critical';
        return 'normal';
    };

    const routeColors = ['#10b981', '#3b82f6', '#a855f7', '#f59e0b', '#ec4899', '#06b6d4'];

    function MapEvents() {
        const map = useMap();
        useEffect(() => {
            if (controls.addOdpMode || controls.editOdpLines || controls.editUserLines) {
                map.getContainer().style.cursor = 'crosshair';
            } else {
                map.getContainer().style.cursor = '';
            }
        }, [map]);

        useMapEvents({
            click(e) {
                if (controls.addOdpMode) {
                    if (onMapClick) onMapClick(e.latlng.lat, e.latlng.lng);
                    return;
                }
                if (selectedNode) setSelectedNode(null);
            },
            mousemove(e) {
                if (selectedNode || controls.addOdpMode) setMousePos([e.latlng.lat, e.latlng.lng]);
            }
        });
        return null;
    }

    const handleNodeClick = (id: number, type: 'ODP' | 'USER', pos: [number, number]) => {
        const [lat, lng] = pos;
        if (controls.addOdpMode) return;
        if (controls.editUserLines) {
            if (!selectedNode) {
                if (type === 'ODP') setSelectedNode({ id, type, lat, lng });
            } else {
                if (selectedNode.type === 'ODP' && type === 'USER') {
                    if (onLinkUpdate) onLinkUpdate(selectedNode.id, id, 'ODP_TO_USER');
                    setSelectedNode(null);
                } else {
                    setSelectedNode({ id, type, lat, lng });
                }
            }
            return;
        }

        if (controls.editOdpLines) {
            if (type !== 'ODP') return;
            if (!selectedNode) {
                setSelectedNode({ id, type, lat, lng });
            } else {
                if (selectedNode.id !== id) {
                    if (onLinkUpdate) onLinkUpdate(selectedNode.id, id, 'ODP_TO_ODP');
                    setSelectedNode(null);
                } else {
                    setSelectedNode(null);
                }
            }
            return;
        }
    };

    if (!mounted) return <div className="h-full w-full bg-[#0f172a] flex items-center justify-center text-white font-bold uppercase tracking-widest">NOC Matrix Orchestrator Loading...</div>;

    return (
        <MapContainer 
            center={center}
            zoom={zoom}
            style={{ height: '100%', width: '100%', background: '#0f172a' }}
            className="z-0"
            zoomControl={false}
        >
            <ChangeView center={center} zoom={zoom} />
            <MapEvents />
            
            <TileLayer
                key={mapStyle}
                attribution={mapStyle === 'dark' ? '&copy; CARTO' : '&copy; Google'}
                url={mapStyle === 'dark' 
                    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" 
                    : "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
                }
            />
            
            <Marker position={[-6.2088, 106.8456]} icon={getServerIcon()}>
                <Popup className="noc-popup animate-in fade-in zoom-in-95 duration-500">
                    <div className="w-[300px] bg-[#0f172a] text-white p-5 rounded-2xl border border-indigo-500/30 shadow-2xl">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400 border border-indigo-500/30">
                                <Server className="w-6 h-6" />
                            </div>
                            <div className="flex flex-col">
                                <span className="font-black uppercase text-xs tracking-widest">Core Gateway</span>
                                <span className="text-[10px] text-emerald-400 font-bold animate-pulse">MATRIX UPLINK ACTIVE</span>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                                <span className="text-[10px] uppercase font-black text-slate-500">Live Traffic</span>
                                <span className="text-xs font-black text-white">10.2 Gbps</span>
                            </div>
                            <div className="flex justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                                <span className="text-[10px] uppercase font-black text-slate-500">Latency</span>
                                <span className="text-xs font-black text-emerald-400">1.2ms</span>
                            </div>
                        </div>
                    </div>
                </Popup>
            </Marker>

            {userPos && (
                <>
                    <Marker position={userPos} icon={getUserLocationIcon()}>
                        <Popup><span className="text-[10px] font-black uppercase text-blue-400 tracking-widest">Field Technician Vector</span></Popup>
                    </Marker>
                    <Circle center={userPos} radius={50} pathOptions={{ color: '#3b82f6', weight: 1, fillColor: '#3b82f6', fillOpacity: 0.1 }} />
                </>
            )}

            {selectedNode && mousePos && (
                <>
                    <Polyline 
                        positions={[[selectedNode.lat, selectedNode.lng], mousePos]}
                        pathOptions={{ color: '#000', weight: 4, opacity: 0.3 }}
                    />
                    <Polyline 
                        positions={[[selectedNode.lat, selectedNode.lng], mousePos]}
                        pathOptions={{ color: '#6366f1', weight: 2, dashArray: '10, 10', opacity: 1 }}
                    />
                </>
            )}

            {controls.addOdpMode && mousePos && (
                <Marker position={mousePos} icon={getNodeIcon('ODP', 'normal', '#10b981', true)} interactive={false} />
            )}

            {controls.showOdpLines && odps.map((odp) => {
                if (!odp.parent_id) return null;
                const parent = odps.find(p => p.id === odp.parent_id);
                if (!parent) return null;
                const distance = calculateDistance(parseFloat(parent.latitude), parseFloat(parent.longitude), parseFloat(odp.latitude), parseFloat(odp.longitude));
                const positions: [number, number][] = [
                    [parseFloat(parent.latitude), parseFloat(parent.longitude)],
                    [parseFloat(odp.latitude), parseFloat(odp.longitude)]
                ];
                return (
                    <React.Fragment key={`backbone-group-${odp.id}`}>
                        {/* Shadow/Glow Line */}
                        <Polyline 
                            positions={positions}
                            pathOptions={{ color: '#000', weight: 8, opacity: 0.4 }}
                        />
                        {/* Main Backbone Line */}
                        <Polyline 
                            positions={positions}
                            pathOptions={{ color: '#06b6d4', weight: 4, opacity: 1, lineJoin: 'round' }}
                        >
                            <LeafletTooltip sticky permanent direction="center" className="distance-tooltip">
                                <span className="bg-cyan-600 text-[10px] font-black text-white px-2 py-0.5 rounded-full border border-cyan-400 shadow-2xl">{distance} M</span>
                            </LeafletTooltip>
                        </Polyline>
                    </React.Fragment>
                );
            })}

            {controls.showUserLines && customers.filter(c => c.latitude && c.longitude && c.odp_id).map((customer) => {
                const odp = odps.find(o => o.id === customer.odp_id);
                if (!odp) return null;
                const distance = calculateDistance(parseFloat(customer.latitude), parseFloat(customer.longitude), parseFloat(odp.latitude), parseFloat(odp.longitude));
                const positions: [number, number][] = [
                    [parseFloat(customer.latitude), parseFloat(customer.longitude)],
                    [parseFloat(odp.latitude), parseFloat(odp.longitude)]
                ];
                return (
                    <React.Fragment key={`userline-group-${customer.id}`}>
                         <Polyline 
                            positions={positions}
                            pathOptions={{ color: '#000', weight: 4, opacity: 0.3 }}
                        />
                        <Polyline 
                            positions={positions}
                            pathOptions={{ color: '#22d3ee', weight: 2, dashArray: '8, 12', opacity: 1 }}
                        >
                            <LeafletTooltip sticky direction="center" className="distance-tooltip">
                                <span className="bg-slate-900 text-[8px] font-black text-cyan-400 px-1.5 py-0.5 rounded-full border border-cyan-500/30 shadow-lg">{distance} M</span>
                            </LeafletTooltip>
                        </Polyline>
                    </React.Fragment>
                );
            })}

            {odps.map((odp, idx) => {
                const odpCustomers = customers.filter(c => c.odpId === odp.id);
                const badSignals = odpCustomers.filter(c => getSignalStatus(c.rx || -22.5, c.status === 'active' ? 'online' : 'offline') !== 'normal').length;
                const healthScore = odpCustomers.length > 0 ? (badSignals / odpCustomers.length) * 100 : 0;
                
                return (
                <React.Fragment key={`odp-frag-${odp.id}`}>
                {/* AIOps Predictive Heatmap Circle */}
                {healthScore > 30 && (
                    <Circle 
                        center={[parseFloat(odp.latitude), parseFloat(odp.longitude)]}
                        radius={50}
                        pathOptions={{ 
                            color: healthScore > 60 ? '#ef4444' : '#f59e0b', 
                            fillColor: healthScore > 60 ? '#ef4444' : '#f59e0b',
                            fillOpacity: 0.15,
                            weight: 1,
                            dashArray: '5, 10'
                        }}
                    >
                        <LeafletTooltip permanent direction="top" className="ai-tooltip bg-red-600/90 border-none text-white text-[8px] font-black uppercase px-2 py-1 rounded-full shadow-lg">
                            <div className="flex items-center gap-1">
                                <Activity className="w-2.5 h-2.5 animate-pulse" />
                                AIOps: Mass Degradation Detected
                            </div>
                        </LeafletTooltip>
                    </Circle>
                )}

                <Marker 
                    key={`odp-${odp.id}`} 
                    position={[parseFloat(odp.latitude), parseFloat(odp.longitude)]}
                    icon={getNodeIcon('ODP', healthScore > 60 ? 'critical' : healthScore > 30 ? 'warning' : 'normal', routeColors[idx % routeColors.length], selectedNode?.id === odp.id && selectedNode?.type === 'ODP')}
                    draggable={controls.editOdpLines || controls.editUserLines}
                    eventHandlers={{
                        click: () => handleNodeClick(odp.id, 'ODP', [parseFloat(odp.latitude), parseFloat(odp.longitude)]),
                        dragend: (e) => {
                            const marker = e.target;
                            const position = marker.getLatLng();
                            onNodeMove?.(odp.id, 'ODP', position.lat, position.lng);
                        }
                    }}
                >
                    {!controls.editOdpLines && !controls.editUserLines && !controls.addOdpMode && (
                        <Popup className="noc-popup animate-in fade-in zoom-in-95 duration-500 slide-in-from-bottom-2">
                            <div className="w-[280px] bg-[#0f172a] rounded-[20px] overflow-hidden border border-white/5 shadow-2xl">
                                <div className="px-5 py-3 bg-linear-to-r from-indigo-600 to-indigo-800 flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <Box className="w-3.5 h-3.5 text-indigo-100" />
                                        <span className="font-black text-[9px] uppercase tracking-[0.2em] text-white">{odp.name}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
                                        <button onClick={() => onDeleteOdp?.(odp.id)} className="p-1 hover:bg-red-500/20 text-red-100/50 hover:text-red-400 rounded-lg transition-all"><Trash2 className="w-3 h-3" /></button>
                                    </div>
                                </div>
                            
                            <div className="p-5 space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-white/3 rounded-xl p-3 border border-white/5">
                                        <div className="flex items-center gap-1.5 mb-1.5 opacity-40">
                                            <Signal className="w-2.5 h-2.5 text-emerald-400" />
                                            <p className="text-[8px] font-black uppercase tracking-widest">Signal</p>
                                        </div>
                                        <div className="flex items-baseline gap-1">
                                            <p className="text-sm font-black text-emerald-400 leading-none">-18.4</p>
                                            <span className="text-[7px] font-black uppercase text-emerald-400/30 tracking-tighter">dBm</span>
                                        </div>
                                    </div>
                                    <div className="bg-white/3 rounded-xl p-3 border border-white/5">
                                        <div className="flex items-center gap-1.5 mb-1.5 opacity-40">
                                            <Server className="w-2.5 h-2.5 text-indigo-400" />
                                            <p className="text-[8px] font-black uppercase tracking-widest">OLT</p>
                                        </div>
                                        <p className="text-[10px] font-black text-indigo-400 leading-none truncate">HS-AIPO-01</p>
                                    </div>
                                </div>

                                <div className="bg-white/3 border border-white/5 rounded-xl p-3">
                                    <div className="flex justify-between items-center mb-2">
                                        <div className="flex items-center gap-1.5">
                                            <Layout className="w-2.5 h-2.5 text-indigo-400" />
                                            <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Utilization</span>
                                        </div>
                                        <span className="text-[9px] font-black text-white/50">{odp.used_ports}/{odp.capacity}</span>
                                    </div>
                                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(odp.used_ports/odp.capacity)*100}%` }}></div>
                                    </div>
                                </div>

                                <div className="h-[100px] w-full bg-white/3 rounded-xl p-3 border border-white/5 relative">
                                    <div className="flex justify-between items-center mb-2">
                                        <p className="text-[8px] font-black uppercase text-slate-600 tracking-widest flex items-center gap-1.5">
                                            <Activity className="w-3 h-3 text-indigo-400" /> Telemetry
                                        </p>
                                        <div className="flex gap-2">
                                            <div className="flex items-center gap-1"><div className="w-1 h-1 rounded-full bg-indigo-400"></div><span className="text-[7px] uppercase text-white/20">TX</span></div>
                                            <div className="flex items-center gap-1"><div className="w-1 h-1 rounded-full bg-emerald-400"></div><span className="text-[7px] uppercase text-white/20">RX</span></div>
                                        </div>
                                    </div>
                                    <div className="flex justify-center mt-2">
                                        <AreaChart width={240} height={60} data={liveTraffic}>
                                            <defs>
                                                <linearGradient id="colorTx" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#818cf8" stopOpacity={0.4}/>
                                                    <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                                                </linearGradient>
                                                <linearGradient id="colorRx" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <Area type="monotone" dataKey="rx" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorRx)" isAnimationActive={false} />
                                            <Area type="monotone" dataKey="tx" stroke="#818cf8" strokeWidth={2} fillOpacity={1} fill="url(#colorTx)" isAnimationActive={false} />
                                        </AreaChart>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-2">
                                    <button className="bg-white/5 hover:bg-white/10 py-2.5 rounded-lg flex flex-col items-center gap-1 transition-all border border-white/5">
                                        <Copy className="w-3 h-3 text-slate-400" />
                                        <span className="text-[7px] font-black uppercase tracking-widest text-slate-500">Copy</span>
                                    </button>
                                    <button className="bg-emerald-600/20 hover:bg-emerald-600/30 py-2.5 rounded-lg flex flex-col items-center gap-1 transition-all border border-emerald-500/20 text-emerald-400">
                                        <Send className="w-3 h-3" />
                                        <span className="text-[7px] font-black uppercase tracking-widest">WA</span>
                                    </button>
                                    <button className="bg-white/5 hover:bg-white/10 py-2.5 rounded-lg flex flex-col items-center gap-1 transition-all border border-white/5">
                                        <Navigation className="w-3 h-3 text-slate-400" />
                                        <span className="text-[7px] font-black uppercase tracking-widest text-slate-500">Nav</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </Popup>
                    )}
                </Marker>
                </React.Fragment>
                );
            })}

            {customers.filter(c => c.latitude && c.longitude).map((customer) => {
                const signalStatus = getSignalStatus(customer.rx || -22.5, customer.status === 'active' ? 'online' : 'offline');
                return (
                    <Marker 
                        key={`cust-${customer.id}`} 
                        position={[parseFloat(customer.latitude), parseFloat(customer.longitude)]}
                        icon={getNodeIcon('USER', signalStatus, '', selectedNode?.id === customer.id && selectedNode?.type === 'USER')}
                        draggable={controls.editUserLines}
                        eventHandlers={{
                            click: () => handleNodeClick(customer.id, 'USER', [parseFloat(customer.latitude), parseFloat(customer.longitude)]),
                            dragend: (e) => {
                                const marker = e.target;
                                const position = marker.getLatLng();
                                onNodeMove?.(customer.id, 'USER', position.lat, position.lng);
                            }
                        }}
                    >
                    {!(controls.editOdpLines || controls.editUserLines) && (
                        <Popup className="noc-popup animate-in fade-in zoom-in-95 duration-500 slide-in-from-bottom-2">
                        <div className="w-[320px] bg-[#0f172a] text-white p-5 rounded-[20px] border border-white/5 shadow-2xl">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex flex-col gap-0.5 flex-1 min-w-0 mr-2">
                                    <span className="font-black text-[13px] uppercase leading-tight wrap-break-word">{customer.name}</span>
                                    <span className="text-[8px] text-slate-500 font-mono tracking-widest uppercase truncate">{customer.pppoe_username}</span>
                                </div>
                                <div className="flex flex-col items-end gap-1.5">
                                    <div className={`px-1.5 py-0.5 rounded-md text-[7px] font-black uppercase ${customer.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                        {customer.status === 'active' ? 'Online' : 'Offline'}
                                    </div>
                                    <div className={`w-2 h-2 rounded-full ${customer.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="bg-white/3 p-3 rounded-xl border border-white/5 space-y-2">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <Signal className="w-3 h-3 text-emerald-400" />
                                            <span className="text-[8px] font-black uppercase text-slate-500 tracking-widest">Signal</span>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-xs font-black text-white leading-none">{customer.rx || -22.50} <span className="text-[8px] opacity-40 ml-0.5">dBm</span></span>
                                        </div>
                                    </div>
                                    <div className="pt-2 border-t border-white/5 flex justify-between items-center opacity-40">
                                        <div className="flex items-center gap-1.5">
                                            <Server className="w-2.5 h-2.5 text-indigo-400" />
                                            <span className="text-[7px] font-black uppercase tracking-widest">OLT</span>
                                        </div>
                                        <span className="text-[8px] font-black text-white">0/1 : PON-4</span>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="bg-white/3 p-3 rounded-xl border border-white/5 flex flex-col gap-1">
                                        <div className="flex items-center justify-between opacity-40">
                                            <ArrowUpRight className="w-3 h-3 text-indigo-400" />
                                            <span className="text-[7px] font-black uppercase tracking-tighter">Upload</span>
                                        </div>
                                        <span className="text-[10px] font-black text-white">2.4 <span className="text-[8px] opacity-40 ml-0.5">Mbps</span></span>
                                    </div>
                                    <div className="bg-white/3 p-3 rounded-xl border border-white/5 flex flex-col gap-1">
                                        <div className="flex items-center justify-between opacity-40">
                                            <ArrowDownLeft className="w-3 h-3 text-emerald-400" />
                                            <span className="text-[7px] font-black uppercase tracking-tighter">Download</span>
                                        </div>
                                        <span className="text-[10px] font-black text-white">15.8 <span className="text-[8px] opacity-40 ml-0.5">Mbps</span></span>
                                    </div>
                                </div>

                                <div className="pt-3 border-t border-white/5 flex justify-between items-center">
                                    <div className="flex gap-2">
                                        <div className="flex items-center gap-1.5 bg-white/3 px-2 py-1 rounded-md border border-white/5">
                                            <Clock className="w-2.5 h-2.5 text-slate-500" />
                                            <span className="text-[8px] font-bold text-slate-400">8h 37m</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 bg-white/3 px-2 py-1 rounded-md border border-white/5">
                                            <Wifi className="w-2.5 h-2.5 text-slate-500" />
                                            <span className="text-[8px] font-bold text-slate-400">2.4G</span>
                                        </div>
                                    </div>
                                    <button className="p-1.5 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 rounded-lg transition-all">
                                        <Navigation className="w-3 h-3" />
                                    </button>
                                </div>

                                <button className="w-full bg-linear-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 py-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] transition-all shadow-xl shadow-indigo-500/20 active:scale-95 border border-white/10 group relative overflow-hidden">
                                    <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                                    <span className="relative z-10">Buka Matriks Kontrol</span>
                                </button>
                            </div>
                        </div>
                    </Popup>
                    )}
                </Marker>
                );
            })}
        </MapContainer>
    );
}
