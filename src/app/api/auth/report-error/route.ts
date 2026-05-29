import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { notifyAdmin, mskNow } from "@/lib/notifyAdmin";

// Minimal dedup: ignore exact same (type+email+error) within 10 seconds
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

    notifyAdmin(
      `${icon} <b>${label}</b>\n` +
      `email: <code>${safeEmail}</code>\n` +
      `err: ${String(errMsg).slice(0, 200).replace(/</g, "&lt;")}\n` +
      `<i>${mskNow()} МСК</i>`
    );
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
