import { pool } from './db';

export async function sendTelegramNotification(message: string) {
    try {
        const [rows]: any = await pool.query("SELECT * FROM Settings WHERE `key` IN ('telegram_enabled', 'telegram_bot_token', 'telegram_chat_id')");
        const settings: any = {};
        rows.forEach((row: any) => { settings[row.key] = row.value; });

        if (settings.telegram_enabled !== '1') return false;
        if (!settings.telegram_bot_token || !settings.telegram_chat_id) return false;

        const response = await fetch(`https://api.telegram.org/bot${settings.telegram_bot_token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: settings.telegram_chat_id,
                text: message,
                parse_mode: 'Markdown'
            })
        });

        return response.ok;
    } catch (e) {
        console.error("Telegram Notification Error:", e);
        return false;
    }
}
