// Email templates for Mentora
// Uses Resend (resend.com) — add RESEND_API_KEY to Vercel env vars

const FROM = "Mentora <hello@mentora.su>";

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailOptions): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[email] RESEND_API_KEY not set — skipping email to", to);
    return false;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: FROM, to, subject, html }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("[email] Resend error:", err);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[email] sendEmail failed:", err);
    return false;
  }
}

// ── Templates ────────────────────────────────────────────────

export function welcomeEmailHtml(email: string): string {
  return `<!DOCTYPE html>
<html lang="ru">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Добро пожаловать в Mentora</title></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

        <!-- Logo -->
        <tr><td align="center" style="padding-bottom:32px;">
          <table cellpadding="0" cellspacing="0"><tr>
            <td style="background:linear-gradient(135deg,#4f6ef7,#3b5bdb);border-radius:12px;width:44px;height:44px;text-align:center;vertical-align:middle;">
              <span style="color:white;font-size:26px;font-weight:800;line-height:44px;">M</span>
            </td>
            <td style="padding-left:10px;font-size:22px;font-weight:700;color:#111827;letter-spacing:-0.5px;">entora</td>
          </tr></table>
        </td></tr>

        <!-- Card -->
        <tr><td style="background:white;border-radius:20px;padding:40px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
          <h1 style="margin:0 0 12px;font-size:26px;font-weight:800;color:#111827;letter-spacing:-0.5px;">
            Добро пожаловать в Mentora! 🎉
          </h1>
          <p style="margin:0 0 20px;font-size:16px;color:#6b7280;line-height:1.6;">
            Привет! Ты только что создал аккаунт — теперь у тебя есть <strong>30 бесплатных сообщений в день</strong> с AI-ментором по истории.
          </p>
          <p style="margin:0 0 28px;font-size:16px;color:#6b7280;line-height:1.6;">
            Ментор знает твой уровень, подстраивается под твой стиль и объясняет историю живо — как умный друг, а не учебник.
          </p>

          <!-- CTA -->
          <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
            <tr><td style="background:#3b5bdb;border-radius:12px;">
              <a href="https://mentora.su/learn/russian-history" style="display:inline-block;padding:14px 28px;color:white;font-weight:600;font-size:15px;text-decoration:none;">
                Начать первый урок →
              </a>
            </td></tr>
          </table>

          <!-- Features -->
          <table cellpadding="0" cellspacing="0" width="100%" style="border-top:1px solid #f3f4f6;padding-top:24px;">
            <tr>
              <td style="padding:8px 12px 8px 0;font-size:14px;color:#374151;">📜 История России — 51 тема</td>
              <td style="padding:8px 0;font-size:14px;color:#374151;">⚡ XP и уровни</td>
            </tr>
            <tr>
              <td style="padding:8px 12px 8px 0;font-size:14px;color:#374151;">🌍 История мира — скоро</td>
              <td style="padding:8px 0;font-size:14px;color:#374151;">🎯 Под твой стиль обучения</td>
            </tr>
          </table>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding-top:24px;text-align:center;font-size:12px;color:#9ca3af;">
          © 2026 Mentora · <a href="https://mentora.su" style="color:#9ca3af;">mentora.su</a>
          <br>Ты получил это письмо, потому что зарегистрировался на mentora.su
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function reengagementEmailHtml(): string {
  return `<!DOCTYPE html>
<html lang="ru">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Давно не виделись!</title></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

        <!-- Logo -->
        <tr><td align="center" style="padding-bottom:32px;">
          <table cellpadding="0" cellspacing="0"><tr>
            <td style="background:linear-gradient(135deg,#4f6ef7,#3b5bdb);border-radius:12px;width:44px;height:44px;text-align:center;vertical-align:middle;">
              <span style="color:white;font-size:26px;font-weight:800;line-height:44px;">M</span>
            </td>
            <td style="padding-left:10px;font-size:22px;font-weight:700;color:#111827;letter-spacing:-0.5px;">entora</td>
          </tr></table>
        </td></tr>

        <!-- Card -->
        <tr><td style="background:white;border-radius:20px;padding:40px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
          <h1 style="margin:0 0 12px;font-size:26px;font-weight:800;color:#111827;letter-spacing:-0.5px;">
            Ментор скучает 👋
          </h1>
          <p style="margin:0 0 20px;font-size:16px;color:#6b7280;line-height:1.6;">
            Прошло несколько дней с твоего последнего урока. История не ждёт — каждый день можно узнать что-то новое за 10 минут.
          </p>
          <p style="margin:0 0 28px;font-size:16px;color:#6b7280;line-height:1.6;">
            Вернись и продолжи с того места, где остановился. Твои <strong>30 сообщений сегодня</strong> уже ждут.
          </p>

          <!-- CTA -->
          <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
            <tr><td style="background:#3b5bdb;border-radius:12px;">
              <a href="https://mentora.su/learn/russian-history" style="display:inline-block;padding:14px 28px;color:white;font-weight:600;font-size:15px;text-decoration:none;">
                Продолжить учиться →
              </a>
            </td></tr>
          </table>

          <p style="margin:0;font-size:13px;color:#9ca3af;">
            Или выбери тему из <a href="https://mentora.su/dashboard" style="color:#3b5bdb;">карты знаний</a> — 51 тема по истории России.
          </p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding-top:24px;text-align:center;font-size:12px;color:#9ca3af;">
          © 2026 Mentora · <a href="https://mentora.su" style="color:#9ca3af;">mentora.su</a>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
