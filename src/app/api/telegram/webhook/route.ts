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
        "Сайт: <a href=\"https://mentora.su\">mentora.su</a>"
      );
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
