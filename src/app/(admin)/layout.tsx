'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    LayoutDashboard, Router as RouterIcon, Users, Activity, Ticket, Receipt,
    Settings, LogOut, ChevronLeft, ChevronRight, Menu, Package, Zap, Map,
    Database, Bell, Globe, Box, Wallet, ChevronDown, Archive, Warehouse, Cpu,
    FileText, X as CloseIcon, User
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
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [updateAvailable, setUpdateAvailable] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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
                { href: '/system', label: 'Monitoring', icon: Activity },
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

    const getPageTitle = () => {
        const item = navItems.find(i => i.href === pathname);
        if (item) return item.label;
        
        // Check sub items
        for (const nav of navItems) {
            const sub = nav.subItems?.find(s => s.href === pathname);
            if (sub) return sub.label;
        }
        
        return 'Dashboard';
    };

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
        <div className="flex h-screen bg-(--background) text-(--foreground) overflow-hidden font-sans relative transition-colors duration-500">
            {/* Ambient Background Elements */}
            <div className="fixed top-[-10%] right-[-10%] w-[50%] h-[50%] bg-accent/3 rounded-full blur-[150px] z-0 pointer-events-none"></div>
            <div className="fixed bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-teal-500/3 rounded-full blur-[150px] z-0 pointer-events-none"></div>

            {/* Sidebar Desktop */}
            <aside className="hidden lg:flex flex-col w-72 h-screen sticky top-0 bg-slate-50 dark:bg-slate-950/40 backdrop-blur-3xl border-r border-slate-200 dark:border-white/10 z-40 transition-colors duration-500">
                <div className="p-8 flex flex-col h-full">
                    {/* Logo Section */}
                    <Link href="/dashboard" className="flex items-center gap-3 group/logo mb-12">
                        {settings?.company_logo ? (
                            <div className="w-10 h-10 rounded-2xl overflow-hidden shadow-lg shadow-accent/20 group-hover/logo:scale-110 transition-transform duration-500 border border-white/10">
                                <img src={settings.company_logo} alt="Logo" className="w-full h-full object-cover" />
                            </div>
                        ) : (
                            <div className="w-10 h-10 rounded-2xl bg-linear-to-br from-accent to-emerald-500 flex items-center justify-center font-bold text-white shadow-lg shadow-accent/20 group-hover/logo:scale-110 transition-transform duration-500">
                                {(settings?.company_name || 'S').charAt(0)}
                            </div>
                        )}
                        <div className="flex flex-col">
                            <h1 className="text-sm font-bold tracking-tight text-primary uppercase leading-none">
                                {settings?.company_name || 'Sahabat Network'}
                            </h1>
                            <span className="text-[9px] font-black text-accent uppercase tracking-[0.2em] mt-1 opacity-90">JARINGAN WIFI</span>
                        </div>
                    </Link>

                    {/* Navigation Items */}
                    {/* Navigation Items */}
                    <nav className="flex-1 space-y-1 overflow-y-auto no-scrollbar pr-2">
                        {filteredNavItems.map((item, idx) => {
                            const Icon = item.icon;
                            const isActive = isActiveLink(item.href, item.subItems);
                            const hasSubItems = !!item.subItems;

                            return (
                                <div key={idx} className="space-y-1">
                                    {/* Main Item or Section Header */}
                                    {hasSubItems ? (
                                        <div className="pt-6 pb-2 px-4">
                                            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">
                                                {item.label}
                                            </span>
                                        </div>
                                    ) : (
                                        <Link
                                            href={item.href || '#'}
                                            className={`flex items-center px-4 py-3 rounded-2xl transition-all duration-500 font-bold text-[12px] uppercase tracking-[0.05em] relative overflow-hidden group/link ${isActive ? 'bg-accent/10 text-accent border border-accent/20 shadow-[0_0_25px_rgba(99,102,241,0.15)]' : 'text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-white hover:bg-slate-200/40 dark:hover:bg-white/5'}`}
                                        >
                                            {isActive && <div className="absolute left-0 top-2 bottom-2 w-1.5 bg-accent rounded-full animate-pulse shadow-[0_0_10px_rgba(99,102,241,0.8)]"></div>}
                                            <Icon className={`w-5 h-5 mr-3.5 transition-all duration-500 ${isActive ? 'text-accent scale-110' : 'opacity-40 group-hover/link:opacity-100 group-hover/link:scale-110 group-hover/link:rotate-6'}`} />
                                            {item.label}
                                        </Link>
                                    )}

                                    {/* Sub Items (Rendered flat under the header) */}
                                    {hasSubItems && (
                                        <div className="space-y-1">
                                            {item.subItems?.map((sub, sIdx) => {
                                                const SubIcon = sub.icon || Icon;
                                                const isSubActive = pathname === sub.href;
                                                return (
                                                    <Link
                                                        key={sIdx}
                                                        href={sub.href}
                                                        className={`flex items-center px-4 py-3 rounded-2xl transition-all duration-500 text-[12px] font-bold uppercase tracking-[0.05em] relative overflow-hidden group/sub ${isSubActive ? 'bg-accent/10 text-accent border border-accent/20 shadow-[0_0_20px_rgba(99,102,241,0.1)]' : 'text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-white hover:bg-slate-200/30 dark:hover:bg-white/5'}`}
                                                    >
                                                        {isSubActive && <div className="absolute left-0 top-2 bottom-2 w-1.5 bg-accent rounded-full animate-pulse"></div>}
                                                        <SubIcon className={`w-5 h-5 mr-3.5 transition-all duration-500 ${isSubActive ? 'text-accent scale-110' : 'opacity-40 group-hover/sub:opacity-100'}`} />
                                                        {sub.label}
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </nav>
                    {/* Sidebar Footer */}
                    <div className="mt-auto pt-8 border-t border-slate-200 dark:border-white/5">
                        <div className="p-4 rounded-2xl bg-slate-200/30 dark:bg-white/2 border border-slate-200/50 dark:border-white/5">
                            <p className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-tight">
                                Sistem Kelola Internal
                            </p>
                            <p className="text-[10px] font-bold text-primary mt-1 truncate">
                                Supriyanto Developer Magetan
                            </p>
                            <div className="flex items-center justify-between mt-3">
                                <span className="text-[7px] font-bold text-accent uppercase tracking-widest px-2 py-0.5 bg-accent/10 rounded-md border border-accent/20">
                                    JARFI MGT Core
                                </span>
                                <div className="flex gap-1.5">
                                    <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></div>
                                    <div className="w-1 h-1 rounded-full bg-emerald-500 opacity-40"></div>
                                    <div className="w-1 h-1 rounded-full bg-emerald-500 opacity-20"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>

            <div className="flex-1 flex flex-col min-w-0 overflow-y-auto custom-scrollbar">
                {/* Top Header */}
                <header className="h-20 flex items-center px-6 lg:px-8 sticky top-0 z-30 bg-white/80 dark:bg-slate-950/80 backdrop-blur-2xl border-b border-slate-200 dark:border-white/5 transition-all duration-500">
                    <div className="w-full flex items-center justify-between">
                        {/* Page Title & Mobile Toggle */}
                        <div className="flex items-center gap-4">
                            <button 
                                onClick={() => setIsSidebarOpen(true)}
                                className="lg:hidden w-10 h-10 rounded-xl flex items-center justify-center bg-white/5 border border-white/10 text-primary active:scale-95 transition-all"
                            >
                                <Menu className="w-5 h-5" />
                            </button>
                            <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">
                                {getPageTitle()}
                            </h2>
                        </div>

                        {/* Right Section Utilities */}
                        <div className="flex items-center gap-4 md:gap-6 ml-auto">
                            {/* Search Bar - Reference Style */}
                            <div className="hidden md:flex items-center gap-3 px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 group transition-all hover:border-accent/30 cursor-pointer">
                                <span className="text-slate-400">
                                    <Globe className="w-4 h-4" />
                                </span>
                                <span className="text-[11px] font-bold text-slate-400 group-hover:text-slate-500 transition-colors uppercase tracking-wider">Cari...</span>
                                <div className="ml-4 flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 shadow-xs">
                                    <span className="text-[9px] font-black text-slate-400">CTRL K</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 border-r border-slate-200 dark:border-white/10 pr-4 md:pr-6">
                                <ThemeToggle />
                                <button className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all relative ${updateAvailable ? 'text-accent bg-accent/10 animate-bounce' : 'text-slate-400 hover:text-accent hover:bg-slate-100 dark:hover:bg-white/5'}`}>
                                    <Bell className="w-5 h-5" />
                                    {updateAvailable && <div className="absolute top-3 right-3 w-1.5 h-1.5 bg-red-500 rounded-full animate-ping"></div>}
                                </button>
                            </div>

                            {/* User Profile - Reference Style Dropdown */}
                            <div className="relative">
                                <div 
                                    className="flex items-center gap-4 group cursor-pointer" 
                                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                                >
                                    <div className="flex flex-col items-end hidden sm:flex">
                                        <p className="text-[11px] font-black text-slate-800 dark:text-white uppercase tracking-tight leading-none">
                                            {user?.name || 'Admin'}
                                        </p>
                                        <p className="text-[9px] font-bold text-accent uppercase tracking-widest mt-1 opacity-80">
                                            {user?.role || 'Administrator'}
                                        </p>
                                    </div>
                                    <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center font-black text-accent text-xs border border-accent/20 group-hover:scale-110 transition-transform duration-500">
                                        {(user?.name || 'AD').substring(0, 2).toUpperCase()}
                                    </div>
                                </div>

                                {/* Profile Dropdown Menu */}
                                {isProfileOpen && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)}></div>
                                        <div className="absolute right-0 mt-3 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                            <div className="p-2 space-y-1">
                                                <button 
                                                    onClick={() => { router.push('/settings'); setIsProfileOpen(false); }}
                                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-all text-[12px] font-bold"
                                                >
                                                    <User className="w-4 h-4" />
                                                    Profil Saya
                                                </button>
                                                <div className="h-px bg-slate-100 dark:bg-white/5 mx-2 my-1"></div>
                                                <button 
                                                    onClick={() => { handleLogout(); setIsProfileOpen(false); }}
                                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-all text-[12px] font-bold"
                                                >
                                                    <LogOut className="w-4 h-4" />
                                                    Keluar
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </header>

                <main className="flex-1 px-6 lg:px-12 pt-4 pb-24 relative w-full flex flex-col">
                    <div className="flex-1 min-h-0">
                        {children}
                    </div>

                    {/* Centered Floating Footer */}
                    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
                        <footer className="glass px-10 py-3.5 rounded-2xl border border-slate-200 dark:border-white/10 flex flex-col items-center gap-1 opacity-40 hover:opacity-100 transition-all duration-500 shadow-2xl pointer-events-auto backdrop-blur-xl bg-white/50 dark:bg-slate-900/50 min-w-[300px]">
                            <p className="text-[7px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.3em] leading-none">
                                Sistem Manajemen Jaringan WiFi
                            </p>
                            <p className="text-[10px] font-black text-primary dark:text-white uppercase tracking-wider">
                                By Supriyanto <span className="text-accent ml-1">085655620979</span>
                            </p>
                            <div className="flex items-center gap-4 mt-1 pt-1 border-t border-slate-200 dark:border-white/5 w-full justify-center">
                                <span className="text-[9px] font-black text-accent uppercase tracking-[0.1em]">
                                    JARFI MGT Core
                                </span>
                                <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-white/20"></div>
                                <span className="text-[7px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                    Engineered in Magetan
                                </span>
                            </div>
                        </footer>
                    </div>
                </main>
            </div>

            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div className="fixed inset-0 z-[100] lg:hidden animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)}></div>
                    <aside className="absolute left-0 top-0 bottom-0 w-80 bg-slate-900 border-r border-white/10 shadow-2xl flex flex-col p-8 animate-in slide-in-from-left duration-500">
                        <div className="flex items-center justify-between mb-12">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-accent/20 flex items-center justify-center font-bold text-accent">S</div>
                                <div className="flex flex-col">
                                    <h1 className="text-sm font-bold text-white uppercase tracking-tight">{settings?.company_name || 'Sahabat Net'}</h1>
                                    <span className="text-[8px] font-black text-accent uppercase tracking-[0.2em] mt-0.5">JARINGAN WIFI</span>
                                </div>
                            </div>
                            <button onClick={() => setIsSidebarOpen(false)} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white">
                                <CloseIcon className="w-5 h-5" />
                            </button>
                        </div>

                        <nav className="flex-1 space-y-1.5 overflow-y-auto no-scrollbar">
                            {filteredNavItems.map((item, idx) => {
                                const Icon = item.icon;
                                const isActive = isActiveLink(item.href, item.subItems);
                                const hasSubItems = !!item.subItems;

                                return (
                                    <div key={idx} className="space-y-1.5">
                                        {hasSubItems ? (
                                            <>
                                                <div className="pt-6 pb-2 px-5">
                                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                                                        {item.label}
                                                    </span>
                                                </div>
                                                {item.subItems?.map((sub, sIdx) => {
                                                    const SubIcon = sub.icon || Icon;
                                                    const isSubActive = pathname === sub.href;
                                                    return (
                                                        <Link
                                                            key={sIdx}
                                                            href={sub.href}
                                                            onClick={() => setIsSidebarOpen(false)}
                                                            className={`flex items-center px-5 py-4 rounded-2xl transition-all font-bold text-xs uppercase tracking-widest ${isSubActive ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'text-slate-400'}`}
                                                        >
                                                            <SubIcon className="w-5 h-5 mr-4" />
                                                            {sub.label}
                                                        </Link>
                                                    );
                                                })}
                                            </>
                                        ) : (
                                            <Link
                                                href={item.href || '#'}
                                                onClick={() => setIsSidebarOpen(false)}
                                                className={`flex items-center px-5 py-4 rounded-2xl transition-all font-bold text-xs uppercase tracking-widest ${isActive ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'text-slate-400'}`}
                                            >
                                                <Icon className="w-5 h-5 mr-4" />
                                                {item.label}
                                            </Link>
                                        )}
                                    </div>
                                );
                            })}
                        </nav>
                        
                        <div className="mt-8 pt-8 border-t border-white/5">
                            <button onClick={handleLogout} className="w-full flex items-center gap-4 text-red-400 font-bold uppercase text-[10px] tracking-widest p-4 bg-red-500/5 rounded-2xl">
                                <LogOut className="w-5 h-5" />
                                Terminasi Sesi
                            </button>
                        </div>
                    </aside>
                </div>
            )}
        </div>
    );
}
