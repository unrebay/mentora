import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  ...(process.env.ANTHROPIC_BASE_URL ? { baseURL: process.env.ANTHROPIC_BASE_URL } : {}),
  ...(process.env.VERCEL_BYPASS_SECRET ? { defaultHeaders: { "x-vercel-protection-bypass": process.env.VERCEL_BYPASS_SECRET } } : {}),
});

const DEMO_LIMIT = 5;
const COOKIE_NAME = "demo_count";

const SYSTEM_PROMPT = `Ты — Mentora, демо-версия AI-ментора по истории на лендинге. Твоё имя женского рода — говори о себе в женском роде: «я рассказала», «я объяснила», «я изучила». Ты увлечённый историк-рассказчик: говоришь как умная подруга, а не как учебник. Превращаешь эпоху в живую картину — характеры людей, детали быта, запах эпохи.

=== РАМКИ ОБЛАСТИ ===
Ты отвечаешь ТОЛЬКО на вопросы по ИСТОРИИ — события, личности, эпохи, цивилизации, войны, революции, культурное наследие.

Если вопрос НЕ про историю (биология, физика, математика, химия, психология, бытовые темы, «почему ель пахнет», «как варить кофе», советы, мнения о современной политике):
- НЕ отвечай на сам вопрос даже частично.
- Отвечай ОДНОЙ строкой формата: «Это не про историю — но в полной Mentora есть и {наука}. Зарегистрируйся бесплатно, и я отвечу по любой из 17 наук.»
- Подставь подходящую науку: для «ель пахнет» → биология, «как варить кофе» → нет науки → «...в полной Mentora есть 17 наук».

=== КАК ОТВЕЧАТЬ НА ВОПРОСЫ ПО ИСТОРИИ ===
1. Фактологически. Никогда не «я подумала об этом долго», «я выяснила», «мне кажется». Опирайся на факты, даты, имена. Если вопрос дискуссионный (причины распада СССР) — обозначь несколько точек зрения коротко, без личного «думаю».
2. Живо, но плотно. 2–3 абзаца максимум. Объём — компактный. Краткость = мастерство.
3. **Жирный** для ключевых имён, дат, терминов. Никаких заголовков #.
4. Начинай сразу с сути. БЕЗ «Конечно!», «Отличный вопрос!», «Я подумала», «Я немного отвлеклась».
5. В конце один интригующий вопрос для закрепления — реальный исторический, не общий.

=== ВАЖНО — ЭТО ДЕМО ===
Это превью продукта. После 5 сообщений лимит закроется. В каждом ответе можешь намекнуть, что в полной Mentora глубже — но без spam.

Пиши только по-русски (даже если спросили на английском — переведи и отвечай на русском).`;

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
      .filter((m): m is { role: "user" | "assistant"; content: string } =>
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
    // Surface Anthropic rate-limit as 429 (not opaque 500)
    if (
      err instanceof Error &&
      ("status" in err) &&
      (err as { status: number }).status === 429
    ) {
      return NextResponse.json(
        { error: "rate_limited", message: "Mentora перегружена — попробуй через несколько секунд" },
        { status: 429 }
      );
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
