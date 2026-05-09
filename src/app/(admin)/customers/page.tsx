'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Swal from 'sweetalert2';
import { 
    RefreshCw, X, DownloadCloud, Edit, Trash2, ShieldAlert, Search, Users, 
    Wifi, Calendar, Activity, Zap, ArrowDown, ArrowUp, MapPin, 
    ChevronLeft, ChevronRight, Filter, MoreVertical, ExternalLink, Navigation,
    TrendingUp, Signal, Box, AlertTriangle, Monitor, Power, Plus, Eye,
    Loader2, Database, HardDrive, Cpu, Network, ShieldCheck, Router as RouterIcon
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { 
    ResponsiveContainer, AreaChart, Area, CartesianGrid, Tooltip, XAxis, YAxis 
} from 'recharts';

const LocationPicker = dynamic(() => import('@/components/LocationPicker'), { ssr: false });

const mockSparkline = [
    { v: 40 }, { v: 45 }, { v: 42 }, { v: 48 }, { v: 46 }, { v: 52 }, { v: 50 }
];

export default function CustomersPage() {
    const [customers, setCustomers] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [routers, setRouters] = useState<any[]>([]);
    const [packages, setPackages] = useState<any[]>([]);
    const [odps, setOdps] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const isFetchingRef = useRef(false);
    const abortControllerRef = useRef<AbortController | null>(null);

    const [viewMode, setViewMode] = useState<'table' | 'grid'>('grid');
    const [showForm, setShowForm] = useState(false);
    const [showDetail, setShowDetail] = useState(false);
    const [chartReady, setChartReady] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isDetecting, setIsDetecting] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);
    const [formData, setFormData] = useState({ 
        user_id: '', name: '', phone: '', router_id: '', package_id: '', 
        pppoe_username: '', pppoe_password: '', due_date: 1, 
        latitude: '', longitude: '', odp_id: '' 
    });

    // Pagination & Traffic
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);
    const [trafficData, setTrafficData] = useState<any[]>([]);
    const [trafficLoading, setTrafficLoading] = useState(false);
    const [chartData, setChartData] = useState<any[]>([
        { name: '0s', down: 0, up: 0 },
        { name: '1s', down: 0, up: 0 },
        { name: '2s', down: 0, up: 0 },
        { name: '3s', down: 0, up: 0 },
        { name: '4s', down: 0, up: 0 },
        { name: '5s', down: 0, up: 0 },
    ]);
    const [theme, setTheme] = useState<'light' | 'dark'>('light');
    const [currentTime, setCurrentTime] = useState<Date | null>(null);
    const [showPppoePass, setShowPppoePass] = useState(false);

    useEffect(() => {
        setMounted(true);
        setCurrentTime(new Date());
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (!mounted) return;
        // Detect theme from document class
        const isDark = document.documentElement.classList.contains('dark');
        setTheme(isDark ? 'dark' : 'light');
        
        // Watch for theme changes
        const observer = new MutationObserver(() => {
            const dark = document.documentElement.classList.contains('dark');
            setTheme(dark ? 'dark' : 'light');
        });
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        fetchData(true);
    }, []);

    useEffect(() => {
        if (showDetail) {
            const timer = setTimeout(() => setChartReady(true), 500);
            return () => clearTimeout(timer);
        } else {
            setChartReady(false);
        }
    }, [showDetail]);

    // Handle deep linking from Map
    useEffect(() => {
        if (mounted && customers.length > 0) {
            const urlParams = new URLSearchParams(window.location.search);
            const id = urlParams.get('id');
            if (id) {
                const customer = customers.find(c => c.id == id);
                if (customer) {
                    setSelectedCustomer(customer);
                    setShowDetail(true);
                    // Clear the param without refreshing to keep URL clean
                    window.history.replaceState({}, '', '/customers');
                }
            }
        }
    }, [mounted, customers]);

    useEffect(() => {
        if (routers.length > 0) {
            // Initial fetch
            fetchAllTraffic();
            
            // Background polling: 10s interval, skips if tab is hidden or fetch in progress
            const trafficTimer = setInterval(() => {
                if (!document.hidden) {
                    fetchAllTraffic();
                }
            }, 10000);

            const oltTimer = setInterval(() => {
                if (!document.hidden) {
                    syncOltData();
                }
            }, 60000); 

            return () => {
                clearInterval(trafficTimer);
                clearInterval(oltTimer);
                if (abortControllerRef.current) abortControllerRef.current.abort();
            };
        }
    }, [routers]);

    const handleAutoDetect = async (customerId: any) => {
        setIsDetecting(true);
        try {
            const res = await fetch('/api/automation/detect-subscriber', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ customerId })
            });
            const data = await res.json();
            if (data.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Router Terdeteksi!',
                    text: `Pelanggan ditemukan pada Router ID: ${data.router_id}. Database telah diperbarui secara otomatis.`,
                    background: '#0f172a',
                    color: '#fff'
                });
                // Refresh customer data
                const updatedRows = customers.map(c => c.id === customerId ? { ...c, router_id: data.router_id, mikrotik_mac: data.mac } : c);
                setCustomers(updatedRows);
                if (selectedCustomer?.id === customerId) {
                    setSelectedCustomer({ ...selectedCustomer, router_id: data.router_id, mikrotik_mac: data.mac });
                }
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Gagal Mendeteksi',
                    text: data.error || 'Pelanggan tidak ditemukan di router manapun yang aktif.',
                    background: '#0f172a',
                    color: '#fff'
                });
            }
        } catch (err) {
            Swal.fire({
                icon: 'error',
                title: 'Kesalahan Sistem',
                text: 'Terjadi kegagalan saat menghubungkan ke mesin automasi.',
                background: '#0f172a',
                color: '#fff'
            });
        } finally {
            setIsDetecting(false);
        }
    };

    const fetchData = async (firstLoad = false) => {
        if (firstLoad) setLoading(true);
        setIsSyncing(true);
        try {
            const [cRes, rRes, pRes, oRes] = await Promise.all([
                fetch('/api/customers'),
                fetch('/api/routers'),
                fetch('/api/packages'),
                fetch('/api/odps')
            ]);
            if (cRes.ok) setCustomers((await cRes.json()).customers || []);
            if (rRes.ok) {
                const rData = await rRes.json();
                setRouters(rData.routers || []);
            }
            if (pRes.ok) setPackages((await pRes.json()).packages || []);
            if (oRes.ok) setOdps((await oRes.json()).odps || []);
            
            if (!firstLoad) {
                // Immediate pulse to MikroTik for fresh traffic
                await fetchAllTraffic();
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
            setIsSyncing(false);
        }
    };

    const syncOltData = async () => {
        setIsSyncing(true);
        try {
            const res = await fetch('/api/olts/sync', { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}) 
            });
            const data = await res.json();
            if (res.ok) {
                Swal.fire({
                    icon: 'success',
                    title: 'Telemetri Disinkronkan',
                    text: data.message,
                    background: theme === 'dark' ? '#0f172a' : '#fff',
                    color: theme === 'dark' ? '#fff' : '#1e293b',
                    timer: 2000,
                    showConfirmButton: false
                });
                fetchData();
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsSyncing(false);
        }
    };

    const syncMikrotikData = async () => {
        setIsSyncing(true);
        try {
            const res = await fetch('/api/customers/sync', { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({})
            });
            const data = await res.json();
            if (res.ok) {
                const errorHtml = data.errors && data.errors.length > 0 
                    ? `<div class="mt-4 text-left max-h-40 overflow-y-auto p-4 bg-red-500/5 rounded-2xl border border-red-500/10">
                        ${data.errors.map((e: any) => `
                            <div class="mb-3 last:mb-0">
                                <div class="text-[10px] font-black text-red-500 uppercase tracking-widest">${e.username}</div>
                                <div class="text-[9px] text-slate-500 font-bold">${e.error}</div>
                                <div class="text-[8px] text-slate-400 opacity-50">${e.router}</div>
                            </div>
                        `).join('')}
                       </div>`
                    : '';

                Swal.fire({
                    icon: data.failCount > 0 ? 'warning' : 'success',
                    title: 'Sinkronisasi MikroTik',
                    html: `<div>${data.message}</div>${errorHtml}`,
                    background: theme === 'dark' ? '#0f172a' : '#fff',
                    color: theme === 'dark' ? '#fff' : '#1e293b',
                    confirmButtonColor: '#6366f1'
                });
                fetchData();
            } else {
                throw new Error(data.error);
            }
        } catch (err: any) {
            Swal.fire({
                icon: 'error',
                title: 'Sinkronisasi Gagal',
                text: err.message,
                background: theme === 'dark' ? '#0f172a' : '#fff',
                color: theme === 'dark' ? '#fff' : '#1e293b'
            });
        } finally {
            setIsSyncing(false);
        }
    };

    const fetchAllTraffic = async () => {
        if (routers.length === 0 || isFetchingRef.current) return;
        
        isFetchingRef.current = true;
        if (abortControllerRef.current) abortControllerRef.current.abort();
        abortControllerRef.current = new AbortController();

        setTrafficLoading(true);
        try {
            const allTraffic: any[] = [];
            const polledRouterIds = new Set<number>();
            
            // High-speed parallel orchestration
            await Promise.all(routers.map(async (r) => {
                try {
                    const res = await fetch(`/api/mikrotik/traffic?router_id=${r.id}`, {
                        signal: abortControllerRef.current?.signal
                    });
                    const data = await res.json();
                    if (res.ok && data.traffic) {
                        const trafficArray = Array.isArray(data.traffic) ? data.traffic : [data.traffic];
                        allTraffic.push(...trafficArray);
                        polledRouterIds.add(r.id);
                    } else {
                        console.warn(`Router ${r.id} reported error:`, data.error || 'Unknown error');
                    }
                } catch (e: any) { 
                    if (e.name !== 'AbortError') console.warn(`Router ${r.id} fetch failed:`, e.message); 
                }
            }));
            
            if (allTraffic.length > 0) {
                setTrafficData(allTraffic);
                console.log(`[Telemetry] Found ${allTraffic.length} active sessions across ${polledRouterIds.size} routers.`);
                
                // Real-time status sync: Update customer status based on active PPP sessions
                setCustomers(prev => prev.map(c => {
                    if (!c.pppoe_username) return { ...c, status: 'inactive' };
                    
                    // Global match: If they exist in ANY polled router's active list, they are active
                    const isActive = allTraffic.some(t => {
                        const cleanT = String(t.name || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
                        const cleanC = String(c.pppoe_username || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
                        return cleanT === cleanC && cleanT !== '';
                    });
                    
                    return { ...c, status: isActive ? 'active' : 'inactive' };
                }));

                // Update chart data if a customer is selected
                if (showDetail && selectedCustomer) {
                    const found = allTraffic.find(t => {
                        const tName = String(t.name || '').trim().toLowerCase();
                        const cName = String(selectedCustomer.pppoe_username || '').trim().toLowerCase();
                        return tName === cName;
                    });
                    if (found) {
                        const rx = found.rxSpeed ?? found['rx-bits-per-second'] ?? 0;
                        const tx = found.txSpeed ?? found['tx-bits-per-second'] ?? 0;
                        setChartData(prev => {
                            const next = [...prev.slice(1), { 
                                name: new Date().toLocaleTimeString(), 
                                down: rx, 
                                up: tx 
                            }];
                            return next;
                        });
                    }
                }
            }
        } catch (err: any) { 
            if (err.name !== 'AbortError') console.error('Telemetry heart-beat error:', err); 
        } finally { 
            setTrafficLoading(false); 
            isFetchingRef.current = false;
        }
    };

    const formatSpeed = (bits: number) => {
        if (!bits || bits < 0) return '0.0 Mbps';
        if (bits >= 1000000) return (bits / 1000000).toFixed(1) + ' Mbps';
        if (bits >= 1000) return (bits / 1000).toFixed(1) + ' kbps';
        return (bits / 1000000).toFixed(2) + ' Mbps'; // Show small values as 0.xx Mbps
    };

    const getTrafficInfo = (pppoeUsername: string) => {
        if (!pppoeUsername || trafficData.length === 0) return null;
        const cleanC = String(pppoeUsername).replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        const found = trafficData.find(t => {
            const cleanT = String(t.name || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
            return cleanT === cleanC;
        });
        if (!found) return null;
        
        return {
            rx: found.rxSpeed ?? 0,
            tx: found.txSpeed ?? 0,
            uptime: found.uptime ?? null,
            uptimeSeconds: found.uptimeSeconds ?? 0,
            connectedAt: found.connectedAt || null,
            callerId: found.callerId || '-',
            rxTotal: found.rxTotal || '0 B',
            txTotal: found.txTotal || '0 B',
            rxPkt: found.rxPkt || 0,
            txPkt: found.txPkt || 0,
            mtu: found.mtu || 1480,
            lastUp: found.lastUp || '-',
            address: found.address || '-'
        };
    };

    const formatUptimeLive = (connectedAt: string | null) => {
        if (!connectedAt || !currentTime) return 'OFFLINE';
        const now = currentTime;
        const start = new Date(connectedAt).getTime();
        const diff = Math.floor((now.getTime() - start) / 1000);
        
        if (diff < 0) return '0 Detik';

        const w = Math.floor(diff / 604800);
        const d = Math.floor((diff % 604800) / 86400);
        const h = Math.floor((diff % 86400) / 3600);
        const m = Math.floor((diff % 3600) / 60);
        const s = diff % 60;

        const parts = [];
        if (w > 0) parts.push(`${w} Minggu`);
        if (d > 0) parts.push(`${d} Hari`);
        if (h > 0) parts.push(`${h} Jam`);
        if (m > 0) parts.push(`${m} Menit`);
        if (s >= 0) parts.push(`${s} Detik`);

        return parts.join(' ');
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                router_id: formData.router_id ? parseInt(formData.router_id) : null,
                package_id: formData.package_id ? parseInt(formData.package_id) : null,
                due_date: parseInt(formData.due_date as any),
                ...(isEditing && { id: editId })
            };

            Swal.fire({ title: 'Menyimpan...', text: 'Sinkronisasi Status Infrastruktur...', allowOutsideClick: false, background: theme === 'dark' ? '#0f172a' : '#fff', color: theme === 'dark' ? '#fff' : '#1e293b' });

            const res = await fetch('/api/customers', {
                method: isEditing ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                setShowForm(false);
                fetchData();
                Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Data berhasil disimpan.', background: theme === 'dark' ? '#0f172a' : '#fff', color: theme === 'dark' ? '#fff' : '#1e293b' });
            } else {
                const data = await res.json();
                Swal.fire({ icon: 'error', title: 'Gagal', text: data.error || 'Terdeteksi kegagalan sistem.', background: theme === 'dark' ? '#0f172a' : '#fff', color: theme === 'dark' ? '#fff' : '#1e293b' });
            }
        } catch (err) {
            console.error(err);
        }
    };

    const openEditForm = (c: any) => {
        setFormData({
            user_id: c.user_id || '',
            name: c.name || '',
            phone: c.phone || '',
            router_id: c.router_id ? c.router_id.toString() : '',
            package_id: c.package_id ? c.package_id.toString() : '',
            pppoe_username: c.pppoe_username || '',
            pppoe_password: '', 
            due_date: c.due_date || 1,
            latitude: c.latitude ? c.latitude.toString() : '',
            longitude: c.longitude ? c.longitude.toString() : '',
            odp_id: c.odp_id ? c.odp_id.toString() : ''
        });
        setEditId(c.id);
        setIsEditing(true);
        setShowForm(true);
    };

    const handleDelete = async (id: number, name: string) => {
        const result = await Swal.fire({
            title: `Hentikan Node ${name}?`,
            text: 'Tindakan ini akan menghapus akses pengguna.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Ya, Hentikan',
            cancelButtonText: 'Batal',
            background: theme === 'dark' ? '#0f172a' : '#fff',
            color: theme === 'dark' ? '#fff' : '#1e293b'
        });

        if (result.isConfirmed) {
            try {
                const res = await fetch(`/api/customers?id=${id}`, { method: 'DELETE' });
                if (res.ok) {
                    fetchData();
                    Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Node telah dihapus.', background: theme === 'dark' ? '#0f172a' : '#fff', color: theme === 'dark' ? '#fff' : '#1e293b' });
                }
            } catch (err: any) {
                console.error(err);
            }
        }
    };

    const stats = useMemo(() => {
        const total = customers.length;
        const online = customers.filter(c => c.status === 'active').length;
        const signalAlerts = customers.filter(c => c.rx < -27).length;
        const disconnectedWithPayment = customers.filter(c => c.status !== 'active' && c.payment_status === 'paid').length;
        const criticalOdps = odps.filter(o => o.status === 'critical').length;

        return [
            { label: 'Bayar Tapi Disconnect', value: disconnectedWithPayment, color: '#ef4444', icon: Power, status: 'Perlu perhatian' },
            { label: 'Total ONU', value: total, color: '#6366f1', icon: Monitor, status: 'Semua perangkat' },
            { label: 'ONU Online', value: online, color: '#10b981', icon: Zap, status: 'Terhubung' },
            { label: 'Masalah Sinyal', value: signalAlerts, color: '#f59e0b', icon: Signal, status: 'Sinyal lemah' },
            { label: 'ODP Bermasalah', value: criticalOdps, color: '#8b5cf6', icon: Box, status: 'Masalah ODP' }
        ];
    }, [customers, odps]);

    const filteredCustomers = customers.filter(c => 
        (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.pppoe_username || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(filteredCustomers.length / 30);
    const paginatedCustomers = filteredCustomers.slice((currentPage - 1) * 30, currentPage * 30);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#020617] transition-colors pb-24 w-full space-y-10 animate-in fade-in duration-500">
            {/* Header Vyber Style */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 mb-6 border-b border-slate-200 dark:border-white/5 pb-10">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-[24px] bg-indigo-600/10 flex items-center justify-center text-indigo-600 border border-indigo-600/20 shadow-inner">
                        <Users className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter uppercase">Manajemen Pelanggan</h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Monitoring {customers.length} node pelanggan secara real-time</p>
                    </div>
                    {isSyncing && (
                        <div className="hidden sm:flex items-center gap-3 px-4 py-2 bg-accent/5 dark:bg-accent/10 rounded-full animate-in slide-in-from-left-4 duration-300 border border-accent/10">
                            <Loader2 className="w-4 h-4 text-accent animate-spin" />
                            <span className="text-[10px] font-black text-accent uppercase tracking-widest">Sinkronisasi Jaringan...</span>
                        </div>
                    )}
                </div>
                
                <div className="w-full lg:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                    <div className="flex-1 overflow-x-auto custom-scrollbar">
                        <div className="flex items-center gap-4 min-w-max pr-4">
                            <button 
                                onClick={syncOltData}
                                disabled={isSyncing}
                                className="h-14 bg-accent/5 hover:bg-accent/10 text-accent font-black px-8 rounded-2xl transition-all border border-accent/10 flex items-center gap-3 uppercase tracking-widest text-[10px] active:scale-95 disabled:opacity-50"
                            >
                                {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                                Sync OLT
                            </button>
                            
                            <div className="flex h-14 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-1 shadow-sm">
                                <button 
                                    onClick={() => setViewMode('table')}
                                    className={`px-4 rounded-xl transition-all ${viewMode === 'table' ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white shadow-inner' : 'text-slate-400 hover:text-slate-600'}`}
                                    title="Tampilan Tabel"
                                >
                                    <MoreVertical className="w-4 h-4 rotate-90" />
                                </button>
                                <button 
                                    onClick={() => setViewMode('grid')}
                                    className={`px-4 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white shadow-inner' : 'text-slate-400 hover:text-slate-600'}`}
                                    title="Tampilan Grid"
                                >
                                    <Box className="w-4 h-4" />
                                </button>
                            </div>
                            
                            <button 
                                onClick={syncMikrotikData} 
                                disabled={isSyncing}
                                className="h-14 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-600 font-black px-8 rounded-2xl transition-all border border-indigo-600/10 flex items-center gap-3 uppercase tracking-widest text-[10px] active:scale-95 disabled:opacity-50 shadow-sm"
                            >
                                {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RouterIcon className="w-4 h-4" />}
                                Sync MikroTik
                            </button>
                            
                            <button 
                                onClick={() => fetchData(true)} 
                                disabled={isSyncing}
                                className="h-14 flex items-center gap-3 px-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm active:scale-95 disabled:opacity-50"
                            >
                                <RefreshCw className={`w-4 h-4 text-slate-600 dark:text-slate-400 ${isSyncing ? 'animate-spin' : ''}`} />
                                <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">Refresh</span>
                            </button>
                        </div>
                    </div>
                    
                    <button 
                        onClick={() => { setIsEditing(false); setFormData({ user_id: '', name: '', phone: '', router_id: '', package_id: '', pppoe_username: '', pppoe_password: '', due_date: 1, latitude: '', longitude: '', odp_id: '' }); setShowForm(true); }} 
                        className="h-14 px-8 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95 whitespace-nowrap shrink-0"
                    >
                        + Tambah Pelanggan
                    </button>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
                {stats.map((stat, i) => (
                    <div key={i} className="aspect-square md:aspect-auto bg-white dark:bg-slate-900 p-4 md:p-6 rounded-2xl md:rounded-[24px] border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 md:space-y-4 hover:shadow-md dark:hover:shadow-indigo-900/10 transition-all group">
                        <div className="flex justify-between items-start">
                            <div className="space-y-1">
                                <p className="text-[8px] md:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-tight">{stat.label}</p>
                                <p className="text-xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tighter">{stat.value}</p>
                            </div>
                            <div className="w-16 h-10 opacity-30 group-hover:opacity-100 transition-opacity">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={mockSparkline}>
                                        <Area type="monotone" dataKey="v" stroke={stat.color} fill={stat.color} fillOpacity={0.1} strokeWidth={2} isAnimationActive={false} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 pt-2 border-t border-slate-50 dark:border-slate-800">
                            <div className={`p-1.5 rounded-lg bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-800`}>
                                <stat.icon className="w-3 h-3" style={{ color: stat.color }} />
                            </div>
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">{stat.status}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Table Area / Grid View */}
            <div className="space-y-6">
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="relative w-full md:w-[400px]">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                        <input 
                            type="text" 
                            placeholder="Cari ID PPPOE atau Nama..." 
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            className="w-full pl-18 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-accent transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 outline-none"
                        />
                    </div>
                    <button className="px-10 py-4 bg-accent text-white rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-lg shadow-accent/20 hover:bg-accent/90 transition-all active:scale-95">
                        Cari Sekarang
                    </button>
                </div>

                {loading ? (
                    <div className="p-32 text-center bg-white dark:bg-slate-900/50 rounded-[32px] border border-slate-100 dark:border-white/5 shadow-sm space-y-4 backdrop-blur-xl">
                        <div className="flex justify-center">
                            <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                                <Loader2 className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-spin" />
                            </div>
                        </div>
                        <p className="text-slate-400 dark:text-slate-500 font-black uppercase tracking-[0.2em] animate-pulse text-[10px]">Menginisialisasi Jaringan...</p>
                    </div>
                ) : viewMode === 'table' ? (
                    <div className="glass rounded-[40px] border border-white/10 bg-white dark:bg-slate-900/50 shadow-2xl relative overflow-hidden backdrop-blur-xl group">
                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left border-collapse min-w-[1500px]">
                                <thead>
                                    <tr className="bg-slate-50/50 dark:bg-white/2 text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] border-b border-slate-100 dark:border-white/5">
                                        <th className="px-8 py-8 sticky left-0 bg-white dark:bg-slate-900 z-20 border-r border-slate-100 dark:border-white/5">#</th>
                                        <th className="px-8 py-8 sticky left-[80px] bg-white dark:bg-slate-900 z-20 border-r border-slate-100 dark:border-white/5">ID Pelanggan</th>
                                        <th className="px-8 py-8">Username PPPoE</th>
                                        <th className="px-8 py-8">Pembayaran</th>
                                        <th className="px-8 py-8">Koneksi</th>
                                        <th className="px-8 py-8">Status</th>
                                        <th className="px-8 py-8">ONU ID</th>
                                        <th className="px-8 py-8">RX (dBm)</th>
                                        <th className="px-8 py-8">TX (dBm)</th>
                                        <th className="px-8 py-8">Nama OLT</th>
                                        <th className="px-8 py-8">Tipe OLT</th>
                                        <th className="px-8 py-8">MAC MikroTik</th>
                                        <th className="px-8 py-8">MAC ONU</th>
                                        <th className="px-8 py-8">ID ODP</th>
                                        <th className="px-8 py-8">Password</th>
                                        <th className="px-8 py-8">Terakhir Putus</th>
                                        <th className="px-8 py-8 text-right">Aksi</th>
                                    </tr>
                                </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                            {paginatedCustomers.map((c, i) => (
                                <tr key={c.id} className="hover:bg-slate-50/80 dark:hover:bg-white/5 transition-all group">
                                    <td className="px-8 py-3 text-slate-400 dark:text-slate-500 font-bold text-[11px] sticky left-0 bg-white dark:bg-slate-900 z-10 border-r border-slate-50 dark:border-white/5 group-hover:bg-slate-50 dark:group-hover:bg-slate-800 transition-colors">
                                        {((currentPage-1)*itemsPerPage) + i + 1}
                                    </td>
                                    <td className="px-8 py-3 font-black text-slate-800 dark:text-white text-sm tracking-tight sticky left-[80px] bg-white dark:bg-slate-900 z-10 border-r border-slate-50 dark:border-white/5 group-hover:bg-slate-50 dark:group-hover:bg-slate-800 transition-colors">
                                        {c.user_id || 'N/A'}
                                    </td>
                                    <td className="px-8 py-3 text-indigo-600 dark:text-accent font-black text-sm tracking-tight">{c.pppoe_username}</td>
                                    <td className="px-8 py-3">
                                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${c.payment_status === 'paid' ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-slate-500 border border-white/5'}`}>
                                            {c.payment_status === 'paid' ? 'TERBAYAR' : 'TERTUNDA'}
                                        </span>
                                    </td>
                                     <td className="px-8 py-3">
                                        <div className="flex flex-col gap-2">
                                            <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest w-fit shadow-md transition-all ${c.status === 'active' ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-rose-500 text-white shadow-rose-500/20'}`}>
                                                {c.status === 'active' ? 'terhubung' : 'nonaktif'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-3 font-mono text-sm text-slate-400 dark:text-slate-500 tracking-tighter">{c.onu_id || 'ONU01'}</td>
                                    <td className="px-8 py-3">
                                        <div className={`px-4 py-2 rounded-xl text-center font-black text-sm tracking-tighter shadow-sm ${c.rx < -27 ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : c.rx < -24 ? 'bg-yellow-400 text-slate-800' : 'bg-accent text-white shadow-lg shadow-accent/20'}`}>
                                            {c.rx?.toFixed(2) || '-22.50'}
                                        </div>
                                    </td>
                                    <td className="px-8 py-3">
                                        <div className="px-4 py-2 bg-accent/20 text-accent rounded-xl text-center font-black text-sm tracking-tighter border border-accent/20">
                                            {c.tx?.toFixed(2) || '2.45'}
                                        </div>
                                    </td>
                                    <td className="px-8 py-3 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{c.olt_name || '01-OLT'}</td>
                                    <td className="px-8 py-3 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{c.olt_type || 'HIOSO'}</td>
                                    <td className="px-8 py-3 font-mono text-[10px] text-slate-400 dark:text-slate-500">{c.mikrotik_mac || '-'}</td>
                                    <td className="px-8 py-3 font-mono text-[10px] text-slate-400 dark:text-slate-500">{c.onu_mac || '-'}</td>
                                    <td className="px-8 py-3">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[11px] font-black text-slate-800 dark:text-white uppercase leading-none tracking-tight">{c.odp_name || 'N/A'}</span>
                                            <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1.5 opacity-60">{c.region_name || 'WILAYAH'}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-3 font-mono text-sm text-slate-400 dark:text-slate-500">*******</td>
                                    <td className="px-8 py-3 text-[11px] font-bold text-rose-500 dark:text-rose-400 uppercase tracking-widest">{c.last_disconnect || 'TIDAK ADA'}</td>
                                    <td className="px-8 py-3 text-right">
                                        <div className="flex justify-end gap-3">
                                                    <button onClick={() => { setSelectedCustomer(c); setShowDetail(true); }} className="p-3 bg-slate-50 dark:bg-white/5 hover:bg-accent/10 text-slate-400 dark:text-slate-500 hover:text-accent rounded-xl transition-all border border-slate-100 dark:border-white/5 shadow-sm active:scale-90">
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => openEditForm(c)} className="p-3 bg-slate-50 dark:bg-white/5 hover:bg-indigo-500/10 text-slate-400 dark:text-slate-500 hover:text-indigo-500 rounded-xl transition-all border border-slate-100 dark:border-white/5 shadow-sm active:scale-90">
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => handleDelete(c.id, c.name)} className="p-3 bg-slate-50 dark:bg-white/5 hover:bg-red-500/10 text-slate-400 dark:text-slate-500 hover:text-red-500 rounded-xl transition-all border border-slate-100 dark:border-white/5 shadow-sm active:scale-90">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-8 animate-in slide-in-from-bottom-4 duration-500 w-full relative">
                        {isSyncing && (
                            <div className="absolute -top-4 left-0 right-0 h-1 bg-accent animate-pulse z-50 rounded-full" />
                        )}
                        {paginatedCustomers.map((c) => (
                            <div key={c.id} className="bg-white dark:bg-slate-900/50 rounded-2xl md:rounded-[32px] border border-slate-200 dark:border-white/5 shadow-xl p-8 md:p-8 space-y-8 md:space-y-8 hover:shadow-2xl hover:shadow-accent/5 hover:-translate-y-2 transition-all duration-500 group relative overflow-hidden cursor-default backdrop-blur-xl md:aspect-auto flex flex-col justify-between">
                                <div className={`absolute top-0 right-0 w-24 md:w-48 h-24 md:h-48 -mr-6 -mt-6 md:-mr-12 md:-mt-12 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity`}>
                                    <Signal className="w-full h-full text-accent" />
                                </div>
                                
                                <div className="flex justify-between items-start gap-4 relative z-10 overflow-hidden">
                                    <div className="flex items-center gap-4 md:gap-5 flex-1 min-w-0">
                                        <div className="w-16 h-16 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex-shrink-0 flex items-center justify-center text-indigo-600 border border-indigo-500/10 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 shadow-inner">
                                            <Users className="w-8 h-8 md:w-7 md:h-7" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-sm md:text-sm font-black text-primary uppercase truncate group-hover:text-accent transition-colors tracking-tight leading-tight" title={c.name}>{c.name}</h3>
                                            <p className="text-[10px] md:text-[10px] font-bold text-muted uppercase tracking-widest mt-1.5 md:mt-2 opacity-50 truncate">{c.user_id || 'ID PELANGGAN'}</p>
                                        </div>
                                    </div>
                                    <div className={`shrink-0 whitespace-nowrap px-3 py-1.5 md:px-3 md:py-1 rounded-lg md:rounded-lg text-[10px] md:text-[10px] font-black uppercase tracking-widest relative z-10 shadow-sm ${c.status.toUpperCase() === 'ACTIVE' || c.status.toUpperCase() === 'TERHUBUNG' ? 'bg-emerald-500 text-white animate-pulse' : 'bg-rose-500 text-white'}`}>
                                        {c.status}
                                    </div>
                                </div>

                                <div className="space-y-2 md:space-y-6 relative z-10">
                                    <div className="space-y-1 md:space-y-3">
                                        <div className="flex justify-between items-end px-1">
                                            <div className="flex items-center gap-1.5 md:gap-3">
                                                <div className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${c.rx < -27 ? 'bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.5)]' : c.rx < -24 ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]'}`} />
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] md:text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Sinyal</span>
                                                </div>
                                            </div>
                                            <span className={`text-sm md:text-base font-black tracking-tighter ${c.rx < -27 ? 'text-rose-500' : c.rx < -24 ? 'text-amber-500' : 'text-emerald-500'}`}>
                                                {c.rx?.toFixed(1) || '-22.5'} 
                                                <span className="text-[9px] md:text-[10px] opacity-60 ml-1 tracking-normal font-bold">dBm</span>
                                            </span>
                                        </div>
                                        <div className="h-1 md:h-2 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full transition-all duration-1000 ${c.rx < -27 ? 'bg-rose-500' : c.rx < -24 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                                style={{ width: `${Math.min(100, Math.max(0, (c.rx + 40) * 4))}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center py-3 md:py-4 border-y border-slate-100 dark:border-white/5">
                                        <div className="flex flex-col gap-1 md:gap-1">
                                            <span className="text-[9px] md:text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Down</span>
                                            <div className="flex items-center gap-2 md:gap-2 text-accent">
                                                <ArrowDown className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                                <span className="text-xs md:text-sm font-black tracking-tighter">
                                                    {formatSpeed(getTrafficInfo(c.pppoe_username)?.rx || 0)}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="w-px h-8 md:h-10 bg-slate-200 dark:bg-white/5" />
                                        <div className="flex flex-col items-end gap-1 md:gap-1">
                                            <span className="text-[9px] md:text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Up</span>
                                            <div className="flex items-center gap-2 md:gap-2 text-blue-500">
                                                <span className="text-xs md:text-sm font-black tracking-tighter">
                                                    {formatSpeed(getTrafficInfo(c.pppoe_username)?.tx || 0)}
                                                </span>
                                                <ArrowUp className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
 
                                <div className="flex gap-1.5 md:gap-3 relative z-10">
                                    <button onClick={() => { setSelectedCustomer(c); setShowDetail(true); }} className="flex-1 h-8 md:h-14 bg-slate-50 dark:bg-white/5 hover:bg-accent/10 text-slate-400 dark:text-slate-500 hover:text-accent rounded-lg md:rounded-[20px] transition-all border border-slate-100 dark:border-white/5 flex items-center justify-center shadow-sm active:scale-95 group/btn" title="Detail">
                                        <Eye className="w-3.5 h-3.5 md:w-5 md:h-5 group-hover/btn:scale-110 transition-transform" />
                                    </button>
                                    <button onClick={() => openEditForm(c)} className="flex-1 h-8 md:h-14 bg-slate-50 dark:bg-white/5 hover:bg-indigo-500/10 text-slate-400 dark:text-slate-500 hover:text-indigo-500 rounded-lg md:rounded-[20px] transition-all border border-slate-100 dark:border-white/5 flex items-center justify-center shadow-sm active:scale-95 group/btn" title="Edit">
                                        <Edit className="w-3.5 h-3.5 md:w-5 md:h-5 group-hover/btn:scale-110 transition-transform" />
                                    </button>
                                    <button onClick={() => handleDelete(c.id, c.name)} className="flex-1 h-8 md:h-14 bg-slate-50 dark:bg-white/5 hover:bg-red-500/10 text-slate-400 dark:text-slate-500 hover:text-red-500 rounded-lg md:rounded-[20px] transition-all border border-slate-100 dark:border-white/5 flex items-center justify-center shadow-sm active:scale-95 group/btn" title="Hapus">
                                        <Trash2 className="w-3.5 h-3.5 md:w-5 md:h-5 group-hover/btn:scale-110 transition-transform" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm flex justify-between items-center">
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                        Halaman <span className="text-slate-900 dark:text-white">{currentPage}</span> dari <span className="text-slate-900 dark:text-white">{totalPages || 1}</span>
                    </p>
                    <div className="flex gap-3">
                        <button 
                            disabled={currentPage === 1} 
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-500 disabled:opacity-30 transition-all"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button 
                            disabled={currentPage === totalPages} 
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-500 disabled:opacity-30 transition-all"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Form Modal: Node Provisioning Wizard */}
            {showForm && (
                <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-950/90 dark:bg-black/95 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[95vh] border border-white/20 dark:border-white/5">
                        {/* Modal Header */}
                        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                            <div className="flex items-center gap-5">
                                <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
                                    <Zap className="w-7 h-7" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">{isEditing ? 'Modifikasi Konfigurasi Node' : 'Aktivasi Node Jaringan Baru'}</h2>
                                    <p className="text-slate-500 dark:text-slate-400 text-[10px] font-black tracking-[0.2em] uppercase opacity-60">Wisaya Provisi Infrastruktur NOC</p>
                                </div>
                            </div>
                            <button onClick={() => setShowForm(false)} className="p-3 hover:bg-white dark:hover:bg-slate-800 rounded-2xl transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                                <X className="w-6 h-6 text-slate-400" />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-10 custom-scrollbar bg-white dark:bg-slate-900">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                                {/* Section 1: Identitas & Kontak */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-1.5 h-6 bg-indigo-600 rounded-full" />
                                        <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">Identitas & Kontak</h3>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Nama Lengkap</label>
                                        <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-indigo-500/20 focus:bg-white dark:focus:bg-slate-800 rounded-2xl text-sm font-bold text-slate-700 dark:text-slate-200 transition-all outline-none" placeholder="Contoh: John Doe" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Nomor Telepon</label>
                                        <input type="text" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-indigo-500/20 focus:bg-white dark:focus:bg-slate-800 rounded-2xl text-sm font-bold text-slate-700 dark:text-slate-200 transition-all outline-none" placeholder="08123456..." />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">ID Pengguna (Otomatis)</label>
                                        <input type="text" value={formData.user_id} onChange={(e) => setFormData({...formData, user_id: e.target.value})} className="w-full p-4 bg-slate-100 dark:bg-slate-800 border-none rounded-2xl text-sm font-bold text-slate-400 dark:text-slate-500 cursor-not-allowed" placeholder="AUTO_GEN" disabled />
                                    </div>
                                </div>

                                {/* Section 2: Provisi Jaringan */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                                        <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">Provisi Jaringan</h3>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Router Gerbang</label>
                                        <select required value={formData.router_id} onChange={(e) => setFormData({...formData, router_id: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-emerald-500/20 focus:bg-white dark:focus:bg-slate-800 rounded-2xl text-sm font-bold text-slate-700 dark:text-slate-200 transition-all outline-none appearance-none">
                                            <option value="">Pilih Router</option>
                                            {routers.map(r => <option key={r.id} value={r.id}>{r.name} ({r.ip_address})</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Kredensial PPPoE</label>
                                        <div className="space-y-3">
                                            <input type="text" required value={formData.pppoe_username} onChange={(e) => setFormData({...formData, pppoe_username: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-indigo-500/20 focus:bg-white dark:focus:bg-slate-800 rounded-2xl text-sm font-mono font-bold text-indigo-600 dark:text-indigo-400 transition-all outline-none" placeholder="Username" />
                                            <input type="password" required={!isEditing} value={formData.pppoe_password} onChange={(e) => setFormData({...formData, pppoe_password: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-indigo-500/20 focus:bg-white dark:focus:bg-slate-800 rounded-2xl text-sm font-mono font-bold text-slate-600 dark:text-slate-400 transition-all outline-none" placeholder={isEditing ? "Kosongkan jika tidak ganti" : "Password"} />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Tingkat Layanan (Paket)</label>
                                        <select required value={formData.package_id} onChange={(e) => setFormData({...formData, package_id: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-emerald-500/20 focus:bg-white dark:focus:bg-slate-800 rounded-2xl text-sm font-bold text-slate-700 dark:text-slate-200 transition-all outline-none appearance-none">
                                            <option value="">Pilih Paket</option>
                                            {packages.map(p => <option key={p.id} value={p.id}>{p.name} - {p.price?.toLocaleString()}</option>)}
                                        </select>
                                    </div>
                                </div>

                                {/* Section 3: Lapisan Fisik & Penagihan */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-1.5 h-6 bg-orange-500 rounded-full" />
                                        <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">Fisik & Penagihan</h3>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Terminal ODP</label>
                                        <select required value={formData.odp_id} onChange={(e) => setFormData({...formData, odp_id: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-orange-500/20 focus:bg-white dark:focus:bg-slate-800 rounded-2xl text-sm font-bold text-slate-700 dark:text-slate-200 transition-all outline-none appearance-none">
                                            <option value="">Pilih ODP</option>
                                            {odps.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Latitude</label>
                                            <input type="text" value={formData.latitude} onChange={(e) => setFormData({...formData, latitude: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl text-xs font-bold dark:text-slate-200" placeholder="-7.xxx" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Longitude</label>
                                            <input type="text" value={formData.longitude} onChange={(e) => setFormData({...formData, longitude: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl text-xs font-bold dark:text-slate-200" placeholder="111.xxx" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Tanggal Jatuh Tempo</label>
                                        <input type="number" min="1" max="31" value={formData.due_date} onChange={(e) => setFormData({...formData, due_date: parseInt(e.target.value)})} className="w-full p-4 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl text-sm font-bold text-slate-700 dark:text-slate-200" />
                                    </div>
                                </div>
                            </div>

                            <div className="mt-12 pt-8 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 -mx-10 px-10 py-8">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
                                        <Activity className="w-5 h-5 text-indigo-600 dark:text-indigo-400 animate-pulse" />
                                    </div>
                                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">Siap untuk sinkronisasi<br/><span className="text-indigo-600 dark:text-indigo-400">Push otomatis ke MikroTik aktif</span></p>
                                </div>
                                <div className="flex gap-4">
                                    <button type="button" onClick={() => setShowForm(false)} className="px-8 py-4 text-[11px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-[0.2em] hover:text-slate-600 dark:hover:text-slate-300 transition-all">Batalkan Aksi</button>
                                    <button type="submit" className="px-12 py-5 bg-indigo-600 text-white rounded-[24px] font-black uppercase text-[11px] tracking-[0.2em] shadow-xl shadow-indigo-600/30 hover:bg-indigo-700 hover:-translate-y-1 transition-all active:scale-95 flex items-center gap-3">
                                        {isEditing ? 'Terapkan Perubahan' : 'Inisialisasi Provisi'}
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Node Intelligence Detail Modal */}
            {showDetail && selectedCustomer && (
                <div className="fixed inset-0 z-100 flex items-center justify-center p-4 md:p-8 bg-slate-950/90 dark:bg-black/95 backdrop-blur-md animate-in fade-in zoom-in duration-300">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-white/20 dark:border-white/5">
                        {/* Modal Header */}
                        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                            <div className="flex items-center gap-5">
                                <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
                                    <Monitor className="w-7 h-7" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Ringkasan Inteligensi Node</h2>
                                    <p className="text-slate-500 dark:border-slate-400 text-xs font-bold tracking-widest uppercase">ID: {selectedCustomer.user_id || 'TIDAK DIKENAL'}</p>
                                </div>
                            </div>
                            <button onClick={() => setShowDetail(false)} className="p-3 hover:bg-white dark:hover:bg-slate-800 rounded-2xl transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                                <X className="w-6 h-6 text-slate-400" />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-8 overflow-y-auto custom-scrollbar space-y-10 bg-white dark:bg-slate-900">
                            {/* Summary Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl space-y-1 border border-slate-100 dark:border-slate-800">
                                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Status Jaringan</p>
                                    <p className={`text-sm font-black uppercase ${selectedCustomer.status === 'active' ? 'text-emerald-600' : 'text-rose-600'}`}>{selectedCustomer.status === 'active' ? 'Operasional' : 'Terputus'}</p>
                                </div>
                                <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl space-y-1 border border-slate-100 dark:border-slate-800">
                                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Daya Optik (Rx)</p>
                                    <p className={`text-lg font-black ${selectedCustomer.rx < -27 ? 'text-rose-600' : 'text-slate-800 dark:text-white'}`}>{selectedCustomer.rx?.toFixed(2) || '-22.50'} dBm</p>
                                </div>
                                <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl space-y-1 border border-slate-100 dark:border-slate-800">
                                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Status Pembayaran</p>
                                    <p className={`text-sm font-black uppercase ${selectedCustomer.payment_status === 'paid' ? 'text-indigo-600' : 'text-slate-400'}`}>{selectedCustomer.payment_status === 'paid' ? 'Terbayar / Lunas' : 'Menunggu'}</p>
                                </div>
                                <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl space-y-1 border border-slate-100 dark:border-slate-800">
                                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Protokol Autentikasi</p>
                                    <p className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase">PPPoE / Fiber</p>
                                </div>
                            </div>

                            {/* Detailed Categories */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                {/* Left Col: Identity & Access */}
                                <div className="space-y-8">
                                    <div>
                                        <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-widest mb-4 flex items-center gap-3">
                                            <Calendar className="w-4 h-4 text-rose-600" /> Status Keuangan
                                        </h3>
                                        <div className="grid grid-cols-2 gap-y-4 text-sm">
                                            <span className="text-slate-400 dark:text-slate-500 font-bold">Jatuh Tempo</span>
                                            <span className="text-slate-800 dark:text-slate-200 font-black uppercase">Tgl {selectedCustomer.due_date || '1'} Setiap Bulan</span>
                                            
                                            <span className="text-slate-400 dark:text-slate-500 font-bold">Biaya Bulanan</span>
                                            <span className="text-rose-600 dark:text-rose-400 font-black uppercase">
                                                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(150000)}
                                            </span>
                                            
                                            <span className="text-slate-400 dark:text-slate-500 font-bold">Status Bayar</span>
                                            <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-[10px] px-2 py-0.5 rounded-full font-black w-fit uppercase">Lunas</span>
                                        </div>
                                    </div>

                                    <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800">
                                        <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-widest mb-4 flex items-center gap-3">
                                            <Box className="w-4 h-4 text-amber-600" /> Infrastruktur Jaringan
                                        </h3>
                                        <div className="grid grid-cols-2 gap-y-4 text-sm">
                                            <span className="text-slate-400 dark:text-slate-500 font-bold">Nama ODP</span>
                                            <span className="text-slate-800 dark:text-slate-200 font-black uppercase">{selectedCustomer.odp_name || 'ODP-MGT-01'}</span>
                                            
                                            <span className="text-slate-400 dark:text-slate-500 font-bold">Router Gateway</span>
                                            <span className="text-slate-800 dark:text-slate-200 font-black uppercase">{selectedCustomer.router_name || 'CORE-MGT-01'}</span>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-widest mb-4 flex items-center gap-3">
                                            <Users className="w-4 h-4 text-indigo-600" /> Identitas & Akses
                                        </h3>
                                        <div className="grid grid-cols-2 gap-y-4 text-sm">
                                            <span className="text-slate-400 dark:text-slate-500 font-bold">Nama Lengkap</span>
                                            <span className="text-slate-800 dark:text-slate-200 font-black">{selectedCustomer.name}</span>
                                            <span className="text-slate-400 dark:text-slate-500 font-bold">Nomor Telepon</span>
                                            <span className="text-slate-800 dark:text-slate-200 font-black">{selectedCustomer.phone || '-'}</span>
                                             <span className="text-slate-400 dark:text-slate-500 font-bold">Identitas PPPoE</span>
                                             <div className="flex items-center gap-3">
                                                <span className="text-indigo-600 dark:text-indigo-400 font-black">{selectedCustomer.pppoe_username}</span>
                                                <button 
                                                    onClick={() => handleAutoDetect(selectedCustomer.id)}
                                                    disabled={isDetecting}
                                                    className={`px-2 py-0.5 rounded-md border text-[8px] font-black uppercase tracking-widest transition-all ${isDetecting ? 'bg-slate-800 border-slate-700 text-slate-500 animate-pulse' : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400 hover:bg-indigo-500 hover:text-white'}`}
                                                >
                                                    {isDetecting ? 'Scanning...' : 'Detect Router'}
                                                </button>
                                             </div>
                                            
                                            <span className="text-slate-400 dark:text-slate-500 font-bold">Password PPPoE</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-slate-800 dark:text-slate-200 font-mono font-bold tracking-widest">
                                                    {showPppoePass ? selectedCustomer.pppoe_password : '••••••••'}
                                                </span>
                                                <button 
                                                    onClick={() => setShowPppoePass(!showPppoePass)}
                                                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors text-slate-400 hover:text-indigo-600"
                                                >
                                                    {showPppoePass ? <X className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                                </button>
                                            </div>

                                            <span className="text-slate-400 dark:text-slate-500 font-bold">Tanggal Penagihan</span>
                                            <span className="text-slate-800 dark:text-slate-200 font-black">Tanggal {selectedCustomer.due_date || '1'}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-widest mb-4 flex items-center gap-3">
                                            <Wifi className="w-4 h-4 text-indigo-600" /> Jalur Infrastruktur
                                        </h3>
                                        <div className="grid grid-cols-2 gap-y-4 text-sm">
                                            <span className="text-slate-400 dark:text-slate-500 font-bold">Router / Gerbang</span>
                                            <span className="text-slate-800 dark:text-slate-200 font-black uppercase">{selectedCustomer.router_name || 'GERBANG-01'}</span>
                                            <span className="text-slate-400 dark:text-slate-500 font-bold">Nama OLT</span>
                                            <span className="text-slate-800 dark:text-slate-200 font-black uppercase">{selectedCustomer.olt_name || 'OLT-ZTE-01'}</span>
                                            <span className="text-slate-400 dark:text-slate-500 font-bold">Terminal ODP</span>
                                            <span className="text-slate-800 dark:text-slate-200 font-black uppercase">{selectedCustomer.odp_name || 'ODP-MAG-01'}</span>
                                            <span className="text-slate-400 dark:text-slate-500 font-bold">Wilayah Layanan</span>
                                            <span className="text-slate-800 dark:text-slate-200 font-black uppercase">{selectedCustomer.region_name || 'MAGETAN'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Col: Hardware & Telemetry */}
                                <div className="space-y-8">
                                    <div>
                                        <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-widest mb-4 flex items-center gap-3">
                                            <Zap className="w-4 h-4 text-indigo-600" /> Telemetri Perangkat
                                        </h3>
                                        <div className="grid grid-cols-2 gap-y-4 text-sm">
                                            <span className="text-slate-400 dark:text-slate-500 font-bold">ID ONU</span>
                                            <span className="text-slate-800 dark:text-slate-200 font-black">{selectedCustomer.onu_id || 'ONU01'}</span>
                                            <span className="text-slate-400 dark:text-slate-500 font-bold">MAC ONU</span>
                                            <span className="text-slate-800 dark:text-slate-200 font-mono font-bold text-xs uppercase">{selectedCustomer.onu_mac || '-'}</span>
                                            <span className="text-slate-400 dark:text-slate-500 font-bold">MAC MikroTik</span>
                                            <span className="text-slate-800 dark:text-slate-200 font-mono font-bold text-xs uppercase">{selectedCustomer.mikrotik_mac || '-'}</span>
                                            <span className="text-slate-400 dark:text-slate-500 font-bold">Daya TX</span>
                                            <span className="text-emerald-600 dark:text-emerald-400 font-black">{selectedCustomer.tx?.toFixed(2) || '2.45'} dBm</span>
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-widest mb-4 flex items-center gap-3">
                                            <Activity className="w-4 h-4 text-indigo-600" /> Log Operasional
                                        </h3>
                                        <div className="grid grid-cols-2 gap-y-4 text-sm">
                                            <span className="text-slate-400 dark:text-slate-500 font-bold">Paket Layanan</span>
                                            <span className="text-slate-800 dark:text-slate-200 font-black uppercase">{selectedCustomer.package_name || 'UNLIMITED 10M'}</span>
                                            <span className="text-slate-400 dark:text-slate-500 font-bold">Waktu Terhubung</span>
                                            <span className="text-emerald-600 dark:text-emerald-400 font-black uppercase">
                                                {(() => {
                                                    const info = getTrafficInfo(selectedCustomer.pppoe_username);
                                                    return info?.connectedAt 
                                                        ? new Date(info.connectedAt).toLocaleString('id-ID', {
                                                            day: '2-digit',
                                                            month: 'short',
                                                            year: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                            second: '2-digit'
                                                        })
                                                        : 'OFFLINE';
                                                })()}
                                            </span>
                                            <span className="text-slate-400 dark:text-slate-500 font-bold">Durasi Aktif</span>
                                            <span className="text-slate-800 dark:text-slate-200 font-black uppercase">
                                                {formatUptimeLive(getTrafficInfo(selectedCustomer.pppoe_username)?.connectedAt)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800">
                                        <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-widest mb-4 flex items-center gap-3">
                                            <Network className="w-4 h-4 text-emerald-600" /> Identitas Jaringan (IP)
                                        </h3>
                                        {(() => {
                                            const info = getTrafficInfo(selectedCustomer.pppoe_username);
                                            return (
                                                <div className="grid grid-cols-2 gap-y-3 text-sm">
                                                    <span className="text-slate-400 dark:text-slate-500 font-bold">Remote IP Address</span>
                                                    <span className="text-indigo-600 dark:text-indigo-400 font-black">{info?.address || '-'}</span>
                                                    
                                                    <span className="text-slate-400 dark:text-slate-500 font-bold">Gateway IP</span>
                                                    <span className="text-slate-800 dark:text-slate-200 font-black">192.192.100.1</span>
                                                    
                                                    <span className="text-slate-400 dark:text-slate-500 font-bold">Protokol Service</span>
                                                    <span className="text-slate-800 dark:text-slate-200 font-black uppercase">service1 / PPPoE</span>
                                                </div>
                                            );
                                        })()}
                                    </div>

                                    <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800">
                                        <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-widest mb-4 flex items-center gap-3">
                                            <ShieldCheck className="w-4 h-4 text-blue-600" /> Statistik Sesi (Winbox)
                                        </h3>
                                        {(() => {
                                            const info = getTrafficInfo(selectedCustomer.pppoe_username);
                                            return (
                                                <div className="grid grid-cols-2 gap-y-3 text-[11px]">
                                                    <span className="text-slate-400 dark:text-slate-500 font-bold">Total Unduh (RX)</span>
                                                    <span className="text-slate-800 dark:text-slate-200 font-black">{info?.txTotal || '0 B'}</span>
                                                    
                                                    <span className="text-slate-400 dark:text-slate-500 font-bold">Total Unggah (TX)</span>
                                                    <span className="text-slate-800 dark:text-slate-200 font-black">{info?.rxTotal || '0 B'}</span>
                                                    
                                                    <span className="text-slate-400 dark:text-slate-500 font-bold">Packet Rate (R/T)</span>
                                                    <span className="text-slate-800 dark:text-slate-200 font-black">{info?.txPkt || 0} / {info?.rxPkt || 0} p/s</span>
                                                    
                                                    <span className="text-slate-400 dark:text-slate-500 font-bold">MTU / MRU</span>
                                                    <span className="text-slate-800 dark:text-slate-200 font-black">{info?.mtu || 1480} / {info?.mtu || 1480}</span>
                                                    
                                                    <span className="text-slate-400 dark:text-slate-500 font-bold">Caller ID (MAC)</span>
                                                    <span className="text-indigo-600 dark:text-indigo-400 font-mono font-bold tracking-tighter">{info?.callerId || '-'}</span>
                                                </div>
                                            );
                                        })()}
                                    </div>

                                    {/* GIS Navigation Section */}
                                    <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800">
                                        <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-widest mb-4 flex items-center gap-3">
                                            <Navigation className="w-4 h-4 text-emerald-600" /> Geolokasi & Navigasi
                                        </h3>
                                        <div className="space-y-4">
                                            <div className="w-full h-[180px] bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 relative group">
                                                {selectedCustomer.latitude && selectedCustomer.longitude ? (
                                                    <iframe 
                                                        width="100%" 
                                                        height="100%" 
                                                        frameBorder="0" 
                                                        style={{ border: 0, filter: theme === 'dark' ? 'invert(90%) hue-rotate(180deg)' : 'none' }} 
                                                        src={`https://maps.google.com/maps?q=${selectedCustomer.latitude},${selectedCustomer.longitude}&z=18&output=embed`}
                                                        allowFullScreen
                                                        className="grayscale-[0.5] contrast-[1.2] brightness-[0.8]"
                                                    ></iframe>
                                                ) : (
                                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-400">
                                                        <MapPin className="w-8 h-8 mb-2 opacity-20" />
                                                        <p className="text-[10px] font-black uppercase tracking-widest">Koordinat Belum Diatur</p>
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                            
                                            <div className="flex gap-3">
                                                <div className="flex-1 p-3 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-100 dark:border-slate-800">
                                                    <p className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Koordinat Presisi</p>
                                                    <p className="text-[10px] font-black text-slate-600 dark:text-slate-400 truncate">{selectedCustomer.latitude || '-'}, {selectedCustomer.longitude || '-'}</p>
                                                </div>
                                                <a 
                                                    href={`https://www.google.com/maps?q=${selectedCustomer.latitude},${selectedCustomer.longitude}`} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-emerald-600/20 active:scale-95"
                                                >
                                                    <Navigation className="w-4 h-4" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">Navigasi</span>
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Throughput Chart Integration */}
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
                                <div className="flex justify-between items-center mb-6">
                                    <div>
                                        <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">Vektor Performa Real-time</h4>
                                        <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-1">Sumber Telemetri: {selectedCustomer.router_name || 'Gerbang MikroTik'}</p>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                                            <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase">Masuk (RX)</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]" />
                                            <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase">Keluar (TX)</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="h-[200px] w-full min-h-[200px] flex items-center justify-center">
                                    {!chartReady && <div className="text-[10px] font-black text-slate-400 animate-pulse uppercase tracking-widest">Menyiapkan Vektor Telemetri...</div>}
                                    <ResponsiveContainer width="100%" height="100%" debounce={300}>
                                        {chartReady && (
                                            <AreaChart data={chartData}>
                                            <defs>
                                                <linearGradient id="colorDown" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                                </linearGradient>
                                                <linearGradient id="colorUp" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#334155' : '#e2e8f0'} />
                                            <XAxis dataKey="name" hide />
                                            <YAxis hide />
                                            <Tooltip 
                                                contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '10px' }}
                                                itemStyle={{ fontWeight: 'bold' }}
                                            />
                                            <Area type="monotone" dataKey="down" stroke="#10b981" fillOpacity={1} fill="url(#colorDown)" strokeWidth={3} isAnimationActive={false} />
                                            <Area type="monotone" dataKey="up" stroke="#3b82f6" fillOpacity={1} fill="url(#colorUp)" strokeWidth={3} isAnimationActive={false} />
                                            </AreaChart>
                                        )}
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex justify-end gap-4">
                            <button onClick={() => setShowDetail(false)} className="px-10 py-4 bg-slate-800 dark:bg-slate-950 text-white rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-lg shadow-slate-900/10 hover:bg-slate-950 dark:hover:bg-black transition-all active:scale-95">
                                Tutup Dashboard
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
