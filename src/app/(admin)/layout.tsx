'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Router as RouterIcon, Users, Activity, Ticket, Receipt, Settings, LogOut, ChevronLeft, ChevronRight, Menu } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const pathname = usePathname();

    const navItems = [
        { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/routers', label: 'Routers', icon: RouterIcon },
        { href: '/customers', label: 'Customers', icon: Users },
        { href: '/system', label: 'System', icon: Activity },
        { href: '/vouchers', label: 'Vouchers', icon: Ticket },
        { href: '/invoices', label: 'Invoices', icon: Receipt },
    ];

    return (
        <div className="flex h-screen bg-slate-900 text-slate-100 overflow-hidden font-sans relative">
            {/* Sidebar (Tablet & Desktop Only) */}
            <aside
                className={`hidden md:flex glass m-3 sm:m-4 rounded-2xl flex-col relative z-20 transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-64'}`}
            >
                <div className={`p-6 border-b border-white/5 flex items-center justify-between`}>
                    {!isCollapsed && (
                        <div>
                            <h1 className="text-3xl font-extrabold bg-linear-to-r from-teal-400 to-blue-500 bg-clip-text text-transparent transition-opacity duration-300">
                                JARFI
                            </h1>
                            <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider font-semibold whitespace-nowrap">Admin Panel</p>
                        </div>
                    )}
                    {isCollapsed && (
                        <h1 className="text-2xl font-extrabold bg-linear-to-r from-teal-400 to-blue-500 bg-clip-text text-transparent mx-auto">
                            J
                        </h1>
                    )}
                </div>

                {/* Collapse Toggle Button - Floating Indicator */}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="absolute -right-3 top-8 bg-slate-800 border border-white/10 text-slate-400 hover:text-white rounded-full p-1 shadow-lg z-50 transition-colors"
                    title={isCollapsed ? "Buka Sidebar" : "Lipat Sidebar"}
                >
                    {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </button>

                <nav className="flex-1 p-3 space-y-2 overflow-y-auto overflow-x-hidden scrollbar-hide py-6">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname?.startsWith(item.href);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center px-4 py-3 rounded-xl transition-all font-medium whitespace-nowrap group relative ${isActive ? 'bg-indigo-500/20 text-indigo-400' : 'hover:bg-white/10 text-slate-300'} ${isCollapsed ? 'justify-center px-0' : ''}`}
                                title={isCollapsed ? item.label : ''}
                            >
                                <Icon className={`w-5 h-5 shrink-0 ${isCollapsed ? '' : 'mr-3'}`} />
                                {!isCollapsed && <span>{item.label}</span>}

                                {/* Active Indicator Pipe for Collapsed State */}
                                {isCollapsed && isActive && <div className="absolute left-0 w-1 h-6 bg-indigo-500 rounded-r-md"></div>}
                            </Link>
                        )
                    })}
                </nav>

                <div className="p-3 border-t border-white/5 space-y-2 pb-6">
                    <Link href="/settings" className={`flex items-center px-4 py-3 rounded-xl transition-all font-medium whitespace-nowrap group relative ${pathname?.startsWith('/settings') ? 'bg-indigo-500/20 text-indigo-400' : 'hover:bg-white/10 text-slate-300'} ${isCollapsed ? 'justify-center px-0' : ''}`} title={isCollapsed ? 'Pengaturan Perusahaan' : ''}>
                        <Settings className={`w-5 h-5 shrink-0 ${isCollapsed ? '' : 'mr-3'} ${pathname?.startsWith('/settings') ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-300'}`} />
                        {!isCollapsed && <span>Pengaturan ISP</span>}
                        {isCollapsed && pathname?.startsWith('/settings') && <div className="absolute left-0 w-1 h-6 bg-indigo-500 rounded-r-md"></div>}
                    </Link>

                    <button className={`w-full flex items-center px-4 py-3 rounded-xl hover:bg-red-500/10 text-red-400 transition-colors font-medium whitespace-nowrap ${isCollapsed ? 'justify-center px-0' : ''}`} title={isCollapsed ? 'Logout' : ''}>
                        <LogOut className={`w-5 h-5 shrink-0 ${isCollapsed ? '' : 'mr-3'}`} />
                        {!isCollapsed && <span>Keluar App</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col p-3 md:p-4 pl-3 md:pl-0 relative z-10 w-full overflow-hidden transition-all duration-300 pb-24 md:pb-4">
                {/* Background ambient light */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>
                <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>

                <header className="glass h-20 rounded-2xl flex items-center px-6 sm:px-8 justify-between mb-4 sm:mb-6 shadow-lg border border-white/5 shrink-0">
                    <div className="flex items-center gap-3">
                        <h2 className="text-xl font-bold text-slate-200 flex items-center">
                            <span className="md:hidden font-extrabold bg-linear-to-r from-teal-400 to-blue-500 bg-clip-text text-transparent mr-2">JARFI</span>
                            <span className="hidden md:inline">Workspace</span>
                        </h2>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-bold text-slate-200">Admin Utama</p>
                            <p className="text-[10px] text-teal-400 uppercase tracking-widest font-sans">NOC Master</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-linear-to-br from-teal-400 to-blue-500 flex items-center justify-center font-bold text-slate-900 shadow-md">
                            A
                        </div>
                    </div>
                </header>
                <div className="flex-1 glass rounded-2xl p-4 sm:p-8 overflow-y-auto overflow-x-hidden shadow-xl border border-white/5 relative">
                    {children}
                </div>
            </main>

            {/* Mobile Bottom Navigation Bar (Hidden on Desktop) */}
            <nav className="md:hidden fixed bottom-1 left-3 right-3 glass border border-white/10 rounded-2xl z-50 flex items-center justify-between px-2 py-2 pb-safe bg-slate-900/95 backdrop-blur-2xl shadow-2xl">
                {navItems.slice(0, 4).map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname?.startsWith(item.href);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex flex-1 flex-col items-center justify-center py-2 px-1 rounded-xl transition-all duration-300 ${isActive ? 'text-teal-400 scale-105 bg-white/5' : 'text-slate-400 hover:text-slate-300'}`}
                        >
                            <Icon className={`w-5 h-5 mb-1 ${isActive ? 'drop-shadow-[0_0_8px_rgba(45,212,191,0.5)]' : ''}`} />
                            <span className="text-[9px] font-bold tracking-wide">{item.label}</span>
                        </Link>
                    );
                })}

                {/* Settings as the 5th icon on mobile */}
                <Link href="/settings" className={`flex flex-1 flex-col items-center justify-center py-2 px-1 rounded-xl transition-all duration-300 ${pathname?.startsWith('/settings') ? 'text-teal-400 scale-105 bg-white/5' : 'text-slate-400 hover:text-slate-300'}`}>
                    <Settings className={`w-5 h-5 mb-1 ${pathname?.startsWith('/settings') ? 'drop-shadow-[0_0_8px_rgba(45,212,191,0.5)]' : ''}`} />
                    <span className="text-[9px] font-bold tracking-wide">Pengaturan</span>
                </Link>
            </nav>
        </div>
    );
}
