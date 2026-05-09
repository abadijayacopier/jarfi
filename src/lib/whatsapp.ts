export async function sendWhatsApp(to: string, message: string) {
    try {
        // Fetch WA Settings from DB
        const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/settings`);
        const data = await res.json();
        const token = data.settings?.wa_api_token;
        
        if (!token) {
            console.error('WhatsApp API Token not configured');
            return false;
        }

        // Using Fonnte API (Standard in ID)
        const response = await fetch('https://api.fonnte.com/send', {
            method: 'POST',
            headers: {
                'Authorization': token,
            },
            body: new URLSearchParams({
                'target': to,
                'message': message,
                'countryCode': '62', // Default to Indonesia
            })
        });

        const result = await response.json();
        return result.status === true;
    } catch (error) {
        console.error('WhatsApp Send Error:', error);
        return false;
    }
}
