import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { BOT_PLATFORM_KNOWLEDGE } from "@/lib/bot-knowledge";

const BOT_TOKEN   = process.env.TELEGRAM_SUPPORT_BOT_TOKEN ?? "";
const ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID ?? "";
const anthropic   = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? "" });

// ── In-memory conversation store (per Telegram user_id → last N messages)
// Works fine for serverless — history resets after cold start, but that's acceptable.
const MAX_HISTORY = 12; // сообщений в памяти на пользователя
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

const SYSTEM_PROMPT = `Ты — AI-ассистент поддержки образовательной платформы Mentora (mentora.su).
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
- Ответ короткий и чёткий. Не лей воду.
- Цензура: не помогай с созданием оружия, вредоносного кода, незаконными вещами.
  Всё остальное — можно обсуждать.

Знания о платформе:
${BOT_PLATFORM_KNOWLEDGE}`;

async function getAIReply(
  userId: number,
  userMessage: string,
): Promise<string> {
  // Достаём историю
  const history = sessions.get(userId) ?? [];
  history.push({ role: "user", content: userMessage });

  try {
    const response = await anthropic.messages.create({
      model:      "claude-sonnet-4-6",
      max_tokens: 1024,
      system:     SYSTEM_PROMPT,
      messages:   history,
    });

    const reply =
      response.content[0]?.type === "text"
        ? response.content[0].text
        : "Извини, не смог сформулировать ответ. Попробуй ещё раз.";

    // Обновляем историю
    history.push({ role: "assistant", content: reply });
    // Ограничиваем размер
    const trimmed = history.slice(-MAX_HISTORY);
    sessions.set(userId, trimmed);

    return reply;
  } catch (err) {
    console.error("AI error:", err);
    // Если AI недоступен — откатываемся к ручному режиму
    return (
      "Сейчас AI временно недоступен. Твой вопрос передан команде — ответим на почту или здесь.\n\n" +
      "Также можно написать на <a href=\"mailto:hello@mentora.su\">hello@mentora.su</a>"
    );
  }
}

// ── Main webhook handler ────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const update = await req.json();
    const message = update?.message;
    if (!message) return NextResponse.json({ ok: true });

    const chatId   = message.chat?.id as number;
    const text     = (message.text ?? "") as string;
    const fromId   = message.from?.id as number;
    const fromName = [message.from?.first_name, message.from?.last_name]
      .filter(Boolean).join(" ") || "Аноним";
    const fromUsername = message.from?.username
      ? `@${message.from.username}` : "без username";

    // ── Successful payment ──────────────────────────────────────────────
    const payment = message.successful_payment;
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
      return NextResponse.json({ ok: true });
    }

    // ── /start ──────────────────────────────────────────────────────────
    if (text.startsWith("/start")) {
      sessions.delete(fromId); // чистим историю при новом старте
      await sendMessage(chatId,
        `Привет! Я AI-ассистент <b>Mentora</b> 👋\n\n` +
        `Помогу разобраться с платформой, отвечу на любые вопросы — про сайт, предметы, тарифы, или просто поболтаем.\n\n` +
        `Просто напиши что тебя интересует.\n\n` +
        `<i>Команды:</i>\n` +
        `/help — частые вопросы\n` +
        `/reset — сбросить историю диалога\n` +
        `/donate — поддержать проект\n\n` +
        `Сайт: <a href="https://mentora.su">mentora.su</a>`
      );
      return NextResponse.json({ ok: true });
    }

    // ── /help ───────────────────────────────────────────────────────────
    if (text === "/help") {
      await sendMessage(chatId,
        `<b>Частые вопросы:</b>\n\n` +
        `• <b>Как начать учиться?</b> — зайди на mentora.su, зарегистрируйся, выбери предмет на дашборде\n\n` +
        `• <b>Лимит сообщений?</b> — сбрасывается каждую ночь в 03:00 МСК\n\n` +
        `• <b>Как загрузить фото задачи?</b> — в чате нажми 📎 рядом с полем ввода\n\n` +
        `• <b>Как получить Pro?</b> — mentora.su/pricing или пригласи друга по реф-ссылке из профиля\n\n` +
        `• <b>Контакт команды:</b> hello@mentora.su\n\n` +
        `Есть другой вопрос? Просто напиши — отвечу!`
      );
      return NextResponse.json({ ok: true });
    }

    // ── /reset ──────────────────────────────────────────────────────────
    if (text === "/reset") {
      sessions.delete(fromId);
      await sendMessage(chatId, "История диалога очищена. Начинаем с чистого листа!");
      return NextResponse.json({ ok: true });
    }

    // ── /donate ─────────────────────────────────────────────────────────
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
      return NextResponse.json({ ok: true });
    }

    if (text.startsWith("/donate_")) {
      const amount = parseInt(text.replace("/donate_", "").trim(), 10);
      if (!isNaN(amount) && amount >= 1 && amount <= 10000) {
        await sendInvoice(chatId, amount);
      } else {
        await sendMessage(chatId, "Укажи сумму от 1 до 10000 Stars. Например: /donate_100");
      }
      return NextResponse.json({ ok: true });
    }

    // ── Admin reply: /reply_CHATID message ──────────────────────────────
    if (text.startsWith("/reply_") && String(chatId) === String(ADMIN_CHAT_ID)) {
      const parts    = text.split(" ");
      const targetId = parts[0].replace("/reply_", "");
      const reply    = parts.slice(1).join(" ");
      if (targetId && reply) {
        await sendMessage(targetId, `💬 <b>Ответ от команды Mentora:</b>\n\n${reply}`);
        await sendMessage(ADMIN_CHAT_ID, "✅ Ответ отправлен");
      }
      return NextResponse.json({ ok: true });
    }

    // ── AI response for all other messages ──────────────────────────────
    await sendTyping(chatId); // показываем "печатает..."

    const aiReply = await getAIReply(fromId, text);
    await sendMessage(chatId, aiReply);

    // Уведомляем админа о новом обращении (только первое сообщение в сессии, тихо)
    const history = sessions.get(fromId) ?? [];
    if (history.length <= 2 && ADMIN_CHAT_ID) {
      await sendMessage(ADMIN_CHAT_ID,
        `📨 <b>Новый диалог поддержки</b>\n` +
        `👤 ${fromName} (${fromUsername}, ID: <code>${fromId}</code>)\n` +
        `💬 ${text.slice(0, 200)}`
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Telegram webhook error:", e);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, service: "Mentora AI support bot" });
}
