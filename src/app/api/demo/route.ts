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

    if (!message?.trim()) {
      return NextResponse.json({ error: "Empty message" }, { status: 400 });
    }

    // Read demo usage counter from cookie
    const countCookie = req.cookies.get(COOKIE_NAME);
    const usedCount = parseInt(countCookie?.value ?? "0", 10);

    if (usedCount >= DEMO_LIMIT) {
      return NextResponse.json(
        { error: "demo_limit_reached", used: usedCount, limit: DEMO_LIMIT },
        { status: 429 }
      );
    }

    // Get AI response
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 800,
      system: SYSTEM_PROMPT,
      messages: [
        ...((history ?? []).slice(-6)),
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
