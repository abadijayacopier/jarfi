'use client';

import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { Download, RefreshCw, Zap } from 'lucide-react';

const CURRENT_VERSION = '4.1.0';
const GITHUB_REPO = 'abadijayacopier/jarfi';

export default function UpdateChecker() {
    const [checking, setChecking] = useState(false);

    useEffect(() => {
        const checkUpdate = async () => {
            if (checking) return;
            setChecking(true);

            try {
                const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`);
                if (!response.ok) return;

                const data = await response.json();
                const latestVersion = data.tag_name.replace('v', '').split('-')[0]; // Handle 'v4.1.0-NOC' -> '4.1.0'

                // Simple version comparison
                if (latestVersion > CURRENT_VERSION) {
                    Swal.fire({
                        title: '<div class="flex items-center gap-3 justify-center mb-2"><div class="p-3 bg-accent/20 rounded-2xl text-accent"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-zap"><path d="M4 14.5L12 3v9h8L12 21v-9H4z"/></svg></div> Update Tersedia!</div>',
                        html: `
                            <div class="text-center space-y-4">
                                <p class="text-slate-400 text-sm">Versi baru <span class="text-accent font-bold">v${data.tag_name}</span> telah dirilis oleh Supriyanto Developer.</p>
                                <div class="bg-slate-900/50 p-4 rounded-2xl border border-white/5 text-left">
                                    <p class="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Apa yang baru:</p>
                                    <div class="text-[11px] text-slate-300 leading-relaxed max-h-32 overflow-y-auto no-scrollbar">
                                        ${data.body.replace(/\n/g, '<br/>')}
                                    </div>
                                </div>
                            </div>
                        `,
                        background: '#0f172a',
                        color: '#fff',
                        showCancelButton: true,
                        confirmButtonText: 'Unduh Sekarang',
                        cancelButtonText: 'Nanti Saja',
                        confirmButtonColor: 'var(--accent)',
                        cancelButtonColor: 'rgba(255,255,255,0.05)',
                        customClass: {
                            popup: 'rounded-4xl border border-white/10 backdrop-blur-3xl shadow-2xl',
                            confirmButton: 'rounded-2xl px-8 py-4 font-bold uppercase tracking-widest text-[11px] shadow-xl shadow-accent/20',
                            cancelButton: 'rounded-2xl px-8 py-4 font-bold uppercase tracking-widest text-[11px]'
                        }
                    }).then((result) => {
                        if (result.isConfirmed) {
                            window.open(data.html_url, '_blank');
                        }
                    });
                }
            } catch (error) {
                console.error('Update check failed:', error);
            } finally {
                setChecking(false);
            }
        };

        // Check on mount and every 6 hours
        checkUpdate();
        const interval = setInterval(checkUpdate, 6 * 60 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    return null;
}
