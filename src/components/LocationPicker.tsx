'use client';

import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

function MapEvents({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
    useMapEvents({
        click(e) {
            onLocationSelect(e.latlng.lat, e.latlng.lng);
        },
    });
    return null;
}

export default function LocationPicker({ 
    initialLat, 
    initialLng, 
    onLocationChange 
}: { 
    initialLat?: string, 
    initialLng?: string, 
    onLocationChange: (lat: string, lng: string) => void 
}) {
    const [pos, setPos] = useState<[number, number] | null>(
        initialLat && initialLng ? [parseFloat(initialLat), parseFloat(initialLng)] : [-6.2088, 106.8456]
    );

    const handleSelect = (lat: number, lng: number) => {
        setPos([lat, lng]);
        onLocationChange(lat.toFixed(8), lng.toFixed(8));
    };

    return (
        <div className="w-full h-[250px] rounded-xl overflow-hidden border border-white/10 shadow-inner">
            <MapContainer 
                center={pos || [-6.2088, 106.8456]} 
                zoom={15} 
                style={{ height: '100%', width: '100%' }}
            >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <MapEvents onLocationSelect={handleSelect} />
                {pos && <Marker position={pos} icon={DefaultIcon} />}
            </MapContainer>
            <div className="bg-slate-900/80 p-2 text-[10px] text-center text-slate-400">
                Klik pada peta untuk menentukan titik lokasi rumah pelanggan
            </div>
        </div>
    );
}
