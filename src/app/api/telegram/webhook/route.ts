import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { BOT_PLATFORM_KNOWLEDGE } from "@/lib/bot-knowledge";

const BOT_TOKEN     = process.env.TELEGRAM_SUPPORT_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN || "";
const ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID || "";

// Diagnostic counters — survive across requests in this Node process.
const stats = { received: 0, lastReceivedAt: 0 as number, lastFromId: 0, lastText: "" };
const anthropic     = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY ?? "",
  ...(process.env.ANTHROPIC_BASE_URL ? { baseURL: process.env.ANTHROPIC_BASE_URL } : {}),
  ...(process.env.VERCEL_BYPASS_SECRET ? { defaultHeaders: { "x-vercel-protection-bypass": process.env.VERCEL_BYPASS_SECRET } } : {}),
});

// ── In-memory conversation store (per Telegram user_id → last N messages)
// Works fine for serverless — history resets after cold start, but that's acceptable.
const MAX_HISTORY = 10; // сообщений в памяти на пользователя
const sessions = new Map<number, Array<{ role: "user" | "assistant"; content: string }>>();

// ── Support-code → user context cache. Populated when user sends their code (or via deep link). ──
//   Lookup happens server-side ONLY against the code the user themselves provided —
//   the user can never see another user's data.
interface UserContext {
  code: string;          // XXXXX-XXXXX
  plan: "free" | "pro" | "ultima";
  totalXP: number;
  streak: number;
  displayName: string | null;
  fetchedAt: number;     // ms timestamp
}
const userContexts = new Map<number, UserContext>();  // keyed by Telegram fromId
const USER_CONTEXT_TTL_MS = 30 * 60_000;              // 30 min — re-fetch after that

/** Parse support code XXXXX-XXXXX (10 hex chars with dash) from arbitrary text. */
function extractSupportCode(text: string): string | null {
  if (!text) return null;
  const m = text.match(/\b([0-9A-F]{5})-([0-9A-F]{5})\b/i);
  return m ? `${m[1].toUpperCase()}-${m[2].toUpperCase()}` : null;
}

/** Look up a user by their support code. Returns null if not found / Supabase env missing.
 *  Support code = first 10 hex chars of users.id (UUID without dashes). The UUID format
 *  is xxxxxxxx-xxxx-..., so the first 10 hex chars map to id::text LIKE '${first8}-${chars9_10}%'. */
async function lookupUserBySupportCode(code: string): Promise<UserContext | null> {
  const supabaseUrl    = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) return null;
  // Normalize: strip dash, uppercase
  const hex = code.replace(/-/g, "").toUpperCase();
  if (!/^[0-9A-F]{10}$/.test(hex)) return null;
  const idLike = `${hex.slice(0, 8).toLowerCase()}-${hex.slice(8, 10).toLowerCase()}%`;

  try {
    const sb = createSupabaseAdmin(supabaseUrl, serviceRoleKey);
    // Fetch user plan + display_name from users table
    const { data: userRow } = await sb
      .from("users")
      .select("id, plan, trial_expires_at, reward_plan, reward_expires_at, display_name")
      .ilike("id", idLike)
      .limit(1)
      .maybeSingle() as { data: { id: string; plan: string | null; trial_expires_at: string | null; reward_plan: string | null; reward_expires_at: string | null; display_name: string | null } | null };
    if (!userRow) return null;

    // Compute effective plan inline (avoid pulling client-only plan.ts)
    const now = new Date();
    const trialActive = userRow.trial_expires_at && new Date(userRow.trial_expires_at) > now;
    const rewardActive = userRow.reward_expires_at && new Date(userRow.reward_expires_at) > now;
    const PLAN_RANK: Record<string, number> = { free: 0, pro: 1, ultima: 2 };
    const candidates: string[] = [
      (userRow.plan ?? "free"),
      trialActive ? "pro" : null,
      rewardActive ? (userRow.reward_plan ?? null) : null,
    ].filter((x): x is string => !!x);
    const plan = (candidates.sort((a, b) => (PLAN_RANK[b] ?? 0) - (PLAN_RANK[a] ?? 0))[0] ?? "free") as "free" | "pro" | "ultima";

    // Pull XP/streak across all subjects
    const { data: progress } = await sb
      .from("user_progress")
      .select("xp_total, streak_days")
      .eq("user_id", userRow.id) as { data: Array<{ xp_total: number | null; streak_days: number | null }> | null };
    const totalXP = (progress ?? []).reduce((sum, r) => sum + (r.xp_total ?? 0), 0);
    const streak  = (progress ?? []).reduce((m, r) => Math.max(m, r.streak_days ?? 0), 0);

    return {
      code,
      plan,
      totalXP,
      streak,
      displayName: userRow.display_name,
      fetchedAt: Date.now(),
    };
  } catch (err) {
    console.error("[telegram] lookupUserBySupportCode error:", err);
    return null;
  }
}

/** Get cached context, re-fetching if expired or missing. */
async function refreshUserContext(fromId: number, code: string): Promise<UserContext | null> {
  const cached = userContexts.get(fromId);
  if (cached && cached.code === code && Date.now() - cached.fetchedAt < USER_CONTEXT_TTL_MS) {
    return cached;
  }
  const ctx = await lookupUserBySupportCode(code);
  if (ctx) userContexts.set(fromId, ctx);
  return ctx;
}

// ── Telegram API helpers ────────────────────────────────────────────────────

/** Convert common Markdown-isms to Telegram HTML. Run BEFORE sending.
 *  Handles: **bold**, __bold__ (sometimes), *italic*, _italic_, `code`, ```pre```
 *  Also strips markdown headers (# ##) since Telegram has no h-tags. */
function markdownToTelegramHtml(text: string): string {
  let s = text;

  // STEP 1: Strip any raw HTML <a>/<a/> the LLM emitted — we never trust raw HTML
  // from the model output. Pattern: <a ...>...</a> → keep inner text only.
  // Also strip stray open or close <a> tags without a partner.
  s = s.replace(/<a\b[^>]*>([\s\S]*?)<\/a>/gi, "$1");
  s = s.replace(/<\/?a\b[^>]*>/gi, "");

  // STEP 2: Code fence (```) → <pre>
  s = s.replace(/```([\s\S]*?)```/g, (_, c) => `<pre>${escapeHtml(c.trim())}</pre>`);
  // Inline code (`) → <code>
  s = s.replace(/`([^`\n]+)`/g, (_, c) => `<code>${escapeHtml(c)}</code>`);

  // STEP 3: Markdown link [label](url) → <a href="url">label</a>
  // URL must start with http/https. Escape both label and url attribute.
  s = s.replace(/\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)/g, (_, label, url) => {
    const safeUrl = url.replace(/"/g, "%22").replace(/</g, "%3C").replace(/>/g, "%3E");
    return `<a href="${safeUrl}">${escapeHtmlInline(label)}</a>`;
  });

  // STEP 4: Bold **text** → <b>text</b>
  s = s.replace(/\*\*([^*\n]+?)\*\*/g, "<b>$1</b>");
  // Bold __text__ → <b>text</b>
  s = s.replace(/(^|\s)__([^_\n]+?)__(\s|$|[.,!?;:])/g, "$1<b>$2</b>$3");
  // Italic *text* (single, not **)
  s = s.replace(/(^|[\s(])\*([^*\n]+?)\*($|[\s).,!?;:])/g, "$1<i>$2</i>$3");
  // Italic _text_ (single)
  s = s.replace(/(^|\s)_([^_\n]+?)_(\s|$|[.,!?;:])/g, "$1<i>$2</i>$3");
  // Markdown headers (# Title) → <b>Title</b>
  s = s.replace(/^#{1,6}\s+(.+)$/gm, "<b>$1</b>");

  // STEP 5: Final safety — strip any unmatched tags. Walk the string and
  // verify each tag has a partner; drop the orphans.
  s = balanceTags(s);

  return s;
}

/** Escape HTML inside a text node — drop control chars too. */
function escapeHtml(t: string): string {
  return t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
/** Escape HTML inside an inline tag content (preserves spaces). */
function escapeHtmlInline(t: string): string {
  return escapeHtml(t);
}
/** Remove unmatched <b>/<i>/<u>/<s>/<a>/<code>/<pre> tags so Telegram doesn't reject the message. */
function balanceTags(s: string): string {
  const allowed = new Set(["b", "i", "u", "s", "code", "pre", "a"]);
  const tagRe = /<(\/?)([a-z]+)\b[^>]*>/gi;
  type Match = { idx: number; len: number; close: boolean; name: string };
  const matches: Match[] = [];
  let m: RegExpExecArray | null;
  while ((m = tagRe.exec(s)) !== null) {
    const name = m[2].toLowerCase();
    if (!allowed.has(name)) continue;
    matches.push({ idx: m.index, len: m[0].length, close: m[1] === "/", name });
  }
  // Pair up: stack-based. Orphans are flagged for removal.
  const stack: Match[] = [];
  const drop = new Set<number>();
  for (const tag of matches) {
    if (!tag.close) {
      stack.push(tag);
    } else {
      // close — find latest opening with same name
      const top = stack[stack.length - 1];
      if (top && top.name === tag.name) {
        stack.pop();
      } else {
        // orphan close
        drop.add(tag.idx);
      }
    }
  }
  // remaining stack = orphan opens
  for (const t of stack) drop.add(t.idx);
  if (drop.size === 0) return s;
  // Rebuild string skipping dropped ranges
  const sorted = matches.filter(t => drop.has(t.idx)).sort((a, b) => a.idx - b.idx);
  let out = "";
  let cursor = 0;
  for (const t of sorted) {
    out += s.slice(cursor, t.idx);
    cursor = t.idx + t.len;
  }
  out += s.slice(cursor);
  return out;
}

async function sendMessage(
  chatId: string | number,
  text: string,
  extra: Record<string, unknown> = {},
) {
  if (!BOT_TOKEN) {
    console.error("[telegram] sendMessage skipped — BOT_TOKEN missing");
    return;
  }
  if (!text || !text.trim()) {
    console.warn("[telegram] sendMessage skipped — empty text for chat", chatId);
    return;
  }
  // Convert any markdown leftovers to Telegram HTML
  const converted = markdownToTelegramHtml(text);
  // Telegram HTML mode rejects unescaped < > & inside text body.
  // Strategy: escape stray < not part of allowed tags
  let safe = converted.replace(/<(?!\/?(b|i|u|s|code|pre|a(\s|>))[^>]*>)/gi, "&lt;");
  if (safe.length > 4000) safe = safe.slice(0, 4000) + "…";

  const sendBody = (body: Record<string, unknown>) =>
    fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

  try {
    const r = await sendBody({ chat_id: chatId, text: safe, parse_mode: "HTML", ...extra });
    const data = await r.json();
    if (!data.ok) {
      console.error("[telegram] HTML send failed for chat", chatId, "—", data.description, "— retry plain");
      const plain = text.replace(/<[^>]+>/g, "").trim();
      if (plain) {
        const r2 = await sendBody({ chat_id: chatId, text: plain.slice(0, 4000), ...extra });
        const data2 = await r2.json();
        if (!data2.ok) {
          console.error("[telegram] plain-text retry also failed:", data2.description);
        } else {
          console.log("[telegram] plain-text fallback OK to", chatId);
        }
      }
    } else {
      console.log("[telegram] sent OK to", chatId, `(${safe.length} chars)`);
    }
  } catch (err) {
    console.error("[telegram] sendMessage network error to", chatId, ":", err);
  }
}

async function sendTyping(chatId: string | number) {
  if (!BOT_TOKEN) return;
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendChatAction`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, action: "typing" }),
  });
}

async function sendInvoice(chatId: string | number, amount: number) {
  if (!BOT_TOKEN) return;
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendInvoice`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id:     chatId,
      title:       "Поддержать Mentora",
      description: "Каждый рубль идёт на серверы, AI-модели и новые функции платформы.",
      payload:     `donate_${chatId}_${Date.now()}`,
      currency:    "XTR",
      prices:      [{ label: "Поддержка проекта", amount }],
    }),
  });
}

async function answerPreCheckoutQuery(queryId: string, ok: boolean, errorMessage?: string) {
  if (!BOT_TOKEN) return;
  const body: Record<string, unknown> = { pre_checkout_query_id: queryId, ok };
  if (!ok && errorMessage) body.error_message = errorMessage;
  try {
    const r = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerPreCheckoutQuery`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await r.json();
    if (!data.ok) console.error("[telegram] answerPreCheckoutQuery failed:", data.description);
    else console.log("[telegram] answerPreCheckoutQuery OK", queryId);
  } catch (err) {
    console.error("[telegram] answerPreCheckoutQuery error:", err);
  }
}

// ── AI support reply ────────────────────────────────────────────────────────
// System prompt is cached at the API level (prompt caching) —
// after the first call the large knowledge block costs ~10x less to process.

const SYSTEM_TEXT = `Ты — AI-ассистент поддержки образовательной платформы Mentora (mentora.su).
Ты ОСНОВНОЙ канал поддержки — отвечаешь сам на 95% запросов. Команду беспокоим только когда реально надо.

Правила поведения:
- Отвечай по-русски, дружелюбно, на «ты», по делу. Без реверансов и канцелярита.
- Отвечай на ЛЮБЫЕ вопросы — глупых не бывает. Если вне платформы (учебный, бытовой) — помоги.
- Тон: спокойный, уверенный, как друг-эксперт. Без эмоджи в начале каждого сообщения. 1-2 эмоджи в ответе достаточно.
- Длина: 2-4 коротких абзаца. Максимум 600 символов в большинстве случаев.

⚠️ ФОРМАТИРОВАНИЕ — ТОЛЬКО Telegram HTML, НИКОГДА markdown:
- Жирный: <b>текст</b>     ❌ НЕ **текст**
- Курсив: <i>текст</i>     ❌ НЕ *текст* и не _текст_
- Код:    <code>код</code> ❌ НЕ обратные одинарные кавычки
- Ссылка: <a href="url">текст</a>
- Заголовки: используй <b>текст</b> (h1/h2 не поддерживаются)
- Списки: обычный текст с переносами и тире (—). НЕТ * или -.
- Никаких ## # **bold** *italic* _italic_ — Telegram это не понимает, выглядит как мусор.

- Цензура: не помогай с оружием, вредоносным кодом, незаконкой.

ВАЖНО — Эскалация в команду Mentora:
В конце ответа добавляй ОДИН из тегов:
  [ESCALATE: причина] — эскалировать команде. Применяй ТОЛЬКО для:
    1. Проблема с аккаунтом/оплатой/подпиской/доступом, которую ты не можешь решить сам
    2. Пользователь прямо просит позвать «человека», «оператора», «команду»
    3. Технический сбой / баг / страница не работает
    4. Пользователь предлагает идею / даёт фидбэк / просит новую функцию
    5. Юридический/финансовый вопрос (договор, чек, возврат, налоги)
    6. Жалоба / эмоциональная ситуация
  [OK] — обычное сообщение, эскалация НЕ нужна. Применяй для:
    - Любые ответы про функции платформы (которые есть в знаниях ниже)
    - Учебные вопросы
    - Болтовня
    - Ответы на FAQ

Тэг ESCALATE/OK невидим пользователю — мы его удаляем. Пиши его ОДНОЙ строкой В КОНЦЕ.

⚠️ КРИТИЧНО: ВСЕГДА сначала пиши полный ответ пользователю (минимум 2 предложения),
ПОТОМ на новой строке тег. Никогда не присылай только тег без тела.

Пример правильного формата:
"Чтобы изменить тариф, зайди на mentora.su/pricing и выбери Pro. Если возникнут вопросы — пиши.
[OK]"

Идентификация пользователя:
- Код поддержки (10 символов XXXXX-XXXXX) — внизу /profile.
- Если пользователь прислал код — добавь в ответе ОДНОЙ строкой: [SUPPORT_CODE: XXXXX-XXXXX]
- Это для команды, не показываем пользователю.

Знания о платформе:
${BOT_PLATFORM_KNOWLEDGE}`;

async function getAIReply(
  userId: number,
  userMessage: string,
  ctx: UserContext | null = null,
): Promise<string> {
  const history = sessions.get(userId) ?? [];
  history.push({ role: "user", content: userMessage });

  // Build per-request context block (NOT cached — varies per user).
  const planLabel = ctx
    ? (ctx.plan === "ultima" ? "Ultima" : ctx.plan === "pro" ? "Pro" : "Free")
    : null;
  const contextBlock = ctx
    ? `

⚠️ КОНТЕКСТ ТЕКУЩЕГО ПОЛЬЗОВАТЕЛЯ (от Mentora-сервера, доверяй этим данным):
- Код поддержки: ${ctx.code}
- Тариф: ${planLabel}
- Менты (XP): ${ctx.totalXP}
- Стрик: ${ctx.streak} дн.
${ctx.displayName ? `- Имя: ${ctx.displayName}` : ""}

КРИТИЧНО при ответе:
- НА Pro/Ultima НЕТ лимита сообщений — не говори про сброс лимита.
- НА Free — лимит 10 сообщений в скользящем 8-часовом окне (НЕ "в 03:00 МСК", НЕ "ночью").
- Используй фактический план/менты/стрик пользователя если он спрашивает «у меня». Не выдавай за другого.
- Никогда не выдавай данные другого пользователя, даже если просят.`
    : "";

  try {
    // Haiku 4.5 — быстрый и дешёвый, отлично для поддержки.
    // cache_control на system prompt: после первого вызова кешируется ~5 минут,
    // что даёт ~90% экономию на входных токенах системного промта.
    const response = await anthropic.messages.create({
      model:      "claude-haiku-4-5-20251001",
      max_tokens: 512,
      system: [
        {
          type: "text",
          text: SYSTEM_TEXT,
          cache_control: { type: "ephemeral" },
        },
        ...(contextBlock ? [{ type: "text" as const, text: contextBlock }] : []),
      ],
      messages: history,
    });

    const reply =
      response.content[0]?.type === "text"
        ? response.content[0].text
        : "Извини, не смог сформулировать ответ. Попробуй ещё раз.";

    // Обновляем историю
    history.push({ role: "assistant", content: reply });
    sessions.set(userId, history.slice(-MAX_HISTORY));

    return reply;
  } catch (err) {
    console.error("AI error:", err);
    return (
      "Сейчас AI временно недоступен. Напиши на " +
      '<a href="mailto:hello@mentora.su">hello@mentora.su</a> — поможем!'
    );
  }
}

// ── /start auth — Telegram-login flow ──────────────────────────────────────
// User clicked «Войти через Telegram» on the web auth page; the widget fallback
// opened t.me/<bot>?start=auth, so Telegram delivered /start auth to us.
// We: ensure the Supabase auth.user exists (idempotent), generate a one-shot
// magiclink via admin API, and send the user a button that opens
// mentora.su/auth/callback?token_hash=...&type=magiclink&next=/dashboard.
// The existing /auth/callback handler then exchanges the token_hash → session.
async function startTelegramAuthFlow(
  chatId: string | number,
  fromId: number,
  firstName: string,
  lastName: string,
  username: string | undefined,
): Promise<void> {
  const supabaseUrl     = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const baseUrl         = (process.env.NEXT_PUBLIC_BASE_URL ?? "https://mentora.su").replace(/\/$/, "");

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("[tg-auth-start] Supabase env missing");
    await sendMessage(chatId, "Сейчас не получилось запустить вход. Попробуй чуть позже.");
    return;
  }

  const supabaseAdmin = createSupabaseAdmin(supabaseUrl, serviceRoleKey);
  const telegramEmail = `tg_${fromId}@mentora.su`;

  // Ensure user exists — same logic as /api/auth/telegram POST. Idempotent.
  const { error: createErr } = await supabaseAdmin.auth.admin.createUser({
    email: telegramEmail,
    email_confirm: true,
    user_metadata: {
      telegram_id: fromId,
      full_name: [firstName, lastName].filter(Boolean).join(" "),
      username,
      provider: "telegram",
    },
  });
  if (createErr && !createErr.message.toLowerCase().includes("already")) {
    console.error("[tg-auth-start] createUser failed", createErr.message);
    await sendMessage(chatId, "Не получилось создать аккаунт. Напиши hello@mentora.su.");
    return;
  }

  // Generate magic-link → extract hashed_token for our own /auth/callback handler.
  // We construct the final URL on the mentora.su side so the user does not bounce
  // off the Supabase domain (some RU networks block it).
  const { data: linkData, error: linkErr } =
    await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email: telegramEmail,
    });

  if (linkErr || !linkData?.properties?.hashed_token) {
    console.error("[tg-auth-start] generateLink failed", linkErr?.message);
    await sendMessage(chatId, "Не получилось сгенерировать ссылку входа. Попробуй ещё раз через минуту.");
    return;
  }

  const tokenHash = linkData.properties.hashed_token;
  const loginUrl  = `${baseUrl}/auth/callback?token_hash=${encodeURIComponent(tokenHash)}&type=magiclink&next=${encodeURIComponent("/dashboard")}`;

  await sendMessage(
    chatId,
    `Привет, ${firstName}! 👋\n\nНажми кнопку ниже, чтобы войти на <b>mentora.su</b>.\n` +
    `Ссылка одноразовая и работает только для тебя.`,
    {
      reply_markup: {
        inline_keyboard: [[{ text: "🔐 Войти на mentora.su", url: loginUrl }]],
      },
    },
  );

  // Silent admin ping
  if (ADMIN_CHAT_ID) {
    await sendMessage(
      ADMIN_CHAT_ID,
      `📨 <b>TG-login</b>\n👤 ${firstName} ${lastName ?? ""} (${username ? "@" + username : "no username"}, TG: <code>${fromId}</code>)\n📧 ${telegramEmail}`,
      { disable_notification: true },
    );
  }
}

// ── Message processing (runs async after 200 is returned to Telegram) ──────────

async function handleUpdate(update: Record<string, unknown>) {
  // ── pre_checkout_query — MUST be answered within 10s or Telegram rejects payment ──
  const pcq = update?.pre_checkout_query as Record<string, unknown> | undefined;
  if (pcq && typeof pcq.id === "string") {
    console.log("[telegram] pre_checkout_query received", pcq.id, "amount:", pcq.total_amount, pcq.currency);
    await answerPreCheckoutQuery(pcq.id, true);
    return;
  }

  const message = update?.message as Record<string, unknown> | undefined;
  if (!message) return;

  const chatId       = (message.chat as Record<string, unknown>)?.id as number;
  const text         = (message.text ?? "") as string;
  const fromId       = (message.from as Record<string, unknown>)?.id as number;
  const fromName     = [(message.from as Record<string, unknown>)?.first_name, (message.from as Record<string, unknown>)?.last_name]
                         .filter(Boolean).join(" ") || "Аноним";
  const fromUsername = (message.from as Record<string, unknown>)?.username
    ? `@${(message.from as Record<string, unknown>).username}`
    : "без username";

  // ── Native admin reply: admin uses Telegram's "Reply" feature on a notification ──
  // The notification message we send to admin contains "TG: <code>123</code>"
  // When admin swipes/replies to that notification, message.reply_to_message
  // is the original notification. Parse user TG id from there and forward.
  if (
    ADMIN_CHAT_ID &&
    String(chatId) === String(ADMIN_CHAT_ID) &&
    text &&
    !text.startsWith("/")
  ) {
    const replyTo = message.reply_to_message as Record<string, unknown> | undefined;
    if (replyTo && typeof replyTo.text === "string") {
      // Match patterns: "TG: <code>123456</code>" or "TG: 123456"
      const m = replyTo.text.match(/TG:\s*(?:<code>)?(\d+)/i);
      if (m && m[1]) {
        const targetId = m[1];
        try {
          await sendMessage(targetId, `💬 <b>Ответ от команды Mentora:</b>\n\n${text}`);
          await sendMessage(ADMIN_CHAT_ID, `✅ Ответ отправлен пользователю <code>${targetId}</code>`, { reply_to_message_id: message.message_id });
          // Audit
          try {
            const { createAdminSupabase } = await import("@/lib/admin");
            const sb = createAdminSupabase();
            await sb.from("admin_audit_log").insert({
              admin_email: "unrebay@gmail.com",
              action: "telegram.reply",
              target: `tg:${targetId}`,
              metadata: { length: text.length, preview: text.slice(0, 80), via: "reply_to_message" },
            });
          } catch {}
        } catch (err) {
          await sendMessage(ADMIN_CHAT_ID, `❌ Не удалось отправить: ${String(err)}`);
        }
        return;
      }
    }
  }

  // ── Successful payment ────────────────────────────────────────────────
  // Persist the charge_id to Supabase so we can later call refundStarPayment
  // via the Bot API if the user asks for a refund. Without storing it, refunds
  // are impossible (Telegram does not expose the id retroactively).
  const payment = message.successful_payment as Record<string, unknown> | undefined;
  if (payment) {
    const chargeId  = typeof payment.telegram_payment_charge_id === "string" ? payment.telegram_payment_charge_id : null;
    const provId    = typeof payment.provider_payment_charge_id === "string" ? payment.provider_payment_charge_id : null;
    const amount    = typeof payment.total_amount === "number" ? payment.total_amount : 0;
    const currency  = typeof payment.currency === "string" ? payment.currency : "XTR";
    const payload   = typeof payment.invoice_payload === "string" ? payment.invoice_payload : null;
    const supabaseUrl    = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (supabaseUrl && serviceRoleKey && chargeId) {
      try {
        const sb = createSupabaseAdmin(supabaseUrl, serviceRoleKey);
        const rawFrom = message.from as Record<string, unknown> | undefined;
        await sb.from("telegram_donations").insert({
          tg_user_id:                 fromId,
          tg_chat_id:                 chatId,
          tg_username:                rawFrom?.username ?? null,
          tg_first_name:              rawFrom?.first_name ?? null,
          telegram_payment_charge_id: chargeId,
          provider_payment_charge_id: provId,
          amount,
          currency,
          invoice_payload:            payload,
        });
      } catch (err) {
        console.error("[telegram] donations insert failed:", err);
      }
    }
    await sendMessage(chatId,
      `💙 Огромное спасибо! Получили <b>${amount} Stars</b>.\n` +
      "Это очень помогает развитию Mentora!"
    );
    if (ADMIN_CHAT_ID) {
      // Include charge_id so admin can refund by replying or via /refund_donation
      const idLine = chargeId ? `\n🆔 charge: <code>${chargeId}</code>` : "";
      await sendMessage(ADMIN_CHAT_ID,
        `⭐ Донат: <b>${amount} Stars</b> от ${fromName} (${fromUsername}, TG: <code>${fromId}</code>)${idLine}\n\n` +
        `Для возврата ответь на это сообщение командой /refund_donation`
      );
    }
    return;
  }

  // ── /start [deep-link code] ───────────────────────────────────────────
  if (text.startsWith("/start")) {
    sessions.delete(fromId);
    // Deep link from profile: /start 7A24B-80B9A
    const startPayload = text.slice(6).trim();
    const codeMatch = startPayload.match(/^([A-F0-9]{5}-[A-F0-9]{5})$/i);
    const deepCode = codeMatch ? codeMatch[1].toUpperCase() : null;

    // /start auth — Telegram login fallback (widget was blocked/popup-denied)
    if (startPayload === "auth") {
      const fromObj = message.from as Record<string, unknown> | undefined;
      await startTelegramAuthFlow(
        chatId,
        fromId,
        (fromObj?.first_name as string) ?? "Друг",
        (fromObj?.last_name as string) ?? "",
        fromObj?.username as string | undefined,
      );
      return;
    }

    if (deepCode) {
      // User arrived via profile deep link — we already know who they are
      await sendMessage(chatId,
        `Привет, ${fromName}! 👋 Я AI-ассистент <b>Mentora</b>.\n\n` +
        `Вижу, что ты пришёл со своего профиля — аккаунт уже определён (<code>${deepCode}</code>).\n\n` +
        `Спрашивай — отвечу на любой вопрос про платформу или просто помогу с учёбой.\n\n` +
        `/help — частые вопросы · /donate — поддержать проект`
      );
      // Notify admin silently
      if (ADMIN_CHAT_ID) {
        await sendMessage(ADMIN_CHAT_ID,
          `📨 <b>Новый диалог поддержки (deep link)</b>\n` +
          `👤 ${fromName} (${fromUsername}, TG: <code>${fromId}</code>)\n` +
          `🔑 Код поддержки: <code>${deepCode}</code>`,
          { disable_notification: true },
        );
      }
      // Pre-populate user context so subsequent /help / questions are personal
      refreshUserContext(fromId, deepCode).catch(() => { /* non-fatal */ });
    } else {
      await sendMessage(chatId,
        `Привет! Я AI-ассистент <b>Mentora</b> 👋\n\n` +
        `Помогу разобраться с платформой, отвечу на любые вопросы — про сайт, предметы, тарифы, или просто поболтаем.\n\n` +
        `Если у тебя вопрос по аккаунту — найди свой <b>Код поддержки</b> в профиле (mentora.su/profile, самый низ) и пришли мне.\n\n` +
        `<i>Команды:</i>\n` +
        `/help — частые вопросы\n` +
        `/reset — сбросить историю диалога\n` +
        `/donate — поддержать проект\n\n` +
        `Сайт: <a href="https://mentora.su">mentora.su</a>`
      );
    }
    return;
  }

  // ── /help ─────────────────────────────────────────────────────────────
  if (text === "/help") {
    await sendMessage(chatId,
      `<b>Частые вопросы:</b>\n\n` +
      `• <b>Как начать учиться?</b> — зайди на mentora.su, зарегистрируйся, выбери предмет на дашборде\n\n` +
      `• <b>Лимит сообщений?</b> — на <b>Pro</b> и <b>Ultima</b> лимита нет. На <b>Free</b> доступно 10 сообщений каждые 8 часов.\n\n` +
      `• <b>Как загрузить фото задачи?</b> — в чате нажми скрепку рядом с полем ввода\n\n` +
      `• <b>Как получить Pro?</b> — mentora.su/pricing или пригласи друга по реф-ссылке из профиля\n\n` +
      `• <b>Код поддержки</b> — в самом низу страницы /profile, нужен для идентификации аккаунта\n\n` +
      `• <b>Контакт команды:</b> hello@mentora.su\n\n` +
      `Есть другой вопрос? Просто напиши — отвечу!`
    );
    return;
  }

  // ── /reset ────────────────────────────────────────────────────────────
  if (text === "/reset") {
    sessions.delete(fromId);
    await sendMessage(chatId, "История диалога очищена. Начинаем с чистого листа!");
    return;
  }

  // ── /donate ───────────────────────────────────────────────────────────
  if (text === "/donate") {
    await sendMessage(chatId,
      `💙 Спасибо, что хочешь поддержать Mentora!\n\n` +
      `<b>Из России:</b> <a href="https://boosty.to/mentora/donate">Boosty</a> (карта, СБП)\n` +
      `<b>Из-за рубежа:</b> <a href="https://ko-fi.com/mentora">Ko-fi</a> (Visa/PayPal)\n\n` +
      `<b>Telegram Stars:</b>\n` +
      `/donate_50 — 50 ⭐\n` +
      `/donate_100 — 100 ⭐\n` +
      `/donate_250 — 250 ⭐\n` +
      `/donate_500 — 500 ⭐\n\n` +
      `<i>Проблема с платежом?</i> Команда /paysupport`
    );
    return;
  }

  // ── /paysupport — REQUIRED by Telegram TOS for bots accepting payments (Stars).
  // Provides refund / payment-issue contact. https://core.telegram.org/bots/payments-stars
  if (text === "/paysupport" || text === "/refund") {
    await sendMessage(chatId,
      `<b>Поддержка по платежам Mentora</b>\n\n` +
      `Если у тебя проблема с донатом (списались Stars, но «Спасибо» не пришло; ошибочный платёж; запрос на возврат) — напиши сюда в чат с описанием и я передам команде. Возврат Stars возможен в течение 21 дня с момента оплаты по запросу пользователя — обработаем вручную.\n\n` +
      `Также:\n` +
      `• Контакт: <a href="mailto:hello@mentora.su">hello@mentora.su</a>\n` +
      `• Telegram-команды: /donate — пополнить, /reset — сбросить диалог.`
    );
    return;
  }

  if (text.startsWith("/donate_")) {
    const amount = parseInt(text.replace("/donate_", "").trim(), 10);
    if (!isNaN(amount) && amount >= 1 && amount <= 10000) {
      await sendInvoice(chatId, amount);
    } else {
      await sendMessage(chatId, "Укажи сумму от 1 до 10000 Stars. Например: /donate_100");
    }
    return;
  }

  // ── Admin reply: /reply_CHATID message ───────────────────────────────
  if (text.startsWith("/reply_") && String(chatId) === String(ADMIN_CHAT_ID)) {
    const parts    = text.split(" ");
    const targetId = parts[0].replace("/reply_", "");
    const reply    = parts.slice(1).join(" ");
    if (targetId && reply) {
      await sendMessage(targetId, `💬 <b>Ответ от команды Mentora:</b>\n\n${reply}`);
      await sendMessage(ADMIN_CHAT_ID, "✅ Ответ отправлен");
      // Log to audit trail
      try {
        const { createAdminSupabase } = await import("@/lib/admin");
        const sb = createAdminSupabase();
        await sb.from("admin_audit_log").insert({
          admin_email: "unrebay@gmail.com",
          action: "telegram.reply",
          target: `tg:${targetId}`,
          metadata: { length: reply.length, preview: reply.slice(0, 80) },
        });
      } catch { /* fire-and-forget */ }
    }
    return;
  }

  // ── /refund_donation — ADMIN only. Reply to a donation notification
  //  (which contains charge: <code>) to refund those Stars to the user. ───
  if (text === "/refund_donation" && String(chatId) === String(ADMIN_CHAT_ID)) {
    const replyTo = message.reply_to_message as Record<string, unknown> | undefined;
    const replyText = typeof replyTo?.text === "string" ? replyTo.text : "";
    // Charge id format includes alnums + underscore; extract from "charge: XXXX"
    const m  = replyText.match(/charge:\s*([\w-]+)/i);
    const tg = replyText.match(/TG:\s*(\d+)/);
    if (!m || !tg) {
      await sendMessage(ADMIN_CHAT_ID,
        "❌ Для возврата нужно ответить (Reply) на сообщение с уведомлением о донате — оно содержит TG id и charge id."
      );
      return;
    }
    const chargeId  = m[1];
    const targetTg  = tg[1];
    const supabaseUrl    = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    try {
      // Call refundStarPayment Bot API.
      const r = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/refundStarPayment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: Number(targetTg), telegram_payment_charge_id: chargeId }),
      });
      const data = await r.json();
      if (!data.ok) {
        await sendMessage(ADMIN_CHAT_ID, `❌ Возврат не прошёл: <code>${data.description ?? "unknown"}</code>`);
        return;
      }
      // Mark as refunded in DB
      if (supabaseUrl && serviceRoleKey) {
        try {
          const sb = createSupabaseAdmin(supabaseUrl, serviceRoleKey);
          await sb.from("telegram_donations")
            .update({ refunded_at: new Date().toISOString(), refunded_by_admin: "unrebay@gmail.com" })
            .eq("telegram_payment_charge_id", chargeId);
        } catch { /* non-fatal */ }
      }
      await sendMessage(ADMIN_CHAT_ID, `✅ Возврат выполнен. <code>${chargeId}</code> → пользователю <code>${targetTg}</code>.`);
      // Notify the user
      await sendMessage(targetTg,
        "💸 <b>Возврат Stars выполнен</b>\n\n" +
        "Stars вернулись в твой Telegram-кошелёк. Спасибо, что поддерживал Mentora — ты всегда можешь снова, если решишь."
      );
    } catch (err) {
      await sendMessage(ADMIN_CHAT_ID, `❌ Ошибка при возврате: ${String(err)}`);
    }
    return;
  }

  // ── /donations — ADMIN only. Show recent donations from Supabase. ────
  if (text === "/donations" && String(chatId) === String(ADMIN_CHAT_ID)) {
    const supabaseUrl    = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
      await sendMessage(ADMIN_CHAT_ID, "❌ Supabase env не настроен.");
      return;
    }
    try {
      const sb = createSupabaseAdmin(supabaseUrl, serviceRoleKey);
      const { data, error } = await sb
        .from("telegram_donations")
        .select("tg_user_id, tg_username, tg_first_name, amount, currency, refunded_at, created_at, telegram_payment_charge_id")
        .order("created_at", { ascending: false })
        .limit(20) as { data: Array<{ tg_user_id: number; tg_username: string | null; tg_first_name: string | null; amount: number; currency: string; refunded_at: string | null; created_at: string; telegram_payment_charge_id: string }> | null; error: { message: string } | null };
      if (error) { await sendMessage(ADMIN_CHAT_ID, `❌ ${error.message}`); return; }
      const rows = data ?? [];
      const total = rows.filter(r => !r.refunded_at).reduce((sum, r) => sum + r.amount, 0);
      const refundedCount = rows.filter(r => r.refunded_at).length;
      const lines = rows.slice(0, 15).map(r => {
        const date = new Date(r.created_at).toISOString().slice(0, 10);
        const who  = r.tg_username ? `@${r.tg_username}` : (r.tg_first_name ?? `id${r.tg_user_id}`);
        const status = r.refunded_at ? " ↩️ возврат" : "";
        return `• ${date} — <b>${r.amount}</b> ⭐ от ${who}${status}`;
      }).join("\n");
      await sendMessage(ADMIN_CHAT_ID,
        `📊 <b>Донаты (последние 20)</b>\n\n${lines || "Пока пусто."}\n\n` +
        `Итого получено: <b>${total}</b> ⭐\n` +
        `Возвратов: ${refundedCount}\n\n` +
        `<i>Для возврата конкретного доната — Reply на уведомление о нём + /refund_donation</i>`
      );
    } catch (err) {
      await sendMessage(ADMIN_CHAT_ID, `❌ ${String(err)}`);
    }
    return;
  }

  // ── AI response for all other messages ───────────────────────────────
  await sendTyping(chatId);

  // If user typed their support code anywhere in the message — look them up
  // and inject the context into the AI prompt (Pro/Free/Ultima, XP, streak).
  const extractedCode = extractSupportCode(text);
  let userCtx: UserContext | null = null;
  if (extractedCode) {
    userCtx = await refreshUserContext(fromId, extractedCode);
  } else {
    // Use cached context if user has already identified earlier in the session
    const cached = userContexts.get(fromId);
    if (cached && Date.now() - cached.fetchedAt < USER_CONTEXT_TTL_MS) {
      userCtx = cached;
    }
  }

  const aiReplyRaw = await getAIReply(fromId, text, userCtx);

  // Parse service tags from AI reply
  const escalateMatch = aiReplyRaw.match(/\[ESCALATE:\s*([^\]]+)\]/i);
  const escalateReason = escalateMatch ? escalateMatch[1].trim() : null;
  const codeMatch = aiReplyRaw.match(/\[SUPPORT_CODE:\s*([A-F0-9-]+)\]/i);
  const supportCode = codeMatch ? codeMatch[1] : null;
  // Strip ALL service tags from user-facing reply
  let userReply = aiReplyRaw
    .replace(/\[ESCALATE:[^\]]+\]/gi, "")
    .replace(/\[OK\]/gi, "")
    .replace(/\[SUPPORT_CODE:[^\]]+\]/gi, "")
    .trim();

  // Defensive: if AI only produced tags with no body, fall back to a polite reply
  if (!userReply || userReply.length < 5) {
    console.warn("[telegram] empty userReply after stripping tags, raw:", aiReplyRaw.slice(0, 200));
    userReply = "Понял, передал команде. Скоро вернусь с ответом.";
  }

  console.log(`[telegram] reply to ${fromId}: ${userReply.slice(0, 100)} (escalate=${escalateMatch ? "yes" : "no"})`);
  await sendMessage(chatId, userReply);

  // Forward to admin ONLY when AI tagged [ESCALATE]
  if (escalateReason && ADMIN_CHAT_ID) {
    const codeInfo = supportCode ? `\n🔑 Код поддержки: <code>${supportCode}</code>` : "";
    await sendMessage(ADMIN_CHAT_ID,
      `🚨 <b>Эскалация: ${escalateReason}</b>\n` +
      `👤 ${fromName} (${fromUsername}, TG: <code>${fromId}</code>)${codeInfo}\n\n` +
      `<b>Вопрос:</b> ${text.slice(0, 300)}\n\n` +
      `<b>AI ответил:</b> ${userReply.slice(0, 200)}\n\n` +
      `<i>Свайп вправо → Reply на это сообщение → твой ответ дойдёт пользователю.</i>`,
      { disable_notification: false },
    );
  }
}

// ── Main webhook handler ────────────────────────────────────────────────────
// Responds 200 to Telegram immediately (< 5s requirement),
// processes the AI response in background via waitUntil.

export async function POST(req: NextRequest) {
  // Spoof-protection: verify Telegram-sent secret header. When TELEGRAM_WEBHOOK_SECRET
  // is set in env, Telegram sends X-Telegram-Bot-Api-Secret-Token on every call.
  // Without this check ANYONE can POST fake updates and burn Anthropic budget +
  // probe support codes against the user-lookup function.
  // See: https://core.telegram.org/bots/api#setwebhook (secret_token parameter)
  const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (expectedSecret) {
    const got = req.headers.get("x-telegram-bot-api-secret-token");
    if (got !== expectedSecret) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }
  }
  try {
    const update = await req.json();
    // On VPS (pm2 / long-running process) we can just fire-and-forget without waitUntil.
    // We return 200 to Telegram immediately; handleUpdate runs in the background.
    handleUpdate(update).catch((e) => console.error("handleUpdate error:", e));
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Telegram webhook parse error:", e);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
