import { NextRequest, NextResponse } from "next/server";

// Best-effort admin notification on auth failures — fire-and-forget
function notifyAdmin(text: string) {
  const BOT_TOKEN = process.env.TELEGRAM_SUPPORT_BOT_TOKEN;
  const ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID;
  if (!BOT_TOKEN || !ADMIN_CHAT_ID) return;
  fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: ADMIN_CHAT_ID, text, parse_mode: "HTML" }),
  }).catch(() => {});
}

export async function POST(req: NextRequest) {
  try {
    const { tab, message, stack, componentStack } = await req.json().catch(() => ({}));
    if (typeof tab !== "string" || typeof message !== "string") {
      return NextResponse.json({ error: "bad payload" }, { status: 400 });
    }
    console.error(`[admin/${tab}] client crash`, { message, stack: stack?.slice(0, 500) });
    const summary =
      `🚨 <b>Admin tab «${tab}» crashed</b>\n` +
      `<code>${message.slice(0, 300)}</code>\n\n` +
      (stack ? `<pre>${stack.slice(0, 600).replace(/</g, "&lt;")}</pre>\n` : "") +
      (componentStack ? `Component:\n<pre>${componentStack.slice(0, 400).replace(/</g, "&lt;")}</pre>` : "");
    notifyAdmin(summary);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
