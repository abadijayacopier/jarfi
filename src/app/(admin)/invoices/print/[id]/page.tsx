'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Printer, Download, ArrowLeft } from 'lucide-react';

export default function PrintInvoicePage() {
    const { id } = useParams();
    const [invoice, setInvoice] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInvoice = async () => {
            try {
                const res = await fetch(`/api/invoices/${id}`);
                const data = await res.json();
                if (res.ok) setInvoice(data.invoice);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchInvoice();
    }, [id]);

    if (loading) return <div className="p-10 text-center">Loading Invoice...</div>;
    if (!invoice) return <div className="p-10 text-center text-red-500">Invoice not found.</div>;

    const handlePrint = () => {
        window.print();
    };

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
                        <Printer className="w-4 h-4" /> Cetak Invoice
                    </button>
                </div>
            </div>

            {/* Invoice Layout */}
            <div className="max-w-4xl mx-auto bg-white shadow-2xl rounded-3xl overflow-hidden print:shadow-none print:rounded-none">
                <div className="p-8 sm:p-12">
                    {/* Invoice Header */}
                    <div className="flex flex-col sm:flex-row justify-between items-start mb-12 gap-8">
                        <div>
                            <h1 className="text-4xl font-black text-indigo-600 tracking-tight mb-2">JARFI</h1>
                            <p className="text-slate-500 font-medium">Layanan Internet Cepat & Stabil</p>
                            <div className="mt-4 text-sm text-slate-500 space-y-1">
                                <p>Jl. Raya Utama No. 123</p>
                                <p>Kota Network, Indonesia 12345</p>
                                <p>Telp: (021) 1234-5678</p>
                                <p>Email: billing@jarfi.com</p>
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
                                <span>Pajak (0%)</span>
                                <span>Rp 0</span>
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
                                <p className="font-bold text-slate-700 mb-1">Transfer Bank (BCA)</p>
                                <p className="text-slate-600">No. Rekening: 1234567890</p>
                                <p className="text-slate-600">A/N: PT JARFI TEKNOLOGI</p>
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
                        <p className="text-slate-400 text-sm">Terima kasih telah berlangganan layanan JARFI.</p>
                        <p className="text-indigo-600 font-bold text-sm mt-1">www.jarfi.com</p>
                    </div>
                </div>
            </div>
            
            <style jsx global>{`
                @media print {
                    body { background: white !important; }
                    .min-h-screen { background: white !important; padding: 0 !important; }
                    .max-w-4xl { max-width: 100% !important; margin: 0 !important; }
                }
            `}</style>
        </div>
    );
}
