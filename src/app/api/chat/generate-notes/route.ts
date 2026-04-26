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
    const { subject, subjectTitle, messages } = await req.json();

    if (!subject || !Array.isArray(messages) || messages.length < 2) {
      return NextResponse.json({ error: "Insufficient data" }, { status: 400 });
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Ultra-only feature
    const { data: profile } = await supabase
      .from("users")
      .select("plan")
      .eq("id", user.id)
      .single();

    if (profile?.plan !== "ultima") {
      return NextResponse.json({ error: "Ultra plan required" }, { status: 403 });
    }

    // Build conversation text for Claude
    const dialogText = messages
      .filter((m: { role: string; content: string }) => m.role === "user" || m.role === "assistant")
      .slice(-30)
      .map((m: { role: string; content: string }) =>
        m.role === "user" ? `Ученик: ${m.content}` : `Mentora: ${m.content}`
      )
      .join("\n\n");

    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1500,
      system: `Ты составляешь учебный конспект по теме "${subjectTitle}" на основе диалога ученика с AI-ментором.
Выведи структурированный JSON в точном формате без лишнего текста:
{
  "title": "название темы из диалога (точное, конкретное)",
  "summary": "краткое резюме темы 2-3 предложения",
  "keyPoints": ["ключевой факт 1", "ключевой факт 2", ...],
  "terms": [{"term": "термин", "definition": "определение"}, ...],
  "practiceQuestion": "один вопрос для самопроверки"
}
Правила: keyPoints — 4-7 пунктов, terms — 3-5 важнейших терминов, всё строго на русском.`,
      messages: [{ role: "user", content: `Вот диалог:\n\n${dialogText}` }],
    });

    const text = (response.content[0] as { type: string; text: string }).text.trim();

    // Extract JSON from response (Claude sometimes wraps in ```json)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");

    const notes = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ notes, subjectTitle });

  } catch (err) {
    console.error("generate-notes error:", err);
    return NextResponse.json({ error: "Failed to generate notes" }, { status: 500 });
  }
}
