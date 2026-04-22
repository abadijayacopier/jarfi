'use client';

import { useState, useEffect } from 'react';
import { Printer, ArrowLeft, Wifi } from 'lucide-react';

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

    if (loading) return <div className="p-10 text-center">Loading Vouchers...</div>;

    const isThermal = settings?.printer_type === 'thermal';
    const thermalWidthClass = settings?.printer_width === '58' ? 'max-w-[58mm]' : 'max-w-[80mm]';

    if (isThermal) {
        return (
            <div className="min-h-screen bg-slate-200 flex justify-center p-4 print:p-0 print:bg-white font-mono">
                {/* Header Controls (Hidden during print) */}
                <div className="absolute top-4 left-4 flex gap-2 print:hidden">
                    <button onClick={() => window.history.back()} className="bg-white px-4 py-2 rounded-lg text-sm font-bold shadow hover:bg-slate-50 flex items-center gap-2">
                        <ArrowLeft className="w-4 h-4" /> Kembali
                    </button>
                    <button onClick={handlePrint} className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow hover:bg-teal-700 flex items-center gap-2">
                        <Printer className="w-4 h-4" /> Cetak Thermal ({settings?.printer_width}mm)
                    </button>
                </div>

                {/* Thermal Vouchers List */}
                <div className={`bg-white shadow-2xl print:shadow-none w-full ${thermalWidthClass}`}>
                    {vouchers.map((v: any, index: number) => (
                        <div key={v.id} className={`p-4 text-[11px] leading-tight text-black text-center ${index !== vouchers.length - 1 ? 'border-b-2 border-dashed border-black print:break-after-page' : ''}`}>
                            <div className="mb-2 border-b border-black pb-2 border-dashed flex flex-col items-center justify-center">
                                <Wifi className="w-5 h-5 mb-1" />
                                <h1 className="text-sm font-black uppercase tracking-widest">{settings?.company_name || 'JARFI'} HOTSPOT</h1>
                            </div>

                            <p className="text-[10px] font-bold uppercase tracking-wider mb-1">Kode Voucher</p>
                            <div className="border-2 border-black p-2 mb-2 font-mono text-lg font-black tracking-widest uppercase">
                                {v.code}
                            </div>
                            
                            <div className="flex justify-between border-b border-black border-dashed pb-1 mb-2 font-bold">
                                <span>Pass: {v.password}</span>
                                <span>{v.profile}</span>
                            </div>

                            <div className="flex justify-between items-center text-sm font-black mt-2">
                                <span>Harga</span>
                                <span>Rp {parseInt(v.price).toLocaleString('id-ID')}</span>
                            </div>
                            
                            <div className="text-[9px] mt-4 font-bold">
                                <p>Gunakan sebelum kadaluarsa.</p>
                                <p>CS: {settings?.company_whatsapp || '-'}</p>
                            </div>
                        </div>
                    ))}
                    
                    {vouchers.length === 0 && (
                        <div className="p-8 text-center text-slate-500 font-bold">
                            Belum ada voucher untuk dicetak.
                        </div>
                    )}
                </div>

                <style jsx global>{`
                    @media print {
                        @page { margin: 0; size: auto; }
                        body, html { background: white !important; padding: 0 !important; margin: 0 !important; color: black !important; }
                        aside, header, nav, button { display: none !important; }
                        .min-h-screen { min-height: auto !important; }
                    }
                `}</style>
            </div>
        );
    }

    // A4 Layout
    return (
        <div className="min-h-screen bg-slate-100 p-4 sm:p-8">
            {/* Header Controls (Hidden during print) */}
            <div className="max-w-5xl mx-auto mb-8 flex justify-between items-center print:hidden">
                <button 
                    onClick={() => window.history.back()}
                    className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors font-bold"
                >
                    <ArrowLeft className="w-5 h-5" /> Kembali
                </button>
                <div className="flex items-center gap-4">
                    <span className="text-sm text-slate-500 font-medium">{vouchers.length} Voucher siap cetak</span>
                    <button 
                        onClick={handlePrint}
                        className="flex items-center gap-2 bg-teal-600 text-white px-6 py-3 rounded-xl hover:bg-teal-700 transition-all shadow-lg font-bold"
                    >
                        <Printer className="w-5 h-5" /> Cetak A4 Sekarang
                    </button>
                </div>
            </div>

            {/* Vouchers Grid */}
            <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {vouchers.map((v: any) => (
                    <div key={v.id} className="bg-white border-2 border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow break-inside-avoid relative">
                        {/* Voucher Header */}
                        <div className="bg-indigo-600 p-2 text-center">
                            <div className="flex items-center justify-center gap-1 text-white">
                                <Wifi className="w-3 h-3" />
                                <span className="text-[10px] font-black tracking-widest uppercase">{settings?.company_name || 'JARFI'} HOTSPOT</span>
                            </div>
                        </div>
                        
                        {/* Voucher Body */}
                        <div className="p-4 text-center">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-1">Kode Login</div>
                            <div className="bg-slate-50 rounded-lg py-2 border border-slate-100 mb-3">
                                <span className="text-xl font-black text-slate-900 tracking-widest font-mono uppercase">{v.code}</span>
                            </div>
                            
                            <div className="flex justify-between items-end">
                                <div className="text-left">
                                    <p className="text-[8px] font-bold text-slate-400 uppercase">Password</p>
                                    <p className="text-sm font-black text-slate-700 font-mono">{v.password}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[8px] font-bold text-slate-400 uppercase">Profil</p>
                                    <p className="text-[10px] font-black text-indigo-600 uppercase">{v.profile}</p>
                                </div>
                            </div>
                        </div>

                        {/* Voucher Footer */}
                        <div className="bg-slate-50 p-2 border-t border-slate-100 flex justify-between items-center">
                            <span className="text-[10px] font-black text-slate-800">Rp {parseInt(v.price).toLocaleString('id-ID')}</span>
                            <span className="text-[8px] font-bold text-slate-400">{settings?.company_email ? `www.${settings.company_email.split('@')[1]}` : 'www.jarfi.com'}</span>
                        </div>
                        
                        {/* Cut lines for printer (subtle) */}
                        <div className="absolute -top-1 -left-1 w-2 h-2 border-t border-l border-slate-300 print:hidden"></div>
                        <div className="absolute -top-1 -right-1 w-2 h-2 border-t border-r border-slate-300 print:hidden"></div>
                        <div className="absolute -bottom-1 -left-1 w-2 h-2 border-b border-l border-slate-300 print:hidden"></div>
                        <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b border-r border-slate-300 print:hidden"></div>
                    </div>
                ))}
            </div>

            {vouchers.length === 0 && (
                <div className="max-w-5xl mx-auto bg-white p-20 rounded-3xl text-center border-2 border-dashed border-slate-200">
                    <Wifi className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                    <p className="text-slate-400 font-bold text-lg">Belum ada voucher untuk dicetak.</p>
                </div>
            )}

            <style jsx global>{`
                @media print {
                    /* Hide everything from the main layout */
                    aside, header, nav, button { display: none !important; }
                    
                    /* Reset background and padding of the main containers */
                    body, html, .min-h-screen { background: white !important; color: black !important; margin: 0 !important; padding: 0 !important; }
                    .flex.h-screen { display: block !important; height: auto !important; background: white !important; }
                    main { padding: 0 !important; margin: 0 !important; display: block !important; background: white !important; }
                    .glass { background: transparent !important; border: none !important; box-shadow: none !important; padding: 0 !important; margin: 0 !important; }
                    
                    /* Layout Vouchers */
                    .max-w-5xl { max-width: 100% !important; width: 100% !important; margin: 0 !important; padding: 0 !important; }
                    .grid { 
                        display: grid !important; 
                        grid-template-columns: repeat(4, 1fr) !important; 
                        gap: 0px !important; 
                        width: 100% !important;
                    }
                    
                    /* Voucher Cards */
                    .bg-white { 
                        border: 1px dashed #000 !important; 
                        border-radius: 0 !important; 
                        box-shadow: none !important; 
                        break-inside: avoid !important;
                        margin-bottom: -1px !important;
                        margin-right: -1px !important;
                    }
                    .bg-indigo-600 { background-color: #4f46e5 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    .bg-slate-50 { background-color: #f8fafc !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    .text-white { color: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                }
            `}</style>
        </div>
    );
}
