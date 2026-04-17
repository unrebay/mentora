import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  ...(process.env.ANTHROPIC_BASE_URL ? { baseURL: process.env.ANTHROPIC_BASE_URL } : {}),
  ...(process.env.VERCEL_BYPASS_SECRET ? { defaultHeaders: { "x-vercel-protection-bypass": process.env.VERCEL_BYPASS_SECRET } } : {}),
});

const DEMO_LIMIT = 5;
const COOKIE_NAME = "demo_count";

const SYSTEM_PROMPT = `Ты — Mentora, персональный AI-ментор по истории. Твоё имя женского рода — всегда говори о себе в женском роде: «я рассказала», «я думаю», «мне кажется», «я изучила». Ты увлечённый историк-рассказчик: говоришь как умная подруга, а не как учебник. Умеешь превратить любую эпоху в живую картину — с характерами людей, деталями быта, запахом эпохи.

Правила:
1. Рассказывай живо — с образами, сравнениями, короткими историями внутри ответа
2. В конце задай один интригующий вопрос для закрепления
3. Объём: 2–4 абзаца. Краткость — признак мастерства
4. Форматирование: **жирный** для ключевых имён и дат. Никаких заголовков #
5. Начинай сразу с сути — без "Конечно!", "Отличный вопрос!" и прочих пустых фраз
6. Пиши по-русски`;

export async function POST(req: NextRequest) {
  try {
    const { message, history } = await req.json();

    // Input validation
    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json({ error: "Empty message" }, { status: 400 });
    }
    if (message.length > 2000) {
      return NextResponse.json({ error: "Message too long" }, { status: 400 });
    }

    // Read demo usage counter from cookie (httpOnly — not forgeable from JS)
    const countCookie = req.cookies.get(COOKIE_NAME);
    const rawCount = parseInt(countCookie?.value ?? "0", 10);
    const usedCount = Number.isFinite(rawCount) && rawCount >= 0 ? rawCount : DEMO_LIMIT;

    if (usedCount >= DEMO_LIMIT) {
      return NextResponse.json(
        { error: "demo_limit_reached", used: usedCount, limit: DEMO_LIMIT },
        { status: 429 }
      );
    }

    // Sanitize history: only valid role/content pairs, cap at 6 turns
    const safeHistory = (Array.isArray(history) ? history : [])
      .filter((m): m is { role: string; content: string } =>
        m && (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" && m.content.length <= 2000
      )
      .slice(-6);

    // Get AI response
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 800,
      system: SYSTEM_PROMPT,
      messages: [
        ...safeHistory,
        { role: "user", content: message },
      ],
    });

    const assistantMessage =
      response.content[0].type === "text" ? response.content[0].text : "";

    const newCount = usedCount + 1;
    const remaining = DEMO_LIMIT - newCount;

    const res = NextResponse.json({
      message: assistantMessage,
      used: newCount,
      remaining,
      limit: DEMO_LIMIT,
    });

    // Set cookie (session cookie — expires when browser closes)
    res.cookies.set(COOKIE_NAME, String(newCount), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return res;
  } catch (err) {
    console.error("Demo API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
