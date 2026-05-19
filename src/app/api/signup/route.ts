import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { sendWelcomeEmail } from "@/lib/sendEmail";

/**
 * Server-side signup endpoint that bypasses Supabase captcha enforcement
 * AND establishes a session in the same request (no client roundtrip to
 * signInWithPassword needed — which would be blocked by Supabase captcha).
 *
 * Flow:
 *   1. admin.createUser({email_confirm:true}) → user exists, email already
 *      verified, no magic-link email sent
 *   2. admin.generateLink({type:"magiclink"}) → get hashed_token
 *   3. supabaseSSR.auth.verifyOtp({token_hash, type:"magiclink"}) → server
 *      sets session cookies on the response (same pattern as
 *      /api/auth/telegram). Captcha not in the way of admin-issued OTP.
 *
 * Returns: { ok: true, userId, next: "/onboarding" }
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// In-memory rate limit (per-instance — best-effort, not crypto-grade)
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
  const arr = (recentByIp.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (arr.length >= MAX_PER_WINDOW) {
    recentByIp.set(ip, arr);
    return true;
  }
  arr.push(now);
  recentByIp.set(ip, arr);
  return false;
}

// Best-effort admin notification on auth failures — fire-and-forget
function notifyAdmin(text: string) {
  const BOT_TOKEN = process.env.TELEGRAM_SUPPORT_BOT_TOKEN;
  const ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID;
  if (!BOT_TOKEN || !ADMIN_CHAT_ID) return;
  fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: ADMIN_CHAT_ID, text, parse_mode: "HTML" }),
  }).catch(() => {});
}

export async function POST(req: NextRequest) {
  const ip = ipFromReq(req);
  try {
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
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !serviceKey || !anonKey) {
      console.error("[signup] Supabase env missing", { hasUrl: !!url, hasService: !!serviceKey, hasAnon: !!anonKey });
      notifyAdmin(`🚨 <b>/api/signup</b> — Supabase env missing\nIP: ${ip}`);
      return NextResponse.json({ error: "Сервис временно недоступен" }, { status: 500 });
    }

    const admin = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // ── 1. Create user (admin bypass — no captcha) ─────────────────────────
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (createErr) {
      const msg = (createErr.message ?? "").toLowerCase();
      const isExisting = msg.includes("already registered") || msg.includes("already exists") || msg.includes("user already");
      if (isExisting) {
        // SECURITY: do NOT issue a session without password verification.
        // Surface as 409 so client switches user to sign-in mode.
        return NextResponse.json({ error: "Этот email уже зарегистрирован" }, { status: 409 });
      }
      console.error("[signup] createUser failed", { email, ip, err: createErr.message });
      notifyAdmin(`🚨 <b>/api/signup</b> createUser failed\nemail: ${email}\nerr: ${createErr.message}`);
      return NextResponse.json({ error: createErr.message || "Ошибка создания аккаунта" }, { status: 400 });
    }

    const userId = created?.user?.id;

    // Fire-and-forget welcome email. Не блокируем signup даже если Resend упал —
    // юзер всё равно попадёт в /onboarding. Письмо догонит если Resend живой.
    sendWelcomeEmail(email).catch((e) => console.warn("[signup] welcome email failed:", e));
    if (!userId) {
      console.error("[signup] createUser succeeded but no userId", { email, ip });
      notifyAdmin(`🚨 <b>/api/signup</b> created user without id\nemail: ${email}`);
      return NextResponse.json({ error: "Не удалось получить ID пользователя" }, { status: 500 });
    }

    // ── 2. Generate magic-link → extract hashed_token (admin path, no SMTP) ─
    const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
    });

    if (linkErr || !linkData?.properties?.hashed_token) {
      console.error("[signup] generateLink failed", { email, ip, err: linkErr?.message });
      notifyAdmin(`🚨 <b>/api/signup</b> generateLink failed\nemail: ${email}\nerr: ${linkErr?.message ?? "no token"}`);
      return NextResponse.json(
        { error: "Аккаунт создан, но войти не удалось. Открой страницу входа." },
        { status: 500 },
      );
    }

    // ── 3. Server-side verifyOtp → sets session cookies on the response ────
    const cookieStore = await cookies();
    const supabaseSSR = createServerClient(url, anonKey, {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (list: { name: string; value: string; options: CookieOptions }[]) =>
          list.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
      },
    });

    const { error: verifyError } = await supabaseSSR.auth.verifyOtp({
      token_hash: linkData.properties.hashed_token,
      type: "magiclink",
    });

    if (verifyError) {
      console.error("[signup] verifyOtp failed", {
        email, ip,
        name: verifyError.name,
        message: verifyError.message,
        status: verifyError.status,
        code: verifyError.code,
      });
      notifyAdmin(`🚨 <b>/api/signup</b> verifyOtp failed\nemail: ${email}\nerr: ${verifyError.message}`);
      return NextResponse.json(
        { error: `Сессия не создалась: ${verifyError.message}` },
        { status: 500 },
      );
    }

    // ── 4. Referral credit (non-critical) ──────────────────────────────────
    if (refCode && userId) {
      try {
        const refUrl = new URL("/api/referral", req.url);
        await fetch(refUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: refCode, newUserId: userId }),
        });
      } catch { /* non-critical */ }
    }

    // ── 5. Decide redirect target ─────────────────────────────────────────
    let next = "/onboarding";
    if (userId) {
      try {
        const { data: profile } = await supabaseSSR
          .from("users")
          .select("onboarding_completed")
          .eq("id", userId)
          .single();
        if (profile?.onboarding_completed) next = "/dashboard";
      } catch { /* default to /onboarding */ }
    }

    return NextResponse.json({ ok: true, userId, next });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[signup] uncaught", { ip, message });
    notifyAdmin(`🚨 <b>/api/signup</b> uncaught\nIP: ${ip}\nerr: ${message}`);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
