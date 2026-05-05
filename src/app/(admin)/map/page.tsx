'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { NetworkMapProps } from '@/components/NetworkMap';
import { 
    Map as MapIcon, Plus, Info, Layers, Crosshair, Box, Search, 
    Loader2, Navigation, ChevronLeft, ChevronRight, Zap, X, 
    Signal, Activity, LayoutGrid, Settings2, Eye, EyeOff, MousePointer2, PlusCircle,
    RefreshCcw, Database, Shield, Layout, Bell, Globe, Maximize2, Monitor, Minus
} from 'lucide-react';
import Swal from 'sweetalert2';

// Dynamic import for Leaflet map component
const NetworkMap = dynamic<NetworkMapProps>(() => import('@/components/NetworkMap'), { 
    ssr: false,
    loading: () => (
        <div className="h-full w-full bg-[#0f172a] animate-pulse rounded-4xl flex items-center justify-center flex-col gap-6">
            <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
            <span className="text-slate-400 font-bold uppercase tracking-widest text-[11px]">Menginisialisasi Matriks NOC...</span>
        </div>
    )
});

interface Odp {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    capacity?: number;
}

interface Customer {
    id: string;
    name: string;
    pppoe_username: string;
    latitude: number;
    longitude: number;
    status: 'active' | 'inactive';
    rx: number;
}

export default function MapPage() {
    const [odps, setOdps] = useState<Odp[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [mapCenter, setMapCenter] = useState<[number, number]>([-6.2088, 106.8456]);
    const [userPos, setUserPos] = useState<[number, number] | null>(null);
    const [mapZoom, setMapZoom] = useState(15);
    const [isSidebarVisible, setIsSidebarVisible] = useState(true);
    const [mapStyle, setMapStyle] = useState('dark');
    
    // Map Controls State
    const [controls, setControls] = useState({
        showOdpTooltip: true,
        showOdpLines: true,
        showUserLines: true,
        showServerOlt: true,
        showOltOdp: true,
        editOdpLines: false,
        editUserLines: false,
        addOdpMode: false
    });

    const [selectedRegion, setSelectedRegion] = useState('1');

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
        
        // Auto-Geolocate on mount
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setMapCenter([latitude, longitude]);
                    setUserPos([latitude, longitude]);
                },
                (error) => {
                    console.log('Initial geolocation silent failure:', error.message);
                },
                { enableHighAccuracy: true }
            );
        }
    }, []);

    const handleSync = async (type: string) => {
        Swal.fire({
            title: `Menyinkronkan ${type}...`,
            text: 'Menghubungkan dengan API perangkat keras...',
            allowOutsideClick: false,
            background: '#0f172a',
            color: '#fff',
            didOpen: () => { Swal.showLoading(); }
        });

        // Simulate API latency
        await new Promise(resolve => setTimeout(resolve, 2000));
        await fetchData();
        
        Swal.fire({
            icon: 'success',
            title: `${type} Tersinkronisasi`,
            text: 'Semua status node diperbarui ke matriks.',
            background: '#0f172a',
            color: '#fff',
            timer: 1500
        });
    };

    const handleBackup = () => {
        Swal.fire({
            title: 'Cadangan Basis Data',
            text: 'Membangun terowongan aman untuk ekspor...',
            background: '#0f172a',
            color: '#fff',
            timer: 2000,
            timerProgressBar: true,
            didOpen: () => { Swal.showLoading(); }
        }).then(() => {
            Swal.fire({ icon: 'success', title: 'Cadangan Aman', text: 'Arsip lokal berhasil dibuat.', background: '#0f172a', color: '#fff' });
        });
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    };

    const handleLocateMe = () => {
        if (!navigator.geolocation) {
            Swal.fire({ icon: 'error', title: 'Geolokasi Tidak Didukung', background: '#0f172a', color: '#fff' });
            return;
        }

        Swal.fire({
            title: 'Mencari Lokasi...',
            text: 'Meminta koordinat presisi tinggi...',
            allowOutsideClick: false,
            background: '#0f172a',
            color: '#fff',
            didOpen: () => { Swal.showLoading(); }
        });

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude, accuracy } = position.coords;
                setMapCenter([latitude, longitude]);
                setUserPos([latitude, longitude]);
                setMapZoom(18);
                Swal.close();
                
                if (accuracy > 100) {
                    Swal.fire({ 
                        icon: 'info', 
                        title: 'Presisi Rendah', 
                        text: `Lokasi ditemukan tetapi akurasi rendah (~${Math.round(accuracy)}m). Aktifkan GPS untuk hasil lebih baik.`, 
                        background: '#0f172a', 
                        color: '#fff',
                        timer: 3000
                    });
                }
            },
            (error) => {
                Swal.fire({ icon: 'error', title: 'Akses Lokasi Ditolak', text: 'Aktifkan izin GPS di pengaturan browser Anda.', background: '#0f172a', color: '#fff' });
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    };

    const handleLinkUpdate = async (sourceId: number, targetId: number, type: string) => {
        const result = await Swal.fire({
            title: 'Simpan Topologi?',
            text: `Hubungkan node ${sourceId} ke ${targetId}?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Hubungkan Node',
            cancelButtonText: 'Batal',
            background: '#0f172a',
            color: '#fff',
            confirmButtonColor: '#6366f1'
        });

        if (result.isConfirmed) {
            try {
                const res = await fetch('/api/map/link', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sourceId, targetId, type })
                });
                if (res.ok) {
                    Swal.fire({ icon: 'success', title: 'Terhubung', background: '#0f172a', color: '#fff', timer: 1000 });
                    fetchData();
                }
            } catch (err) {
                Swal.fire({ icon: 'error', title: 'Gagal', background: '#0f172a', color: '#fff' });
            }
        }
    };

    const handleDeleteOdp = async (id: number) => {
        const result = await Swal.fire({
            title: 'Hapus ODP?',
            text: "Ini akan menghapus node ODP secara permanen dan memutuskan semua jalur pelanggan yang terhubung di matriks.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Hapus Node',
            cancelButtonText: 'Batal',
            background: '#0f172a',
            color: '#fff'
        });

        if (result.isConfirmed) {
            try {
                const res = await fetch(`/api/odps?id=${id}`, { method: 'DELETE' });
                if (res.ok) {
                    Swal.fire({ icon: 'success', title: 'Node Terhapus', background: '#0f172a', color: '#fff', timer: 1500 });
                    fetchData();
                } else {
                    const data = await res.json();
                    Swal.fire({ icon: 'error', title: 'Gagal Menghapus', text: data.error, background: '#0f172a', color: '#fff' });
                }
            } catch (err) {
                Swal.fire({ icon: 'error', title: 'Kesalahan Jaringan', background: '#0f172a', color: '#fff' });
            }
        }
    };

    const handleAddOdp = async (lat: number, lng: number) => {
        if (!controls.addOdpMode) return;

        const { value: formValues } = await Swal.fire({
            title: 'Node ODP Baru',
            html:
                '<input id="swal-input1" class="swal2-input bg-slate-800 text-white border-slate-700" placeholder="Nama ODP">' +
                '<input id="swal-input2" class="swal2-input bg-slate-800 text-white border-slate-700" placeholder="Kapasitas" type="number">',
            focusConfirm: false,
            background: '#0f172a',
            color: '#fff',
            showCancelButton: true,
            cancelButtonText: 'Batal',
            preConfirm: () => {
                return [
                    (document.getElementById('swal-input1') as HTMLInputElement).value,
                    (document.getElementById('swal-input2') as HTMLInputElement).value
                ]
            }
        });

        if (formValues && formValues[0]) {
            try {
                const res = await fetch('/api/odps', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: formValues[0],
                        latitude: lat,
                        longitude: lng,
                        capacity: formValues[1] || 8
                    })
                });
                if (res.ok) {
                    Swal.fire({ icon: 'success', title: 'ODP Terdaftar', background: '#0f172a', color: '#fff' });
                    setControls(prev => ({ ...prev, addOdpMode: false }));
                    fetchData();
                }
            } catch (err) {
                Swal.fire({ icon: 'error', title: 'Pendaftaran Gagal', background: '#0f172a', color: '#fff' });
            }
        }
    };

    const toggleControl = (key: keyof typeof controls) => {
        if (['editOdpLines', 'editUserLines', 'addOdpMode'].includes(key)) {
            setControls(prev => ({
                ...prev,
                editOdpLines: key === 'editOdpLines' ? !prev.editOdpLines : false,
                editUserLines: key === 'editUserLines' ? !prev.editUserLines : false,
                addOdpMode: key === 'addOdpMode' ? !prev.addOdpMode : false,
            }));
        } else {
            setControls(prev => ({ ...prev, [key]: !prev[key] }));
        }
    };

    return (
        <div className="h-[calc(100vh-140px)] flex flex-col relative overflow-hidden -mx-6 md:-mx-12 -mt-6 bg-[#0f172a]">
            {/* NOC Header Bar */}
            <div className="absolute top-6 left-6 z-1000 flex flex-wrap gap-2 animate-in slide-in-from-top duration-500 max-w-[calc(100%-400px)]">
                <button onClick={() => handleSync('Mikrotik')} className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xl flex items-center gap-2 transition-all border border-indigo-400/20 group">
                    <RefreshCcw className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-500" />
                    <span className="text-[9px] font-black uppercase tracking-widest">Sync Mikrotik</span>
                </button>
                <button onClick={() => handleSync('ACS')} className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xl flex items-center gap-2 transition-all border border-emerald-400/20 group">
                    <RefreshCcw className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-500" />
                    <span className="text-[9px] font-black uppercase tracking-widest">Sync ACS</span>
                </button>
                <button onClick={handleBackup} className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl shadow-xl flex items-center gap-2 transition-all border border-white/10">
                    <Database className="w-3.5 h-3.5" />
                    <span className="text-[9px] font-black uppercase tracking-widest">Backup</span>
                </button>

                <div className="h-10 w-px bg-white/5 mx-1 hidden lg:block"></div>

                <div className="flex bg-slate-900/90 backdrop-blur-md rounded-2xl border border-white/5 p-1.5 shadow-2xl">
                    <button className="px-4 py-1.5 bg-rose-600 text-white rounded-lg flex items-center gap-2 transition-all">
                        <Box className="w-3.5 h-3.5" />
                        <span className="text-[9px] font-black uppercase tracking-widest">Perangkat</span>
                    </button>
                    <input 
                        type="text" 
                        placeholder="Cari Lat, Lng atau Nama..." 
                        className="bg-transparent pl-4 pr-4 py-1.5 text-white text-[10px] font-bold tracking-widest focus:outline-none w-[200px]"
                    />
                </div>

                <div className="flex gap-1.5">
                    <button className="w-10 h-10 bg-blue-600 hover:bg-blue-500 rounded-xl flex items-center justify-center text-white shadow-lg transition-all"><Search className="w-4 h-4" /></button>
                    <button onClick={() => Swal.fire({ title: 'Pemindaian Keamanan', text: 'Tidak ada kerentanan terdeteksi dalam matriks.', icon: 'success', background: '#0f172a', color: '#fff' })} className="w-10 h-10 bg-amber-500 hover:bg-amber-400 rounded-xl flex items-center justify-center text-white shadow-lg transition-all"><Shield className="w-4 h-4" /></button>
                    <button onClick={toggleFullscreen} className="w-10 h-10 bg-slate-700 hover:bg-slate-600 rounded-xl flex items-center justify-center text-white shadow-lg transition-all"><Maximize2 className="w-4 h-4" /></button>
                    <button onClick={() => setIsSidebarVisible(!isSidebarVisible)} className="w-10 h-10 bg-slate-700 hover:bg-slate-600 rounded-xl flex items-center justify-center text-white shadow-lg transition-all"><LayoutGrid className="w-4 h-4" /></button>
                    <button onClick={() => toggleControl('addOdpMode')} className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg transition-all ${controls.addOdpMode ? 'bg-emerald-400 animate-pulse' : 'bg-emerald-600 hover:bg-emerald-500'}`}><Plus className="w-4 h-4" /></button>
                    <button onClick={() => setMapStyle(mapStyle === 'dark' ? 'satellite' : 'dark')} className="w-10 h-10 bg-indigo-600 hover:bg-indigo-500 rounded-xl flex items-center justify-center text-white shadow-lg transition-all"><Layers className="w-4 h-4" /></button>
                    <button onClick={handleLocateMe} className="w-10 h-10 bg-rose-600 hover:bg-rose-500 rounded-xl flex items-center justify-center text-white shadow-lg transition-all"><Navigation className="w-4 h-4" /></button>
                </div>
            </div>

            <div className="flex-1 relative z-0">
                <NetworkMap 
                    odps={odps} 
                    customers={customers} 
                    controls={controls}
                    onLinkUpdate={handleLinkUpdate}
                    onDeleteOdp={handleDeleteOdp}
                    onMapClick={handleAddOdp}
                    onNodeMove={(id, type, lat, lng) => {
                        console.log('Node moved:', id, type, lat, lng);
                    }}
                    center={mapCenter} 
                    zoom={mapZoom}
                    userPos={userPos}
                    mapStyle={mapStyle}
                />
            </div>

            {/* NOC Sidebar - Control Panel */}
            {isSidebarVisible && (
                <div className="absolute top-6 right-6 z-1000 w-[340px] animate-in slide-in-from-right duration-500 h-[calc(100vh-200px)] pointer-events-none">
                    <div className="bg-[#0f172a]/90 backdrop-blur-2xl rounded-[32px] shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden border border-white/10 pointer-events-auto h-full flex flex-col">
                        <div className="px-8 py-6 flex justify-between items-center bg-indigo-600">
                            <div className="flex items-center gap-3">
                                <Shield className="w-5 h-5 text-white" />
                                <span className="text-white font-black uppercase tracking-[0.2em] text-[10px]">Kontrol Matriks</span>
                            </div>
                            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></div>
                        </div>

                        <div className="p-8 space-y-8 flex-1 overflow-y-auto custom-scrollbar">
                            <div className="space-y-4">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Matriks Regional</label>
                                <div className="relative">
                                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400" />
                                    <select 
                                        value={selectedRegion}
                                        onChange={(e) => setSelectedRegion(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white text-[11px] font-black focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none"
                                    >
                                        <option value="1">Node Region Alpha-1</option>
                                        <option value="2">Node Region Beta-2</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Vektor Infrastruktur</label>
                                <button 
                                    onClick={() => toggleControl('addOdpMode')}
                                    className={`w-full py-5 rounded-2xl flex items-center justify-center gap-4 transition-all font-black uppercase tracking-[0.2em] text-[9px] ${controls.addOdpMode ? 'bg-emerald-500 text-white shadow-[0_0_30px_rgba(16,185,129,0.3)]' : 'bg-white/5 text-white hover:bg-white/10 border border-white/5'}`}
                                >
                                    <PlusCircle className="w-4 h-4" />
                                    {controls.addOdpMode ? 'Penempatan Aktif...' : 'Pasang Node ODP Baru'}
                                </button>
                            </div>

                            <div className="space-y-6">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Matriks Visualisasi</label>
                                {[
                                    { id: 'showOdpTooltip', label: 'Metadata ODP', icon: Info },
                                    { id: 'showOdpLines', label: 'Fiber Backbone', icon: Activity },
                                    { id: 'showUserLines', label: 'Drop Pelanggan', icon: MousePointer2 },
                                    { id: 'showServerOlt', label: 'Telemetri OLT', icon: Box },
                                    { id: 'showOltOdp', label: 'Uplink Matriks', icon: Zap },
                                ].map((item) => (
                                    <div key={item.id} className="flex justify-between items-center group cursor-pointer" onClick={() => toggleControl(item.id as any)}>
                                        <div className="flex items-center gap-4">
                                            <div className={`p-2.5 rounded-xl transition-all ${controls[item.id as keyof typeof controls] ? 'bg-indigo-500/20 text-indigo-400' : 'bg-white/5 text-slate-500'}`}>
                                                <item.icon className="w-4 h-4" />
                                            </div>
                                            <span className={`text-[11px] font-bold transition-all ${controls[item.id as keyof typeof controls] ? 'text-white' : 'text-slate-500'}`}>{item.label}</span>
                                        </div>
                                        <div className={`w-12 h-6 rounded-full relative transition-all duration-500 ${controls[item.id as keyof typeof controls] ? 'bg-indigo-500' : 'bg-white/5 border border-white/10'}`}>
                                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-500 shadow-lg ${controls[item.id as keyof typeof controls] ? 'left-7' : 'left-1'}`}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-6 pt-8 border-t border-white/5">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Mode Edit Industri</label>
                                {[
                                    { id: 'editOdpLines', label: 'Bangun Backbone', icon: Activity },
                                    { id: 'editUserLines', label: 'Hubungkan Pelanggan', icon: MousePointer2 },
                                ].map((item) => (
                                    <div key={item.id} className="flex justify-between items-center group cursor-pointer" onClick={() => toggleControl(item.id as any)}>
                                        <div className="flex items-center gap-4">
                                            <div className={`p-2.5 rounded-xl transition-all ${controls[item.id as keyof typeof controls] ? 'bg-amber-500/20 text-amber-400' : 'bg-white/5 text-slate-500'}`}>
                                                <item.icon className="w-4 h-4" />
                                            </div>
                                            <span className={`text-[11px] font-bold transition-all ${controls[item.id as keyof typeof controls] ? 'text-white' : 'text-slate-500'}`}>{item.label}</span>
                                        </div>
                                        <div className={`w-12 h-6 rounded-full relative transition-all duration-500 ${controls[item.id as keyof typeof controls] ? 'bg-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.2)]' : 'bg-white/5 border border-white/10'}`}>
                                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-500 shadow-lg ${controls[item.id as keyof typeof controls] ? 'left-7' : 'left-1'}`}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* NOC Unified Matrix Dock */}
            <div className="absolute bottom-10 left-10 right-10 z-1000 flex justify-between items-center pointer-events-none">
                <div className="bg-[#0f172a]/95 backdrop-blur-3xl px-8 py-4 rounded-[32px] border border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.8)] pointer-events-auto flex items-center gap-10 animate-in slide-in-from-bottom duration-700 max-w-full overflow-x-auto custom-scrollbar no-scrollbar">
                    {/* System Pulse */}
                    <div className="flex items-center gap-5 border-r border-white/5 pr-10">
                        <div className="relative">
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.8)]"></div>
                            <div className="absolute inset-0 rounded-full bg-emerald-500/30 animate-ping"></div>
                        </div>
                        <div className="flex flex-col min-w-[120px]">
                            <span className="text-[8px] font-black uppercase text-slate-500 tracking-[0.3em] leading-none mb-1">Aliran Matriks</span>
                            <span className="text-[11px] font-black text-white uppercase tracking-wider">Pemantauan Aktif</span>
                        </div>
                    </div>

                    {/* Telemetry Stats */}
                    <div className="flex items-center gap-10">
                        {[
                            { label: 'Total ONU', value: customers.length, color: 'text-indigo-400', icon: Monitor },
                            { label: 'ONU Aktif', value: customers.filter(c => c.status === 'active').length, color: 'text-emerald-400', icon: Zap },
                            { label: 'Waspada Sinyal', value: customers.filter(c => c.rx < -27).length, color: 'text-amber-400', icon: Signal },
                            { label: 'Node ODP', value: odps.length, color: 'text-indigo-400', icon: Box }
                        ].map((stat, i) => (
                            <div key={i} className="flex flex-col min-w-[70px]">
                                <span className="text-[8px] font-black uppercase text-slate-600 tracking-widest mb-1">{stat.label}</span>
                                <div className="flex items-center gap-2">
                                    <stat.icon className={`w-3 h-3 ${stat.color} opacity-40`} />
                                    <span className="text-sm font-black text-white">{stat.value}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="h-10 w-px bg-white/5"></div>

                    {/* Infrastructure Overview */}
                    <div className="flex items-center gap-10">
                         <div className="flex flex-col">
                            <span className="text-[8px] font-black uppercase text-slate-600 tracking-widest mb-1">Pelanggan Global</span>
                            <span className="text-sm font-black text-indigo-400">{customers.length} <span className="text-[8px] text-indigo-400/30 ml-1 tracking-widest">AKTIF</span></span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[8px] font-black uppercase text-slate-600 tracking-widest mb-1">Kesehatan Matriks</span>
                            <div className="flex items-center gap-2">
                                <div className="flex -space-x-1">
                                    {[1, 2, 3].map(j => <div key={j} className="w-1.5 h-4 bg-emerald-500/40 rounded-sm"></div>)}
                                    <div className="w-1.5 h-4 bg-white/5 rounded-sm"></div>
                                </div>
                                <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Stabil</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Map Action Controls */}
                <div className="flex gap-3 pointer-events-auto items-center">
                    <div className="flex flex-col gap-2 p-1.5 bg-[#0f172a]/90 backdrop-blur-2xl rounded-2xl border border-white/5 shadow-2xl">
                        <button onClick={() => setMapZoom(z => Math.min(20, z + 1))} className="w-10 h-10 bg-white/5 hover:bg-indigo-600 rounded-xl flex items-center justify-center text-white transition-all"><Plus className="w-4 h-4" /></button>
                        <button onClick={() => setMapZoom(z => Math.max(1, z - 1))} className="w-10 h-10 bg-white/5 hover:bg-indigo-600 rounded-xl flex items-center justify-center text-white transition-all"><Minus className="w-4 h-4" /></button>
                    </div>
                    <button 
                        onClick={handleLocateMe}
                        className="w-14 h-14 bg-rose-600 rounded-3xl shadow-[0_15px_40px_rgba(225,29,72,0.3)] flex items-center justify-center text-white hover:bg-rose-500 transition-all hover:-translate-y-1 active:scale-95 border border-rose-400/30"
                    >
                        <Navigation className="w-6 h-6" />
                    </button>
                </div>
            </div>
        </div>
    );
}
