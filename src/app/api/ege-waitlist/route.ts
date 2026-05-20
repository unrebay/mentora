import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// In-memory rate limit (per-instance, best-effort).
const recentByIp = new Map<string, number[]>();
const WAITLIST_WINDOW_MS = 10 * 60 * 1000;
const WAITLIST_MAX_PER_WINDOW = 3;

function ipFromReq(req: NextRequest): string {
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  const xff = req.headers.get("x-forwarded-for")?.split(",").map((s) => s.trim()).filter(Boolean) ?? [];
  return xff[xff.length - 1] ?? "unknown";
}

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const arr = (recentByIp.get(ip) ?? []).filter((t) => now - t < WAITLIST_WINDOW_MS);
  if (arr.length >= WAITLIST_MAX_PER_WINDOW) { recentByIp.set(ip, arr); return true; }
  arr.push(now); recentByIp.set(ip, arr); return false;
}

/**
 * ЕГЭ-режим запускается осенью 2026 — этот endpoint собирает email/Telegram
 * желающих узнать первыми. Запись идёт в Supabase `ege_waitlist` и параллельно
 * админу через support-bot webhook (если настроен).
 */
export async function POST(req: NextRequest) {
  const ip = ipFromReq(req);
  if (rateLimited(ip)) {
    return NextResponse.json({ error: "Слишком много запросов. Попробуй через 10 минут." }, { status: 429 });
  }
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
      // Dedupe: ignore if same email or telegram already in waitlist (any source)
      if (email || telegram) {
        const query = supabase.from("ege_waitlist").select("id").limit(1);
        if (email && telegram) query.or(`email.eq.${email},telegram.eq.${telegram}`);
        else if (email) query.eq("email", email);
        else query.eq("telegram", telegram);
        const { data: existing } = await query;
        if (existing && existing.length > 0) {
          // Already registered — respond OK silently (don't leak existence)
          return NextResponse.json({ ok: true, already: true });
        }
      }
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
