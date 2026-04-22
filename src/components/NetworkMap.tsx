'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default icon issues in Leaflet with Next.js
const DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

const ODP_ICON = L.divIcon({
    html: '<div class="w-8 h-8 bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-white font-bold shadow-lg">ODP</div>',
    className: 'custom-div-icon',
    iconSize: [32, 32],
    iconAnchor: [16, 16]
});

const CUSTOMER_ICON = L.divIcon({
    html: '<div class="w-6 h-6 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center text-white text-[10px] shadow-lg">🏠</div>',
    className: 'custom-div-icon',
    iconSize: [24, 24],
    iconAnchor: [12, 12]
});

L.Marker.prototype.options.icon = DefaultIcon;

function MapEvents({ onClick }: { onClick?: (lat: number, lng: number) => void }) {
    useMapEvents({
        click(e) {
            if (onClick) onClick(e.latlng.lat, e.latlng.lng);
        },
    });
    return null;
}

export default function NetworkMap({ odps, customers, onMapClick }: { odps: any[], customers: any[], onMapClick?: (lat: number, lng: number) => void }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return <div className="h-[600px] bg-slate-900 animate-pulse rounded-2xl flex items-center justify-center text-slate-500">Loading Map Engine...</div>;

    return (
        <MapContainer 
            {...{
                center: [-6.2088, 106.8456] as [number, number],
                zoom: 13,
                style: { height: '600px', width: '100%', borderRadius: '1.5rem', border: '1px solid rgba(255,255,255,0.1)' },
                className: "z-10 shadow-2xl"
            } as any}
        >
            <TileLayer
                {...{
                    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                } as any}
            />
            
            <MapEvents onClick={onMapClick} />
            
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
                        <div className="p-1">
                            <h3 className="font-bold text-indigo-600 text-lg">{odp.name}</h3>
                            <p className="text-sm text-slate-600">Kapasitas: {odp.used_ports}/{odp.capacity} Port</p>
                            <p className="text-xs text-slate-400 mt-1">Status: <span className="font-bold text-green-600">{odp.status}</span></p>
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
                        icon: CUSTOMER_ICON
                    } as any}
                >
                    <Popup>
                        <div className="p-1">
                            <h3 className="font-bold text-blue-600">{customer.name}</h3>
                            <p className="text-sm text-slate-600">{customer.pppoe_username}</p>
                            <p className="text-xs text-slate-400 mt-1">Status: {customer.status}</p>
                        </div>
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    );
}
