'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Printer, ArrowLeft } from 'lucide-react';

export default function PrintInvoicePage() {
    const { id } = useParams();
    const [invoice, setInvoice] = useState<any>(null);
    const [settings, setSettings] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [invRes, setRes] = await Promise.all([
                    fetch(`/api/invoices/${id}`),
                    fetch('/api/settings')
                ]);
                
                const [invData, setData] = await Promise.all([
                    invRes.json(),
                    setRes.json()
                ]);

                if (invRes.ok) setInvoice(invData.invoice);
                if (setRes.ok) setSettings(setData.settings);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    if (loading) return <div className="p-10 text-center">Loading Invoice...</div>;
    if (!invoice) return <div className="p-10 text-center text-red-500">Invoice not found.</div>;

    const handlePrint = () => {
        window.print();
    };

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
                    <button onClick={handlePrint} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow hover:bg-indigo-700 flex items-center gap-2">
                        <Printer className="w-4 h-4" /> Cetak Thermal
                    </button>
                </div>

                {/* Thermal Layout */}
                <div className={`bg-white shadow-2xl print:shadow-none w-full ${thermalWidthClass} p-4 text-[11px] leading-tight text-black`}>
                    <div className="text-center mb-4 border-b border-black pb-4 border-dashed">
                        <h1 className="text-lg font-black uppercase mb-1">{settings?.company_name || 'JARFI'}</h1>
                        <p>{settings?.company_address || 'Alamat Perusahaan'}</p>
                        <p>WA: +62 {settings?.company_whatsapp || '-'}</p>
                    </div>

                    <div className="mb-4">
                        <div className="flex justify-between">
                            <span>No:</span>
                            <span>INV-{invoice.id.toString().padStart(6, '0')}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Tgl:</span>
                            <span>{new Date(invoice.created_at).toLocaleDateString('id-ID')}</span>
                        </div>
                        <div className="flex justify-between mt-2">
                            <span>Plg:</span>
                            <span className="font-bold">{invoice.customer_name}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>ID:</span>
                            <span>{invoice.pppoe_username}</span>
                        </div>
                    </div>

                    <div className="border-t border-b border-black border-dashed py-2 mb-4">
                        <div className="flex justify-between font-bold mb-1">
                            <span>Item</span>
                            <span>Harga</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="w-2/3 truncate">Paket {invoice.package_name || 'Internet'} ({invoice.billing_month})</span>
                            <span>{parseInt(invoice.amount).toLocaleString('id-ID')}</span>
                        </div>
                    </div>

                    <div className="mb-4 space-y-1">
                        <div className="flex justify-between">
                            <span>Subtotal</span>
                            <span>{parseInt(invoice.amount).toLocaleString('id-ID')}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>PPN ({settings?.tax_enabled === '1' ? '11%' : '0%'})</span>
                            <span>{settings?.tax_enabled === '1' ? Math.round(parseInt(invoice.amount) / 1.11 * 0.11).toLocaleString('id-ID') : '0'}</span>
                        </div>
                        <div className="flex justify-between text-sm font-black pt-2 border-t border-black border-dashed mt-2">
                            <span>TOTAL</span>
                            <span>Rp {parseInt(invoice.amount).toLocaleString('id-ID')}</span>
                        </div>
                    </div>

                    <div className="text-center mt-6">
                        <p className="font-bold text-sm uppercase mb-1">
                            {invoice.status === 'PAID' ? '- L U N A S -' : '- B E L U M  L U N A S -'}
                        </p>
                        {invoice.status === 'PAID' && invoice.paid_at && (
                            <p className="text-[9px] mb-4">Tgl Bayar: {new Date(invoice.paid_at).toLocaleString('id-ID')}</p>
                        )}
                        {!invoice.status || invoice.status !== 'PAID' && (
                            <div className="text-left mt-4 border border-black p-2 rounded">
                                <p className="font-bold text-[10px] mb-1">Transfer Pembayaran:</p>
                                <p>{settings?.bank_name || 'BCA'} - {settings?.bank_account || '-'}</p>
                                <p>A/N: {settings?.bank_holder || settings?.company_name || '-'}</p>
                            </div>
                        )}
                    </div>

                    <div className="text-center mt-6 text-[10px]">
                        <p>Terima Kasih</p>
                        <p className="font-bold">{settings?.company_name || 'JARFI'}</p>
                    </div>
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
        <div className="min-h-screen bg-slate-50 p-4 sm:p-8 font-sans text-slate-900">
            {/* Header Controls (Hidden during print) */}
            <div className="max-w-4xl mx-auto mb-8 flex justify-between items-center print:hidden">
                <button 
                    onClick={() => window.history.back()}
                    className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" /> Kembali
                </button>
                <div className="flex gap-3">
                    <button 
                        onClick={handlePrint}
                        className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-all shadow-lg"
                    >
                        <Printer className="w-4 h-4" /> Cetak Invoice (A4)
                    </button>
                </div>
            </div>

            {/* Invoice Layout */}
            <div className="max-w-4xl mx-auto bg-white shadow-2xl rounded-3xl overflow-hidden print:shadow-none print:rounded-none">
                <div className="p-8 sm:p-12">
                    {/* Invoice Header */}
                    <div className="flex flex-col sm:flex-row justify-between items-start mb-12 gap-8">
                        <div>
                            <h1 className="text-4xl font-black text-indigo-600 tracking-tight mb-2 uppercase">{settings?.company_name || 'JARFI'}</h1>
                            <p className="text-slate-500 font-medium">Layanan Internet Cepat & Stabil</p>
                            <div className="mt-4 text-sm text-slate-500 space-y-1">
                                <p className="whitespace-pre-line">{settings?.company_address || 'Alamat Perusahaan'}</p>
                                <p>WhatsApp: +62 {settings?.company_whatsapp || '-'}</p>
                                <p>Email: {settings?.company_email || '-'}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <h2 className="text-2xl font-bold text-slate-900 uppercase tracking-widest mb-1">INVOICE</h2>
                            <p className="text-slate-500 font-mono text-sm mb-4">#{invoice.id.toString().padStart(6, '0')}</p>
                            
                            <div className="space-y-1 text-sm">
                                <p className="text-slate-400">Tanggal Tagihan</p>
                                <p className="font-bold text-slate-900">{new Date(invoice.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-12 mb-12 border-t border-slate-100 pt-8">
                        <div>
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Ditujukan Untuk</h3>
                            <p className="text-lg font-bold text-slate-900">{invoice.customer_name}</p>
                            <p className="text-slate-500 mb-1">{invoice.pppoe_username}</p>
                            <p className="text-slate-500 mb-1">{invoice.customer_phone || '-'}</p>
                            <p className="text-slate-500">{invoice.customer_email || '-'}</p>
                        </div>
                        <div className="sm:text-right">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Status Pembayaran</h3>
                            <div className="inline-block">
                                <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border ${invoice.status === 'PAID' ? 'bg-teal-50 text-teal-600 border-teal-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                                    {invoice.status === 'PAID' ? 'LUNAS' : 'BELUM DIBAYAR'}
                                </span>
                            </div>
                            {invoice.paid_at && (
                                <p className="text-xs text-slate-400 mt-2 italic">
                                    Dibayar pada: {new Date(invoice.paid_at).toLocaleString('id-ID')}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Table */}
                    <div className="mb-12">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b-2 border-slate-900">
                                    <th className="py-4 font-bold text-slate-900 uppercase text-xs tracking-wider">Deskripsi Layanan</th>
                                    <th className="py-4 font-bold text-slate-900 uppercase text-xs tracking-wider text-center">Periode</th>
                                    <th className="py-4 font-bold text-slate-900 uppercase text-xs tracking-wider text-right">Harga</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                <tr>
                                    <td className="py-6">
                                        <p className="font-bold text-slate-900">Paket Internet: {invoice.package_name || 'Standar'}</p>
                                        <p className="text-sm text-slate-500 mt-1">Bandwidth Up To {invoice.bandwidth_limit || '10Mbps'}</p>
                                    </td>
                                    <td className="py-6 text-center text-slate-700">{invoice.billing_month}</td>
                                    <td className="py-6 text-right font-bold text-slate-900">Rp {parseInt(invoice.amount).toLocaleString('id-ID')}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Footer Totals */}
                    <div className="flex justify-end border-t-2 border-slate-900 pt-8">
                        <div className="w-full sm:w-1/2 space-y-4">
                            <div className="flex justify-between text-slate-500 font-medium">
                                <span>Subtotal</span>
                                <span>Rp {parseInt(invoice.amount).toLocaleString('id-ID')}</span>
                            </div>
                             <div className="flex justify-between text-slate-500 font-medium">
                                <span>Pajak (PPN {settings?.tax_enabled === '1' ? '11%' : '0%'})</span>
                                <span>Rp {settings?.tax_enabled === '1' ? Math.round(parseInt(invoice.amount) / 1.11 * 0.11).toLocaleString('id-ID') : '0'}</span>
                            </div>
                            <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                                <span className="text-lg font-bold text-slate-900 uppercase">Total Tagihan</span>
                                <span className="text-3xl font-black text-indigo-600">Rp {parseInt(invoice.amount).toLocaleString('id-ID')}</span>
                            </div>
                        </div>
                    </div>

                    {/* Payment Info */}
                    <div className="mt-16 p-8 bg-slate-50 rounded-2xl border border-slate-100 text-sm">
                        <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                             Metode Pembayaran
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                            <div>
                                <p className="font-bold text-slate-700 mb-1">Transfer Bank ({settings?.bank_name || 'BCA'})</p>
                                <p className="text-slate-600">No. Rekening: {settings?.bank_account || '-'}</p>
                                <p className="text-slate-600">A/N: {settings?.bank_holder || settings?.company_name || '-'}</p>
                            </div>
                            <div>
                                <p className="font-bold text-slate-700 mb-1">Penting</p>
                                <p className="text-slate-500 italic leading-relaxed">
                                    Mohon sertakan Nomor Invoice dalam berita transfer. Pembayaran paling lambat tanggal 10 setiap bulannya.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-16 pt-8 border-t border-slate-100 text-center">
                        <p className="text-slate-400 text-sm">Terima kasih telah berlangganan layanan {settings?.company_name || 'JARFI'}.</p>
                        <p className="text-indigo-600 font-bold text-sm mt-1">{settings?.company_email ? `support@${settings.company_email.split('@')[1]}` : 'www.jarfi.com'}</p>
                    </div>
                </div>
            </div>
            
            <style jsx global>{`
                @media print {
                    /* Hide everything from the main layout */
                    aside, header, nav, button { display: none !important; }
                    
                    /* Reset background and padding of the main containers */
                    body, html, .min-h-screen { background: white !important; color: black !important; margin: 0 !important; padding: 0 !important; }
                    .flex.h-screen { display: block !important; height: auto !important; background: white !important; }
                    main { padding: 0 !important; margin: 0 !important; display: block !important; background: white !important; }
                    .glass { background: transparent !important; border: none !important; box-shadow: none !important; padding: 0 !important; margin: 0 !important; }
                    
                    /* Layout Invoice */
                    .min-h-screen { background: white !important; padding: 0 !important; }
                    .max-w-4xl { max-width: 100% !important; width: 100% !important; margin: 0 !important; }
                    .bg-white { border-radius: 0 !important; box-shadow: none !important; }
                    
                    /* Colors for Print */
                    .text-indigo-600 { color: #4f46e5 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    .bg-indigo-600 { background-color: #4f46e5 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    .bg-slate-50 { background-color: #f8fafc !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    .bg-teal-50 { background-color: #f0fdfa !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    .bg-red-50 { background-color: #fef2f2 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                }
            `}</style>
        </div>
    );
}
