import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

// Simple function to call Gemini AI (or any LLM)
async function getAIResponse(userMessage: string, context: any) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return "AI Key not configured.";

    const prompt = `
        Anda adalah AI Assistant untuk JARFI DUNIA WIFI (ISP Management).
        Tugas Anda adalah membantu admin atau pelanggan melalui Telegram dengan gaya bicara yang profesional namun ramah.
        Anda mengerti konteks sistem saat ini.
        
        DATA SISTEM SAAT INI:
        - Total Pelanggan: ${context.totalCustomers}
        - Router Aktif: ${context.routerStats.length}
        - Router Offline: ${context.routerStats.filter((r: any) => r.error).length}
        - Total Pendapatan Estimasi: Rp ${context.expectedRevenue.toLocaleString('id-ID')}
        
        PERTANYAAN USER: "${userMessage}"
        
        Berikan jawaban yang relevan, singkat, dan informatif. Jika ditanya status jaringan, berikan ringkasan router mana yang bermasalah jika ada.
    `;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });
        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    } catch (e) {
        return "Maaf Bos, otak AI saya sedang loading. Coba lagi ya!";
    }
}

async function sendTelegramMessage(chatId: number, text: string) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) return;
    
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: chatId,
            text: text,
            parse_mode: 'Markdown'
        })
    });
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        
        // Telegram Webhook sends 'message' object
        if (!body.message) return NextResponse.json({ ok: true });

        const chatId = body.message.chat.id;
        const userText = body.message.text;

        if (!userText) return NextResponse.json({ ok: true });

        // 1. Fetch current system context for AI
        const statsRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/dashboard/stats`);
        const context = await statsRes.json();

        // 2. Get AI Understanding
        const aiResponse = await getAIResponse(userText, context);

        // 3. Send back to Telegram
        await sendTelegramMessage(chatId, aiResponse);

        return NextResponse.json({ ok: true });
    } catch (error: any) {
        console.error('Telegram Webhook Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
