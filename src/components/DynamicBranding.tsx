'use client';

import { useEffect } from 'react';

export default function DynamicBranding() {
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch('/api/settings');
                const data = await res.json();
                if (data.settings) {
                    const { company_name, company_logo } = data.settings;
                    
                    // Update Title
                    if (company_name) {
                        document.title = `${company_name} | ISP Management`;
                    }
                    
                    // Update Favicon
                    if (company_logo) {
                        let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
                        if (!link) {
                            link = document.createElement('link');
                            link.rel = 'icon';
                            document.getElementsByTagName('head')[0].appendChild(link);
                        }
                        link.href = company_logo;
                    }
                }
            } catch (error) {
                console.error('Failed to load dynamic branding:', error);
            }
        };

        fetchSettings();
    }, []);

    return null;
}
