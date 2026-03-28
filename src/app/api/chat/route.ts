import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const DAILY_LIMIT = 30;

export async function POST(req: NextRequest) {
  try {
    const { message, subject, history } = await req.json();

    // Auth check
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Get user profile
    const { data: profile } = await supabase
      .from("users")
      .select("onboarding_style, onboarding_level, onboarding_goal, plan, messages_today, messages_date, trial_expires_at")
      .eq("id", user.id)
      .single();

    // --- Daily limit check ---
    const isTrialActive = profile?.trial_expires_at
      ? new Date(profile.trial_expires_at) > new Date()
      : false;
    const isPro = profile?.plan === "pro" || isTrialActive;
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
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
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: message,
    });
    const queryEmbedding = embeddingResponse.data[0].embedding;

    const { data: chunks } = await supabase.rpc("search_knowledge", {
      query_embedding: queryEmbedding,
      subject_filter: subject,
      match_count: 5,
    });

    const ragContext = chunks?.length
      ? chunks.map((c: { content: string; topic: string }) => `[${c.topic}]\n${c.content}`).join("\n\n")
      : "База знаний пока пуста. Отвечай на основе своих знаний, но предупреди об этом.";

    // Build personalized system prompt
    const style  = profile?.onboarding_style ?? "storytelling";
    const level  = profile?.onboarding_level ?? "adult";
    const goal   = profile?.onboarding_goal  ?? "general";

    const styleGuide: Record<string, string> = {
      storytelling: "Рассказывай через живые образы и истории: характеры людей, детали быта, запах эпохи. Сначала — захватывающий момент или деталь, потом — объяснение.",
      facts:        "Структурируй ответ чётко: причины → события → следствия → даты. Акцент на хронологии и причинно-следственных связях. Минимум лирики — максимум точности.",
      practice:     "Чередуй краткое объяснение с вопросом-заданием. После ответа пользователя — оценивай, поправляй, углубляй. Твоя главная задача — проверить понимание, а не просто рассказать.",
    };

    const levelGuide: Record<string, string> = {
      school:  "Ученик — школьник, готовится к урокам или ЕГЭ/ОГЭ. Используй простой язык, школьную терминологию. Привязывай к кодификатору ЕГЭ: упоминай номера периодов, типовые формулировки заданий, ключевые понятия из критериев.",
      student: "Ученик — студент вуза. Можно использовать академическую лексику, упоминать историографические дискуссии, называть исследователей. Ожидает глубины, а не упрощений.",
      adult:   "Ученик — взрослый, учится для себя. Говори как с умным человеком без научного снобизма. Проводи параллели с современностью и личным опытом — это цепляет.",
      expert:  "Ученик — историк или глубокий знаток. Веди как с коллегой: полемизируй, указывай на дискуссионные вопросы, называй конкретные источники и историков. Не разжёвывай очевидное.",
    };

    const goalGuide: Record<string, string> = {
      exam:         "Цель — сдать ЕГЭ/ОГЭ. В конце каждого ответа добавляй блок '📝 Для экзамена:' с 1-2 ключевыми фактами/датами в формате, удобном для запоминания.",
      general:      "Цель — общее развитие. Показывай связи между эпохами, глобальный контекст. Объясняй, почему это важно понимать сегодня.",
      professional: "Цель — профессиональная. Акцентируй аналитику, источниковедение, историографию. Давай ссылки на конкретные труды и дискуссии.",
      curiosity:    "Цель — просто интересно. Выделяй самые неожиданные, малоизвестные или парадоксальные детали. Люби историю вслух — заражай интересом.",
    };

    const systemPrompt = `Ты — Mentora, персональный AI-ментор по истории. Твоё имя женского рода — всегда говори о себе в женском роде: «я рассказала», «я думаю», «мне кажется», «я изучила». Говоришь как умная подруга, а не как учебник.

ПРОФИЛЬ УЧЕНИКА:
- Стиль подачи: ${styleGuide[style]}
- Уровень: ${levelGuide[level]}
- Цель: ${goalGuide[goal]}

ПАМЯТЬ О ПОЛЬЗОВАТЕЛЕ:
${JSON.stringify(memory?.memory_json ?? {})}

БАЗА ЗНАНИЙ (используй как основу — приоритет над общими знаниями):
${ragContext}

ПРАВИЛА:
1. Следуй стилю, уровню и цели ученика — это главное
2. Начинай сразу с сути — без "Конечно!", "Отличный вопрос!", "Рад помочь"
3. Форматирование: **жирный** для ключевых имён и дат; - для списков; никаких заголовков #
4. Объём: 3–5 абзацев (для practice-стиля — короче, с упором на задание)
5. В конце — один цепляющий вопрос для закрепления (кроме practice, где вопрос-задание встроен)
6. Если база знаний пуста — одна строка "ℹ️ База знаний по этой теме пока пополняется" и далее по памяти
7. Пиши по-русски`;

    // Save user message
    await supabase.from("chat_messages").insert({
      user_id: user.id,
      subject,
      role: "user",
      content: message,
    });

    // Get AI response
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        ...((history ?? []).slice(-10)),
        { role: "user", content: message },
      ],
    });

    const assistantMessage = response.content[0].type === "text"
      ? response.content[0].text
      : "";

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
    await supabase.from("users").update({
      messages_today: newUsedToday,
      messages_date: today,
      last_active_at: new Date().toISOString(),
    }).eq("id", user.id);

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

    const messagesRemaining = isPro ? null : DAILY_LIMIT - newUsedToday;

    return NextResponse.json({
      message: assistantMessage,
      messagesRemaining,
      trialExpiresAt: profile?.trial_expires_at ?? null,
    });
  } catch (err) {
    console.error("Chat API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
