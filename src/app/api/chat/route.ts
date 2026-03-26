import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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

    // Get user profile for personalization
    const { data: profile } = await supabase
      .from("users")
      .select("onboarding_style, onboarding_level, onboarding_goal")
      .eq("id", user.id)
      .single();

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

    // System prompt
    const systemPrompt = `Ты — Алексей, AI-ментор по истории на платформе Mentora. Ты увлечённый историк-рассказчик: говоришь как умный друг, а не как учебник. Умеешь превратить любую эпоху в живую картину — с характерами людей, деталями быта, запахом эпохи.

Профиль ученика:
- Стиль: ${profile?.onboarding_style ?? "simple"}
- Уровень: ${profile?.onboarding_level ?? "beginner"}
- Цель: ${profile?.onboarding_goal ?? "изучить предмет"}

Память о пользователе:
${JSON.stringify(memory?.memory_json ?? {})}

База знаний:
${ragContext}

Правила:
1. Рассказывай живо — с образами, сравнениями, короткими историями внутри ответа
2. Используй базу знаний выше как основу. Если она пуста — честно предупреди одной строкой и отвечай по памяти
3. В конце задай один интригующий вопрос для закрепления — не скучный, а такой, чтобы захотелось думать
4. Объём: 3–5 абзацев. Краткость — признак мастерства
5. Форматирование: **жирный** для ключевых имён и дат, списки через - для перечислений. Никаких заголовков #
6. Начинай сразу с сути — без "Конечно!", "Отличный вопрос!" и прочих пустых фраз
7. Пиши по-русски`;

    // Save user message to DB
    await supabase.from("chat_messages").insert({
      user_id: user.id,
      subject,
      role: "user",
      content: message,
    });

    // Get AI response (Haiku for speed/cost)
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

    // Save assistant response to DB
    await supabase.from("chat_messages").insert({
      user_id: user.id,
      subject,
      role: "assistant",
      content: assistantMessage,
      tokens_used: response.usage.input_tokens + response.usage.output_tokens,
    });

    // Upsert user progress (XP +10 per message)
    await supabase.from("user_progress").upsert({
      user_id: user.id,
      subject,
      xp_total: 10,
      last_active_at: new Date().toISOString(),
    }, {
      onConflict: "user_id,subject",
      ignoreDuplicates: false,
    });

    return NextResponse.json({ message: assistantMessage });
  } catch (err) {
    console.error("Chat API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
