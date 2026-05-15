import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * ЕГЭ-режим запускается осенью 2026 — этот endpoint собирает email/Telegram
 * желающих узнать первыми. Запись идёт в Supabase `ege_waitlist` и параллельно
 * админу через support-bot webhook (если настроен).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = typeof body.email === "string" ? body.email.trim().slice(0, 200) : "";
    const telegram = typeof body.telegram === "string" ? body.telegram.trim().slice(0, 64) : "";
    if (!email && !telegram) {
      return NextResponse.json({ error: "Нужен email или Telegram-ник" }, { status: 400 });
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Некорректный email" }, { status: 400 });
    }

    try {
      const cookieStore = await cookies();
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
      );
      await supabase.from("ege_waitlist").insert({
        email: email || null,
        telegram: telegram || null,
        source: "podgotovka-k-ege",
      });
    } catch {
      // table may not exist yet — non-fatal
    }

    const BOT_TOKEN = process.env.TELEGRAM_SUPPORT_BOT_TOKEN;
    const ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID;
    if (BOT_TOKEN && ADMIN_CHAT_ID) {
      const text = `🎓 <b>Новая запись в ЕГЭ wait-list</b>\n` +
        (email ? `📧 ${email}\n` : "") +
        (telegram ? `✈️ ${telegram}\n` : "") +
        `Источник: /podgotovka-k-ege`;
      fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: ADMIN_CHAT_ID, text, parse_mode: "HTML" }),
      }).catch(() => {});
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
