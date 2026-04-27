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
        <div className="animate-in fade-in duration-500 pb-20 space-y-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12">
                <div>
                    <h3 className="text-4xl font-black text-primary flex items-center gap-4">
                        <MapIcon className="w-10 h-10 text-indigo-600 dark:text-indigo-400" /> Network Map
                    </h3>
                    <p className="text-muted font-medium mt-2">Visualisasi sebaran ODP dan lokasi pelanggan secara geografis</p>
                </div>
                <button
                    onClick={() => handleAddODP()}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 px-8 rounded-2xl transition-all shadow-xl shadow-indigo-600/20 flex items-center gap-3 uppercase tracking-widest text-[10px] active:scale-95"
                >
                    <Plus className="w-5 h-5" /> Tambah ODP
                </button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-10">
                {/* Stats & Legend */}
                <div className="xl:col-span-1 space-y-8">
                    <div className="glass p-8 rounded-[2.5rem] border border-(--glass-border) shadow-xl">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-6 flex items-center gap-3">
                            <Layers className="w-4 h-4" /> Legenda Peta
                        </h4>
                        <div className="space-y-6">
                            <div className="flex items-center gap-4 group">
                                <div className="w-8 h-8 bg-red-500 rounded-2xl border-2 border-white dark:border-slate-800 flex items-center justify-center text-[10px] text-white font-black shadow-lg group-hover:scale-110 transition-transform">O</div>
                                <div>
                                    <p className="text-sm font-black text-primary">Titik ODP</p>
                                    <p className="text-[10px] text-muted font-bold uppercase tracking-widest mt-0.5">Optical Distribution Point</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 group">
                                <div className="w-8 h-8 bg-indigo-600 rounded-2xl border-2 border-white dark:border-slate-800 flex items-center justify-center text-xs shadow-lg group-hover:scale-110 transition-transform">🏠</div>
                                <div>
                                    <p className="text-sm font-black text-primary">Lokasi Pelanggan</p>
                                    <p className="text-[10px] text-muted font-bold uppercase tracking-widest mt-0.5">PPPoE Active Sessions</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="glass p-8 rounded-[2.5rem] border border-(--glass-border) shadow-xl">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-6 flex items-center gap-3">
                            <Box className="w-4 h-4" /> Ringkasan Jaringan
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-100 dark:bg-slate-900/50 p-5 rounded-2xl border border-(--glass-border) text-center shadow-inner">
                                <p className="text-3xl font-black text-primary">{odps.length}</p>
                                <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mt-1">Total ODP</p>
                            </div>
                            <div className="bg-slate-100 dark:bg-slate-900/50 p-5 rounded-2xl border border-(--glass-border) text-center shadow-inner">
                                <p className="text-3xl font-black text-indigo-600 dark:text-indigo-400">{customers.filter((c: any) => c.latitude).length}</p>
                                <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mt-1">Terpetakan</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-indigo-500/10 border border-indigo-500/20 p-8 rounded-[2.5rem] shadow-xl">
                        <div className="flex gap-4 mb-3">
                            <Crosshair className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                            <h5 className="font-black text-primary text-sm uppercase tracking-widest">Geolokasi Otomatis</h5>
                        </div>
                        <p className="text-xs text-muted leading-relaxed font-medium">
                            Pastikan Anda mengisi koordinat Latitude & Longitude pada form pelanggan agar icon rumah muncul di peta ini secara presisi.
                        </p>
                    </div>
                </div>

                {/* Map View */}
                <div className="xl:col-span-3 relative group">
                    <div className="absolute inset-0 rounded-[3rem] border-4 border-indigo-500/5 pointer-events-none z-50"></div>
                    
                    {/* Search Bar Overlay */}
                    <div className="absolute top-6 left-6 right-6 z-1000 max-w-md" ref={searchRef}>
                        <form onSubmit={handleSearch} className="relative group/search">
                            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                {isSearching ? (
                                    <Loader2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400 animate-spin" />
                                ) : (
                                    <Search className="h-5 w-5 text-slate-400 group-focus-within/search:text-indigo-600 transition-colors" />
                                )}
                            </div>
                            <input
                                type="text"
                                className="block w-full pl-14 pr-6 py-5 bg-white/90 dark:bg-slate-950/90 backdrop-blur-2xl border-2 border-(--glass-border) rounded-4xl text-primary placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all shadow-[0_20px_50px_-10px_rgba(0,0,0,0.3)] font-bold text-sm"
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
                            <div className="absolute mt-3 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border-2 border-(--glass-border) rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.4)] overflow-hidden animate-in slide-in-from-top-4 duration-300">
                                <div className="max-h-[350px] overflow-y-auto custom-scrollbar">
                                    {searchResults.map((result, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => handleSelectLocation(result.lat, result.lon, result.display_name)}
                                            className="w-full text-left px-6 py-4 hover:bg-slate-100 dark:hover:bg-white/5 border-b border-(--glass-border) last:border-0 transition-all flex items-start gap-4 active:bg-indigo-50"
                                        >
                                            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 mt-0.5">
                                                <Navigation className="w-4 h-4 shrink-0" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-primary line-clamp-1">{result.display_name.split(',')[0]}</p>
                                                <p className="text-[10px] text-muted font-bold line-clamp-2 mt-1 uppercase tracking-tight">{result.display_name}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="rounded-[3rem] overflow-hidden shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] border-2 border-(--glass-border) h-[650px]">
                        <NetworkMap 
                            odps={odps} 
                            customers={customers} 
                            onMapClick={handleMapClick} 
                            center={mapCenter} 
                            zoom={mapZoom} 
                        />
                    </div>
                    
                    <div className="mt-6 text-center">
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3">
                            <span className="w-8 h-px bg-slate-200 dark:bg-white/10"></span>
                            💡 Tips: Klik area manapun di peta untuk menambah titik ODP baru secara instan
                            <span className="w-8 h-px bg-slate-200 dark:bg-white/10"></span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
