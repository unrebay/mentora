import { NextRequest, NextResponse } from "next/server";

const BOT_TOKEN = process.env.TELEGRAM_SUPPORT_BOT_TOKEN ?? "";
const ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID ?? "";

async function sendMessage(chatId: string | number, text: string, parseMode = "HTML") {
  if (!BOT_TOKEN) return;
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: parseMode }),
  });
}

async function sendInvoice(chatId: string | number, amount: number) {
  if (!BOT_TOKEN) return;
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendInvoice`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      title: "Поддержать Mentora",
      description: "Каждый рубль идёт на серверы, AI-модели и новые функции платформы.",
      payload: `donate_${chatId}_${Date.now()}`,
      currency: "XTR", // Telegram Stars
      prices: [{ label: "Поддержка проекта", amount }],
    }),
  });
}

export async function POST(req: NextRequest) {
  try {
    const update = await req.json();
    const message = update?.message;
    if (!message) return NextResponse.json({ ok: true });

    const chatId = message.chat?.id;
    const text = message.text ?? "";
    const fromName = [message.from?.first_name, message.from?.last_name].filter(Boolean).join(" ") || "Аноним";
    const fromUsername = message.from?.username ? `@${message.from.username}` : "без username";
    const fromId = message.from?.id;

    // /start command
    if (text.startsWith("/start")) {
      await sendMessage(chatId,
        "👋 Привет! Это поддержка <b>Mentora</b>.\n\n" +
        "Напиши своё сообщение — мы получим его и ответим в ближайшее время.\n\n" +
        "Хочешь поддержать проект? Напишите /donate\n\n" +
        "Сайт: <a href=\"https://mentora.su\">mentora.su</a>"
      );
      return NextResponse.json({ ok: true });
    }

    // /donate command — send Stars invoice with amount options
    if (text === "/donate") {
      await sendMessage(chatId,
        "💙 Спасибо, что хочешь поддержать Mentora!\n\n" +
        "Выбери сумму в Telegram Stars:\n" +
        "/donate_50 — 50 Stars\n" +
        "/donate_100 — 100 Stars\n" +
        "/donate_250 — 250 Stars\n" +
        "/donate_500 — 500 Stars\n\n" +
        "Или напиши /donate_[число] — любую сумму."
      );
      return NextResponse.json({ ok: true });
    }

    if (text.startsWith("/donate_")) {
      const raw = text.replace("/donate_", "").trim();
      const amount = parseInt(raw, 10);
      if (!isNaN(amount) && amount >= 1 && amount <= 10000) {
        await sendInvoice(chatId, amount);
      } else {
        await sendMessage(chatId, "Укажи сумму от 1 до 10000 Stars. Например: /donate_100");
      }
      return NextResponse.json({ ok: true });
    }

    // Handle successful payment
    const payment = update?.message?.successful_payment;
    if (payment) {
      await sendMessage(chatId,
        `💙 Огромное спасибо! Получили ${payment.total_amount} Stars.\n` +
        "Это очень помогает развитию Mentora!"
      );
      if (ADMIN_CHAT_ID) {
        await sendMessage(ADMIN_CHAT_ID,
          `⭐ Донат: ${payment.total_amount} Stars от ${fromName} (${fromUsername}, ID: ${fromId})`
        );
      }
      return NextResponse.json({ ok: true });
    }

    // Forward to admin
    if (ADMIN_CHAT_ID) {
      const adminText =
        `📨 <b>Новое обращение в поддержку</b>\n\n` +
        `👤 <b>От:</b> ${fromName} (${fromUsername})\n` +
        `🆔 <b>Chat ID:</b> <code>${fromId}</code>\n\n` +
        `💬 <b>Сообщение:</b>\n${text}\n\n` +
        `↩️ Чтобы ответить: /reply_${chatId} [текст]`;
      await sendMessage(ADMIN_CHAT_ID, adminText);
    }

    // Admin reply command: /reply_CHATID message
    if (text.startsWith("/reply_") && String(chatId) === String(ADMIN_CHAT_ID)) {
      const parts = text.split(" ");
      const targetId = parts[0].replace("/reply_", "");
      const reply = parts.slice(1).join(" ");
      if (targetId && reply) {
        await sendMessage(targetId, `💬 <b>Ответ от поддержки Mentora:</b>\n\n${reply}`);
        await sendMessage(ADMIN_CHAT_ID, "✅ Ответ отправлен");
        return NextResponse.json({ ok: true });
      }
    }

    // Auto-reply to user
    await sendMessage(chatId,
      "✅ Получили ваше сообщение! Ответим в ближайшее время.\n\n" +
      "Также можно написать на почту: <a href=\"mailto:hello@mentora.su\">hello@mentora.su</a>"
    );

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Telegram webhook error:", e);
    return NextResponse.json({ ok: false }, { status: 200 }); // always 200 for Telegram
  }
}

// Used to verify webhook setup
export async function GET() {
  return NextResponse.json({ ok: true, service: "Mentora support bot webhook" });
}
