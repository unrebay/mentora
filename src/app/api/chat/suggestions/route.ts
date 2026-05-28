import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  ...(process.env.ANTHROPIC_BASE_URL ? { baseURL: process.env.ANTHROPIC_BASE_URL } : {}),
});

export async function POST(req: NextRequest) {
  try {
    const { subject, subjectTitle, history, locale } = await req.json();
    if (!subject || !Array.isArray(history) || history.length < 2) {
      return NextResponse.json({ suggestions: [] });
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ suggestions: [] });

    // Last 3 exchanges (up to 6 messages) — enough context, keep prompt short
    const recent = history
      .filter((m: { role: string }) => m.role === "user" || m.role === "assistant")
      .slice(-6);

    const dialog = recent
      .map((m: { role: string; content: string }) =>
        m.role === "user"
          ? `Ученик: ${m.content.slice(0, 180)}`
          : `Mentora: ${m.content.slice(0, 280)}`
      )
      .join("\n\n");

    const isRu = locale !== "en";

    const prompt = isRu
      ? `Предмет: «${subjectTitle}».

Последний диалог:
${dialog}

Предложи ровно 3 коротких вопроса (не длиннее 7 слов каждый), которые ученик с высокой вероятностью захочет спросить следующим. Опирайся на то, что было только что объяснено — предугадай любопытство, упомяни то, что ещё не обсуждали. Мягкий, разговорный стиль.

Ответь строго JSON-массивом из 3 строк, без комментариев:
["вопрос 1", "вопрос 2", "вопрос 3"]`
      : `Subject: «${subjectTitle}».

Recent dialogue:
${dialog}

Suggest exactly 3 short follow-up questions (max 7 words each) the student is most likely to ask next. Build on what was just explained — anticipate curiosity, hint at topics not yet covered. Conversational, soft tone.

Respond strictly as a JSON array of 3 strings, no commentary:
["question 1", "question 2", "question 3"]`;

    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 160,
      temperature: 0.7,
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.content[0]?.type === "text" ? response.content[0].text.trim() : "";
    const match = text.match(/\[[\s\S]*?\]/);
    if (!match) return NextResponse.json({ suggestions: [] });

    const raw: unknown[] = JSON.parse(match[0]);
    const suggestions = raw
      .filter((s): s is string => typeof s === "string" && s.trim().length > 0)
      .slice(0, 3);

    return NextResponse.json({ suggestions });
  } catch (e) {
    console.error("[suggestions]", e);
    return NextResponse.json({ suggestions: [] });
  }
}
