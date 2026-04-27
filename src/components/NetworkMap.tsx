'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, Polyline, useMap } from 'react-leaflet';
import L, { LeafletMouseEvent } from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default icon issues in Leaflet with Next.js
const DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

const ODP_ICON = L.divIcon({
    html: `
        <div class="relative flex flex-col items-center">
            <div class="w-10 h-10 bg-red-600 rounded-xl border-2 border-white flex items-center justify-center text-white shadow-[0_0_15px_rgba(220,38,38,0.5)] transform -rotate-45">
                <div class="transform rotate-45 font-black text-[10px]">BOX</div>
            </div>
            <div class="bg-red-600 text-white text-[8px] font-black px-1.5 rounded-full mt-1 border border-white whitespace-nowrap shadow-md uppercase">ODP HUB</div>
        </div>
    `,
    className: 'custom-div-icon',
    iconSize: [40, 60],
    iconAnchor: [20, 20]
});

const CUSTOMER_ICON = L.divIcon({
    html: `
        <div class="relative flex flex-col items-center">
            <div class="w-8 h-8 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center text-white shadow-lg">
                <span class="text-sm">🏠</span>
            </div>
            <div class="bg-slate-900/80 text-white text-[7px] font-bold px-1 rounded mt-0.5 border border-white/20 whitespace-nowrap uppercase">User</div>
        </div>
    `,
    className: 'custom-div-icon',
    iconSize: [32, 45],
    iconAnchor: [16, 16]
});

L.Marker.prototype.options.icon = DefaultIcon;

function MapEvents({ onClick }: { onClick?: (lat: number, lng: number) => void }) {
    useMapEvents({
        click(e: LeafletMouseEvent) {
            if (onClick) onClick(e.latlng.lat, e.latlng.lng);
        },
    });
    return null;
}

// Component to handle map view changes
function ChangeView({ center, zoom }: { center: [number, number], zoom: number }) {
    const map = useMap();
    useEffect(() => {
        map.setView(center, zoom);
    }, [center, zoom, map]);
    return null;
}

interface NetworkMapProps {
    odps: any[];
    customers: any[];
    onMapClick?: (lat: number, lng: number) => void;
    center?: [number, number];
    zoom?: number;
}

export default function NetworkMap({ odps, customers, onMapClick, center = [-6.2088, 106.8456], zoom = 13 }: NetworkMapProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return <div className="h-[600px] bg-slate-900 animate-pulse rounded-2xl flex items-center justify-center text-slate-500 font-black tracking-widest uppercase">INITIALIZING MAP ENGINE...</div>;

    return (
        <MapContainer 
            {...{
                center: center,
                zoom: zoom,
                style: { height: '600px', width: '100%', borderRadius: '1.5rem', border: '1px solid rgba(255,255,255,0.1)' },
                className: "z-10 shadow-2xl"
            } as any}
        >
            <ChangeView center={center} zoom={zoom} />
            <TileLayer
                {...{
                    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                } as any}
            />
            
            <MapEvents onClick={onMapClick} />
            
            {/* Draw Polylines (Cables) between Customers and their ODPs */}
            {customers.filter(c => c.latitude && c.longitude && c.odp_id).map((customer) => {
                const odp = odps.find(o => o.id === customer.odp_id);
                if (!odp) return null;
                
                return (
                    <Polyline 
                        key={`line-${customer.id}`}
                        positions={[
                            [parseFloat(customer.latitude), parseFloat(customer.longitude)],
                            [parseFloat(odp.latitude), parseFloat(odp.longitude)]
                        ]}
                        pathOptions={{ color: '#6366f1', weight: 2, dashArray: '5, 10', opacity: 0.6 }}
                    />
                );
            })}

            {/* Render ODPs */}
            {odps.map((odp) => (
                <Marker 
                    key={`odp-${odp.id}`} 
                    {...{
                        position: [parseFloat(odp.latitude), parseFloat(odp.longitude)] as [number, number],
                        icon: ODP_ICON
                    } as any}
                >
                    <Popup>
                        <div className="p-2 min-w-[150px]">
                            <h3 className="font-black text-red-600 text-lg border-b border-red-100 pb-1 mb-2 uppercase italic">{odp.name}</h3>
                            <div className="space-y-1">
                                <p className="text-xs text-slate-600 flex justify-between"><span>Kapasitas:</span> <span className="font-bold text-slate-900">{odp.used_ports}/{odp.capacity} Port</span></p>
                                <p className="text-xs text-slate-600 flex justify-between"><span>Status:</span> <span className="font-bold text-green-600 uppercase tracking-tighter">{odp.status}</span></p>
                            </div>
                        </div>
                    </Popup>
                </Marker>
            ))}

            {/* Render Customers with locations */}
            {customers.filter(c => c.latitude && c.longitude).map((customer) => (
                <Marker 
                    key={`cust-${customer.id}`} 
                    {...{
                        position: [parseFloat(customer.latitude), parseFloat(customer.longitude)] as [number, number],
                        icon: L.divIcon({
                            html: `
                                <div class="relative flex flex-col items-center">
                                    <div class="w-8 h-8 bg-indigo-500 rounded-full border-2 border-white flex items-center justify-center text-white shadow-lg">
                                        <span class="text-sm">🏠</span>
                                    </div>
                                    <div class="bg-indigo-600 text-white text-[7px] font-black px-1.5 rounded mt-0.5 border border-white/20 whitespace-nowrap uppercase shadow-sm">${customer.package_name || 'N/A'}</div>
                                </div>
                            `,
                            className: 'custom-div-icon',
                            iconSize: [40, 50],
                            iconAnchor: [20, 20]
                        })
                    } as any}
                >
                    <Popup>
                        <div className="p-3 min-w-[180px] bg-white rounded-lg">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-black text-indigo-600 text-base uppercase leading-tight mr-2">{customer.name}</h3>
                                <span className={`text-[8px] px-1.5 py-0.5 rounded-md font-black uppercase shadow-sm ${customer.status === 'ACTIVE' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                                    {customer.status}
                                </span>
                            </div>
                            
                            <div className="space-y-1.5 mb-3">
                                <p className="text-[10px] text-slate-500 flex justify-between">
                                    <span className="font-medium">Username:</span>
                                    <span className="font-bold text-slate-900">{customer.pppoe_username}</span>
                                </p>
                                <p className="text-[10px] text-slate-500 flex justify-between">
                                    <span className="font-medium">Paket:</span>
                                    <span className="font-black text-indigo-600 uppercase italic">{customer.package_name || 'Tanpa Paket'}</span>
                                </p>
                                <p className="text-[10px] text-slate-500 flex justify-between">
                                    <span className="font-medium">Phone:</span>
                                    <span className="font-bold text-slate-900">{customer.phone || '-'}</span>
                                </p>
                            </div>
                            
                            <div className="pt-2 border-t border-slate-100 flex items-center justify-center">
                                <button className="text-[9px] font-black uppercase text-indigo-500 hover:text-indigo-700 transition-colors">
                                    Buka Detail Pelanggan
                                </button>
                            </div>
                        </div>
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    );
}

