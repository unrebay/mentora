import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
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

// ── Telegram API helpers ────────────────────────────────────────────────────

/** Convert common Markdown-isms to Telegram HTML. Run BEFORE sending.
 *  Handles: **bold**, __bold__ (sometimes), *italic*, _italic_, `code`, ```pre```
 *  Also strips markdown headers (# ##) since Telegram has no h-tags. */
function markdownToTelegramHtml(text: string): string {
  let s = text;
  // Code fence (```) → <pre>
  s = s.replace(/```([\s\S]*?)```/g, (_, c) => `<pre>${c.trim()}</pre>`);
  // Inline code (`) → <code>
  s = s.replace(/`([^`\n]+)`/g, "<code>$1</code>");
  // Bold **text** → <b>text</b>
  s = s.replace(/\*\*([^*\n]+?)\*\*/g, "<b>$1</b>");
  // Bold __text__ → <b>text</b> (only if not within a word like file_name_)
  s = s.replace(/(^|\s)__([^_\n]+?)__(\s|$|[.,!?;:])/g, "$1<b>$2</b>$3");
  // Italic *text* (single, not **) — careful not to break math like 2*3
  s = s.replace(/(^|[\s(])\*([^*\n]+?)\*($|[\s).,!?;:])/g, "$1<i>$2</i>$3");
  // Italic _text_ (single)
  s = s.replace(/(^|\s)_([^_\n]+?)_(\s|$|[.,!?;:])/g, "$1<i>$2</i>$3");
  // Markdown headers (# Title) → <b>Title</b>
  s = s.replace(/^#{1,6}\s+(.+)$/gm, "<b>$1</b>");
  return s;
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
): Promise<string> {
  const history = sessions.get(userId) ?? [];
  history.push({ role: "user", content: userMessage });

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
  const payment = message.successful_payment as Record<string, unknown> | undefined;
  if (payment) {
    await sendMessage(chatId,
      `💙 Огромное спасибо! Получили <b>${payment.total_amount} Stars</b>.\n` +
      "Это очень помогает развитию Mentora!"
    );
    if (ADMIN_CHAT_ID) {
      await sendMessage(ADMIN_CHAT_ID,
        `⭐ Донат: ${payment.total_amount} Stars от ${fromName} (${fromUsername}, ID: ${fromId})`
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
      `• <b>Лимит сообщений?</b> — сбрасывается каждую ночь в 03:00 МСК\n\n` +
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
      `/donate_500 — 500 ⭐`
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

  // ── AI response for all other messages ───────────────────────────────
  await sendTyping(chatId);

  const aiReplyRaw = await getAIReply(fromId, text);

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
