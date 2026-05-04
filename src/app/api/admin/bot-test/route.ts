import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import Anthropic from "@anthropic-ai/sdk";
import { BOT_PLATFORM_KNOWLEDGE } from "@/lib/bot-knowledge";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const SYSTEM_TEXT = `Ты — AI-ассистент поддержки образовательной платформы Mentora (mentora.su).
В конце ответа добавляй ОДИН тег: [ESCALATE: причина] для эскалации, или [OK] если эскалация не нужна.

Знания о платформе:
${BOT_PLATFORM_KNOWLEDGE}`;

export async function POST(req: NextRequest) {
  const forbidden = await requireAdmin();
  if (forbidden) return forbidden;

  let body: { message?: string };
  try { body = await req.json(); } catch { body = {}; }
  const message = body.message ?? "Привет, расскажи что такое Mentora";

  const env = {
    BOT_TOKEN_set: !!(process.env.TELEGRAM_SUPPORT_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN),
    ADMIN_CHAT_ID_set: !!process.env.TELEGRAM_ADMIN_CHAT_ID,
    ANTHROPIC_API_KEY_set: !!process.env.ANTHROPIC_API_KEY,
    ANTHROPIC_BASE_URL: process.env.ANTHROPIC_BASE_URL ? "set" : "direct",
  };

  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY ?? "",
    baseURL: process.env.ANTHROPIC_BASE_URL || undefined,
  });

  const start = Date.now();
  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      system: SYSTEM_TEXT,
      messages: [{ role: "user", content: message }],
    });
    const ms = Date.now() - start;
    const raw = response.content[0]?.type === "text" ? response.content[0].text : "<no text>";

    const escalateMatch = raw.match(/\[ESCALATE:\s*([^\]]+)\]/i);
    const userReply = raw
      .replace(/\[ESCALATE:[^\]]+\]/gi, "")
      .replace(/\[OK\]/gi, "")
      .replace(/\[SUPPORT_CODE:[^\]]+\]/gi, "")
      .trim();

    return NextResponse.json({
      ok: true,
      env,
      ms,
      input: message,
      raw,
      escalate: escalateMatch ? escalateMatch[1].trim() : null,
      userReply,
      userReplyLength: userReply.length,
    });
  } catch (err) {
    return NextResponse.json({
      ok: false,
      env,
      ms: Date.now() - start,
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack?.slice(0, 500) : undefined,
    });
  }
}
