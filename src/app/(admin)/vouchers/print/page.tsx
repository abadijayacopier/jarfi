'use client';

import { useState, useEffect } from 'react';
import { Printer, ArrowLeft, Wifi, Terminal, Shield, QrCode } from 'lucide-react';

export default function PrintVouchersPage() {
    const [vouchers, setVouchers] = useState([]);
    const [settings, setSettings] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [vRes, sRes] = await Promise.all([
                    fetch('/api/vouchers'),
                    fetch('/api/settings')
                ]);
                const [vData, sData] = await Promise.all([
                    vRes.json(),
                    sRes.json()
                ]);
                if (vRes.ok) setVouchers(vData.vouchers || []);
                if (sRes.ok) setSettings(sData.settings);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handlePrint = () => {
        window.print();
    };

    if (loading) return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-6">
            <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Sinkronisasi Voucher...</p>
        </div>
    );

    const isThermal = settings?.printer_type === 'thermal';
    const thermalWidthClass = settings?.printer_width === '58' ? 'max-w-[58mm]' : 'max-w-[80mm]';
    const brandName = settings?.company_name || 'JARFI MGT CORE';
    const hotspotDomain = settings?.hotspot_domain || 'www.jarfi.net';

    const getQrUrl = (code: string, pass: string) => {
        const baseUrl = hotspotDomain;
        const query = `?username=${code}&password=${pass}`;
        const fullUrl = `http://${baseUrl}/login${query}`;
        return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(fullUrl)}&bgcolor=ffffff&color=000000&margin=1`;
    };

    if (isThermal) {
        return (
            <div className="min-h-screen bg-slate-950 flex justify-center p-4 print:p-0 print:bg-white font-mono text-black">
                {/* Header Controls */}
                <div className="fixed top-6 left-6 right-6 flex justify-between items-center z-50 print:hidden glass p-4 rounded-2xl border border-white/5 shadow-2xl">
                    <button onClick={() => window.history.back()} className="bg-white/5 hover:bg-white/10 px-6 py-3 rounded-xl text-xs font-bold text-slate-400 flex items-center gap-2 transition-all">
                        <ArrowLeft className="w-4 h-4" /> Kembali
                    </button>
                    <button onClick={handlePrint} className="bg-accent text-white px-8 py-3 rounded-xl text-xs font-black shadow-xl hover:bg-accent/90 flex items-center gap-2 transition-all active:scale-95">
                        <Printer className="w-4 h-4" /> Cetak Thermal ({settings?.printer_width}mm)
                    </button>
                </div>

                {/* Thermal Vouchers List */}
                <div className={`bg-white shadow-2xl print:shadow-none w-full mt-24 print:mt-0 ${thermalWidthClass}`}>
                    {vouchers.map((v: any, index: number) => (
                        <div key={v.id} className={`p-6 text-[11px] leading-tight text-black text-center ${index !== vouchers.length - 1 ? 'border-b-2 border-dashed border-black print:break-after-page' : ''}`}>
                            <div className="mb-4 border-b border-black pb-4 border-dashed flex flex-col items-center justify-center">
                                <Wifi className="w-6 h-6 mb-2" />
                                <h1 className="text-sm font-black uppercase tracking-tighter">{brandName}</h1>
                                <p className="text-[9px] font-bold uppercase tracking-widest opacity-60">Hotspot Access Token</p>
                            </div>

                            <div className="flex justify-center mb-4">
                                <img src={getQrUrl(v.code, v.password)} alt="QR Login" className="w-24 h-24 border border-black p-1" />
                            </div>

                            <p className="text-[9px] font-black uppercase tracking-widest mb-2 opacity-40">User Login</p>
                            <div className="border-2 border-black p-3 mb-4 font-mono text-xl font-black tracking-widest uppercase bg-slate-50">
                                {v.code}
                            </div>
                            
                            <div className="flex justify-between border-b border-black border-dashed pb-2 mb-4 font-bold text-[10px]">
                                <span>PIN: {v.password}</span>
                                <span className="uppercase">{v.profile}</span>
                            </div>

                            <div className="flex justify-between items-center text-base font-black mt-2">
                                <span className="text-[10px] uppercase opacity-40">Price</span>
                                <span>Rp {parseInt(v.price).toLocaleString('id-ID')}</span>
                            </div>
                        </div>
                    ))}
                </div>

                <style jsx global>{`
                    @media print {
                        @page { margin: 0; size: auto; }
                        body, html { background: white !important; color: black !important; }
                        aside, header, nav, button, .glass { display: none !important; }
                    }
                `}</style>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 p-6 sm:p-12 print:p-0 print:bg-white overflow-x-hidden">
            {/* UI Header (Hidden on Print) */}
            <div className="max-w-6xl mx-auto mb-16 flex flex-col md:flex-row justify-between items-start md:items-center gap-8 print:hidden">
                <div>
                    <button onClick={() => window.history.back()} className="flex items-center gap-3 text-slate-500 hover:text-white transition-all font-bold uppercase tracking-widest text-[10px] mb-4">
                        <ArrowLeft className="w-4 h-4" /> Kembali
                    </button>
                    <h2 className="text-3xl font-black text-white tracking-tighter flex items-center gap-4">
                        <Printer className="text-accent w-8 h-8" />
                        Matriks Cetak Voucher <span className="text-slate-700">v4.1</span>
                    </h2>
                </div>
                <div className="flex items-center gap-6 glass p-4 rounded-3xl border border-white/5">
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Layout A4</span>
                        <span className="text-lg font-black text-white tracking-tighter">{vouchers.length} Unit</span>
                    </div>
                    <button onClick={handlePrint} className="flex items-center gap-3 bg-accent text-white px-10 py-4 rounded-2xl hover:bg-accent/90 transition-all shadow-2xl font-black uppercase tracking-widest text-[11px] active:scale-95">
                        <Printer className="w-5 h-5" /> Cetak Sekarang
                    </button>
                </div>
            </div>

            {/* Vouchers Grid */}
            <div className="voucher-container max-w-6xl mx-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 print:grid-cols-4 print:gap-0 print:max-w-none print:w-full">
                {vouchers.map((v: any) => (
                    <div key={v.id} className="voucher-card bg-white border border-white/10 rounded-4xl overflow-hidden shadow-2xl print:shadow-none print:border print:border-black print:rounded-none break-inside-avoid relative flex flex-col transition-all hover:scale-[1.02]">
                        {/* Voucher Header */}
                        <div className="bg-slate-950 p-4 text-center border-b border-white/10 print:bg-white print:border-black print:border-b-2">
                            <div className="flex items-center justify-between px-2">
                                <div className="flex items-center gap-2">
                                    <Wifi className="w-3 h-3 text-accent print:text-black" />
                                    <span className="text-[8px] font-black tracking-widest uppercase text-white print:text-black">{brandName}</span>
                                </div>
                                <span className="text-[8px] font-black text-accent tracking-widest uppercase print:text-black">{v.profile}</span>
                            </div>
                        </div>
                        
                        {/* Voucher Body */}
                        <div className="p-6 bg-white flex flex-col items-center">
                            <div className="mb-4">
                                <img src={getQrUrl(v.code, v.password)} alt="QR" className="w-24 h-24 border border-slate-100 p-1 rounded-xl print:border-black print:rounded-none" />
                            </div>

                            <div className="w-full text-center mb-4">
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 print:text-black">Login Code</p>
                                <div className="bg-slate-900 text-white rounded-xl py-3 border border-slate-800 print:bg-white print:text-black print:border-2 print:border-black print:rounded-none">
                                    <span className="text-xl font-black tracking-[0.2em] font-mono uppercase">{v.code}</span>
                                </div>
                            </div>
                            
                            <div className="w-full flex justify-between items-center px-1">
                                <div className="text-left">
                                    <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest print:text-black">PIN</p>
                                    <p className="text-xs font-black text-slate-800 font-mono">{v.password}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest print:text-black">Price</p>
                                    <p className="text-xs font-black text-slate-900 tracking-tighter">Rp {parseInt(v.price).toLocaleString('id-ID')}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <style jsx global>{`
                @media print {
                    /* Hide all UI elements */
                    aside, header, nav, button, .glass, [role="banner"], [role="navigation"] { display: none !important; }
                    
                    /* Global Print Reset */
                    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                    body, html, main, .min-h-screen { 
                        background: white !important; 
                        color: black !important; 
                        margin: 0 !important; 
                        padding: 0 !important; 
                        width: 100% !important;
                        height: auto !important;
                        display: block !important;
                    }

                    /* Grid Optimization for A4 */
                    .voucher-container {
                        display: grid !important;
                        grid-template-columns: repeat(4, 1fr) !important;
                        gap: 0 !important;
                        width: 100% !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        border-top: 1px solid black !important;
                        border-left: 1px solid black !important;
                    }

                    /* Card Optimization */
                    .voucher-card {
                        border-right: 1px solid black !important;
                        border-bottom: 1px solid black !important;
                        border-top: none !important;
                        border-left: none !important;
                        border-radius: 0 !important;
                        break-inside: avoid !important;
                        background: white !important;
                        height: auto !important;
                        min-height: 180px !important;
                    }

                    /* Text & Color Reset for Print */
                    .text-white, .text-accent { color: black !important; }
                    .bg-slate-950, .bg-slate-900, .bg-slate-800 { background: white !important; color: black !important; border-color: black !important; }
                    
                    /* Page Breaks */
                    @page {
                        margin: 0.5cm;
                        size: A4 portrait;
                    }
                }
            `}</style>
        </div>
    );
}
