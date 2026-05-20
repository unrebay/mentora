/**
 * Resend transactional email — direct API (not Supabase SMTP).
 *
 * Why direct API and not Supabase: this is for OUR app-level emails
 * (welcome, billing receipts, mass announcements). Supabase SMTP is for
 * auth-flow emails only (confirm signup / magic link / reset). The two are
 * intentionally separate so we don't accidentally rate-limit auth behind
 * marketing sends.
 *
 * Auth: RESEND_API_KEY in env. Same Resend key as the one used for Supabase
 * SMTP password — works for both because the key has Sending access.
 *
 * Fire-and-forget pattern — callers should `.catch(() => {})` so a Resend
 * outage never breaks the primary user flow.
 */

const RESEND_API = "https://api.resend.com/emails";
const FROM = "Mentora <noreply@mentora.su>";

type SendOpts = {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
};

async function sendEmail(opts: SendOpts): Promise<{ ok: boolean; id?: string; error?: string }> {
  // Read RESEND2_API_KEY (Andy named this secret with "2" suffix to distinguish
  // from the Resend key used for Supabase auth SMTP — two separate keys, two
  // separate rotation cycles).
  const key = process.env.RESEND2_API_KEY;
  if (!key) {
    console.warn("[email] RESEND2_API_KEY missing — skipping send to", opts.to);
    return { ok: false, error: "missing_api_key" };
  }
  try {
    const res = await fetch(RESEND_API, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to: [opts.to],
        subject: opts.subject,
        html: opts.html,
        ...(opts.replyTo ? { reply_to: opts.replyTo } : {}),
      }),
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      console.error(`[email] Resend ${res.status} for ${opts.to}: ${txt.slice(0, 200)}`);
      return { ok: false, error: `resend_${res.status}` };
    }
    const data = (await res.json()) as { id?: string };
    return { ok: true, id: data.id };
  } catch (e) {
    console.error("[email] send failed", e);
    return { ok: false, error: "network" };
  }
}

/* ── Welcome email — fired after a successful signup. ──────────────────────
 *
 * Goal: confirm sign-up succeeded (no scary "we don't have your email"),
 * surface 3 concrete first-conversation ideas (reduce blank-page anxiety),
 * give a direct CTA back to /dashboard.
 *
 * Sender same as auth emails (noreply@mentora.su) → user inbox groups them.
 */
export async function sendWelcomeEmail(email: string): Promise<void> {
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <link href="https://fonts.googleapis.com/css2?family=Golos+Text:wght@400;700&family=Playfair+Display:ital,wght@1,700&display=swap" rel="stylesheet">
</head>
<body style="margin:0; padding:0; background:#f7f8fb; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;">
  <div style="max-width:520px; margin:0 auto; padding:48px 24px; text-align:center; color:#1a2340; line-height:1.6;">

    <div style="margin:0 auto 36px;">
      <img src="https://mentora.su/logo-white.png" alt="Mentora" width="200" style="display:block;margin:0 auto;width:200px;height:auto;background:#06060F;padding:22px 28px;border-radius:16px;">
    </div>

    <h1 style="font-size:24px; font-weight:700; margin:0 0 12px; color:#1a2340;">Добро пожаловать!</h1>
    <p style="margin:0 0 28px; color:#5a6478; font-size:15px;">
      Ты только что получил доступ к своему AI-ментору по 17 наукам. Можно сразу спрашивать о чём угодно.
    </p>

    <div style="background:#ffffff; border:1px solid #e5e9f0; border-radius:16px; padding:20px 24px; margin:0 0 28px; text-align:left;">
      <p style="margin:0 0 12px; font-size:13px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:#4561E8;">
        С чего начать
      </p>
      <ul style="margin:0; padding:0 0 0 18px; color:#1a2340; font-size:14px;">
        <li style="margin-bottom:8px;">«Объясни теорему Пифагора так, чтобы я запомнил навсегда»</li>
        <li style="margin-bottom:8px;">«Почему в 1941 году началась война именно тогда?»</li>
        <li style="margin-bottom:0;">«Что такое квант простыми словами?»</li>
      </ul>
    </div>

    <a href="https://mentora.su/dashboard"
       style="display:inline-block; background:linear-gradient(135deg,#5575FF 0%,#4561E8 50%,#6B4FF0 100%); color:#ffffff; text-decoration:none; padding:14px 36px; border-radius:999px; font-weight:600; font-size:15px;">
      Открыть Mentora
    </a>

    <p style="margin:36px 0 0; font-size:13px; color:#8a94a6;">
      Вопросы? Просто ответь на это письмо — мы читаем каждое.
    </p>
    <p style="margin:16px 0 0; font-size:11px; color:#b0b9c8;">
      © 2026 Mentora · <a href="https://mentora.su" style="color:#4561E8; text-decoration:none;">mentora.su</a>
    </p>

  </div>
</body>
</html>`;

  await sendEmail({
    to: email,
    subject: "Добро пожаловать в Mentora",
    html,
    replyTo: "hello@mentora.su",
  });
}
