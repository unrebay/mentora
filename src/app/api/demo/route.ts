import Anthropic from "@anthropic-ai/sdk";
import { acquireAnthropicSlot } from "@/lib/anthropic-queue";
import { NextRequest, NextResponse } from "next/server";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  ...(process.env.ANTHROPIC_BASE_URL ? { baseURL: process.env.ANTHROPIC_BASE_URL } : {}),
  ...(process.env.VERCEL_BYPASS_SECRET ? { defaultHeaders: { "x-vercel-protection-bypass": process.env.VERCEL_BYPASS_SECRET } } : {}),
});

const DEMO_LIMIT = 5;
const COOKIE_NAME = "demo_count";

// C4: server-side IP rate limit (backstop in addition to the cookie, which a
// scripted client can just drop). Per-instance in-memory, best-effort.
const recentByIp = new Map<string, number[]>();
const RL_WINDOW_MS = 24 * 60 * 60 * 1000; // 24h, matches the cookie lifetime
const RL_MAX = 20;                        // ~4 demo users behind one NAT before we throttle
function ipFromReq(req: NextRequest): string {
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  const xff = req.headers.get("x-forwarded-for")?.split(",").map((s) => s.trim()).filter(Boolean) ?? [];
  return xff[xff.length - 1] ?? "unknown";
}
function ipRateLimited(ip: string): boolean {
  const now = Date.now();
  const arr = (recentByIp.get(ip) ?? []).filter((t) => now - t < RL_WINDOW_MS);
  if (arr.length >= RL_MAX) { recentByIp.set(ip, arr); return true; }
  arr.push(now); recentByIp.set(ip, arr); return false;
}

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

    // C4: server-side IP backstop so dropping the cookie doesn't grant unlimited calls
    if (ipRateLimited(ipFromReq(req))) {
      return NextResponse.json(
        { error: "demo_limit_reached", used: DEMO_LIMIT, limit: DEMO_LIMIT },
        { status: 429 }
      );
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

    // ── Streamed demo answer ──────────────────────────────────────────────
    // Same pattern as the main chat: text deltas flow immediately (~1s to first
    // words instead of ~6s of blank waiting — this is the FIRST thing a guest
    // tries), then a trailing META event carries {used, remaining, limit}.
    // Concurrency slot taken before streaming → overload still yields clean 429.
    const releaseSlot = await acquireAnthropicSlot();

    const newCount = usedCount + 1;
    const remaining = DEMO_LIMIT - newCount;
    const enc = new TextEncoder();
    const META = "\u001e__MENTORA_META__\u001e";

    const streamBody = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          controller.enqueue(enc.encode("\u200b")); // immediate first byte
          const ms = anthropic.messages.stream({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 800,
            system: SYSTEM_PROMPT,
            messages: [
              ...safeHistory,
              { role: "user", content: message },
            ],
          }, { timeout: 60_000, maxRetries: 1 });
          for await (const ev of ms) {
            if (ev.type === "content_block_delta" && ev.delta.type === "text_delta") {
              controller.enqueue(enc.encode(ev.delta.text));
            }
          }
          await ms.finalMessage();
          releaseSlot();
          controller.enqueue(enc.encode(META + JSON.stringify({ used: newCount, remaining, limit: DEMO_LIMIT })));
          controller.close();
        } catch (streamErr) {
          releaseSlot();
          console.error("Demo stream error:", streamErr);
          try { controller.enqueue(enc.encode(META + JSON.stringify({ error: "stream_failed" }))); } catch { /* client gone */ }
          controller.close();
        }
      },
    });

    const res = new NextResponse(streamBody, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "X-Accel-Buffering": "no",
      },
    });

    // Set cookie (counted up-front — headers must go out before the stream)
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
    // Request queue full or timed out
    if (
      err instanceof Error &&
      ("code" in err) &&
      ((err as NodeJS.ErrnoException).code === "QUEUE_FULL" ||
       (err as NodeJS.ErrnoException).code === "QUEUE_TIMEOUT")
    ) {
      return NextResponse.json(
        { error: "rate_limited", message: "Mentora сейчас занята — попробуй через пару секунд" },
        { status: 429 }
      );
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
