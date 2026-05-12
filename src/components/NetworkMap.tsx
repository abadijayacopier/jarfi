'use client';

import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap, useMapEvents, Tooltip as LeafletTooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
    Box, Info, Activity, Signal, Zap, AlertTriangle, 
    Trash2, Server, MousePointer2, Layout, Send, Copy, Navigation, Users, Monitor
} from 'lucide-react';
import Swal from 'sweetalert2';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

// Helper for custom icons
const getNodeIcon = (type: 'ODP' | 'USER', status: 'normal' | 'warning' | 'critical' | 'offline', color: string, isSelected: boolean) => {
    const iconColor = status === 'offline' ? '#64748b' : 
                     status === 'critical' ? '#ef4444' : 
                     status === 'warning' ? '#f59e0b' : color || '#6366f1';
    
    const size = type === 'ODP' ? 42 : 32;
    const glowColor = isSelected ? '#fff' : iconColor;
    
    return L.divIcon({
        html: `
            <div class="relative flex items-center justify-center">
                ${isSelected ? `<div class="absolute -inset-4 bg-${status === 'critical' ? 'rose' : 'indigo'}-500/20 rounded-full animate-ping"></div>` : ''}
                <div class="relative transition-all duration-500 transform ${isSelected ? 'scale-125' : 'hover:scale-110'}" 
                     style="
                        width: ${size}px; 
                        height: ${size}px; 
                        background: ${iconColor}; 
                        border-radius: ${type === 'ODP' ? '12px' : '50%'}; 
                        border: 2px solid rgba(255,255,255,0.3);
                        box-shadow: 0 0 20px ${glowColor}66, inset 0 0 10px rgba(255,255,255,0.2);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: white;
                     ">
                    ${type === 'ODP' ? 
                        `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v3"/><path d="m21 16-9 5-9-5V8l9 5 9-5Z"/><path d="m12 13 9-5-9-5-9 5Z"/><path d="m12 21-9-5"/><path d="m12 21 9-5"/></svg>` : 
                        `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/></svg>`
                    }
                </div>
            </div>
        `,
        className: 'custom-node-icon',
        iconSize: [size, size],
        iconAnchor: [size/2, size/2]
    });
};

const getUserLocationIcon = () => {
    return L.divIcon({
        html: `
            <div class="relative flex items-center justify-center">
                <div class="absolute inset-0 bg-blue-500/40 rounded-full animate-ping"></div>
                <div class="w-6 h-6 bg-blue-600 rounded-full border-2 border-white shadow-xl flex items-center justify-center text-white">
                    <div class="w-2 h-2 bg-white rounded-full"></div>
                </div>
            </div>
        `,
        className: 'user-location-icon',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
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

const getOdpIcon = (used: number, capacity: number) => {
    const isFull = used >= capacity;
    return getNodeIcon('ODP', isFull ? 'critical' : 'normal', '#10b981', false);
};

const getPoleIcon = () => {
    return L.divIcon({
        html: `
            <div class="relative flex items-center justify-center">
                <div class="w-8 h-8 bg-slate-800 rounded-xl border-2 border-slate-600 shadow-xl flex items-center justify-center text-slate-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/><path d="M15 3v18"/><path d="M3 9h18"/><path d="M3 15h18"/></svg>
                </div>
            </div>
        `,
        className: 'pole-icon',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
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

// Helper to calculate estimated optical loss (dB)
const calculateAttenuation = (distanceMeters: number) => {
    const km = distanceMeters / 1000;
    const loss = (km * 0.35) + 0.15; // 0.35 dB/km + 0.15 for connector/splice average
    return loss.toFixed(2);
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
        addCustomerMode: boolean;
        addPoleMode: boolean;
    };
    onLinkUpdate?: (sourceId: any, targetId: any, type: 'ODP_TO_USER' | 'ODP_TO_ODP') => void;
    onDeleteOdp?: (id: any) => void;
    onNodeMove?: (id: any, type: 'ODP' | 'USER', lat: number, lng: number) => void;
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
    const [selectedNode, setSelectedNode] = useState<{ id: any, type: 'ODP' | 'USER', lat: number, lng: number } | null>(null);
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
            if (controls.addOdpMode || controls.editOdpLines || controls.editUserLines || controls.addCustomerMode || controls.addPoleMode) {
                map.getContainer().style.cursor = 'crosshair';
            } else {
                map.getContainer().style.cursor = '';
            }
        }, [map]);

        useMapEvents({
            click(e) {
                if ((controls.addOdpMode || controls.addCustomerMode || controls.addPoleMode) && onMapClick) {
                    onMapClick(e.latlng.lat, e.latlng.lng);
                    return;
                }
                if (selectedNode) setSelectedNode(null);
            },
            mousemove(e) {
                if (selectedNode || controls.addOdpMode || controls.addCustomerMode || controls.addPoleMode) {
                    setMousePos([e.latlng.lat, e.latlng.lng]);
                }
            }
        });
        return null;
    }

    const handleNodeClick = (id: any, type: 'ODP' | 'USER', pos: [number, number]) => {
        const [lat, lng] = pos;
        if (controls.addOdpMode || controls.addCustomerMode) return;
        
        if (controls.editUserLines) {
            if (!selectedNode) {
                setSelectedNode({ id, type, lat, lng });
            } else {
                const isOdpToUser = selectedNode.type === 'ODP' && type === 'USER';
                const isUserToOdp = selectedNode.type === 'USER' && type === 'ODP';
                
                if (isOdpToUser) {
                    if (onLinkUpdate) onLinkUpdate(selectedNode.id, id, 'ODP_TO_USER');
                    setSelectedNode(null);
                } else if (isUserToOdp) {
                    if (onLinkUpdate) onLinkUpdate(id, selectedNode.id, 'ODP_TO_USER');
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
                if (selectedNode.id != id) {
                    if (onLinkUpdate) onLinkUpdate(selectedNode.id, id, 'ODP_TO_ODP');
                    setSelectedNode(null);
                } else {
                    setSelectedNode(null);
                }
            }
            return;
        }
    };

    const handleDeleteLink = async (sourceId: any, targetId: any, type: string) => {
        const result = await Swal.fire({
            title: 'Putuskan Jalur Fiber?',
            text: "Jalur fiber akan dihapus dari peta.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Putuskan Jalur',
            cancelButtonText: 'Batal',
            background: '#0f172a',
            color: '#fff'
        });

        if (result.isConfirmed) {
            try {
                const res = await fetch('/api/map/link', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sourceId, targetId, type })
                });
                if (res.ok) {
                    Swal.fire({ icon: 'success', title: 'Terputus', background: '#0f172a', color: '#fff', timer: 1000 });
                    window.location.reload();
                }
            } catch (err) {
                Swal.fire({ icon: 'error', title: 'Gagal', background: '#0f172a', color: '#fff' });
            }
        }
    };

    const calculateCumulativeLoss = (odpId: any, allOdps: any[]): string => {
        let totalLoss = 0.5; // Start with 0.5dB for OLT port/connector
        let currentOdp = allOdps.find(o => o.id == odpId);
        let visited = new Set(); // Prevent infinite loops

        while (currentOdp && currentOdp.parent_id && !visited.has(currentOdp.id)) {
            visited.add(currentOdp.id);
            const parent = allOdps.find(p => p.id == currentOdp.parent_id);
            if (!parent) break;

            const dist = calculateDistance(
                parseFloat(currentOdp.latitude), parseFloat(currentOdp.longitude),
                parseFloat(parent.latitude), parseFloat(parent.longitude)
            );
            totalLoss += parseFloat(calculateAttenuation(dist));
            // Add splitter loss if it's not the root
            totalLoss += 0.1; // Splice/connector loss between ODPs
            
            currentOdp = parent;
        }

        return totalLoss.toFixed(2);
    };

    if (!mounted) return <div className="h-full w-full bg-white dark:bg-[#0f172a] flex items-center justify-center text-primary font-bold uppercase tracking-widest">Memuat Peta Jaringan...</div>;

    return (
        <MapContainer 
            center={center}
            zoom={zoom}
            maxZoom={22}
            style={{ height: '100%', width: '100%' }}
            className={`z-0 ${mapStyle === 'dark' ? '[&_.leaflet-tile-pane]:brightness-100' : ''}`}
            zoomControl={false}
        >
            {mounted && (
                <>
                    <ChangeView center={center} zoom={zoom} />
                    <MapEvents />
                    
                    <TileLayer
                        attribution={mapStyle === 'dark' ? '&copy; CARTO' : mapStyle === 'satellite' ? '&copy; Google' : '&copy; OpenStreetMap'}
                        url={mapStyle === 'dark' 
                            ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" 
                            : mapStyle === 'satellite'
                            ? "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
                            : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                        }
                        maxZoom={22}
                    />
                </>
            )}
            
            <Marker position={[-6.2088, 106.8456]} icon={getServerIcon()}>
                <Popup className="noc-popup">
                    <div className="w-[300px] bg-[#0f172a] text-white p-5 rounded-2xl border border-indigo-500/30">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-indigo-600/20 rounded-xl">
                                <Box className="w-6 h-6 text-indigo-400" />
                            </div>
                            <div>
                                <span className="font-black uppercase text-xs text-indigo-400 tracking-widest block">Server Pusat</span>
                                <h3 className="font-black text-lg uppercase tracking-tighter">SERVER / OLT</h3>
                            </div>
                        </div>
                        <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                            <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                <span>Status Server</span>
                                <span className="text-emerald-400">Online & Stabil</span>
                            </div>
                        </div>
                    </div>
                </Popup>
            </Marker>

            {userPos && (
                <Marker position={userPos} icon={getUserLocationIcon()}>
                    <Popup><span className="text-[10px] font-black uppercase text-blue-400">Lokasi Saya</span></Popup>
                </Marker>
            )}

            {selectedNode && mousePos && (
                <Polyline 
                    positions={[[selectedNode.lat, selectedNode.lng], mousePos]}
                    pathOptions={{ color: '#f59e0b', weight: 3, opacity: 0.8, dashArray: '10, 10' }}
                />
            )}

            {/* Backbone Lines */}
            {controls.showOdpLines && odps.filter(o => o.parent_id).map(odp => {
                const parent = odps.find(p => p.id == odp.parent_id);
                if (!parent) return null;
                const pos: [number, number][] = [[parseFloat(odp.latitude), parseFloat(odp.longitude)], [parseFloat(parent.latitude), parseFloat(parent.longitude)]];
                const dist = calculateDistance(pos[0][0], pos[0][1], pos[1][0], pos[1][1]);
                const loss = calculateAttenuation(dist);
                return (
                    <React.Fragment key={`link-odp-${odp.id}`}>
                        <Polyline positions={pos} pathOptions={{ color: '#000', weight: 10, opacity: 0.5 }} />
                        <Polyline 
                            positions={pos} 
                            eventHandlers={{ click: (e) => { L.DomEvent.stopPropagation(e); handleDeleteLink(odp.parent_id, odp.id, 'ODP_TO_ODP'); } }}
                            pathOptions={{ color: '#06b6d4', weight: 8, opacity: 1 }} 
                        />
                        <Polyline positions={pos} interactive={false} pathOptions={{ color: '#fff', weight: 1.5, opacity: 0.7, dashArray: '1, 10' }}>
                            <LeafletTooltip sticky permanent direction="center" className="distance-tooltip">
                                <div className="flex flex-col items-center bg-cyan-900/90 border border-cyan-400/50 backdrop-blur-md px-3 py-1 rounded-xl shadow-2xl">
                                    <span className="text-[10px] font-black text-white">{dist} M</span>
                                    <span className="text-[8px] font-bold text-cyan-300">Loss: {loss} dB</span>
                                </div>
                            </LeafletTooltip>
                        </Polyline>
                    </React.Fragment>
                );
            })}

            {/* Customer Lines */}
            {controls.showUserLines && customers.filter(c => c.odp_id).map(c => {
                const odp = odps.find(o => o.id == c.odp_id);
                if (!odp) return null;
                const pos: [number, number][] = [[parseFloat(odp.latitude), parseFloat(odp.longitude)], [parseFloat(c.latitude), parseFloat(c.longitude)]];
                const dist = calculateDistance(pos[0][0], pos[0][1], pos[1][0], pos[1][1]);
                const loss = calculateAttenuation(dist);
                return (
                    <React.Fragment key={`link-user-${c.id}`}>
                        <Polyline positions={pos} pathOptions={{ color: '#000', weight: 8, opacity: 0.3 }} />
                        <Polyline 
                            positions={pos}
                            eventHandlers={{ click: (e) => { L.DomEvent.stopPropagation(e); handleDeleteLink(c.odp_id, c.id, 'ODP_TO_USER'); } }}
                            pathOptions={{ color: '#6366f1', weight: 4, dashArray: '8, 12', opacity: 0.8 }}
                        >
                            <LeafletTooltip sticky permanent direction="center" className="distance-tooltip">
                                <div className="flex flex-col items-center bg-indigo-900/90 border border-indigo-400/50 backdrop-blur-md px-2 py-0.5 rounded-lg shadow-xl">
                                    <span className="text-[8px] font-black text-white">{dist} M</span>
                                    <span className="text-[7px] font-bold text-indigo-300">-{loss} dB</span>
                                </div>
                            </LeafletTooltip>
                        </Polyline>
                    </React.Fragment>
                );
            })}

            {/* ODP Markers */}
            {odps.map((odp) => {
                const isPole = (odp.name || '').toUpperCase().startsWith('TIANG');
                const used = odp.used_ports || 0;
                const capacity = odp.capacity || 8;
                const remaining = Math.max(0, capacity - used);
                const cumulativeLoss = calculateCumulativeLoss(odp.id, odps);

                return (
                    <Marker 
                        key={odp.id} 
                        position={[parseFloat(odp.latitude), parseFloat(odp.longitude)]} 
                        icon={isPole ? getPoleIcon() : getOdpIcon(used, capacity)}
                        eventHandlers={{ 
                            click: () => handleNodeClick(odp.id, 'ODP', [parseFloat(odp.latitude), parseFloat(odp.longitude)])
                        }}
                    >
                        {controls.showOdpTooltip && (
                            <LeafletTooltip permanent direction="right" className="odp-tooltip">
                                <span className="font-bold uppercase text-[9px]">{odp.name}</span>
                            </LeafletTooltip>
                        )}
                        <Popup className="noc-popup">
                            <div className="w-[280px] bg-[#0f172a] text-white p-6 rounded-3xl border border-white/10 shadow-2xl">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className={`p-3 rounded-2xl ${isPole ? 'bg-slate-800' : 'bg-emerald-500/20'}`}>
                                        <Box className={`w-5 h-5 ${isPole ? 'text-slate-400' : 'text-emerald-400'}`} />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-lg uppercase tracking-tight leading-none mb-1">{odp.name}</h3>
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">ODP Aktif</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4 mb-6">
                                    {!isPole && (
                                        <>
                                            <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Kapasitas Splitter</span>
                                                    <span className="text-[11px] font-black text-white">{used} / {capacity}</span>
                                                </div>
                                                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                                                    <div 
                                                        className="h-full bg-emerald-500 rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(16,185,129,0.5)]" 
                                                        style={{ width: `${(used/capacity)*100}%` }}
                                                    ></div>
                                                </div>
                                                <div className="flex justify-between mt-2">
                                                    <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">Sisa: {remaining} Port</span>
                                                </div>
                                            </div>

                                            <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex justify-between items-center">
                                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Estimasi Redaman</span>
                                                <div className="text-right">
                                                    <span className="text-sm font-black text-amber-400 tracking-tighter">{cumulativeLoss} dB</span>
                                                    <p className="text-[7px] text-slate-500 uppercase font-bold tracking-widest mt-0.5">Total dari OLT</p>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>

                                <button 
                                    onClick={() => onDeleteOdp && onDeleteOdp(odp.id)}
                                    className="w-full py-4 rounded-2xl bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white transition-all flex items-center justify-center gap-3 font-black uppercase tracking-widest text-[10px] border border-rose-500/20 group"
                                >
                                    <Trash2 className="w-4 h-4 group-hover:animate-bounce" />
                                    Hapus ODP
                                </button>
                            </div>
                        </Popup>
                    </Marker>
                );
            })}

            {/* Customer Markers */}
            {customers.filter(c => c.latitude && c.longitude && (parseFloat(c.latitude) !== 0 || String(c.latitude).length > 5)).map((c) => {
                const status = getSignalStatus(c.rx || -22.5, (c.status || '').toLowerCase() === 'active' ? 'online' : 'offline');
                const isLinked = !!c.odp_id;
                
                return (
                    <Marker 
                        key={`cust-${c.id}`}
                        position={[parseFloat(c.latitude), parseFloat(c.longitude)]}
                        icon={getNodeIcon('USER', status, isLinked ? '#6366f1' : '#f43f5e', selectedNode?.id == c.id && selectedNode?.type === 'USER')}
                        draggable={controls.editUserLines}
                        eventHandlers={{
                            click: () => handleNodeClick(c.id, 'USER', [parseFloat(c.latitude), parseFloat(c.longitude)]),
                            dragend: (e) => onNodeMove?.(c.id, 'USER', e.target.getLatLng().lat, e.target.getLatLng().lng)
                        }}
                    >
                        <LeafletTooltip permanent direction="right" offset={[15, 0]} className="customer-name-tooltip">
                            <div className="flex flex-col gap-0.5">
                                <span className="bg-[#0f172a]/90 text-white text-[9px] font-black px-2 py-0.5 rounded-md border border-white/10 shadow-xl backdrop-blur-sm uppercase tracking-tighter truncate max-w-[100px]">{c.name}</span>
                                <div className={`w-fit px-1.5 py-0.5 rounded-md border text-[8px] font-black ${c.rx < -27 ? 'bg-rose-500 border-rose-400' : c.rx < -24 ? 'bg-amber-500 border-amber-400' : 'bg-emerald-500 border-emerald-400'} text-white shadow-lg`}>
                                    {c.rx?.toFixed(1) || '-22.5'} dBm
                                </div>
                            </div>
                        </LeafletTooltip>
                        <Popup className="noc-popup">
                            <div className="w-[200px] bg-[#0f172a] p-4 rounded-xl text-white border border-white/10 shadow-2xl">
                                <p className="font-black uppercase text-[11px] mb-1">{c.name}</p>
                                <p className="text-[9px] font-bold text-indigo-400 mb-2">{c.pppoe_username}</p>
                                <div className="h-px w-full bg-white/5 mb-3"></div>
                                <div className="flex justify-between items-center text-[8px] font-black uppercase text-slate-500">
                                    <span>Status Sinyal</span>
                                    <span className={status === 'normal' ? 'text-emerald-400' : 'text-amber-400'}>{status}</span>
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                );
            })}
        </MapContainer>
    );
}
