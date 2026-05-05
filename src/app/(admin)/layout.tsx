'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard, Router as RouterIcon, Users, Activity, Ticket, Receipt,
    Settings, LogOut, ChevronLeft, ChevronRight, Menu, Package, Zap, Map,
    Database, Bell, Globe, Box, Wallet, ChevronDown, Archive, Warehouse, Cpu,
    FileText
} from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [mounted, setMounted] = useState(false);
    const [settings, setSettings] = useState<any>(null);
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
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
        { href: '/settings', label: 'Pengaturan', icon: Settings },
    ];

    useEffect(() => {
        setMounted(true);
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);

        fetch('/api/settings').then(res => res.json()).then(data => {
            if (data.settings) setSettings(data.settings);
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

    return (
        <div className="flex flex-col min-h-screen bg-(--background) text-(--foreground) overflow-x-hidden font-sans relative transition-colors duration-500">
            {/* Ambient Background Elements */}
            <div className="fixed top-[-10%] right-[-10%] w-[50%] h-[50%] bg-accent/3 rounded-full blur-[150px] z-0 pointer-events-none"></div>
            <div className="fixed bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-teal-500/3 rounded-full blur-[150px] z-0 pointer-events-none"></div>

            {/* Top Navigation Bar */}
            <header className="fixed top-0 left-0 right-0 z-50 w-full px-6 py-4">
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
                                    <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-muted mt-1 opacity-60">Pusat Kontrol</span>
                                </div>
                            </Link>

                            {/* Desktop Nav Items */}
                            <nav className="hidden xl:flex items-center gap-1 px-2 py-1.5 bg-slate-500/5 rounded-2xl border border-white/5" ref={dropdownRef}>
                                {navItems.map((item, idx) => {
                                    const Icon = item.icon;
                                    const isActive = isActiveLink(item.href, item.subItems);
                                    const hasSubItems = !!item.subItems;

                                    return (
                                        <div key={idx} className="relative">
                                            {item.href ? (
                                                <Link
                                                    href={item.href}
                                                    className={`flex items-center px-5 py-2.5 rounded-2xl transition-all duration-300 font-bold text-[10px] uppercase tracking-wider ${isActive ? 'bg-white dark:bg-white/10 text-primary shadow-sm border border-white/10' : 'text-muted hover:text-primary hover:bg-white/5'}`}
                                                >
                                                    <Icon className={`w-4 h-4 mr-2.5 ${isActive ? 'text-accent' : ''}`} />
                                                    {item.label}
                                                </Link>
                                            ) : (
                                                <button
                                                    onClick={() => setActiveDropdown(activeDropdown === item.label ? null : item.label)}
                                                    className={`flex items-center px-5 py-2.5 rounded-2xl transition-all duration-300 font-bold text-[10px] uppercase tracking-wider ${isActive ? 'bg-white dark:bg-white/10 text-primary shadow-sm border border-white/10' : 'text-muted hover:text-primary hover:bg-white/5'}`}
                                                >
                                                    <Icon className={`w-4 h-4 mr-2.5 ${isActive ? 'text-accent' : ''}`} />
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
                                    {mounted ? formatTime(currentTime) : '--:--:--'}
                                </span>
                                <span className="text-[8px] text-muted font-semibold uppercase tracking-tight mt-1">
                                    {mounted ? formatDate(currentTime) : 'Memuat...'}
                                </span>
                            </div>

                            <div className="flex items-center gap-2">
                                <button className="w-10 h-10 rounded-2xl flex items-center justify-center text-muted hover:text-accent hover:bg-white/5 transition-all relative">
                                    <Bell className="w-5 h-5" />
                                    <div className="absolute top-3 right-3 w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                                </button>
                                <ThemeToggle />
                                <div className="h-8 w-px bg-white/10 mx-1 hidden sm:block"></div>
                                <div className="flex items-center gap-4 pl-4 group cursor-pointer border-l border-white/10">
                                    <div className="text-right hidden sm:block">
                                        <p className="text-value leading-none uppercase">Administrator</p>
                                        <div className="text-label text-accent opacity-100 mt-1.5 flex items-center justify-end gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"></div>
                                            Online
                                        </div>
                                    </div>
                                    <div className="w-12 h-12 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center font-black text-accent shadow-sm group-hover:border-accent/40 transition-all text-sm">
                                        AD
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col pt-32 px-6 md:px-12 pb-24 md:pb-8 relative w-full">
                <div className="flex-1 min-h-0">
                    {children}
                </div>
            </main>

            {/* Mobile Nav (Bottom) */}
            <nav className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[95%] glass rounded-[32px] z-50 flex items-center justify-around p-3 shadow-2xl border border-white/10 dark:border-white/5 bg-white/80 dark:bg-slate-950/80 backdrop-blur-2xl">
                {navItems.filter(item => item.href || item.label === 'Pusat Laporan').slice(0, 4).map((item, idx) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={idx}
                            href={item.href || '/reports'}
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

                {/* Mobile More Menu Overlay */}
                {activeDropdown === 'mobile-more' && (
                    <div className="absolute bottom-20 left-0 right-0 glass rounded-[32px] p-6 shadow-2xl border border-white/10 dark:border-white/5 animate-in slide-in-from-bottom-4 duration-300 max-h-[70vh] overflow-y-auto">
                        <div className="grid grid-cols-2 gap-4">
                            {navItems.map((item, idx) => (
                                <div key={idx} className="space-y-3">
                                    <h4 className="text-[10px] font-black text-accent uppercase tracking-widest px-2">{item.label}</h4>
                                    {item.href ? (
                                        <Link
                                            href={item.href}
                                            onClick={() => setActiveDropdown(null)}
                                            className={`flex items-center gap-3 p-3 rounded-2xl transition-all ${pathname === item.href ? 'bg-accent/10 text-accent' : 'text-muted hover:bg-white/5'}`}
                                        >
                                            <item.icon className="w-4 h-4" />
                                            <span className="text-xs font-bold">{item.label}</span>
                                        </Link>
                                    ) : (
                                        <div className="space-y-1">
                                            {item.subItems?.map((sub, sIdx) => (
                                                <Link
                                                    key={sIdx}
                                                    href={sub.href}
                                                    onClick={() => setActiveDropdown(null)}
                                                    className={`flex items-center gap-3 p-3 rounded-2xl transition-all ${pathname === sub.href ? 'bg-accent/10 text-accent' : 'text-muted hover:bg-white/5 hover:text-primary'}`}
                                                >
                                                    <sub.icon className="w-4 h-4" />
                                                    <span className="text-xs font-bold">{sub.label}</span>
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </nav>
        </div>
    );
}
