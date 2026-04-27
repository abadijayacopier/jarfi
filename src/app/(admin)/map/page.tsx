'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Map as MapIcon, Plus, Info, Layers, Crosshair, Box, Search, Loader2, Navigation } from 'lucide-react';
import Swal from 'sweetalert2';

// Dynamic import for Leaflet map component to avoid SSR errors
const NetworkMap = dynamic(() => import('@/components/NetworkMap'), { 
    ssr: false,
    loading: () => <div className="h-[600px] bg-slate-900 animate-pulse rounded-2xl flex items-center justify-center text-slate-500 font-black">INITIALIZING MAP ENGINE...</div>
});

export default function MapPage() {
    const [odps, setOdps] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [mapCenter, setMapCenter] = useState<[number, number]>([-6.2088, 106.8456]);
    const [mapZoom, setMapZoom] = useState(13);
    
    // Search states
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [showResults, setShowResults] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    const fetchData = async () => {
        try {
            const [odpRes, custRes] = await Promise.all([
                fetch('/api/odps'),
                fetch('/api/customers')
            ]);
            const odpData = await odpRes.json();
            const custData = await custRes.json();
            setOdps(odpData.odps || []);
            setCustomers(custData.customers || []);
        } catch (error) {
            console.error('Fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        
        // Click outside to close search results
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowResults(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!searchQuery.trim()) return;

        setIsSearching(true);
        setShowResults(true);
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5&countrycodes=id`, {
                headers: {
                    'User-Agent': 'Jarfi-ISP-Management-App'
                }
            });
            const data = await response.json();
            setSearchResults(data);
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSelectLocation = (lat: string, lon: string, displayName: string) => {
        setMapCenter([parseFloat(lat), parseFloat(lon)]);
        setMapZoom(16);
        setSearchQuery(displayName);
        setShowResults(false);
    };

    const handleMapClick = (lat: number, lng: number) => {
        handleAddODP(lat.toString(), lng.toString());
    };

    const handleAddODP = async (initLat = '', initLng = '') => {
        const { value: formValues } = await Swal.fire({
            title: 'Tambah Titik ODP Baru',
            html: `
                <div class="space-y-4 text-left p-2">
                    <div>
                        <label class="text-xs font-black text-slate-500 uppercase block mb-1">Nama ODP</label>
                        <input id="swal-name" class="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-white focus:outline-none" placeholder="Contoh: ODP-BDI-01">
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="text-xs font-black text-slate-500 uppercase block mb-1">Latitude</label>
                            <input id="swal-lat" class="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-white focus:outline-none" placeholder="-6.2088" value="${initLat}">
                        </div>
                        <div>
                            <label class="text-xs font-black text-slate-500 uppercase block mb-1">Longitude</label>
                            <input id="swal-lng" class="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-white focus:outline-none" placeholder="106.8456" value="${initLng}">
                        </div>
                    </div>
                    <div>
                        <label class="text-xs font-black text-slate-500 uppercase block mb-1">Kapasitas Port</label>
                        <select id="swal-cap" class="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-white focus:outline-none">
                            <option value="8">8 Port</option>
                            <option value="16">16 Port</option>
                            <option value="32">32 Port</option>
                        </select>
                    </div>
                </div>
            `,
            focusConfirm: false,
            background: '#1e293b',
            color: '#fff',
            confirmButtonText: 'Simpan ODP',
            confirmButtonColor: '#6366f1',
            preConfirm: () => {
                return {
                    name: (document.getElementById('swal-name') as HTMLInputElement).value,
                    latitude: (document.getElementById('swal-lat') as HTMLInputElement).value,
                    longitude: (document.getElementById('swal-lng') as HTMLInputElement).value,
                    capacity: (document.getElementById('swal-cap') as HTMLSelectElement).value
                };
            }
        });

        if (formValues) {
            try {
                const res = await fetch('/api/odps', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formValues)
                });
                if (res.ok) {
                    Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Titik ODP telah didaftarkan ke peta.', background: '#1e293b', color: '#fff' });
                    fetchData();
                }
            } catch (err) {
                Swal.fire({ icon: 'error', title: 'Gagal', text: 'Terjadi kesalahan sistem.', background: '#1e293b', color: '#fff' });
            }
        }
    };

    return (
        <div className="animate-in fade-in duration-500 pb-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h3 className="text-3xl font-bold text-white flex items-center gap-3">
                        <MapIcon className="w-8 h-8 text-indigo-400" /> Network Map
                    </h3>
                    <p className="text-slate-400 mt-1">Visualisasi sebaran ODP dan lokasi pelanggan secara geografis</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => handleAddODP()}
                        className="bg-indigo-500 hover:bg-indigo-400 text-white font-bold py-3 px-6 rounded-2xl transition-all shadow-lg flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" /> Tambah ODP
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                {/* Stats & Legend */}
                <div className="xl:col-span-1 space-y-6">
                    <div className="glass p-6 rounded-3xl border border-white/10">
                        <h4 className="text-sm font-black uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
                            <Layers className="w-4 h-4" /> Legenda Peta
                        </h4>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-6 h-6 bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-[10px] text-white font-bold shadow-md">O</div>
                                <div>
                                    <p className="text-sm font-bold text-white">Titik ODP</p>
                                    <p className="text-[10px] text-slate-400">Optical Distribution Point</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-6 h-6 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center text-xs shadow-md">🏠</div>
                                <div>
                                    <p className="text-sm font-bold text-white">Lokasi Pelanggan</p>
                                    <p className="text-[10px] text-slate-400">PPPoE Active Sessions</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="glass p-6 rounded-3xl border border-white/10">
                        <h4 className="text-sm font-black uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
                            <Box className="w-4 h-4" /> Ringkasan Jaringan
                        </h4>
                        <div className="grid grid-cols-2 gap-4 text-center">
                            <div className="bg-slate-900/50 p-3 rounded-2xl border border-white/5">
                                <p className="text-2xl font-black text-white">{odps.length}</p>
                                <p className="text-[10px] text-slate-500 uppercase font-black">Total ODP</p>
                            </div>
                            <div className="bg-slate-900/50 p-3 rounded-2xl border border-white/5">
                                <p className="text-2xl font-black text-indigo-400">{customers.filter((c: any) => c.latitude).length}</p>
                                <p className="text-[10px] text-slate-500 uppercase font-black">Terpetakan</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-indigo-500/10 border border-indigo-500/20 p-5 rounded-3xl">
                        <div className="flex gap-3 mb-2">
                            <Crosshair className="w-5 h-5 text-indigo-400" />
                            <h5 className="font-bold text-white text-sm">Geolokasi Otomatis</h5>
                        </div>
                        <p className="text-[11px] text-indigo-300/80 leading-relaxed">
                            Pastikan Anda mengisi koordinat Latitude & Longitude pada form pelanggan agar icon rumah muncul di peta ini.
                        </p>
                    </div>
                </div>

                {/* Map View */}
                <div className="xl:col-span-3 relative">
                    {/* Search Bar Overlay */}
                    <div className="absolute top-4 left-4 right-4 z-1000 max-w-md" ref={searchRef}>
                        <form onSubmit={handleSearch} className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                {isSearching ? (
                                    <Loader2 className="h-5 w-5 text-indigo-400 animate-spin" />
                                ) : (
                                    <Search className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-400 transition-colors" />
                                )}
                            </div>
                            <input
                                type="text"
                                className="block w-full pl-11 pr-4 py-3.5 bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-2xl"
                                placeholder="Cari alamat atau lokasi..."
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    if (e.target.value.length > 2) handleSearch();
                                }}
                                onFocus={() => searchQuery.length > 2 && setShowResults(true)}
                            />
                        </form>

                        {/* Search Results Dropdown */}
                        {showResults && searchResults.length > 0 && (
                            <div className="absolute mt-2 w-full bg-slate-900/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-top-2 duration-200">
                                <div className="max-h-[300px] overflow-y-auto">
                                    {searchResults.map((result, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => handleSelectLocation(result.lat, result.lon, result.display_name)}
                                            className="w-full text-left px-4 py-3 hover:bg-white/5 border-b border-white/5 last:border-0 transition-colors flex items-start gap-3"
                                        >
                                            <Navigation className="w-4 h-4 text-indigo-400 mt-1 shrink-0" />
                                            <div>
                                                <p className="text-xs font-bold text-white line-clamp-1">{result.display_name.split(',')[0]}</p>
                                                <p className="text-[10px] text-slate-400 line-clamp-2 mt-0.5">{result.display_name}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <NetworkMap 
                        odps={odps} 
                        customers={customers} 
                        onMapClick={handleMapClick} 
                        center={mapCenter} 
                        zoom={mapZoom} 
                    />
                    
                    <div className="mt-3 text-center">
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">💡 Tips: Klik area manapun di peta untuk menambah titik ODP baru secara instan</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
