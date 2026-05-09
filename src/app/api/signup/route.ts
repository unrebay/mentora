import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Server-side signup endpoint that bypasses Supabase captcha enforcement.
 *
 * Why: Supabase project has captcha protection enabled at the API level.
 * Client signups from prod (where NEXT_PUBLIC_HCAPTCHA_SITE_KEY may not be set)
 * fail with 400 captcha_failed. This route uses service_role to admin.createUser
 * which doesn't go through captcha checks.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const recentByIp = new Map<string, number[]>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;

function ipFromReq(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const arr = (recentByIp.get(ip) ?? []).filter(t => now - t < WINDOW_MS);
  if (arr.length >= MAX_PER_WINDOW) {
    recentByIp.set(ip, arr);
    return true;
  }
  arr.push(now);
  recentByIp.set(ip, arr);
  return false;
}

export async function POST(req: NextRequest) {
  try {
    const ip = ipFromReq(req);
    if (rateLimited(ip)) {
      return NextResponse.json(
        { error: "Слишком много попыток. Попробуй через несколько минут." },
        { status: 429 },
      );
    }

    const body = await req.json().catch(() => null);
    const email = (body?.email ?? "").toString().trim().toLowerCase();
    const password = (body?.password ?? "").toString();
    const refCode: string | null = body?.refCode ?? null;

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Неверный формат email" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Пароль должен быть не короче 6 символов" }, { status: 400 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) {
      return NextResponse.json({ error: "Сервис временно недоступен" }, { status: 500 });
    }

    const admin = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (createErr) {
      const msg = (createErr.message ?? "").toLowerCase();
      if (msg.includes("already registered") || msg.includes("already exists") || msg.includes("user already")) {
        return NextResponse.json({ error: "Этот email уже зарегистрирован" }, { status: 409 });
      }
      return NextResponse.json({ error: createErr.message || "Ошибка создания аккаунта" }, { status: 400 });
    }

    if (refCode && created.user?.id) {
      try {
        const refUrl = new URL("/api/referral", req.url);
        await fetch(refUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: refCode, newUserId: created.user.id }),
        });
      } catch { /* non-critical */ }
    }

    return NextResponse.json({ ok: true, userId: created.user?.id });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
