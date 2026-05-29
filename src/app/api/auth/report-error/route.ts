import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Minimal dedup: ignore exact same (type+email+error) within 10 seconds
// to prevent double-fire on React StrictMode double-invocations.
const recentDedup = new Map<string, number>();
const DEDUP_MS = 10_000;

function isDuplicate(key: string): boolean {
  const last = recentDedup.get(key) ?? 0;
  if (Date.now() - last < DEDUP_MS) return true;
  recentDedup.set(key, Date.now());
  if (recentDedup.size > 500) {
    const cutoff = Date.now() - DEDUP_MS;
    for (const [k, v] of recentDedup) if (v < cutoff) recentDedup.delete(k);
  }
  return false;
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return "***@***";
  const masked = local.length <= 2
    ? "*".repeat(local.length)
    : local[0] + "*".repeat(local.length - 2) + local[local.length - 1];
  return `${masked}@${domain}`;
}

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

function logToAudit(type: string, safeEmail: string, errMsg: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return;
  const sb = createClient(url, key);
  sb.from("admin_audit_log").insert({
    admin_email: "system",
    action: `auth_error:${type}`,
    target: safeEmail,
    metadata: { error: errMsg.slice(0, 300), type, ts: new Date().toISOString() },
  }).then(null, () => {});
}

export async function POST(req: NextRequest) {
  try {
    const { type, email, error: errMsg } = await req.json().catch(() => ({}));

    if (typeof type !== "string" || typeof errMsg !== "string") {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const safeEmail = typeof email === "string" && email.includes("@")
      ? maskEmail(email)
      : "unknown";

    const key = `${type}:${typeof email === "string" ? email.toLowerCase() : ""}:${errMsg}`;
    if (isDuplicate(key)) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    // Persist to audit log (fire-and-forget)
    logToAudit(type, safeEmail, errMsg);

    const icons: Record<string, string> = {
      login_fail:          "🔐",
      password_reset_fail: "📧",
      oauth_fail:          "🔗",
    };
    const labels: Record<string, string> = {
      login_fail:          "Не удалось войти",
      password_reset_fail: "Сброс пароля не отправлен",
      oauth_fail:          "OAuth ошибка",
    };

    const icon  = icons[type]  ?? "⚠️";
    const label = labels[type] ?? type;
    const now = new Date().toLocaleString("ru-RU", { timeZone: "Europe/Moscow" });

    const text =
      `${icon} <b>${label}</b>\n` +
      `email: <code>${safeEmail}</code>\n` +
      `err: ${String(errMsg).slice(0, 200).replace(/</g, "&lt;")}\n` +
      `<i>${now} МСК</i>`;

    notifyAdmin(text);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
