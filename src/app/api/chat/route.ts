import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  ...(process.env.ANTHROPIC_BASE_URL ? { baseURL: process.env.ANTHROPIC_BASE_URL } : {}),
  ...(process.env.VERCEL_BYPASS_SECRET ? { defaultHeaders: { "x-vercel-protection-bypass": process.env.VERCEL_BYPASS_SECRET } } : {}),
});
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const WINDOW_HOURS = 24;
const WINDOW_LIMIT = 20;

// Subject display names for system prompt
const SUBJECT_NAME: Record<string, string> = {
  "russian-history": "\u0438\u0441\u0442\u043e\u0440\u0438\u0438 \u0420\u043e\u0441\u0441\u0438\u0438",
  "world-history": "\u0432\u0441\u0435\u043c\u0438\u0440\u043d\u043e\u0439 \u0438\u0441\u0442\u043e\u0440\u0438\u0438",
  "mathematics": "\u043c\u0430\u0442\u0435\u043c\u0430\u0442\u0438\u043a\u0435",
  "physics": "\u0444\u0438\u0437\u0438\u043a\u0435",
  "chemistry": "\u0445\u0438\u043c\u0438\u0438",
  "biology": "\u0431\u0438\u043e\u043b\u043e\u0433\u0438\u0438",
  "russian-language": "\u0440\u0443\u0441\u0441\u043a\u043e\u043c\u0443 \u044f\u0437\u044b\u043a\u0443",
  "literature": "\u043b\u0438\u0442\u0435\u0440\u0430\u0442\u0443\u0440\u0435",
  "english": "\u0430\u043d\u0433\u043b\u0438\u0439\u0441\u043a\u043e\u043c\u0443 \u044f\u0437\u044b\u043a\u0443",
  "social-studies": "\u043e\u0431\u0449\u0435\u0441\u0442\u0432\u043e\u0437\u043d\u0430\u043d\u0438\u044e",
  "geography": "\u0433\u0435\u043e\u0433\u0440\u0430\u0444\u0438\u0438",
  "computer-science": "\u0438\u043d\u0444\u043e\u0440\u043c\u0430\u0442\u0438\u043a\u0435 \u0438 \u043f\u0440\u043e\u0433\u0440\u0430\u043c\u043c\u0438\u0440\u043e\u0432\u0430\u043d\u0438\u044e",
  "astronomy": "\u0430\u0441\u0442\u0440\u043e\u043d\u043e\u043c\u0438\u0438",
  "discovery": "\u0440\u0430\u0441\u0448\u0438\u0440\u0435\u043d\u0438\u044e \u043a\u0440\u0443\u0433\u043e\u0437\u043e\u0440\u0430",
};

// --- Personalization guides (module-level constants, not recreated per request) ---
const STYLE_GUIDE: Record<string, string> = {
  storytelling: "Рассказывай через живые примеры и аналогии. Сначала — захватывающий факт, образ, или неожиданный угол зрения, потом — объяснение сути.",
  facts: "Структурируй ответ чётко: от определения к принципу, от принципа к примеру. Акцент на логике, закономерностях и точных формулировках. Минимум лирики — максимум точности.",
  practice: "Чередуй краткое объяснение с вопросом-заданием. После ответа пользователя — оценивай, поправляй, углубляй. Твоя главная задача — проверить понимание, а не просто рассказать.",
};

const LEVEL_GUIDE: Record<string, string> = {
  school: "Ученик — школьник, готовится к урокам или ЕГЭ/ОГЭ. Используй простой язык, школьную терминологию. Объясняй в контексте школьной программы, давай примеры из учебника, упоминай типовые форматы заданий и экзаменов по предмету.",
  student: "Ученик — студент вуза. Можно использовать академическую лексику, упоминать научные дискуссии, называть исследователей и теории. Ожидает глубины, а не упрощений.",
  adult: "Ученик — взрослый, учится для себя. Говори как с умным человеком без снобизма. Проводи параллели с практикой и личным опытом — это цепляет.",
  expert: "Ученик — глубокий знаток предмета. Веди как с коллегой: полемизируй, указывай на дискуссионные вопросы, называй конкретные источники и авторитетов. Не разжёвывай очевидное.",
};

const GOAL_GUIDE: Record<string, string> = {
  exam: "Цель — сдать ЕГЭ/ОГЭ. В конце каждого ответа добавляй блок '📝 Для экзамена:' с 1-2 ключевыми фактами/формулами в формате, удобном для запоминания.",
  general: "Цель — общее развитие. Показывай связи между темами, широкий контекст. Объясняй, почему это важно понимать.",
  professional: "Цель — профессиональная. Акцентируй глубину, методологию, дискуссионные вопросы предметной области. Давай ссылки на конкретные работы и научные подходы.",
  curiosity: "Цель — просто интересно. Выделяй самые неожиданные, малоизвестные или парадоксальные детали. Заражай интересом к предмету.",
};

export async function POST(req: NextRequest) {
  try {
    const { message, subject, history, imageData, imageMimeType } = await req.json();

    // Input validation
    if (!message || typeof message !== "string" || message.length > 4000) {
      return NextResponse.json({ error: "Invalid message" }, { status: 400 });
    }
    const VALID_SUBJECTS = ["russian-history","world-history","mathematics","physics","chemistry","biology","russian-language","literature","english","social-studies","geography","computer-science","astronomy","discovery"];
    if (!subject || !VALID_SUBJECTS.includes(subject)) {
      return NextResponse.json({ error: "Invalid subject" }, { status: 400 });
    }
    // Image validation: size guard (~5 MB base64) + MIME type whitelist
    const VALID_MIME_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (imageData && imageData.length > 5_000_000) {
      return NextResponse.json({ error: "Image too large" }, { status: 413 });
    }
    if (imageData && imageMimeType && !VALID_MIME_TYPES.includes(imageMimeType)) {
      return NextResponse.json({ error: "Invalid image type" }, { status: 400 });
    }

    // Auth check
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    );
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Get user profile (no messages_today/window — handled atomically below)
    const { data: profile } = await supabase
      .from("users")
      .select("onboarding_style, onboarding_level, onboarding_goal, plan, trial_expires_at")
      .eq("id", user.id)
      .single();

    // --- Plan check ---
    const isTrialActive = profile?.trial_expires_at
      ? new Date(profile.trial_expires_at) > new Date()
      : false;
    const isPro = profile?.plan === "pro" || profile?.plan === "ultima" || isTrialActive;
    const isUltima = profile?.plan === "ultima";

    // Atomic window check-and-increment for free users (prevents race condition)
    let messagesRemaining: number | null = null;
    let windowResetAt: string | null = null;

    if (!isPro) {
      const { data: windowRows } = await supabase.rpc("increment_messages_window", {
        p_user_id: user.id,
        p_window_hours: WINDOW_HOURS,
        p_window_limit: WINDOW_LIMIT,
      });
      const w = windowRows?.[0];
      if (!w?.allowed) {
        const resetTs = w?.messages_window_start
          ? new Date(new Date(w.messages_window_start).getTime() + WINDOW_HOURS * 3600000).toISOString()
          : new Date(Date.now() + WINDOW_HOURS * 3600000).toISOString();
        return NextResponse.json(
          { error: "limit_reached", messagesRemaining: 0, resetAt: resetTs },
          { status: 429 }
        );
      }
      messagesRemaining = Math.max(0, WINDOW_LIMIT - (w?.messages_today ?? WINDOW_LIMIT));
      windowResetAt = w?.messages_window_start
        ? new Date(new Date(w.messages_window_start).getTime() + WINDOW_HOURS * 3600000).toISOString()
        : null;
    } else {
      // Pro: fire-and-forget last_active_at update
      supabase.from("users").update({ last_active_at: new Date().toISOString() }).eq("id", user.id);
    }

    // Parallel: fetch user memory + RAG embeddings simultaneously
    const [memoryResult, ragContext] = await Promise.all([
      supabase
        .from("user_memory")
        .select("memory_json")
        .eq("user_id", user.id)
        .eq("subject", subject)
        .single(),
      (async (): Promise<string> => {
        try {
          const embedResp = await fetch(
            `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/embed`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
              },
              body: JSON.stringify({ input: message }),
              signal: AbortSignal.timeout(5000),
            }
          );
          const embedData = await embedResp.json();
          const queryEmbedding = embedData.embedding as number[];
          const { data: chunks } = await supabase.rpc("search_knowledge", {
            query_embedding: queryEmbedding,
            subject_filter: subject,
            match_count: 5,
          });
          if (chunks?.length) {
            return chunks
              .map((c: { content: string; topic: string }) => `[${c.topic}]\n${c.content}`)
              .join("\n\n");
          }
        } catch (ragErr) {
          console.error("RAG error (non-blocking):", ragErr);
        }
        return "База знаний пока пуста. Отвечай на основе своих знаний.";
      })(),
    ]);

    const memory = memoryResult.data;

    // Build personalized system prompt
    const style = profile?.onboarding_style ?? "storytelling";
    const level = profile?.onboarding_level ?? "adult";
    const goal = profile?.onboarding_goal ?? "general";
    const subjectLabel = SUBJECT_NAME[subject] ?? subject;
    const isEnglish = subject === "english";
    const planLabel = isUltima ? "Ultima (максимальный тариф, безлимитные сообщения, загрузка фото задач)" : isPro ? "Pro (безлимитные сообщения)" : "Free (лимит сообщений в день)";

    const isDiscovery = subject === "discovery";
    const systemPrompt = isDiscovery
      ? `Ты — Mentora, проводник по удивительному миру знаний. Говоришь как умная подруга с широким кругозором.

ТВОЯ СУПЕРСИЛА — соединять знания из разных областей. Когда рассказываешь факт — показывай неожиданную связь.

ПРОФИЛЬ: Стиль: ${STYLE_GUIDE[profile?.onboarding_style ?? "storytelling"]} | Уровень: ${LEVEL_GUIDE[profile?.onboarding_level ?? "adult"]}

БАЗА ЗНАНИЙ: ${ragContext}

ПРАВИЛА: начинай с факта, **жирный** для ключевого, 2–4 абзаца, в конце вопрос. Акцент на культурах разных народов.`
      : `Ты — Mentora, персональный AI-ментор по ${subjectLabel}. Твоё имя женского рода — всегда говори о себе в женском роде: «я рассказала», «я думаю», «мне кажется». Говоришь как умная подруга, а не как учебник.${isEnglish ? "\n\nЯЗЫК: Объяснения давай на русском, но примеры, задания и диалоги — на английском." : ""}

ПРОФИЛЬ УЧЕНИКА:
- Стиль подачи: ${STYLE_GUIDE[style]}
- Уровень: ${LEVEL_GUIDE[level]}
- Цель: ${GOAL_GUIDE[goal]}
- Тариф: ${planLabel}

ПАМЯТЬ О ПОЛЬЗОВАТЕЛЕ:
${JSON.stringify(memory?.memory_json ?? {})}

БАЗА ЗНАНИЙ (используй как основу — приоритет над общими знаниями):
${ragContext}

ПРАВИЛА:
1. Следуй стилю, уровню и цели ученика — это главное
2. Начинай сразу с сути — без "Конечно!", "Отличный вопрос!", "Рад помочь"
3. Форматирование: **жирный** для ключевых терминов и фактов; - или 1. 2. 3. для списков; никаких заголовков # и разделителей ---
4. Объём: 3–5 абзацев (для practice-стиля — короче, с упором на задание)
5. В конце — один цепляющий вопрос для закрепления (кроме practice, где вопрос-задание встроен)
6. Если база знаний пуста — отвечай по своим знаниям, не упоминая об этом явно
7. Пиши по-русски (кроме английского языка — там примеры на английском)
8. Если не уверена в точной второстепенной дате или малоизвестной детали — скажи об этом легко, вплетая в ответ: «точную дату лучше сверь в учебнике — ориентировочно это [год/период]». Без акцента и извинений — как умная подруга, которая просто честна

ДИНАМИКА СЛОЖНОСТИ (анализируй историю диалога):
— Путается, пишет «не понимаю», отвечает неверно 2 раза подряд → упрости: сократи объём, дай бытовую аналогию, разбей на шаги. Без объявлений — просто сделай.
— Правильно отвечает, задаёт глубокие вопросы, просит больше деталей 2 раза подряд → усложняй: добавляй нюансы, альтернативные точки зрения, академический контекст.

СПЕЦИАЛЬНЫЕ РЕЖИМЫ:
— «проверь меня»/«квиз»/«тест» → 5 вопросов по очереди, после каждого: ✓/✗ + одна строка. В конце: X/5 и одна рекомендация.
— «итог»/«что я узнал» → 3–5 ключевых тезисов из диалога в формате «📌 [Факт]».
— «объясни по-другому» → другой подход: формально → дай аналогию; абстрактно → привяжи к практике; сложно → разбей на шаги.${isEnglish ? `
— «режим носителя»/«native mode»/«native»/«speak only English»/«включи режим носителя» → переключись полностью на английский. Говори как молодой носитель языка в переписке с другом: живой, разговорный, естественный язык. НИКАКОГО русского — ни слова. Если темы ещё нет, предложи интересную для разговора. Оставайся в этом режиме до конца диалога или пока пользователь явно не попросит вернуться.
— «back to Russian»/«вернись на русский»/«switch back»/«выключи режим носителя» → вернись к обычному режиму: объяснения на русском, примеры и диалоги — на английском.` : ""}`;

    // Save user message
    await supabase.from("chat_messages").insert({
      user_id: user.id,
      subject,
      role: "user",
      content: message,
    });

    // Get AI response — use vision model if Ultima user sends an image
    const hasImage = isUltima && imageData && imageMimeType && VALID_MIME_TYPES.includes(imageMimeType);
    const userTurnContent = hasImage
      ? [
          {
            type: "image" as const,
            source: {
              type: "base64" as const,
              media_type: imageMimeType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
              data: imageData,
            },
          },
          { type: "text" as const, text: message || "Объясни решение задачи на фотографии. Разбери подробно, шаг за шагом." },
        ]
      : message;

    const response = await anthropic.messages.create({
      model: hasImage ? "claude-sonnet-4-6" : "claude-haiku-4-5-20251001",
      max_tokens: hasImage ? 2048 : 1024,
      system: systemPrompt,
      messages: [
        ...((history ?? []).filter((m: {role: string}) => m.role === "user" || m.role === "assistant").slice(-10)),
        { role: "user", content: userTurnContent },
      ],
    });

    const firstContent = response.content[0];
    if (firstContent.type !== "text") throw new Error("Unexpected response type: " + firstContent.type);
    const assistantMessage = firstContent.text;
    // Guard: never save an empty response to DB
    if (!assistantMessage.trim()) {
      throw new Error("Empty assistant response");
    }

    // Save assistant response
    await supabase.from("chat_messages").insert({
      user_id: user.id,
      subject,
      role: "assistant",
      content: assistantMessage,
      tokens_used: response.usage.input_tokens + response.usage.output_tokens,
    });

    // Update XP atomically (+10 per message) — non-blocking
    try {
      await supabase.rpc("increment_xp", {
        p_user_id: user.id,
        p_subject: subject,
        p_amount: 10,
      });
    } catch (xpErr) {
      console.error("XP update failed (non-blocking):", xpErr);
    }

    return NextResponse.json({
      message: assistantMessage,
      messagesRemaining,
      resetAt: windowResetAt,
      trialExpiresAt: profile?.trial_expires_at ?? null,
    });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error("Chat API error:", errMsg);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
