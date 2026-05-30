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

    const { data, error: genErr } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email,
    });

    if (genErr || !data?.properties?.hashed_token) {
      console.warn("[forgot-password] generateLink returned no token:", genErr?.message ?? "no hashed_token");
      return NextResponse.json({ ok: true });
    }

    const { hashed_token } = data.properties;
    const baseUrl    = (process.env.NEXT_PUBLIC_BASE_URL ?? "https://mentora.su").replace(/\/$/, "");
    const confirmUrl = `${baseUrl}/auth/confirm?token_hash=${encodeURIComponent(hashed_token)}&email=${encodeURIComponent(email)}&type=recovery`;

    const sent = await sendEmail({
      to: email,
      subject: "Сброс пароля — Mentora",
      html: buildResetEmail(confirmUrl),
    });

    const masked = email.replace(/^(.{2})(.*)(@.+)$/, (_, a, _b, c) => `${a}***${c}`);

    if (!sent) {
      console.error(`[forgot-password] sendEmail FAILED for ${masked}`);
      notifyAdmin(`🚨 <b>forgot-password</b>: sendEmail FAILED\nrecipient: <code>${masked}</code>\nCheck RESEND2_API_KEY on VPS`);
      return NextResponse.json({ ok: true });
    }

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
  const safeUrl = confirmUrl.replace(/&/g, "&amp;");
  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,700&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:#f2f2f7;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f2f2f7;padding:44px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:420px;">

        <!-- Logo — Playfair Display 700, italic blue e -->
        <tr><td align="center" style="padding-bottom:24px;">
          <span style="font-family:'Playfair Display',Georgia,'Times New Roman',serif;font-size:26px;font-weight:700;font-style:normal;color:#1d1d1f;letter-spacing:-0.02em;line-height:1;">M<span style="color:#4561E8;font-style:italic;">e</span>ntora</span>
        </td></tr>

        <!-- Card -->
        <tr><td style="background:#ffffff;border-radius:16px;padding:40px 36px 36px;box-shadow:0 1px 6px rgba(0,0,0,0.07);">

          <p style="margin:0 0 8px;font-size:19px;font-weight:600;color:#1c1c1e;line-height:1.3;letter-spacing:-0.3px;text-align:center;">
            Сброс пароля
          </p>
          <p style="margin:0 0 28px;font-size:14px;color:#8e8e93;line-height:1.6;text-align:center;">
            Нажми кнопку ниже, чтобы задать новый пароль.<br>Ссылка действительна 1 час.
          </p>

          <table cellpadding="0" cellspacing="0" width="100%">
            <tr><td align="center">
              <a href="${safeUrl}"
                style="display:inline-block;background:#4561E8;color:#ffffff;text-decoration:none;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:14px;font-weight:600;padding:12px 28px;border-radius:10px;letter-spacing:-0.1px;">
                Задать новый пароль
              </a>
            </td></tr>
          </table>

          <p style="margin:28px 0 0;font-size:12px;color:#c7c7cc;line-height:1.6;text-align:center;">
            Если ты не запрашивал(а) сброс — просто проигнорируй это письмо.
          </p>

        </td></tr>

        <!-- Footer -->
        <tr><td align="center" style="padding-top:20px;">
          <span style="font-size:11px;color:#c7c7cc;letter-spacing:0.2px;">mentora.su</span>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
