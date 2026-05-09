'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    LayoutDashboard, Router as RouterIcon, Users, Activity, Ticket, Receipt,
    Settings, LogOut, ChevronLeft, ChevronRight, Menu, Package, Zap, Map,
    Database, Bell, Globe, Box, Wallet, ChevronDown, Archive, Warehouse, Cpu,
    FileText, X as CloseIcon
} from 'lucide-react';

// Force refresh for Turbopack stale state
import ThemeToggle from '@/components/ThemeToggle';
import Swal from 'sweetalert2';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [currentTime, setCurrentTime] = useState<Date | null>(null);
    const [mounted, setMounted] = useState(false);
    const [settings, setSettings] = useState<any>(null);
    const [user, setUser] = useState<any>(null);
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
    const [updateAvailable, setUpdateAvailable] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const navItems = [
        { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        {
            label: 'Infrastruktur',
            icon: Globe,
            subItems: [
                { href: '/routers', label: 'Region Server', icon: RouterIcon },
                { href: '/map', label: 'Pemetaan & ODP', icon: Map },
                { href: '/olts', label: 'OLT Hub', icon: Cpu },
                { href: '/vouchers', label: 'Hotspot (Voucher)', icon: Ticket },
                { href: '/system', label: 'Telemetri & PPPoE', icon: Activity },
            ]
        },
        {
            label: 'Keuangan',
            icon: Wallet,
            subItems: [
                { href: '/packages', label: 'Paket Internet', icon: Package },
                { href: '/invoices', label: 'Tagihan & Riwayat', icon: Receipt },
                { href: '/automation', label: 'Isolir Billing Otomatis', icon: Zap },
            ]
        },
        { href: '/customers', label: 'Pelanggan', icon: Users },
        {
            label: 'Inventori',
            icon: Archive,
            subItems: [
                { href: '/inventory/items', label: 'Stok Barang', icon: Box },
            ]
        },
        { href: '/reports', label: 'Pusat Laporan', icon: FileText },
        { href: '/users', label: 'Kelola User', icon: Users },
        { href: '/settings', label: 'Pengaturan', icon: Settings },
    ];

    useEffect(() => {
        setMounted(true);
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);

        fetch('/api/settings').then(res => res.json()).then(data => {
            if (data.settings) setSettings(data.settings);
        });

        fetch('/api/auth/me').then(res => res.json()).then(data => {
            if (data.user) setUser(data.user);
        });

        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setActiveDropdown(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            clearInterval(timer);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Auto-close dropdown on navigation
    useEffect(() => {
        setActiveDropdown(null);
    }, [pathname]);

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('id-ID', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    const isActiveLink = (href?: string, subItems?: any[]) => {
        if (href === pathname) return true;
        if (subItems) {
            return subItems.some(sub => sub.href === pathname);
        }
        return false;
    };

    useEffect(() => {
        // Listen for Electron Update Events
        if (typeof window !== 'undefined' && (window as any).electronAPI) {
            const api = (window as any).electronAPI;
            
            api.onUpdateAvailable(() => {
                setUpdateAvailable(true);
                Swal.fire({
                    title: 'Update Tersedia!',
                    text: 'Versi baru sedang diunduh secara otomatis...',
                    icon: 'info',
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 5000,
                    background: '#1a1d21',
                    color: '#fff'
                });
            });

            api.onUpdateDownloaded(() => {
                Swal.fire({
                    title: 'Update Siap!',
                    text: 'Versi terbaru sudah diunduh. Restart sekarang untuk update?',
                    icon: 'success',
                    showCancelButton: true,
                    confirmButtonText: 'Restart Sekarang',
                    cancelButtonText: 'Nanti Saja',
                    background: '#1a1d21',
                    color: '#fff'
                }).then((result) => {
                    if (result.isConfirmed) {
                        api.restartApp();
                    }
                });
            });
        }
    }, []);

    const handleLogout = async () => {
        const result = await fetch('/api/auth/logout', { method: 'POST' });
        if (result.ok) {
            router.push('/login');
        }
    };

    const filteredNavItems = navItems.filter(item => {
        if (!user) return true; // Show all while loading or if not set
        if (user.role === 'SUPERADMIN') return true;
        
        if (user.role === 'TEKNISI') {
            return ['Dashboard', 'Infrastruktur', 'Pelanggan', 'Pusat Laporan'].includes(item.label);
        }
        
        if (user.role === 'KASIR') {
            return ['Dashboard', 'Keuangan', 'Pelanggan'].includes(item.label);
        }
        
        return true;
    });

    return (
        <div className="flex flex-col min-h-screen bg-(--background) text-(--foreground) overflow-x-hidden font-sans relative transition-colors duration-500">
            {/* Ambient Background Elements */}
            <div className="fixed top-[-10%] right-[-10%] w-[50%] h-[50%] bg-accent/3 rounded-full blur-[150px] z-0 pointer-events-none"></div>
            <div className="fixed bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-teal-500/3 rounded-full blur-[150px] z-0 pointer-events-none"></div>

            {/* Top Navigation Bar */}
            <header className="sticky top-0 z-50 w-full px-6 py-4 bg-(--background)/80 backdrop-blur-xl">
                <div className="w-full">
                    <div className="glass rounded-[40px] h-24 flex items-center px-10 justify-between shadow-2xl border border-white/10 dark:border-white/5 relative">

                        <div className="flex items-center gap-10 relative z-10">
                            <Link href="/dashboard" className="flex items-center gap-3 group/logo">
                                {settings?.company_logo ? (
                                    <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-lg shadow-accent/20 group-hover/logo:scale-110 transition-transform duration-500 border border-white/10">
                                        <img src={settings.company_logo} alt="Logo" className="w-full h-full object-cover" />
                                    </div>
                                ) : (
                                    <div className="w-10 h-10 rounded-2xl bg-linear-to-br from-accent to-emerald-500 flex items-center justify-center font-bold text-white shadow-lg shadow-accent/20 group-hover/logo:scale-110 transition-transform duration-500">
                                        {(settings?.company_name || 'S').charAt(0)}
                                    </div>
                                )}
                                <div className="flex flex-col">
                                    <h1 className="text-lg font-bold tracking-tight text-primary uppercase leading-none">
                                        {settings?.company_name || 'Sahabat Network'}
                                    </h1>
                                    <span className="text-[8px] font-bold text-accent uppercase tracking-widest mt-1.5 opacity-80">ISP Management System v0.1.0 by Supriyanto</span>
                                </div>
                            </Link>

                            {/* Desktop Nav Items */}
                            <nav className="hidden xl:flex items-center gap-1 px-2 py-1.5 bg-slate-500/5 rounded-2xl border border-white/5" ref={dropdownRef}>
                                {filteredNavItems.map((item, idx) => {
                                    const Icon = item.icon;
                                    const isActive = isActiveLink(item.href, item.subItems);
                                    const hasSubItems = !!item.subItems;

                                    return (
                                        <div key={idx} className="relative">
                                            {item.href ? (
                                                <Link
                                                    href={item.href}
                                                    className={`flex items-center px-5 py-2.5 rounded-2xl transition-all duration-300 font-bold text-[10px] uppercase tracking-wider ${isActive ? 'bg-white dark:bg-white/15 text-slate-900 dark:text-white shadow-sm border border-white/10' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/10 dark:hover:bg-white/5'}`}
                                                >
                                                    <Icon className={`w-4 h-4 mr-2.5 ${isActive ? 'text-accent' : 'opacity-50'}`} />
                                                    {item.label}
                                                </Link>
                                            ) : (
                                                <button
                                                    onClick={() => setActiveDropdown(activeDropdown === item.label ? null : item.label)}
                                                    className={`flex items-center px-5 py-2.5 rounded-2xl transition-all duration-300 font-bold text-[10px] uppercase tracking-wider ${isActive ? 'bg-white dark:bg-white/15 text-slate-900 dark:text-white shadow-sm border border-white/10' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/10 dark:hover:bg-white/5'}`}
                                                >
                                                    <Icon className={`w-4 h-4 mr-2.5 ${isActive ? 'text-accent' : 'opacity-50'}`} />
                                                    {item.label}
                                                    <ChevronDown className={`w-3.5 h-3.5 ml-2 transition-transform duration-300 ${activeDropdown === item.label ? 'rotate-180' : ''}`} />
                                                </button>
                                            )}

                                            {/* Dropdown Menu */}
                                            {hasSubItems && activeDropdown === item.label && (
                                                <div className="absolute top-full left-0 mt-3 w-64 glass rounded-3xl shadow-2xl border border-white/10 p-3 animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                                                    <div className="grid gap-1">
                                                        {item.subItems?.map((sub, sIdx) => (
                                                            <Link
                                                                key={sIdx}
                                                                href={sub.href}
                                                                onClick={() => setActiveDropdown(null)}
                                                                className={`flex items-center px-4 py-3 rounded-2xl transition-all text-[11px] font-semibold tracking-wide ${pathname === sub.href ? 'bg-accent/10 text-accent shadow-inner' : 'text-muted hover:bg-white/5 hover:text-primary'}`}
                                                            >
                                                                {sub.icon && <sub.icon className="w-4 h-4 mr-3 opacity-70" />}
                                                                {sub.label}
                                                            </Link>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </nav>
                        </div>

                        <div className="flex items-center gap-4 relative z-10">
                            <div className="hidden lg:flex flex-col items-end mr-4 border-r border-white/10 pr-6">
                                <span className="text-[10px] text-accent font-bold uppercase tracking-widest leading-none">
                                    {currentTime ? formatTime(currentTime) : '--:--:--'}
                                </span>
                                <span className="text-[8px] text-muted font-semibold uppercase tracking-tight mt-1">
                                    {currentTime ? formatDate(currentTime) : 'Memuat...'}
                                </span>
                            </div>

                            <div className="flex items-center gap-2">
                                <button className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all relative ${updateAvailable ? 'text-accent bg-accent/10 animate-bounce' : 'text-muted hover:text-accent hover:bg-white/5'}`}>
                                    <Bell className="w-5 h-5" />
                                    {updateAvailable && <div className="absolute top-3 right-3 w-1.5 h-1.5 bg-red-500 rounded-full animate-ping"></div>}
                                    {!updateAvailable && <div className="absolute top-3 right-3 w-1.5 h-1.5 bg-red-500 rounded-full"></div>}
                                </button>
                                <ThemeToggle />
                                <div className="h-8 w-px bg-white/10 mx-1 hidden sm:block"></div>
                                <div className="flex items-center gap-4 pl-4 group cursor-pointer border-l border-white/10" onClick={handleLogout} title="Klik untuk Logout">
                                    <div className="text-right hidden sm:block">
                                        <p className="text-value leading-none uppercase">{user?.name || 'Loading...'}</p>
                                        <div className="text-label text-accent opacity-100 mt-1.5 flex items-center justify-end gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"></div>
                                            {user?.role || '...'}
                                        </div>
                                    </div>
                                    <div className="w-12 h-12 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center font-black text-accent shadow-sm group-hover:border-accent/40 transition-all text-sm">
                                        {(user?.name || 'AD').substring(0, 2).toUpperCase()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col px-6 md:px-12 pt-6 pb-24 md:pb-8 relative w-full">
                <div className="flex-1 min-h-0">
                    {children}
                </div>
            </main>

            {/* Mobile Nav (Bottom) - Optimized for Field Operations */}
            <nav className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[95%] glass rounded-[32px] z-50 flex items-center justify-around p-3 shadow-2xl border border-white/10 dark:border-white/5 bg-white/80 dark:bg-slate-950/80 backdrop-blur-2xl">
                {[
                    { href: '/dashboard', label: 'Dasbor', icon: LayoutDashboard },
                    { href: '/map', label: 'Pemetaan', icon: Map },
                    { href: '/customers', label: 'Pelanggan', icon: Users },
                    { href: '/reports', label: 'Laporan', icon: FileText },
                ].map((item, idx) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={idx}
                            href={item.href}
                            className={`flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all duration-300 ${isActive ? 'text-accent bg-accent/10 shadow-inner' : 'text-muted hover:text-primary hover:bg-white/5'}`}
                        >
                            <Icon className={`w-6 h-6 ${isActive ? 'scale-110' : ''}`} />
                            <span className="text-[8px] font-black uppercase mt-1 tracking-tighter">{item.label}</span>
                        </Link>
                    );
                })}
                <button 
                    onClick={() => setActiveDropdown(activeDropdown === 'mobile-more' ? null : 'mobile-more')}
                    className={`flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all duration-300 ${activeDropdown === 'mobile-more' ? 'text-accent bg-accent/10 shadow-inner' : 'text-muted'}`}
                >
                    <Menu className="w-6 h-6" />
                    <span className="text-[8px] font-black uppercase mt-1 tracking-tighter">Menu</span>
                </button>

            </nav>

            {/* Mobile More Menu Overlay - Moved to root for absolute z-index priority */}
            {activeDropdown === 'mobile-more' && (
                <div className="fixed inset-0 z-9999 flex items-end justify-center p-4 sm:p-6 animate-in fade-in duration-500">
                    <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-2xl" onClick={() => setActiveDropdown(null)}></div>
                    <div className="bg-[#0f172a]/90 w-full max-w-2xl rounded-[48px] shadow-[0_-25px_100px_rgba(0,0,0,0.9)] border border-white/15 flex flex-col relative z-10 overflow-hidden animate-in slide-in-from-bottom-full duration-700 mb-16 backdrop-saturate-150">
                        {/* Industrial Header Ornament */}
                        <div className="absolute top-0 left-0 right-0 h-1.5 bg-linear-to-r from-transparent via-accent/50 to-transparent"></div>
                        
                        {/* Drag Handle */}
                        <div className="w-16 h-1.5 bg-white/10 rounded-full mx-auto mt-5 mb-2 shadow-inner"></div>
                        
                        <div className="px-10 py-6 border-b border-white/10 flex justify-between items-center bg-linear-to-b from-white/5 to-transparent">
                            <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-accent animate-pulse shadow-[0_0_10px_rgba(99,102,241,0.8)]"></div>
                                    <span className="text-[12px] font-black text-white uppercase tracking-[0.4em] drop-shadow-lg">Matriks Navigasi</span>
                                </div>
                                <span className="text-[8px] font-bold text-accent uppercase tracking-widest mt-1.5 opacity-80">ISP Management System v0.1.0 by Supriyanto</span>
                            </div>
                            <button onClick={() => setActiveDropdown(null)} className="w-12 h-12 rounded-[20px] bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-all border border-white/10 shadow-inner group active:scale-90">
                                <CloseIcon className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 sm:p-10 space-y-12 custom-scrollbar">
                            {filteredNavItems
                                .filter(item => !['Dasbor', 'Pemetaan', 'Pelanggan', 'Laporan', 'Dashboard', 'Pusat Laporan'].includes(item.label))
                                .map((item, idx) => {
                                    const hasSubItems = item.subItems && item.subItems.length > 0;
                                    const filteredSubItems = item.subItems?.filter(sub => !['Pemetaan & ODP'].includes(sub.label));

                                    return (
                                        <div key={idx} className="space-y-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-1.5 h-1.5 rounded-full bg-accent"></div>
                                                <h5 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">{item.label}</h5>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                {!hasSubItems ? (
                                                    <Link
                                                        href={item.href || '/dashboard'}
                                                        onClick={() => setActiveDropdown(null)}
                                                        className="flex items-center gap-5 p-6 rounded-[32px] bg-white/5 border border-white/5 hover:bg-accent/10 hover:border-accent/30 transition-all group active:scale-95"
                                                    >
                                                        <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent border border-accent/20 group-hover:scale-110 transition-all">
                                                            <item.icon className="w-6 h-6" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="font-black text-white text-sm tracking-tight uppercase">{item.label}</p>
                                                            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">Direct Access</p>
                                                        </div>
                                                        <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-accent group-hover:translate-x-1 transition-all" />
                                                    </Link>
                                                ) : (
                                                    filteredSubItems?.map((sub, sIdx) => (
                                                        <Link
                                                            key={sIdx}
                                                            href={sub.href || '/dashboard'}
                                                            onClick={() => setActiveDropdown(null)}
                                                            className="flex items-center gap-5 p-6 rounded-[32px] bg-white/5 border border-white/5 hover:bg-accent/10 hover:border-accent/30 transition-all group active:scale-95"
                                                        >
                                                            <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent border border-accent/20 group-hover:scale-110 transition-all">
                                                                <sub.icon className="w-6 h-6" />
                                                            </div>
                                                            <div className="flex-1 text-left">
                                                                <p className="font-black text-white text-sm tracking-tight uppercase">{sub.label}</p>
                                                                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">Modul Layanan</p>
                                                            </div>
                                                            <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-accent group-hover:translate-x-1 transition-all" />
                                                        </Link>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>

                        <div className="mt-12 pt-10 border-t border-white/10 space-y-8 p-6 sm:p-10">
                            <div className="group relative flex items-center justify-between bg-white/2 p-6 rounded-[40px] border border-white/5 hover:bg-white/5 transition-all duration-500">
                                <div className="flex items-center gap-6">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-accent rounded-2xl blur-md opacity-20 group-hover:opacity-40 transition-opacity"></div>
                                        <div className="relative w-16 h-16 rounded-2xl bg-linear-to-br from-accent/30 to-emerald-500/30 flex items-center justify-center font-black text-[18px] text-white border border-white/20 shadow-2xl">
                                            {(user?.name || 'AD').substring(0, 2).toUpperCase()}
                                        </div>
                                    </div>
                                    <div className="text-left">
                                        <p className="text-[14px] font-black text-white uppercase leading-none tracking-widest">{user?.name || 'Administrator'}</p>
                                        <div className="flex items-center gap-2 mt-2.5">
                                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
                                            <p className="text-[9px] font-black text-accent uppercase tracking-[0.3em]">{user?.role || 'SECURE ACCESS'}</p>
                                        </div>
                                    </div>
                                </div>
                                <ThemeToggle />
                            </div>

                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center justify-center gap-6 text-red-400 font-black uppercase text-[11px] tracking-[0.4em] py-7 bg-red-500/5 hover:bg-red-500/10 rounded-[40px] border border-red-500/10 active:scale-95 transition-all shadow-2xl group relative overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-linear-to-r from-red-500/0 via-red-500/5 to-red-500/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                                <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center group-hover:bg-red-500/20 transition-all border border-red-500/20 shadow-inner">
                                    <LogOut className="w-6 h-6" />
                                </div>
                                Terminate Session (Logout)
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
