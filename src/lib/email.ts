// Email templates for Mentora
// Uses Resend (resend.com) — add RESEND2_API_KEY to Vercel/runner env

const FROM = "Mentora <hello@mentora.su>";

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailOptions): Promise<boolean> {
  const apiKey = process.env.RESEND2_API_KEY;
  if (!apiKey) {
    console.warn("[email] RESEND2_API_KEY not set — skipping email to", to);
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

// ── Shared text logo (no image, no dark background) ──────────────────────────
const TEXT_LOGO = `
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:30px;font-weight:800;color:#111827;letter-spacing:-1px;line-height:1;">
    M<span style="color:#4561E8;">e</span>ntora<span style="font-size:17px;font-weight:600;color:#9ca3af;">.su</span>
  </div>`;

// ── Templates ────────────────────────────────────────────────

export function welcomeEmailHtml(email: string): string {
  void email; // reserved for future personalisation
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
          ${TEXT_LOGO}
        </td></tr>

        <!-- Card -->
        <tr><td style="background:white;border-radius:20px;padding:40px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">

          <p style="margin:0 0 6px;font-size:13px;font-weight:600;color:#4561E8;letter-spacing:0.05em;text-transform:uppercase;">
            Добро пожаловать
          </p>
          <h1 style="margin:0 0 16px;font-size:28px;font-weight:800;color:#111827;letter-spacing:-0.5px;line-height:1.2;">
            Ментор готов к работе
          </h1>
          <p style="margin:0 0 20px;font-size:16px;color:#6b7280;line-height:1.6;">
            Я — Mentora, твой персональный AI-ментор по 17 наукам. Я уже знаю твой стиль обучения и уровень — и готова объяснять так, как тебе удобно.
          </p>
          <p style="margin:0 0 28px;font-size:16px;color:#6b7280;line-height:1.6;">
            Тебе доступно <strong style="color:#111827;">10 бесплатных сообщений каждые 8 часов</strong>. Этого хватит, чтобы разобрать несколько тем — или задать все вопросы, которые давно копились.
          </p>

          <!-- CTA — centered -->
          <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:32px;">
            <tr><td align="center">
              <table cellpadding="0" cellspacing="0">
                <tr><td style="background:#4561E8;border-radius:12px;">
                  <a href="https://mentora.su/dashboard" style="display:inline-block;padding:14px 36px;color:white;font-weight:600;font-size:15px;text-decoration:none;letter-spacing:-0.2px;">
                    Начать первый урок &rarr;
                  </a>
                </td></tr>
              </table>
            </td></tr>
          </table>

          <!-- Divider -->
          <div style="border-top:1px solid #f3f4f6;margin-bottom:24px;"></div>

          <!-- Feature list -->
          <p style="margin:0 0 16px;font-size:13px;font-weight:600;color:#374151;text-transform:uppercase;letter-spacing:0.05em;">Что уже доступно</p>
          <table cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td style="padding:6px 12px 6px 0;font-size:14px;color:#374151;vertical-align:top;">
                <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#4561E8;margin-right:8px;vertical-align:middle;"></span>17 наук в одном чате
              </td>
              <td style="padding:6px 0;font-size:14px;color:#374151;vertical-align:top;">
                <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#10B981;margin-right:8px;vertical-align:middle;"></span>XP и уровни прогресса
              </td>
            </tr>
            <tr>
              <td style="padding:6px 12px 6px 0;font-size:14px;color:#374151;vertical-align:top;">
                <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#6366F1;margin-right:8px;vertical-align:middle;"></span>Галактика знаний
              </td>
              <td style="padding:6px 0;font-size:14px;color:#374151;vertical-align:top;">
                <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#FF7A00;margin-right:8px;vertical-align:middle;"></span>Стиль под тебя
              </td>
            </tr>
          </table>

          <!-- PS -->
          <p style="margin:24px 0 0;font-size:13px;color:#9ca3af;line-height:1.5;">
            Если будут вопросы — просто ответи на это письмо. Я читаю каждое.
          </p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding-top:24px;text-align:center;font-size:12px;color:#9ca3af;line-height:1.6;">
          &copy; 2026 Mentora &middot; <a href="https://mentora.su" style="color:#9ca3af;text-decoration:none;">mentora.su</a><br>
          Ты получил это письмо, потому что зарегистрировался на mentora.su
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
<title>Ментора ждёт</title></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

        <!-- Logo -->
        <tr><td align="center" style="padding-bottom:32px;">
          ${TEXT_LOGO}
        </td></tr>

        <!-- Card -->
        <tr><td style="background:white;border-radius:20px;padding:40px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
          <h1 style="margin:0 0 12px;font-size:26px;font-weight:800;color:#111827;letter-spacing:-0.5px;">
            Ментора ждёт
          </h1>
          <p style="margin:0 0 20px;font-size:16px;color:#6b7280;line-height:1.6;">
            Прошло несколько дней с твоего последнего урока. Каждый день можно узнать что-то новое за 10 минут.
          </p>
          <p style="margin:0 0 28px;font-size:16px;color:#6b7280;line-height:1.6;">
            Вернись и продолжи с того места, где остановился. <strong style="color:#111827;">10 сообщений каждые 8 часов</strong> уже ждут.
          </p>

          <!-- CTA — centered -->
          <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:28px;">
            <tr><td align="center">
              <table cellpadding="0" cellspacing="0">
                <tr><td style="background:#4561E8;border-radius:12px;">
                  <a href="https://mentora.su/dashboard" style="display:inline-block;padding:14px 28px;color:white;font-weight:600;font-size:15px;text-decoration:none;">
                    Продолжить учиться &rarr;
                  </a>
                </td></tr>
              </table>
            </td></tr>
          </table>

          <p style="margin:0;font-size:13px;color:#9ca3af;">
            Или выбери науку из <a href="https://mentora.su/dashboard" style="color:#4561E8;">галактики знаний</a> — математика, история, физика, английский и ещё 13 наук.
          </p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding-top:24px;text-align:center;font-size:12px;color:#9ca3af;">
          &copy; 2026 Mentora &middot; <a href="https://mentora.su" style="color:#9ca3af;">mentora.su</a>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
