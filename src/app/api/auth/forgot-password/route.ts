import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email";

/** Fire-and-forget Telegram notification for admin observability */
function notifyAdmin(text: string) {
  const BOT_TOKEN   = process.env.TELEGRAM_SUPPORT_BOT_TOKEN;
  const ADMIN_CHAT  = process.env.TELEGRAM_ADMIN_CHAT_ID;
  if (!BOT_TOKEN || !ADMIN_CHAT) return;
  fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: ADMIN_CHAT, text, parse_mode: "HTML" }),
  }).catch(() => {});
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const raw: unknown = body?.email;
    if (!raw || typeof raw !== "string") {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }
    const email = raw.trim().toLowerCase();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceKey) {
      console.error("[forgot-password] Missing SUPABASE env vars");
      notifyAdmin("🚨 <b>forgot-password</b>: Missing SUPABASE env vars");
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // ── 1. Generate recovery link via Admin API ───────────────────────────
    // Using admin.generateLink() — never calls Supabase email templates.
    // Returns hashed_token guaranteed non-empty (unlike {{ .TokenHash }} in templates).
    const { data, error: genErr } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email,
    });

    if (genErr || !data?.properties?.hashed_token) {
      // User may not exist — don't reveal; return success silently.
      console.warn("[forgot-password] generateLink returned no token:", genErr?.message ?? "no hashed_token");
      return NextResponse.json({ ok: true });
    }

    const { hashed_token } = data.properties;
    const baseUrl    = (process.env.NEXT_PUBLIC_BASE_URL ?? "https://mentora.su").replace(/\/$/, "");

    // Link goes directly to /auth/confirm — a "use client" page (JS-only).
    // Apple Mail pre-fetches ALL email links as plain HTTP GET → would burn
    // a Supabase /verify token in <1 s. Our page is JS-only so pre-fetch gets
    // only an HTML shell; token is never consumed until the user actually clicks
    // the "Set new password" button.
    const confirmUrl = `${baseUrl}/auth/confirm?token_hash=${encodeURIComponent(hashed_token)}&email=${encodeURIComponent(email)}&type=recovery`;

    // ── 2. Send email via Resend ──────────────────────────────────────────
    const sent = await sendEmail({
      to: email,
      subject: "Сброс пароля Mentora",
      html: buildResetEmail(confirmUrl),
    });

    // Mask email for Telegram log: andy_lighter@icloud.com → an***@icloud.com
    const masked = email.replace(/^(.{2})(.*)(@.+)$/, (_, a, _b, c) => `${a}***${c}`);

    if (!sent) {
      // Email delivery failed (RESEND2_API_KEY missing or Resend API error).
      // Log visibly so admin can investigate; still return ok to user (privacy).
      console.error(`[forgot-password] sendEmail FAILED for ${masked}`);
      notifyAdmin(`🚨 <b>forgot-password</b>: sendEmail FAILED\nrecipient: <code>${masked}</code>\nCheck RESEND2_API_KEY on VPS`);
      // Return ok so we don't reveal user existence via error pattern
      return NextResponse.json({ ok: true });
    }

    // All good — notify admin for observability during early launch
    notifyAdmin(`🔑 <b>Password reset</b> sent → <code>${masked}</code>`);

    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[forgot-password] unexpected error:", msg);
    notifyAdmin(`🚨 <b>forgot-password</b>: unexpected error\n${msg}`);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

function buildResetEmail(confirmUrl: string): string {
  // NOTE: & in href attributes should be &amp; per HTML spec.
  // Most email clients handle bare & correctly, but we use &amp; to be safe
  // and prevent any link-scanner / strict HTML parser from mangling the URL.
  const safeUrl = confirmUrl.replace(/&/g, "&amp;");
  return `<!DOCTYPE html>
<html lang="ru">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;">

        <tr><td style="padding:0 0 24px 0;text-align:center;">
          <span style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:28px;font-weight:500;color:#111827;letter-spacing:-0.5px;">
            M<span style="color:#4561E8;">e</span>ntora<span style="font-size:16px;font-weight:500;color:#9ca3af;">.su</span>
          </span>
        </td></tr>

        <tr><td style="background:#ffffff;border-radius:16px;padding:40px 36px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
          <p style="margin:0 0 8px 0;font-size:22px;font-weight:700;color:#111827;line-height:1.3;">Сброс пароля</p>
          <p style="margin:0 0 28px 0;font-size:15px;color:#6b7280;line-height:1.6;">
            Мы получили запрос на сброс пароля.<br>
            Нажми кнопку ниже, чтобы задать новый пароль.
          </p>

          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center" style="padding:4px 0 28px 0;">
              <a href="${safeUrl}" style="display:inline-block;background:linear-gradient(135deg,#4561E8,#6B8FFF);color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 36px;border-radius:12px;">
                Задать новый пароль &#8594;
              </a>
            </td></tr>
          </table>

          <p style="margin:0 0 8px 0;font-size:13px;color:#9ca3af;">Кнопка не работает? Скопируй ссылку:</p>
          <p style="margin:0 0 24px 0;font-size:12px;color:#6b7280;word-break:break-all;background:#f9fafb;padding:10px 12px;border-radius:8px;border:1px solid #e5e7eb;">${confirmUrl}</p>

          <hr style="border:none;border-top:1px solid #f3f4f6;margin:0 0 20px 0;">
          <p style="margin:0;font-size:12px;color:#d1d5db;line-height:1.6;">
            Если ты не запрашивал(а) сброс — просто проигнори это письмо. Ссылка действительна 1 час.
          </p>
        </td></tr>

        <tr><td style="padding:20px 0 0 0;text-align:center;">
          <p style="margin:0;font-size:12px;color:#9ca3af;">mentora.su — Персональный AI-ментор</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
