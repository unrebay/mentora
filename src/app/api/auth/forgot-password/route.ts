import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    if (!serviceKey) {
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Generate recovery link via Admin API — completely bypasses Supabase email templates.
    // hashed_token = token_hash for verifyOtp({ token_hash, type: 'recovery' })
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email: email.trim().toLowerCase(),
    });

    if (error || !data?.properties?.hashed_token) {
      console.error("[forgot-password] generateLink error:", error?.message);
      // Don't reveal whether user exists — always return success
      return NextResponse.json({ ok: true });
    }

    const { hashed_token } = data.properties;
    const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL ?? "https://mentora.su").replace(/\/$/, "");
    const confirmUrl = `${baseUrl}/auth/confirm?token_hash=${encodeURIComponent(hashed_token)}&email=${encodeURIComponent(email)}&type=recovery`;

    await sendEmail({
      to: email,
      subject: "Сброс пароля Mentora",
      html: buildResetEmail(confirmUrl),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[forgot-password] unexpected error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

function buildResetEmail(confirmUrl: string): string {
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
            Мы получили запрос на сброс пароля для твоего аккаунта.<br>
            Нажми кнопку ниже, чтобы задать новый пароль.
          </p>

          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center" style="padding:4px 0 28px 0;">
              <a href="${confirmUrl}" style="display:inline-block;background:linear-gradient(135deg,#4561E8,#6B8FFF);color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 36px;border-radius:12px;">
                Задать новый пароль &#8594;
              </a>
            </td></tr>
          </table>

          <p style="margin:0 0 8px 0;font-size:13px;color:#9ca3af;">Кнопка не работает? Скопируй ссылку в браузер:</p>
          <p style="margin:0 0 24px 0;font-size:12px;color:#6b7280;word-break:break-all;background:#f9fafb;padding:10px 12px;border-radius:8px;border:1px solid #e5e7eb;">${confirmUrl}</p>

          <hr style="border:none;border-top:1px solid #f3f4f6;margin:0 0 20px 0;">
          <p style="margin:0;font-size:12px;color:#d1d5db;line-height:1.6;">
            Если ты не запрашивал(а) сброс пароля — просто проигнорируй это письмо. Ссылка действительна 1 час.
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
