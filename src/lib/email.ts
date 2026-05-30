// Email templates for Mentora — all use the unified design standard (approved 2026-05-30)
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

// ── Shared design primitives ─────────────────────────────────────────────────
// Standard: Playfair Display logo + system fonts for body + #f2f2f7 background
// Approved by Andy on 2026-05-30

const FONT_LINK = `<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,700&display=swap" rel="stylesheet">`;

const LOGO_HTML = `<span style="font-family:'Playfair Display',Georgia,'Times New Roman',serif;font-size:26px;font-weight:700;font-style:normal;color:#1d1d1f;letter-spacing:-0.02em;line-height:1;">M<em style="color:#4561E8;font-family:'Playfair Display',Georgia,'Times New Roman',serif;font-weight:700;font-style:italic;">e</em>ntora</span>`;

const BODY_FONT = `-apple-system,BlinkMacSystemFont,'Helvetica Neue',Helvetica,Arial,sans-serif`;

function emailShell(cardContent: string): string {
  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  ${FONT_LINK}
</head>
<body style="margin:0;padding:0;background:#f2f2f7;font-family:${BODY_FONT};">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f2f2f7;padding:44px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:420px;">

        <tr><td align="center" style="padding-bottom:24px;">${LOGO_HTML}</td></tr>

        <tr><td style="background:#ffffff;border-radius:16px;padding:40px 36px 36px;box-shadow:0 1px 6px rgba(0,0,0,0.07);">
          ${cardContent}
        </td></tr>

        <tr><td align="center" style="padding-top:20px;">
          <span style="font-size:11px;color:#c7c7cc;letter-spacing:0.2px;">mentora.su</span>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ── Templates ────────────────────────────────────────────────

export function welcomeEmailHtml(_email: string): string {
  return emailShell(`
    <p style="margin:0 0 8px;font-size:19px;font-weight:600;color:#1c1c1e;line-height:1.3;letter-spacing:-0.3px;text-align:center;">
      Добро пожаловать!
    </p>
    <p style="margin:0 0 28px;font-size:14px;color:#8e8e93;line-height:1.6;text-align:center;">
      Твой AI-ментор по 17 наукам готов к работе.<br>
      Тебе доступно <strong style="color:#1c1c1e;">10 бесплатных сообщений каждые 8 часов</strong>.
    </p>

    <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:28px;">
      <tr><td align="center">
        <a href="https://mentora.su/dashboard"
          style="display:inline-block;background:#4561E8;color:#ffffff;text-decoration:none;font-family:${BODY_FONT};font-size:14px;font-weight:600;padding:12px 28px;border-radius:10px;letter-spacing:-0.1px;">
          Начать первый урок
        </a>
      </td></tr>
    </table>

    <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:20px;">
      <tr>
        <td style="font-size:13px;color:#8e8e93;padding:4px 8px 4px 0;">17 наук в одном чате</td>
        <td style="font-size:13px;color:#8e8e93;padding:4px 0;">XP и уровни прогресса</td>
      </tr>
      <tr>
        <td style="font-size:13px;color:#8e8e93;padding:4px 8px 4px 0;">Галактика знаний</td>
        <td style="font-size:13px;color:#8e8e93;padding:4px 0;">Стиль объяснений под тебя</td>
      </tr>
    </table>

    <p style="margin:0;font-size:12px;color:#c7c7cc;line-height:1.6;text-align:center;">
      Есть вопросы? Просто ответь на это письмо — мы читаем каждое.
    </p>
  `);
}

export function reengagementEmailHtml(): string {
  return emailShell(`
    <p style="margin:0 0 8px;font-size:19px;font-weight:600;color:#1c1c1e;line-height:1.3;letter-spacing:-0.3px;text-align:center;">
      Ментора ждёт
    </p>
    <p style="margin:0 0 28px;font-size:14px;color:#8e8e93;line-height:1.6;text-align:center;">
      Прошло несколько дней с твоего последнего урока.<br>
      <strong style="color:#1c1c1e;">10 сообщений каждые 8 часов</strong> уже ждут тебя.
    </p>

    <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:28px;">
      <tr><td align="center">
        <a href="https://mentora.su/dashboard"
          style="display:inline-block;background:#4561E8;color:#ffffff;text-decoration:none;font-family:${BODY_FONT};font-size:14px;font-weight:600;padding:12px 28px;border-radius:10px;letter-spacing:-0.1px;">
          Продолжить учиться
        </a>
      </td></tr>
    </table>

    <p style="margin:0;font-size:12px;color:#c7c7cc;line-height:1.6;text-align:center;">
      Математика, история, физика, английский и ещё 13 наук — в одном чате.
    </p>
  `);
}
