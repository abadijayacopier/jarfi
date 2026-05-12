'use client';

import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';

const CURRENT_VERSION = '4.2.0';
const GITHUB_REPO = 'abadijayacopier/jarfi';

export default function UpdateChecker() {
    const [checking, setChecking] = useState(false);
    const [latestUpdateInfo, setLatestUpdateInfo] = useState<any>(null);

    const showUpdateModal = (data: any) => {
        Swal.fire({
            title: '<div class="flex items-center gap-3 justify-center mb-2"><div class="p-3 bg-emerald-500/20 rounded-2xl text-emerald-400"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14.5L12 3v9h8L12 21v-9H4z"/></svg></div> Update Tersedia!</div>',
            html: `
                <div class="text-center space-y-4">
                    <p class="text-slate-400 text-sm">Versi baru <span class="text-emerald-400 font-bold">${data.tag_name}</span> telah dirilis.</p>
                    <div class="bg-slate-900/50 p-4 rounded-2xl border border-white/5 text-left">
                        <p class="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Apa yang baru:</p>
                        <div class="text-[11px] text-slate-300 leading-relaxed max-h-32 overflow-y-auto no-scrollbar">
                            ${(data.body || 'Perbaikan dan peningkatan.').replace(/\n/g, '<br/>')}
                        </div>
                    </div>
                </div>
            `,
            background: '#0f172a',
            color: '#fff',
            showCancelButton: true,
            confirmButtonText: 'Unduh Sekarang',
            cancelButtonText: 'Nanti Saja',
            confirmButtonColor: '#10b981',
            cancelButtonColor: 'rgba(255,255,255,0.05)',
            customClass: {
                popup: 'rounded-4xl border border-white/10 backdrop-blur-3xl shadow-2xl',
                confirmButton: 'rounded-2xl px-8 py-4 font-bold uppercase tracking-widest text-[11px] shadow-xl shadow-emerald-500/20',
                cancelButton: 'rounded-2xl px-8 py-4 font-bold uppercase tracking-widest text-[11px]'
            }
        }).then((result) => {
            if (result.isConfirmed) {
                window.open(data.html_url || `https://github.com/${GITHUB_REPO}/releases/latest`, '_blank');
            }
        });
    };

    useEffect(() => {
        const isElectron = typeof window !== 'undefined' && !!(window as any).electronAPI;

        const handleManualTrigger = () => {
            if (latestUpdateInfo) showUpdateModal(latestUpdateInfo);
        };
        window.addEventListener('show-update-modal', handleManualTrigger);

        if (isElectron) {
            const api = (window as any).electronAPI;
            api.onUpdateAvailable((info: any) => {
                setLatestUpdateInfo({ tag_name: `v${info.version}`, body: 'Pembaruan otomatis sistem.' });
                window.dispatchEvent(new CustomEvent('update-available'));
                
                Swal.fire({
                    title: '<div class="flex items-center gap-3 justify-center mb-2"><div class="p-3 bg-emerald-500/20 rounded-2xl text-emerald-400"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14.5L12 3v9h8L12 21v-9H4z"/></svg></div> Update Tersedia!</div>',
                    html: `
                        <div class="text-center space-y-3">
                            <p class="text-slate-400 text-sm">Versi baru <span class="text-emerald-400 font-bold">v${info.version}</span> sedang diunduh secara otomatis...</p>
                            <div class="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                                <div id="swal-progress-bar" class="bg-emerald-500 h-full rounded-full transition-all duration-300" style="width: 0%"></div>
                            </div>
                            <p id="swal-progress-text" class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Memulai unduhan...</p>
                        </div>
                    `,
                    background: '#0f172a',
                    color: '#fff',
                    showConfirmButton: false,
                    allowOutsideClick: false,
                    customClass: { popup: 'rounded-4xl border border-white/10 backdrop-blur-3xl shadow-2xl' }
                });
            });

            api.onUpdateProgress((progress: any) => {
                const bar = document.getElementById('swal-progress-bar');
                const text = document.getElementById('swal-progress-text');
                if (bar) bar.style.width = `${Math.round(progress.percent)}%`;
                if (text) text.textContent = `Mengunduh: ${Math.round(progress.percent)}%`;
            });

            api.onUpdateDownloaded((info: any) => {
                Swal.fire({
                    title: '<div class="flex items-center gap-3 justify-center mb-2"><div class="p-3 bg-emerald-500/20 rounded-2xl text-emerald-400"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14.5L12 3v9h8L12 21v-9H4z"/></svg></div> Update Siap!</div>',
                    html: `
                        <div class="text-center space-y-3">
                            <p class="text-slate-400 text-sm">Versi <span class="text-emerald-400 font-bold">v${info.version}</span> telah diunduh.</p>
                            <p class="text-slate-500 text-xs">Restart sekarang untuk menerapkan update?</p>
                        </div>
                    `,
                    background: '#0f172a',
                    color: '#fff',
                    showCancelButton: true,
                    confirmButtonText: 'Restart Sekarang',
                    cancelButtonText: 'Nanti Saja',
                    confirmButtonColor: '#10b981',
                    cancelButtonColor: 'rgba(255,255,255,0.05)',
                    customClass: {
                        popup: 'rounded-4xl border border-white/10 backdrop-blur-3xl shadow-2xl',
                        confirmButton: 'rounded-2xl px-8 py-4 font-bold uppercase tracking-widest text-[11px] shadow-xl shadow-emerald-500/20',
                        cancelButton: 'rounded-2xl px-8 py-4 font-bold uppercase tracking-widest text-[11px]'
                    }
                }).then((result) => {
                    if (result.isConfirmed) api.restartApp();
                });
            });

        } else {
            const checkUpdate = async () => {
                if (checking) return;
                setChecking(true);
                try {
                    const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`);
                    if (!response.ok) return;
                    const data = await response.json();
                    const latestVersion = data.tag_name.replace('v', '').split('-')[0];

                    if (latestVersion > CURRENT_VERSION) {
                        setLatestUpdateInfo(data);
                        window.dispatchEvent(new CustomEvent('update-available'));
                        showUpdateModal(data);
                    }
                } catch (error) {
                } finally {
                    setChecking(false);
                }
            };

            checkUpdate();
            const interval = setInterval(checkUpdate, 6 * 60 * 60 * 1000);
            return () => {
                clearInterval(interval);
                window.removeEventListener('show-update-modal', handleManualTrigger);
            };
        }
        return () => window.removeEventListener('show-update-modal', handleManualTrigger);
    }, [latestUpdateInfo]);

    return null;
}
