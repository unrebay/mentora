import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { BOT_PLATFORM_KNOWLEDGE } from "@/lib/bot-knowledge";

const BOT_TOKEN     = process.env.TELEGRAM_SUPPORT_BOT_TOKEN ?? process.env.TELEGRAM_BOT_TOKEN ?? "";
const ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID ?? "";
const anthropic     = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? "" });

// ── In-memory conversation store (per Telegram user_id → last N messages)
// Works fine for serverless — history resets after cold start, but that's acceptable.
const MAX_HISTORY = 10; // сообщений в памяти на пользователя
const sessions = new Map<number, Array<{ role: "user" | "assistant"; content: string }>>();

// ── Telegram API helpers ────────────────────────────────────────────────────

async function sendMessage(
  chatId: string | number,
  text: string,
  extra: Record<string, unknown> = {},
) {
  if (!BOT_TOKEN) return;
  // Telegram HTML: strip unsupported tags
  const safe = text.replace(/<(?!\/?(b|i|u|s|code|pre|a\s))[^>]+>/gi, "");
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: safe, parse_mode: "HTML", ...extra }),
  });
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

// ── AI support reply ────────────────────────────────────────────────────────
// System prompt is cached at the API level (prompt caching) —
// after the first call the large knowledge block costs ~10x less to process.

const SYSTEM_TEXT = `Ты — AI-ассистент поддержки образовательной платформы Mentora (mentora.su).
Твоя задача: помогать пользователям разобраться с платформой, отвечать на вопросы,
решать проблемы, объяснять как что работает.

Правила поведения:
- Отвечай по-русски, дружелюбно и по делу. Без лишних реверансов.
- Отвечай на ЛЮБЫЕ вопросы — глупых вопросов не бывает.
- Если вопрос не про платформу (например, учебный вопрос) — помоги!
  Ты умный, не ограничивай себя только поддержкой.
- Если не знаешь точного ответа — честно скажи и предложи написать на hello@mentora.su.
- Форматирование: Telegram HTML. Можно использовать <b>жирный</b>, <i>курсив</i>, <code>код</code>.
- Не используй markdown (*звёздочки*, #решётки) — только HTML-теги или простой текст.
- Ответ короткий и чёткий. Не лей воду. Максимум 3-4 коротких абзаца.
- Цензура: не помогай с созданием оружия, вредоносного кода, незаконными вещами.
  Всё остальное — можно обсуждать.

Идентификация пользователя:
- У каждого пользователя платформы есть «Код поддержки» (10 символов, вида XXXXX-XXXXX).
  Он виден в самом низу страницы /profile на сайте, рядом кнопка «Скопировать».
- Если пользователь упомянул проблему с аккаунтом и не прислал код — попроси его.
- Если пользователь прислал код — добавь в самом конце своего ответа строку:
  [SUPPORT_CODE: XXXXX-XXXXX]
  Это нужно для того, чтобы команда Mentora нашла аккаунт.

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
    }
    return;
  }

  // ── AI response for all other messages ───────────────────────────────
  await sendTyping(chatId);

  const aiReply = await getAIReply(fromId, text);

  // Если бот нашёл support_code — включить в уведомление для админа
  const codeMatch = aiReply.match(/\[SUPPORT_CODE:\s*([A-F0-9-]+)\]/i);
  const supportCode = codeMatch ? codeMatch[1] : null;
  // Убираем служебный тег из ответа пользователю
  const userReply = aiReply.replace(/\[SUPPORT_CODE:[^\]]+\]/gi, "").trim();

  await sendMessage(chatId, userReply);

  // Уведомляем админа о новом обращении (только первое сообщение в сессии, тихо)
  const history = sessions.get(fromId) ?? [];
  if (history.length <= 2 && ADMIN_CHAT_ID) {
    const codeInfo = supportCode ? `\n🔑 Код поддержки: <code>${supportCode}</code>` : "";
    await sendMessage(ADMIN_CHAT_ID,
      `📨 <b>Новый диалог поддержки</b>\n` +
      `👤 ${fromName} (${fromUsername}, TG: <code>${fromId}</code>)${codeInfo}\n` +
      `💬 ${text.slice(0, 200)}`,
      { disable_notification: true },
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

// ── GET handler ────────────────────────────────────────────────────────────
// Plain GET → status JSON. With ?diag=1 → verifies bot via getMe и getWebhookInfo.
export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get("diag") !== "1") {
    return NextResponse.json({ ok: true, service: "Mentora AI support bot" });
  }
  if (!BOT_TOKEN) {
    return NextResponse.json({
      bot_token_env: "missing — neither TELEGRAM_SUPPORT_BOT_TOKEN nor TELEGRAM_BOT_TOKEN set",
      admin_chat_id: ADMIN_CHAT_ID || "(missing)",
    }, { status: 500 });
  }
  try {
    const meRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getMe`);
    const me = await meRes.json();
    const wRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`);
    const w = await wRes.json();
    return NextResponse.json({
      bot_id: BOT_TOKEN.split(":")[0],
      getMe_ok: me.ok,
      bot_username: me.result?.username ?? null,
      webhook_url: w.result?.url ?? null,
      pending_update_count: w.result?.pending_update_count ?? 0,
      last_error_date: w.result?.last_error_date ?? null,
      last_error_message: w.result?.last_error_message ?? null,
      admin_chat_id_set: !!ADMIN_CHAT_ID,
      anthropic_api_key_set: !!process.env.ANTHROPIC_API_KEY,
    });
  } catch (e: unknown) {
    return NextResponse.json({
      error: e instanceof Error ? e.message : String(e),
    }, { status: 500 });
  }
}
