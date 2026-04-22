'use client';

import { useState, useEffect } from 'react';
import { 
    Zap, Wifi, Signal, Globe, Server, 
    ArrowLeft, Search, RefreshCw, HardDrive, 
    Smartphone, User, Info, Activity, ShieldCheck
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function OLTDetailPage() {
    const { id } = useParams();
    const [olt, setOlt] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Mock data for ONUs
    const mockOnus = [
        { id: 1, name: 'Bpk. Ahmad (PPPoE: ahmad_01)', port: 'PON 1', model: 'HSGQ-E04', status: 'Online', dbm: -18.5, uptime: '12d 4h', mac: 'BC:62:0E:12:34:56' },
        { id: 2, name: 'Bpk. Budi (PPPoE: budi_fiber)', port: 'PON 1', model: 'ZTE-F609', status: 'Online', dbm: -21.2, uptime: '5d 2h', mac: 'BC:62:0E:12:34:57' },
        { id: 3, name: 'Ibu Citra (PPPoE: citra_net)', port: 'PON 2', model: 'Huawei-HG8245', status: 'Offline', dbm: 0, uptime: '0s', mac: 'BC:62:0E:12:34:58' },
        { id: 4, name: 'Cafe Sejahtera (Hotspot)', port: 'PON 3', model: 'HSGQ-E04', status: 'Online', dbm: -19.8, uptime: '30d 12h', mac: 'BC:62:0E:12:34:59' },
        { id: 5, name: 'Ruko Abadi (PPPoE: ruko_abadi)', port: 'PON 1', model: 'ZTE-F660', status: 'Online', dbm: -24.5, uptime: '1d 8h', mac: 'BC:62:0E:12:34:60' },
    ];

    useEffect(() => {
        fetch('/api/olts').then(res => res.json()).then(data => {
            const found = data.olts?.find((o: any) => o.id.toString() === id);
            setOlt(found);
            setLoading(false);
        });
    }, [id]);

    if (loading) return <div className="p-20 text-center animate-pulse uppercase font-black text-slate-500 tracking-widest">Loading OLT Engine...</div>;
    if (!olt) return <div className="p-20 text-center text-red-400 font-bold">OLT Not Found</div>;

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-6">
                    <Link href="/olts" className="p-4 bg-slate-900 rounded-2xl hover:bg-slate-800 text-slate-400 transition-all border border-white/5">
                        <ArrowLeft className="w-6 h-6" />
                    </Link>
                    <div>
                        <h2 className="text-3xl font-black text-white">{olt.name}</h2>
                        <div className="flex items-center gap-3 mt-1">
                            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 px-2 py-0.5 bg-indigo-500/10 rounded-md">{olt.type}</span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{olt.ip_address}</span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button className="px-6 py-3 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl font-bold hover:bg-indigo-500/20 transition-all flex items-center gap-2">
                        <RefreshCw className="w-4 h-4" /> Sync ONU
                    </button>
                    <button className="px-6 py-3 bg-emerald-500 text-white rounded-xl font-black uppercase tracking-widest text-xs shadow-xl shadow-emerald-500/20 hover:bg-emerald-400 transition-all">
                        Refresh All Stats
                    </button>
                </div>
            </div>

            {/* OLT System Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="glass p-6 rounded-3xl border border-white/10 relative overflow-hidden group">
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-3">PON Ports Status</p>
                    <div className="flex gap-2">
                        {[1, 2, 3, 4].map(p => (
                            <div key={p} className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black ${p === 4 ? 'bg-slate-800 text-slate-500' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}>
                                {p}
                            </div>
                        ))}
                    </div>
                </div>
                <div className="glass p-6 rounded-3xl border border-white/10">
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Total ONU Online</p>
                    <h4 className="text-3xl font-black text-white">24 <span className="text-sm text-slate-500 font-bold">/ 28</span></h4>
                </div>
                <div className="glass p-6 rounded-3xl border border-white/10">
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">CPU Load</p>
                    <div className="flex items-center gap-3">
                        <h4 className="text-3xl font-black text-white">12%</h4>
                        <div className="flex-1 bg-slate-900 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-indigo-500 h-full w-[12%]"></div>
                        </div>
                    </div>
                </div>
                <div className="glass p-6 rounded-3xl border border-white/10">
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">OLT Temperature</p>
                    <h4 className="text-3xl font-black text-orange-400">42°C</h4>
                </div>
            </div>

            {/* ONU List Section */}
            <div className="glass rounded-[2.5rem] border border-white/10 overflow-hidden shadow-3xl">
                <div className="p-8 border-b border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
                    <h3 className="text-xl font-black text-white flex items-center gap-3">
                        <Smartphone className="w-6 h-6 text-indigo-400" />
                        Connected ONU / ONT List
                    </h3>
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                        <input 
                            type="text" 
                            placeholder="Cari ONU (Nama/MAC)..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-900/50 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-indigo-500 transition-all text-sm"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-slate-950/30 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                                <th className="px-8 py-6 text-left">Customer / ONU Info</th>
                                <th className="px-8 py-6 text-left">Port / MAC</th>
                                <th className="px-8 py-6 text-left">Signal (dBm)</th>
                                <th className="px-8 py-6 text-left">Status / Uptime</th>
                                <th className="px-8 py-6 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {mockOnus.map((onu) => (
                                <tr key={onu.id} className="hover:bg-white/5 transition-colors group">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-indigo-400 border border-white/5">
                                                <User className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-white">{onu.name}</p>
                                                <p className="text-[10px] font-black uppercase text-slate-500">{onu.model}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="space-y-1">
                                            <p className="text-xs font-bold text-white">{onu.port}</p>
                                            <p className="text-[10px] font-mono text-slate-500">{onu.mac}</p>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-3">
                                            <div className="flex flex-col">
                                                <span className={`text-sm font-black ${onu.dbm === 0 ? 'text-slate-500' : onu.dbm < -25 ? 'text-red-400' : 'text-emerald-400'}`}>
                                                    {onu.dbm === 0 ? '-' : `${onu.dbm} dBm`}
                                                </span>
                                                <div className="flex gap-0.5 mt-1">
                                                    {[1, 2, 3, 4, 5].map(s => (
                                                        <div key={s} className={`w-1 h-3 rounded-full ${onu.dbm === 0 ? 'bg-slate-800' : s <= (onu.dbm > -20 ? 5 : onu.dbm > -25 ? 3 : 1) ? 'bg-emerald-500' : 'bg-slate-800'}`}></div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${onu.status === 'Online' ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`}></div>
                                                <span className={`text-xs font-black uppercase tracking-widest ${onu.status === 'Online' ? 'text-emerald-400' : 'text-red-400'}`}>{onu.status}</span>
                                            </div>
                                            <p className="text-[10px] text-slate-500 font-bold">{onu.status === 'Online' ? `UP: ${onu.uptime}` : 'Last Seen: 2h ago'}</p>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg hover:bg-indigo-500 hover:text-white transition-all">
                                                <Info className="w-4 h-4" />
                                            </button>
                                            <button className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition-all">
                                                <RefreshCw className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Help / Guide */}
            <div className="bg-indigo-500/5 border border-indigo-500/10 p-6 rounded-3xl flex items-start gap-4">
                <ShieldCheck className="w-6 h-6 text-indigo-400 shrink-0 mt-1" />
                <div>
                    <h5 className="text-white font-bold uppercase text-xs tracking-widest mb-1">Panduan Sinyal dBm</h5>
                    <p className="text-xs text-slate-500 leading-relaxed">
                        Sinyal ideal ONT berkisar antara <b>-15 dBm sampai -24 dBm</b>. Jika sinyal lebih dari <b>-27 dBm</b>, pelanggan mungkin mengalami koneksi lambat atau RTO. 
                        Warna hijau menunjukkan kualitas sinyal prima.
                    </p>
                </div>
            </div>
        </div>
    );
}
