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

const DAILY_LIMIT = 20;

// Subject display names for system prompt
const SUBJECT_NAME: Record<string, string> = {
  "russian-history": "истории России",
  "world-history": "всемирной истории",
  "mathematics": "математике",
  "physics": "физике",
  "chemistry": "химии",
  "biology": "биологии",
  "russian-language": "русскому языку",
  "literature": "литературе",
  "english": "английскому языку",
  "social-studies": "обществознанию",
  "geography": "географии",
  "computer-science": "информатике и программированию",
  "astronomy": "астрономии",
};

// --- Personalization guides (module-level constants, not recreated per request) ---
const STYLE_GUIDE: Record<string, string> = {
  storytelling:
    "Рассказывай через живые примеры и аналогии. Сначала — захватывающий факт, образ или неожиданный угол зрения, потом — объяснение сути.",
  facts:
    "Структурируй ответ чётко: от определения к принципу, от принципа к примеру. Акцент на логике, закономерностях и точных формулировках. Минимум лирики — максимум точности.",
  practice:
    "Чередуй краткое объяснение с вопросом-заданием. После ответа пользователя — оценивай, поправляй, углубляй. Твоя главная задача — проверить понимание, а не просто рассказать.",
};

const LEVEL_GUIDE: Record<string, string> = {
  school:
    "Ученик — школьник, готовится к урокам или ЕГЭ/ОГЭ. Используй простой язык, школьную терминологию. Объясняй в контексте школьной программы, давай примеры из учебника, упоминай типовые форматы заданий и экзаменов по предмету.",
  student:
    "Ученик — студент вуза. Можно использовать академическую лексику, упоминать научные дискуссии, называть исследователей и теории. Ожидает глубины, а не упрощений.",
  adult:
    "Ученик — взрослый, учится для себя. Говори как с умным человеком без снобизма. Проводи параллели с практикой и личным опытом — это цепляет.",
  expert:
    "Ученик — глубокий знаток предмета. Веди как с коллегой: полемизируй, указывай на дискуссионные вопросы, называй конкретные источники и авторитетов. Не разжёвывай очевидное.",
};

const GOAL_GUIDE: Record<string, string> = {
  exam: "Цель — сдать ЕГЭ/ОГЭ. В конце каждого ответа добавляй блок '📝 Для экзамена:' с 1-2 ключевыми фактами/формулами в формате, удобном для запоминания.",
  general:
    "Цель — общее развитие. Показывай связи между темами, широкий контекст. Объясняй, почему это важно понимать.",
  professional:
    "Цель — профессиональная. Акцентируй глубину, методологию, дискуссионные вопросы предметной области. Давай ссылки на конкретные работы и научные подходы.",
  curiosity:
    "Цель — просто интересно. Выделяй самые неожиданные, малоизвестные или парадоксальные детали. Заражай интересом к предмету.",
};

export async function POST(req: NextRequest) {
  try {
    const { message, subject, history, imageData, imageMimeType } = await req.json();

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

    // Get user profile
    const { data: profile } = await supabase
      .from("users")
      .select(
        "onboarding_style, onboarding_level, onboarding_goal, plan, messages_today, messages_date, trial_expires_at"
      )
      .eq("id", user.id)
      .single();

    // --- Daily limit check ---
    const isTrialActive = profile?.trial_expires_at
      ? new Date(profile.trial_expires_at) > new Date()
      : false;
    const isPro = profile?.plan === "pro" || profile?.plan === "ultima" || isTrialActive;
    const isUltima = profile?.plan === "ultima";
    const today = new Date().toISOString().slice(0, 10);
    const isNewDay = profile?.messages_date !== today;
    const usedToday = isNewDay ? 0 : (profile?.messages_today ?? 0);
    if (!isPro && usedToday >= DAILY_LIMIT) {
      return NextResponse.json(
        { error: "limit_reached", messagesRemaining: 0 },
        { status: 429 }
      );
    }

    // Get user memory for this subject
    const { data: memory } = await supabase
      .from("user_memory")
      .select("memory_json")
      .eq("user_id", user.id)
      .eq("subject", subject)
      .single();

    // RAG: embed the user message and search knowledge base
    // Wrapped in try/catch — if OpenAI or search_knowledge fails, fall back to empty context
    let ragContext = "База знаний пока пуста. Отвечай на основе своих знаний.";
    try {
      // Use Supabase Edge Function for embeddings (avoids OpenAI geo-blocking)
      const embedResp = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/embed`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({ input: message }),
      });
      const embedData = await embedResp.json();
      const queryEmbedding = embedData.embedding as number[];

      const { data: chunks } = await supabase.rpc("search_knowledge", {
        query_embedding: queryEmbedding,
        subject_filter: subject,
        match_count: 5,
      });

      if (chunks?.length) {
        ragContext = chunks
          .map((c: { content: string; topic: string }) => `[${c.topic}]\n${c.content}`)
          .join("\n\n");
      }
    } catch (ragErr) {
      console.error("RAG error (non-blocking):", ragErr);
      // Continue with empty context
    }

    // Build personalized system prompt
    const style = profile?.onboarding_style ?? "storytelling";
    const level = profile?.onboarding_level ?? "adult";
    const goal = profile?.onboarding_goal ?? "general";
    const subjectLabel = SUBJECT_NAME[subject] ?? subject;
    const isEnglish = subject === "english";

    const systemPrompt = `Ты — Mentora, персональный AI-ментор по ${subjectLabel}. Твоё имя женского рода — всегда говори о себе в женском роде: «я рассказала», «я думаю», «мне кажется». Говоришь как умная подруга, а не как учебник.${isEnglish ? "\n\nЯЗЫК: Объяснения давай на русском, но примеры, задания и диалоги — на английском." : ""}

ПРОФИЛЬ УЧЕНИКА:
- Стиль подачи: ${STYLE_GUIDE[style]}
- Уровень: ${LEVEL_GUIDE[level]}
- Цель: ${GOAL_GUIDE[goal]}

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
— «объясни по-другому» → другой подход: формально → дай аналогию; абстрактно → привяжи к практике; сложно → разбей на шаги.`;

    // Save user message
    await supabase.from("chat_messages").insert({
      user_id: user.id,
      subject,
      role: "user",
      content: message,
    });

    // Get AI response — use vision model if Ultima user sends an image
    const hasImage = isUltima && imageData && imageMimeType;
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
        ...((history ?? []).slice(-10)),
        { role: "user", content: userTurnContent },
      ],
    });

    const assistantMessage =
      response.content[0].type === "text" ? response.content[0].text : "";

    // Save assistant response
    await supabase.from("chat_messages").insert({
      user_id: user.id,
      subject,
      role: "assistant",
      content: assistantMessage,
      tokens_used: response.usage.input_tokens + response.usage.output_tokens,
    });

    // Update message counter + last_active_at
    const newUsedToday = usedToday + 1;
    await supabase
      .from("users")
      .update({
        messages_today: newUsedToday,
        messages_date: today,
        last_active_at: new Date().toISOString(),
      })
      .eq("id", user.id);

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
      messagesRemaining: isPro ? null : DAILY_LIMIT - newUsedToday,
      trialExpiresAt: profile?.trial_expires_at ?? null,
    });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error("Chat API error:", errMsg);
    return NextResponse.json({ error: "Internal server error", detail: errMsg }, { status: 500 });
  }
}
