import { NextRequest, NextResponse } from "next/server";

// In-memory rate limit: max 1 notification per (email+type) per 5 minutes
// Keeps noisy "wrong password" spam out of the admin feed while still surfacing
// repeated failures that indicate a real problem.
const lastNotified = new Map<string, number>();
const NOTIFY_COOLDOWN_MS = 5 * 60 * 1000; // 5 min

function shouldNotify(key: string): boolean {
  const last = lastNotified.get(key) ?? 0;
  if (Date.now() - last > NOTIFY_COOLDOWN_MS) {
    lastNotified.set(key, Date.now());
    return true;
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

export async function POST(req: NextRequest) {
  try {
    const { type, email, error: errMsg } = await req.json().catch(() => ({}));

    if (typeof type !== "string" || typeof errMsg !== "string") {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const safeEmail = typeof email === "string" && email.includes("@")
      ? maskEmail(email)
      : "unknown";

    const key = `${type}:${typeof email === "string" ? email.toLowerCase() : ""}`;
    if (!shouldNotify(key)) {
      return NextResponse.json({ ok: true, skipped: true });
    }

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

    const text =
      `${icon} <b>${label}</b>\n` +
      `email: <code>${safeEmail}</code>\n` +
      `err: ${String(errMsg).slice(0, 200).replace(/</g, "&lt;")}`;

    notifyAdmin(text);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
