'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { NetworkMapProps } from '@/components/NetworkMap';
import { 
    Map as MapIcon, Plus, Info, Layers, Crosshair, Box, Search, 
    Loader2, Navigation, ChevronLeft, ChevronRight, Zap, X, 
    Signal, Activity, LayoutGrid, Settings2, Eye, EyeOff, MousePointer2, PlusCircle,
    RefreshCcw, Database, Shield, Layout, Bell, Globe, Maximize2, Monitor, Minus, Users
} from 'lucide-react';
import Swal from 'sweetalert2';

// Dynamic import for Leaflet map component
const NetworkMap = dynamic<NetworkMapProps>(() => import('@/components/NetworkMap'), { 
    ssr: false,
    loading: () => (
        <div className="h-full w-full bg-[#0f172a] animate-pulse rounded-4xl flex items-center justify-center flex-col gap-6">
            <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
            <span className="text-slate-400 font-bold uppercase tracking-widest text-[11px]">Memuat Peta Jaringan...</span>
        </div>
    )
});

interface Odp {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    capacity: number;
    used_ports?: number;
    parent_id?: string;
}

interface Customer {
    id: string;
    name: string;
    pppoe_username: string;
    latitude: number;
    longitude: number;
    status: 'active' | 'inactive';
    rx: number;
    odp_id?: string;
}

export default function MapPage() {
    const [odps, setOdps] = useState<Odp[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [mapCenter, setMapCenter] = useState<[number, number]>([-6.2088, 106.8456]);
    const [userPos, setUserPos] = useState<[number, number] | null>(null);
    const [mapZoom, setMapZoom] = useState(15);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [isSidebarVisible, setIsSidebarVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
            setIsSidebarVisible(true);
        }
    }, []);
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
        addOdpMode: false,
        addCustomerMode: false,
        addPoleMode: false
    });

    const [selectedRegion, setSelectedRegion] = useState('all');
    const [routers, setRouters] = useState<any[]>([]);

    const fetchData = async () => {
        try {
            const [odpRes, custRes, routerRes] = await Promise.all([
                fetch('/api/odps'),
                fetch('/api/customers'),
                fetch('/api/routers')
            ]);
            const odpData = await odpRes.json();
            const custData = await custRes.json();
            const routerData = await routerRes.json();
            setOdps(odpData.odps || []);
            setCustomers(custData.customers || []);
            setRouters(routerData.routers || []);
        } catch (error) {
            console.warn('Fetch error:', error);
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
            text: 'Menghubungkan dengan router MikroTik...',
            allowOutsideClick: false,
            background: '#0f172a',
            color: '#fff',
            didOpen: () => { Swal.showLoading(); }
        });

        try {
            // Sync pelanggan dari semua router yang terdaftar
            for (const r of routers) {
                try {
                    const secretsRes = await fetch(`/api/mikrotik/secrets?router_id=${r.id}`);
                    if (secretsRes.ok) {
                        const secretsData = await secretsRes.json();
                        const unsynced = (secretsData.secrets || []).filter((s: any) => !s.is_synced);
                        if (unsynced.length > 0) {
                            await fetch('/api/mikrotik/secrets', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ router_id: r.id, secrets: unsynced })
                            });
                        }
                    }
                } catch(e) { /* Router offline, skip */ }
            }
            await fetchData();
            Swal.fire({
                icon: 'success',
                title: `${type} Tersinkronisasi`,
                text: 'Data perangkat berhasil diperbarui.',
                background: '#0f172a',
                color: '#fff',
                timer: 1500
            });
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Gagal Sinkronisasi', text: 'Periksa koneksi router.', background: '#0f172a', color: '#fff' });
        }
    };

    const handleBackup = () => {
        Swal.fire({
            title: 'Backup Data Peta',
            text: 'Memulai proses backup data ODP & pelanggan...',
            background: '#0f172a',
            color: '#fff',
            timer: 2000,
            timerProgressBar: true,
            didOpen: () => { Swal.showLoading(); }
        }).then(() => {
            Swal.fire({ icon: 'success', title: 'Backup Berhasil', text: 'File berhasil disimpan.', background: '#0f172a', color: '#fff' });
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

    const handleSearch = () => {
        if (!searchQuery) return;
        
        // 1. Check for coordinates
        const coordMatch = searchQuery.match(/(-?\d+\.\d+),\s*(-?\d+\.\d+)/);
        if (coordMatch) {
            setMapCenter([parseFloat(coordMatch[1]), parseFloat(coordMatch[2])]);
            setMapZoom(18);
            return;
        }

        // 2. Search ODPs
        const foundOdp = odps.find(o => o.name.toLowerCase().includes(searchQuery.toLowerCase()));
        if (foundOdp) {
            setMapCenter([foundOdp.latitude, foundOdp.longitude]);
            setMapZoom(18);
            Swal.fire({ icon: 'info', title: 'ODP Ditemukan', text: foundOdp.name, timer: 1500, showConfirmButton: false, background: '#0f172a', color: '#fff' });
            return;
        }

        // 3. Search Customers
        const foundCust = customers.find(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.pppoe_username.toLowerCase().includes(searchQuery.toLowerCase()));
        if (foundCust && foundCust.latitude && foundCust.longitude) {
            setMapCenter([foundCust.latitude, foundCust.longitude]);
            setMapZoom(18);
            Swal.fire({ icon: 'info', title: 'Pelanggan Ditemukan', text: foundCust.name, timer: 1500, showConfirmButton: false, background: '#0f172a', color: '#fff' });
            return;
        }

        Swal.fire({ icon: 'error', title: 'Tidak Ditemukan', text: 'Perangkat atau pelanggan tidak ditemukan di peta.', background: '#0f172a', color: '#fff' });
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
                // Dynamic zoom based on accuracy (better accuracy = deeper zoom)
                const targetZoom = accuracy < 100 ? 18 : accuracy < 1000 ? 15 : 13;
                setMapZoom(targetZoom);
                Swal.close();
                
                if (accuracy > 500) {
                    const Toast = Swal.mixin({
                        toast: true,
                        position: 'top-end',
                        showConfirmButton: false,
                        timer: 4000,
                        timerProgressBar: true,
                        background: '#0f172a',
                        color: '#fff'
                    });
                    Toast.fire({
                        icon: 'info',
                        title: 'Presisi Rendah',
                        text: `Akurasi ~${Math.round(accuracy/1000)}km (Basis IP).`
                    });
                }
            },
            (error) => {
                let msg = 'Gagal mengambil koordinat lokasi.';
                if (error.code === 1) {
                    msg = 'Izin ditolak. Silakan buka pengaturan browser dan izinkan akses lokasi untuk situs ini.';
                    if (window.location.protocol === 'http:' && window.location.hostname !== 'localhost') {
                        msg += '\n\nCatatan: Browser memblokir GPS pada koneksi HTTP tidak aman.';
                    }
                } else if (error.code === 2) {
                    msg = 'Sinyal GPS tidak stabil atau perangkat tidak merespon.';
                } else if (error.code === 3) {
                    msg = 'Waktu pencarian habis (Timeout). Pastikan GPS aktif.';
                }
                
                Swal.fire({ 
                    icon: 'error', 
                    title: 'Akses Lokasi Bermasalah', 
                    text: msg, 
                    background: '#0f172a', 
                    color: '#fff',
                    confirmButtonColor: '#6366f1'
                });
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
            text: "Ini akan menghapus ODP secara permanen dan memutuskan koneksi pelanggan yang terhubung.",
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

    const handleMapClick = async (lat: number, lng: number) => {
        if (controls.addPoleMode) {
            try {
                const res = await fetch('/api/odps', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: `TIANG-${Math.floor(Math.random() * 1000)}`,
                        latitude: lat,
                        longitude: lng,
                        capacity: 0 // Pole has no ports
                    })
                });
                if (res.ok) {
                    setControls(prev => ({ ...prev, addPoleMode: false }));
                    fetchData();
                }
            } catch (err) {
                console.error(err);
            }
            return;
        }
        if (controls.addOdpMode) {
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
        } else if (controls.addCustomerMode) {
            // Filter customers who don't have valid coordinates yet
            const unmappedCustomers = customers.filter(c => !c.latitude || !c.longitude || (c.latitude === 0 && c.longitude === 0));
            
            const { value: formValues } = await Swal.fire({
                title: 'Daftar/Tempatkan Pelanggan',
                html: `
                    <div class="space-y-4 text-left">
                        <div>
                            <label class="text-[10px] font-black uppercase text-slate-500 mb-2 block">Pilih dari Daftar PPPoE (Mikrotik)</label>
                            <select id="cust-select" class="swal2-input bg-slate-800 text-white border-slate-700 m-0 w-full">
                                <option value="new">-- Daftar Pelanggan Baru (Prospek) --</option>
                                ${unmappedCustomers.map(c => `<option value="${c.id}">${c.name} (${c.pppoe_username})</option>`).join('')}
                            </select>
                        </div>
                        <div id="new-cust-fields">
                            <label class="text-[10px] font-black uppercase text-slate-500 mb-2 block">Atau Input Data Manual</label>
                            <input id="cust-input1" class="swal2-input bg-slate-800 text-white border-slate-700 m-0 mb-2 w-full" placeholder="Nama Lengkap">
                            <input id="cust-input2" class="swal2-input bg-slate-800 text-white border-slate-700 m-0 mb-2 w-full" placeholder="PPPoE Username">
                            <input id="cust-input3" class="swal2-input bg-slate-800 text-white border-slate-700 m-0 w-full" placeholder="No. WhatsApp">
                        </div>
                    </div>
                `,
                didOpen: () => {
                    const select = document.getElementById('cust-select') as HTMLSelectElement;
                    const fields = document.getElementById('new-cust-fields');
                    select.addEventListener('change', () => {
                        if (fields) fields.style.display = select.value === 'new' ? 'block' : 'none';
                    });
                },
                focusConfirm: false,
                background: '#0f172a',
                color: '#fff',
                showCancelButton: true,
                cancelButtonText: 'Batal',
                preConfirm: () => {
                    const selectValue = (document.getElementById('cust-select') as HTMLSelectElement).value;
                    if (selectValue !== 'new') {
                        return { type: 'update', id: selectValue };
                    }
                    return {
                        type: 'create',
                        name: (document.getElementById('cust-input1') as HTMLInputElement).value,
                        username: (document.getElementById('cust-input2') as HTMLInputElement).value,
                        whatsapp: (document.getElementById('cust-input3') as HTMLInputElement).value
                    };
                }
            });

            if (formValues) {
                try {
                    let res;
                    if (formValues.type === 'update') {
                        // Update existing customer location
                        res = await fetch('/api/customers', {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                id: formValues.id,
                                latitude: lat,
                                longitude: lng
                            })
                        });
                    } else if (formValues.name) {
                        // Create new customer
                        res = await fetch('/api/customers', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                name: formValues.name,
                                pppoe_username: formValues.username,
                                whatsapp: formValues.whatsapp,
                                latitude: lat,
                                longitude: lng,
                                status: 'active'
                            })
                        });
                    }

                    if (res && res.ok) {
                        Swal.fire({ icon: 'success', title: 'Pelanggan Terdaftar', background: '#0f172a', color: '#fff' });
                        setControls(prev => ({ ...prev, addCustomerMode: false }));
                        fetchData();
                    }
                } catch (err) {
                    Swal.fire({ icon: 'error', title: 'Operasi Gagal', background: '#0f172a', color: '#fff' });
                }
            }
        }
    };

    const toggleControl = (key: keyof typeof controls) => {
        if (['editOdpLines', 'editUserLines', 'addOdpMode', 'addCustomerMode', 'addPoleMode'].includes(key)) {
            setControls(prev => ({
                ...prev,
                editOdpLines: key === 'editOdpLines' ? !prev.editOdpLines : false,
                editUserLines: key === 'editUserLines' ? !prev.editUserLines : false,
                addOdpMode: key === 'addOdpMode' ? !prev.addOdpMode : false,
                addCustomerMode: key === 'addCustomerMode' ? !prev.addCustomerMode : false,
                addPoleMode: key === 'addPoleMode' ? !prev.addPoleMode : false,
            }));
        } else {
            setControls(prev => ({ ...prev, [key]: !prev[key] }));
        }
    };

    return (
        <div className="h-[calc(100vh-140px)] flex flex-col relative overflow-hidden -mx-6 md:-mx-12 -mt-6 bg-[#0f172a]">
            {/* NOC Header Bar - Optimized for Mobile */}
            <div className="absolute top-4 md:top-6 left-4 md:left-6 z-10 flex overflow-x-auto no-scrollbar gap-1.5 md:gap-2 animate-in slide-in-from-top duration-500 max-w-[calc(100%-32px)] lg:max-w-[calc(100%-400px)] pb-4">
                <button onClick={() => handleSync('Mikrotik')} className="px-4 py-2.5 bg-indigo-600/90 hover:bg-indigo-600 text-white rounded-xl shadow-xl backdrop-blur-md flex items-center gap-2 transition-all border border-indigo-400/20 group">
                    <RefreshCcw className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-500" />
                    <span className="text-[9px] font-black uppercase tracking-widest">Sinkron Mikrotik</span>
                </button>
                <button onClick={() => handleSync('ACS')} className="px-4 py-2.5 bg-emerald-600/90 hover:bg-emerald-600 text-white rounded-xl shadow-xl backdrop-blur-md flex items-center gap-2 transition-all border border-emerald-400/20 group">
                    <RefreshCcw className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-500" />
                    <span className="text-[9px] font-black uppercase tracking-widest">Sinkron ACS</span>
                </button>
                <button onClick={handleBackup} className="px-4 py-2.5 bg-slate-800/90 hover:bg-slate-800 text-white rounded-xl shadow-xl backdrop-blur-md flex items-center gap-2 transition-all border border-white/10">
                    <Database className="w-3.5 h-3.5" />
                    <span className="text-[9px] font-black uppercase tracking-widest">Cadangan</span>
                </button>

                <div className="h-10 w-px bg-white/5 mx-1 hidden lg:block"></div>

                <div className="flex bg-slate-900/90 backdrop-blur-md rounded-2xl border border-white/5 p-1.5 shadow-2xl">
                    <button className="px-4 py-1.5 bg-rose-600 text-white rounded-lg flex items-center gap-2 transition-all">
                        <Box className="w-3.5 h-3.5" />
                        <span className="text-[9px] font-black uppercase tracking-widest">Perangkat</span>
                    </button>
                    <input 
                        type="text" 
                        placeholder="Cari Perangkat atau Pelanggan..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        className="bg-transparent pl-4 pr-4 py-1.5 text-white text-[10px] font-bold tracking-widest focus:outline-none w-[200px]"
                    />
                </div>

                <div className="flex gap-1">
                    <button onClick={handleSearch} className="w-8 h-8 md:w-10 md:h-10 bg-blue-600 hover:bg-blue-500 rounded-lg md:rounded-xl flex items-center justify-center text-white shadow-lg transition-all"><Search className="w-3.5 h-3.5 md:w-4 md:h-4" /></button>
                    <button onClick={() => Swal.fire({ title: 'Status Jaringan', text: `${customers.filter(c => (c.status || '').toLowerCase() === 'active').length} pelanggan aktif, ${odps.length} ODP terpasang.`, icon: 'info', background: '#0f172a', color: '#fff' })} className="w-8 h-8 md:w-10 md:h-10 bg-amber-500 hover:bg-amber-400 rounded-lg md:rounded-xl flex items-center justify-center text-white shadow-lg transition-all"><Shield className="w-3.5 h-3.5 md:w-4 md:h-4" /></button>
                    <button onClick={toggleFullscreen} className="w-8 h-8 md:w-10 md:h-10 bg-slate-700 hover:bg-slate-600 rounded-lg md:rounded-xl flex items-center justify-center text-white shadow-lg transition-all"><Maximize2 className="w-3.5 h-3.5 md:w-4 md:h-4" /></button>
                    <button onClick={() => setIsSidebarVisible(!isSidebarVisible)} className={`w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center text-white shadow-lg transition-all ${isSidebarVisible ? 'bg-indigo-600' : 'bg-slate-700 hover:bg-slate-600'}`}><LayoutGrid className="w-3.5 h-3.5 md:w-4 md:h-4" /></button>
                    <button onClick={() => toggleControl('addOdpMode')} className={`w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center text-white shadow-lg transition-all ${controls.addOdpMode ? 'bg-emerald-400 animate-pulse' : 'bg-emerald-600 hover:bg-emerald-500'}`} title="Pasang ODP"><Plus className="w-3.5 h-3.5 md:w-4 md:h-4" /></button>
                    <button onClick={() => toggleControl('addPoleMode')} className={`w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center text-white shadow-lg transition-all ${controls.addPoleMode ? 'bg-slate-400 animate-pulse' : 'bg-slate-600 hover:bg-slate-500'}`} title="Pasang Tiang"><Monitor className="w-3.5 h-3.5 md:w-4 md:h-4" /></button>
                    <button onClick={() => setMapStyle(mapStyle === 'dark' ? 'satellite' : 'dark')} className="w-8 h-8 md:w-10 md:h-10 bg-indigo-600 hover:bg-indigo-500 rounded-lg md:rounded-xl flex items-center justify-center text-white shadow-lg transition-all"><Layers className="w-3.5 h-3.5 md:w-4 md:h-4" /></button>
                    <button onClick={handleLocateMe} className="w-8 h-8 md:w-10 md:h-10 bg-rose-600 hover:bg-rose-500 rounded-lg md:rounded-xl flex items-center justify-center text-white shadow-lg transition-all"><Navigation className="w-3.5 h-3.5 md:w-4 md:h-4" /></button>
                </div>
            </div>

            <div className="flex-1 relative z-0">
                <NetworkMap 
                    odps={odps} 
                    customers={customers} 
                    controls={controls}
                    onLinkUpdate={handleLinkUpdate}
                    onDeleteOdp={handleDeleteOdp}
                    onMapClick={handleMapClick}
                    onNodeMove={(id, type, lat, lng) => {
                        console.log('Node moved:', id, type, lat, lng);
                    }}
                    center={mapCenter} 
                    zoom={mapZoom}
                    userPos={userPos}
                    mapStyle={mapStyle}
                />
            </div>

            {/* Map Action Buttons */}
            <div className="fixed bottom-32 right-6 z-50 flex flex-col gap-4">
                {!isSidebarVisible && (
                    <button 
                        onClick={() => setIsSidebarVisible(true)}
                        className="w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-2xl flex items-center justify-center animate-in zoom-in duration-300 border border-white/20 active:scale-95 transition-all group"
                    >
                        <Settings2 className="w-6 h-6 group-hover:rotate-90 transition-transform duration-500" />
                    </button>
                )}
                <button 
                    onClick={fetchData}
                    className="w-14 h-14 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 rounded-2xl shadow-2xl flex items-center justify-center border border-slate-200 dark:border-white/10 active:scale-95 transition-all group"
                >
                    <RefreshCcw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* NOC Sidebar - Control Panel */}
            {isSidebarVisible && <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-90 lg:hidden" onClick={() => setIsSidebarVisible(false)}></div>}
            <div className={`fixed lg:absolute bottom-0 lg:bottom-auto lg:top-6 lg:right-6 z-100 lg:w-[340px] w-full lg:h-[calc(100vh-200px)] flex items-end lg:items-start p-0 lg:p-0 pointer-events-none transition-all duration-500 ${isSidebarVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-full lg:translate-x-full pointer-events-none'}`}>
                    <div className="bg-[#0f172a] lg:bg-[#0f172a]/90 backdrop-blur-3xl rounded-t-[48px] lg:rounded-[40px] shadow-[0_-20px_80px_rgba(0,0,0,0.8)] lg:shadow-[0_0_60px_rgba(0,0,0,0.6)] overflow-hidden border-t lg:border border-white/15 w-full h-[75vh] lg:h-full flex flex-col pointer-events-auto transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]">
                        {/* Drawer Handle for Mobile */}
                        <div className="lg:hidden w-16 h-1.5 bg-white/10 rounded-full mx-auto mt-4 mb-2 shadow-inner"></div>
                        
                        <div className="px-10 py-6 lg:py-8 flex justify-between items-center bg-linear-to-r from-indigo-600/90 to-indigo-700/80 backdrop-blur-xl shrink-0 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                            <div className="flex items-center gap-4 relative z-10">
                                <div className="p-2 bg-white/10 rounded-xl shadow-inner">
                                    <Shield className="w-6 h-6 text-white" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-white font-black uppercase tracking-[0.3em] text-[11px] drop-shadow-lg">Panel Kontrol</span>
                                    <span className="text-[7px] font-bold text-white/50 uppercase tracking-widest mt-1">Pemetaan Jaringan</span>
                                </div>
                            </div>
                            <button onClick={() => setIsSidebarVisible(false)} className="w-10 h-10 flex items-center justify-center text-white/60 hover:text-white transition-all bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 active:scale-90 relative z-10">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-8 space-y-8 flex-1 overflow-y-auto custom-scrollbar">
                            <div className="space-y-4">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Wilayah / Region Server</label>
                                <div className="relative">
                                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400" />
                                    <select 
                                        value={selectedRegion}
                                        onChange={(e) => setSelectedRegion(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white text-[11px] font-black focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none"
                                    >
                                        <option value="all">Semua Region</option>
                                        {routers.map((r: any) => (
                                            <option key={r.id} value={r.id}>{r.name || r.ip_address}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Kelola Infrastruktur</label>
                                <div className="grid grid-cols-1 gap-4">
                                    <button 
                                        onClick={() => toggleControl('addOdpMode')}
                                        className={`w-full py-6 rounded-3xl flex items-center justify-center gap-5 transition-all font-black uppercase tracking-[0.3em] text-[10px] relative overflow-hidden group shadow-2xl ${
                                            controls.addOdpMode 
                                            ? 'bg-emerald-500 text-white shadow-[0_0_40px_rgba(16,185,129,0.4)] border-emerald-400' 
                                            : 'bg-slate-900/50 text-slate-400 hover:text-white border border-white/5 hover:bg-white/5'
                                        }`}
                                    >
                                        {controls.addOdpMode && (
                                            <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>
                                        )}
                                        <div className={`p-2 rounded-xl ${controls.addOdpMode ? 'bg-white/20' : 'bg-white/5 group-hover:bg-white/10'} transition-all`}>
                                            <PlusCircle className={`w-5 h-5 ${controls.addOdpMode ? 'animate-bounce' : ''}`} />
                                        </div>
                                        <span className="relative z-10">{controls.addOdpMode ? 'Mode Pasang ODP Aktif' : 'Pasang ODP Baru'}</span>
                                    </button>

                                    <button 
                                        onClick={() => toggleControl('addPoleMode')}
                                        className={`w-full py-6 rounded-3xl flex items-center justify-center gap-5 transition-all font-black uppercase tracking-[0.3em] text-[10px] relative overflow-hidden group shadow-2xl ${
                                            controls.addPoleMode 
                                            ? 'bg-slate-400 text-slate-900 shadow-[0_0_40px_rgba(148,163,184,0.4)] border-slate-300' 
                                            : 'bg-slate-900/50 text-slate-400 hover:text-white border border-white/5 hover:bg-white/5'
                                        }`}
                                    >
                                        {controls.addPoleMode && (
                                            <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>
                                        )}
                                        <div className={`p-2 rounded-xl ${controls.addPoleMode ? 'bg-white/20' : 'bg-white/5 group-hover:bg-white/10'} transition-all`}>
                                            <Monitor className={`w-5 h-5 ${controls.addPoleMode ? 'animate-bounce' : ''}`} />
                                        </div>
                                        <span className="relative z-10">{controls.addPoleMode ? 'Mode Pasang Tiang Aktif' : 'Pasang Tiang Baru'}</span>
                                    </button>

                                    <button 
                                        onClick={() => toggleControl('addCustomerMode')}
                                        className={`w-full py-6 rounded-3xl flex items-center justify-center gap-5 transition-all font-black uppercase tracking-[0.3em] text-[10px] relative overflow-hidden group shadow-2xl ${
                                            controls.addCustomerMode 
                                            ? 'bg-indigo-500 text-white shadow-[0_0_40px_rgba(99,102,241,0.4)] border-indigo-400' 
                                            : 'bg-slate-900/50 text-slate-400 hover:text-white border border-white/5 hover:bg-white/5'
                                        }`}
                                    >
                                        {controls.addCustomerMode && (
                                            <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>
                                        )}
                                        <div className={`p-2 rounded-xl ${controls.addCustomerMode ? 'bg-white/20' : 'bg-white/5 group-hover:bg-white/10'} transition-all`}>
                                            <Users className={`w-5 h-5 ${controls.addCustomerMode ? 'animate-bounce' : ''}`} />
                                        </div>
                                        <span className="relative z-10">{controls.addCustomerMode ? 'Pilih Lokasi Pelanggan' : 'Daftar Pelanggan Baru'}</span>
                                    </button>
                                </div>
                                {controls.addOdpMode && (
                                    <p className="text-[8px] font-bold text-emerald-500/80 uppercase tracking-widest text-center animate-pulse">
                                        Klik pada area peta untuk menempatkan titik ODP
                                    </p>
                                )}
                            </div>

                            <div className="space-y-6">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Tampilan Peta</label>
                                {[
                                    { id: 'showOdpTooltip', label: 'Label ODP', icon: Info },
                                    { id: 'showOdpLines', label: 'Jalur Fiber ODP', icon: Activity },
                                    { id: 'showUserLines', label: 'Kabel Drop Pelanggan', icon: MousePointer2 },
                                    { id: 'showServerOlt', label: 'Server / OLT', icon: Box },
                                    { id: 'showOltOdp', label: 'Jalur OLT ke ODP', icon: Zap },
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
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Mode Edit Topologi</label>
                                {[
                                    { id: 'editOdpLines', label: 'Hubungkan Jalur Fiber', icon: Activity },
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
            <div className="absolute bottom-6 md:bottom-10 left-6 md:left-10 right-6 md:right-10 z-20 flex flex-col md:flex-row justify-between items-end md:items-center gap-4 pointer-events-none">
                <div className="bg-[#0f172a]/90 md:bg-[#0f172a]/95 backdrop-blur-3xl px-6 md:px-8 py-3 md:py-4 rounded-3xl md:rounded-[32px] border border-white/10 md:border-white/5 shadow-2xl pointer-events-auto flex items-center gap-6 md:gap-10 animate-in slide-in-from-bottom duration-700 max-w-full overflow-x-auto no-scrollbar">
                    {/* System Pulse */}
                    <div className="flex items-center gap-4 md:gap-5 border-r border-white/10 pr-6 md:pr-10 shrink-0">
                        <div className="relative">
                            <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.8)]"></div>
                            <div className="absolute inset-0 rounded-full bg-emerald-500/30 animate-ping"></div>
                        </div>
                        <div className="flex flex-col min-w-[100px] md:min-w-[120px]">
                            <span className="text-[7px] md:text-[8px] font-black uppercase text-slate-500 tracking-[0.3em] leading-none mb-1">Status Jaringan</span>
                            <span className="text-[10px] md:text-[11px] font-black text-white uppercase tracking-wider">Pemantauan Aktif</span>
                        </div>
                    </div>

                    {/* Telemetry Stats */}
                    <div className="flex items-center gap-6 md:gap-10 shrink-0">
                        {[
                            { label: 'PELANGGAN', value: customers.length, color: 'text-indigo-400', icon: Monitor },
                            { label: 'AKTIF', value: customers.filter(c => c.status === 'active').length, color: 'text-emerald-400', icon: Zap },
                            { label: 'SINYAL', value: customers.filter(c => c.rx < -27).length, color: 'text-amber-400', icon: Signal },
                            { label: 'ODP', value: odps.length, color: 'text-indigo-400', icon: Box }
                        ].map((stat, i) => (
                            <div key={i} className="flex flex-col min-w-[50px] md:min-w-[70px]">
                                <span className="text-[7px] md:text-[8px] font-black uppercase text-slate-600 tracking-widest mb-1">{stat.label}</span>
                                <div className="flex items-center gap-2">
                                    <stat.icon className={`w-2.5 h-2.5 md:w-3 md:h-3 ${stat.color} opacity-40`} />
                                    <span className="text-xs md:text-sm font-black text-white">{stat.value}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="hidden lg:block h-8 w-px bg-white/10"></div>

                    {/* Infrastructure Overview */}
                    <div className="hidden lg:flex items-center gap-10 shrink-0">
                         <div className="flex flex-col">
                            <span className="text-[8px] font-black uppercase text-slate-600 tracking-widest mb-1">Total Pelanggan</span>
                            <span className="text-sm font-black text-indigo-400">{customers.length} <span className="text-[8px] text-indigo-400/30 ml-1 tracking-widest">AKTIF</span></span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[8px] font-black uppercase text-slate-600 tracking-widest mb-1">Kondisi Jaringan</span>
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
                <div className="flex md:flex-row gap-3 pointer-events-auto items-center">
                    <div className="flex md:flex-col gap-2 p-1.5 bg-[#0f172a]/90 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-2xl">
                        <button onClick={() => setMapZoom(z => Math.min(22, z + 1))} className="w-10 h-10 bg-white/5 hover:bg-indigo-600 rounded-xl flex items-center justify-center text-white transition-all"><Plus className="w-4 h-4" /></button>
                        <button onClick={() => setMapZoom(z => Math.max(1, z - 1))} className="w-10 h-10 bg-white/5 hover:bg-indigo-600 rounded-xl flex items-center justify-center text-white transition-all"><Minus className="w-4 h-4" /></button>
                    </div>
                    <button 
                        onClick={handleLocateMe}
                        className="w-12 h-12 md:w-14 md:h-14 bg-rose-600 rounded-3xl shadow-[0_15px_40px_rgba(225,29,72,0.3)] flex items-center justify-center text-white hover:bg-rose-500 transition-all hover:-translate-y-1 active:scale-95 border border-rose-400/30"
                    >
                        <Navigation className="w-5 h-5 md:w-6 md:h-6" />
                    </button>
                </div>
            </div>
        </div>
    );
}
