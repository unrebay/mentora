import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import Anthropic from "@anthropic-ai/sdk";
import { acquireAnthropicSlot } from "@/lib/anthropic-queue";
import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import { getEffectivePlan, LEVEL_REWARDS, computeNewReward } from "@/lib/plan";
import { notifyAdmin, mskNow } from "@/lib/notifyAdmin";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  timeout: 25_000,   // 25s — fail fast instead of hanging for minutes
  maxRetries: 3,     // SDK-level retries on transient 503/network errors
  ...(process.env.ANTHROPIC_BASE_URL ? { baseURL: process.env.ANTHROPIC_BASE_URL } : {}),
  ...(process.env.VERCEL_BYPASS_SECRET ? { defaultHeaders: { "x-vercel-protection-bypass": process.env.VERCEL_BYPASS_SECRET } } : {}),
});
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });


// ── XP level detection ────────────────────────────────────────────────────────
const XP_LEVELS_API = [
  { name: "Новичок", nameEn: "Beginner", minXP: 0 },
  { name: "Исследователь", nameEn: "Explorer", minXP: 100 },
  { name: "Знаток", nameEn: "Adept", minXP: 300 },
  { name: "Историк", nameEn: "Scholar", minXP: 600 },
  { name: "Эксперт", nameEn: "Expert", minXP: 1000 },
];
function getLevelName(xp: number, locale?: string): string {
  const level = [...XP_LEVELS_API].reverse().find(l => xp >= l.minXP) ?? XP_LEVELS_API[0];
  return locale === "en" ? level.nameEn : level.name;
}
function getLevelColor(level: string): string {
  const colors: Record<string, string> = {
    "Исследователь": "#4561E8", "Explorer": "#4561E8",
    "Знаток": "#7C3AED", "Adept": "#7C3AED",
    "Историк": "#f59e0b", "Scholar": "#f59e0b",
    "Эксперт": "#d97706", "Expert": "#d97706",
  };
  return colors[level] ?? "#4561E8";
}
// Nominative subject titles — used in level-up messages so case-declension
// issues (e.g. «в Английский язык» vs «в английскому языку») never arise.
const SUBJECT_TITLE_RU: Record<string, string> = {
  "russian-history": "История России",
  "world-history": "Всемирная история",
  "mathematics": "Математика",
  "physics": "Физика",
  "chemistry": "Химия",
  "biology": "Биология",
  "russian-language": "Русский язык",
  "literature": "Литература",
  "english": "Английский язык",
  "social-studies": "Обществознание",
  "geography": "География",
  "computer-science": "Информатика",
  "astronomy": "Астрономия",
  "discovery": "Расширение кругозора",
  "psychology": "Психология",
  "economics": "Экономика",
  "philosophy": "Философия",
};
const SUBJECT_TITLE_EN: Record<string, string> = {
  "russian-history": "Russian History",
  "world-history": "World History",
  "mathematics": "Mathematics",
  "physics": "Physics",
  "chemistry": "Chemistry",
  "biology": "Biology",
  "russian-language": "Russian Language",
  "literature": "Literature",
  "english": "English",
  "social-studies": "Social Studies",
  "geography": "Geography",
  "computer-science": "Computer Science",
  "astronomy": "Astronomy",
  "discovery": "Discovery",
  "psychology": "Psychology",
  "economics": "Economics",
  "philosophy": "Philosophy",
};

function getLevelUpMessage(newLevel: string, subjectId: string, locale?: string): string {
  if (locale === "en") {
    const title = SUBJECT_TITLE_EN[subjectId] ?? subjectId;
    const msgs: Record<string, string> = {
      "Explorer": `Explorer level — «${title}»! You already know more than most beginners. Keep going — every question makes you stronger.`,
      "Adept": `Adept — «${title}»! Your effort is clear. Mentora sees your progress — keep it up.`,
      "Scholar": `Scholar — «${title}»! Impressive results. You're one step from the top — don't stop now.`,
      "Expert": `Expert — «${title}», the pinnacle! You're among those who reached the top. Mentora is proud of you.`,
    };
    return msgs[newLevel] ?? `New level — ${newLevel}!`;
  }
  const title = SUBJECT_TITLE_RU[subjectId] ?? subjectId;
  // Tag pattern «Уровень — «Название»!» keeps the title in nominative as a
  // standalone tag (like a book title), avoiding any case-declension errors.
  const msgs: Record<string, string> = {
    "Исследователь": `Уровень Исследователя — «${title}»! Ты уже знаешь больше большинства новичков. Продолжай — каждый вопрос делает тебя сильнее.`,
    "Знаток": `Знаток — «${title}»! Твои усилия очевидны. Ментора видит прогресс — так держать.`,
    "Историк": `Историк — «${title}»! Серьёзный результат. До вершины один шаг — не останавливайся.`,
    "Эксперт": `Эксперт — «${title}», вершина! Ты в числе тех, кто дошёл до конца. Ментора гордится.`,
  };
  return msgs[newLevel] ?? `Новый уровень — ${newLevel}!`;
}

const WINDOW_HOURS = 8;
const WINDOW_LIMIT = 10;

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
  "psychology": "\u043f\u0441\u0438\u0445\u043e\u043b\u043e\u0433\u0438\u0438",
  "economics": "\u044d\u043a\u043e\u043d\u043e\u043c\u0438\u043a\u0435",
  "philosophy": "\u0444\u0438\u043b\u043e\u0441\u043e\u0444\u0438\u0438",
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

// ── English equivalents ────────────────────────────────────────────────────────
const STYLE_GUIDE_EN: Record<string, string> = {
  storytelling: "Tell through vivid examples and analogies. Start with a captivating fact, image, or unexpected angle, then explain the core idea.",
  facts: "Structure clearly: definition → principle → example. Focus on logic, patterns, and precise wording. Minimize narrative — maximize precision.",
  practice: "Alternate brief explanations with tasks. After the student's answer: evaluate, correct, deepen. Your goal is to check understanding, not just explain.",
};
const LEVEL_GUIDE_EN: Record<string, string> = {
  school: "Student is a school pupil preparing for exams. Use simple language and school terminology.",
  student: "Student is a university student. Academic vocabulary welcome. Expects depth, not simplifications.",
  adult: "Student is an adult learning for personal growth. Speak as with an intelligent person. Draw parallels to real life and practice.",
  expert: "Student is a domain expert. Engage as with a colleague: debate, reference sources, point out controversies.",
};
const GOAL_GUIDE_EN: Record<string, string> = {
  exam: "Goal: pass an exam. At the end of each answer add a '📝 For the exam:' block with 1-2 key facts/formulas.",
  general: "Goal: general knowledge. Show connections between topics, broad context. Explain why this matters.",
  professional: "Goal: professional use. Emphasize depth, methodology, open questions. Reference specific works and academic approaches.",
  curiosity: "Goal: just curious. Highlight the most unexpected, little-known or paradoxical details. Inspire genuine interest.",
};

export async function POST(req: NextRequest) {
  // C3: if we count a free-tier message but generation then fails, refund it.
  let freeMsgToRefund: string | null = null;
  try {
    const { message, subject, history, imageData, imageMimeType, locale } = await req.json();
    const isEnLocale = locale === "en";

    // Input validation
    if (!message || typeof message !== "string" || message.length > 4000) {
      return NextResponse.json({ error: "Invalid message" }, { status: 400 });
    }
    const VALID_SUBJECTS = ["russian-history","world-history","mathematics","physics","chemistry","biology","russian-language","literature","english","social-studies","geography","computer-science","astronomy","discovery","psychology","economics","philosophy"];
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
      .select("onboarding_style, onboarding_level, onboarding_goal, plan, plan_expires_at, trial_expires_at, streak_reward_claimed, reward_plan, reward_expires_at, display_name, visit_streak")
      .eq("id", user.id)
      .single();

    // --- Plan check (accounts for paid plan + trial + level reward) ---
    const effectivePlan = getEffectivePlan(profile ?? {});
    const isPro   = effectivePlan === "pro" || effectivePlan === "ultima";
    const isUltima = effectivePlan === "ultima";

    // Perf: run the free-limit window check, user-memory fetch, and RAG embedding
    // all in parallel. The window RPC is independent of memory/RAG, so overlapping
    // them removes its round-trip (~50-80ms) from the critical path on every allowed
    // free message. We await all three together, so the early-return paths below have
    // no orphaned in-flight promise; on a blocked/errored request the only cost is one
    // already-issued embed call (rare, ~$0.00002).
    type Citation = { id: number; topic: string; source: string | null; snippet: string };
    type WindowOutcome =
      | { kind: "ok"; messagesRemaining: number | null; windowResetAt: string | null }
      | { kind: "error" }
      | { kind: "limit"; resetAt: string };

    let messagesRemaining: number | null = null;
    let windowResetAt: string | null = null;

    const windowPromise: Promise<WindowOutcome> = (async (): Promise<WindowOutcome> => {
      if (isPro) {
        // Pro/Ultra: fire-and-forget last_active_at update
        void supabase.from("users").update({ last_active_at: new Date().toISOString() }).eq("id", user.id).then(null, (e: unknown) => console.error("last_active_at update failed:", e));
        return { kind: "ok", messagesRemaining: null, windowResetAt: null };
      }
      // Atomic window check-and-increment for free users (prevents race condition)
      const { data: windowRows, error: windowError } = await supabase.rpc("increment_messages_window", {
        p_user_id: user.id,
        p_window_hours: WINDOW_HOURS,
        p_window_limit: WINDOW_LIMIT,
      });
      if (windowError || !windowRows?.[0]) {
        // RPC failed — do NOT false-positive 429. Let caller retry.
        console.error("increment_messages_window error:", windowError?.message ?? "empty result");
        return { kind: "error" };
      }
      const w = windowRows[0];
      // Window resets WINDOW_HOURS after it started — compute from window_start returned by RPC
      const windowResetISO = (() => {
        if (w.messages_window_start) {
          const d = new Date(w.messages_window_start);
          d.setTime(d.getTime() + WINDOW_HOURS * 3600_000);
          return d.toISOString();
        }
        // Fallback: WINDOW_HOURS from now
        return new Date(Date.now() + WINDOW_HOURS * 3600_000).toISOString();
      })();
      if (!w.allowed) {
        return { kind: "limit", resetAt: windowResetISO };
      }
      freeMsgToRefund = user.id; // C3: this message was counted — refund if we fail below
      // Free: also update last_active_at so admin "active today" count is accurate
      void supabase.from("users").update({ last_active_at: new Date().toISOString() }).eq("id", user.id).then(null, (e: unknown) => console.error("last_active_at update failed:", e));
      return {
        kind: "ok",
        messagesRemaining: Math.max(0, WINDOW_LIMIT - (w.messages_today ?? 1)),
        windowResetAt: windowResetISO,
      };
    })();

    // Parallel: window check + user memory + RAG embeddings simultaneously
    const [windowOutcome, memoryResult, ragData] = await Promise.all([
      windowPromise,
      supabase
        .from("user_memory")
        .select("memory_json")
        .eq("user_id", user.id)
        .eq("subject", subject)
        .single(),
      (async (): Promise<{ contextText: string; citations: Citation[] }> => {
        // RAG-gate: skip embed+search for short or command-style messages where the
        // knowledge base is irrelevant (greetings, "quiz", "summary", "explain again",
        // mode triggers). Saves an OpenAI embed call + a vector search + latency.
        // Conservative gate: skip RAG ONLY for exact command/acknowledgement phrases
        // where the knowledge base is provably irrelevant. We do NOT gate by length —
        // short factual questions ("Дата ВОВ?") still need RAG. Knowledge base IS
        // populated (e.g. russian-history ~200 chunks), so false-skips would drop citations.
        const msgLower = message.trim().toLowerCase().replace(/[!?.…\s]+$/, "");
        const SKIP_EXACT = new Set(["спасибо", "спс", "thanks", "thank you", "ок", "ok", "окей", "понял", "понятно", "ясно", "got it", "ещё", "еще", "more", "продолжи", "continue", "квиз", "quiz", "тест", "test me", "итог", "summarize", "what did i learn", "что я узнал"]);
        if (SKIP_EXACT.has(msgLower) && !imageData) {
          return { contextText: "База знаний пока пуста. Отвечай на основе своих знаний.", citations: [] };
        }
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
            const citations: Citation[] = chunks.map(
              (c: { content: string; topic: string; source?: string }, i: number) => ({
                id: i + 1,
                topic: c.topic,
                source: c.source ?? null,
                snippet: c.content,
              })
            );
            const contextText = chunks
              .map((c: { content: string; topic: string; source?: string }, i: number) => {
                const src = c.source ? ` (источник: ${c.source})` : "";
                return `[${i + 1}] [${c.topic}]${src}\n${c.content}`;
              })
              .join("\n\n");
            return { contextText, citations };
          }
        } catch (ragErr) {
          console.error("RAG error (non-blocking):", ragErr);
        }
        return { contextText: "База знаний пока пуста. Отвечай на основе своих знаний.", citations: [] };
      })(),
    ]);

    // Evaluate the free-limit outcome AFTER the parallel await (no orphaned promise).
    if (windowOutcome.kind === "error") {
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
    if (windowOutcome.kind === "limit") {
      return NextResponse.json(
        { error: "limit_reached", messagesRemaining: 0, resetAt: windowOutcome.resetAt },
        { status: 429 }
      );
    }
    messagesRemaining = windowOutcome.messagesRemaining;
    windowResetAt = windowOutcome.windowResetAt;

    const ragContext = ragData.contextText;
    const citations = ragData.citations;
    const memory = memoryResult.data;

    // ── Adaptive learning signals ─────────────────────────────────────────
    const mem = (memory?.memory_json ?? {}) as Record<string, unknown>;
    const userName = profile?.display_name ? (profile.display_name as string).split(" ")[0] : null;
    const lastTopic = (mem.last_topic as string | undefined) ?? null;
    const masteredTopics: string[] = Array.isArray(mem.mastered_topics) ? (mem.mastered_topics as string[]).slice(0, 8) : [];
    const difficultyAreas: string[] = Array.isArray(mem.difficulty_areas) ? (mem.difficulty_areas as string[]).slice(0, 5) : [];
    const interests: string[] = Array.isArray(mem.interests) ? (mem.interests as string[]).slice(0, 5) : [];
    const learningPace: string = (mem.learning_pace as string) ?? "medium";
    const preferredDepth: string = (mem.preferred_depth as string) ?? "standard";
    const sessionCount: number = ((mem.session_count as number) ?? 0) + 1;
    const lastSeen: string | null = (mem.last_seen as string) ?? null;
    const daysSinceLastSeen: number | null = lastSeen
      ? Math.floor((Date.now() - new Date(lastSeen).getTime()) / 86400000)
      : null;
    const isReturning = sessionCount > 1 && !!lastTopic;
    const today = new Date().toISOString().split("T")[0];

    // Build personalized system prompt
    const style = profile?.onboarding_style ?? "storytelling";
    const level = profile?.onboarding_level ?? "adult";
    const goal = profile?.onboarding_goal ?? "general";
    const subjectLabel = SUBJECT_NAME[subject] ?? subject;
    const isEnglish = subject === "english";

    const planLabel = isUltima
      ? (isEnLocale ? "Ultra (max plan)" : "Ultra (максимальный тариф)")
      : isPro
      ? "Pro"
      : "Free";

    // ── Adaptive context blocks from user memory ────────────────────────────
    const buildAdaptiveBlock = (lang: "ru" | "en"): string => {
      const lines: string[] = [];
      if (lang === "ru") {
        if (userName) lines.push(`ИМЯ ПОЛЬЗОВАТЕЛЯ: ${userName}. Обращайся по имени 1–2 раза за сессию — в начале первого ответа и изредка при похвале. Не злоупотребляй.`);
        if (isReturning && lastTopic) {
          const dayStr = daysSinceLastSeen === 0 ? "сегодня" : daysSinceLastSeen === 1 ? "вчера" : `${daysSinceLastSeen} дн. назад`;
          lines.push(`КОНТЕКСТ ВОЗВРАТА: Пользователь возвращается (был ${dayStr}), последняя тема — «${lastTopic}». На первое сообщение этой сессии (history пустая или ≤2 сообщ.) — кратко и тепло восстанови контекст: предложи «Продолжим с ${lastTopic}?» или сделай мостик. Если пользователь сам задаёт новый вопрос — адаптируйся естественно.`);
        }
        if (masteredTopics.length > 0) lines.push(`ОСВОИЛ ХОРОШО: ${masteredTopics.join(", ")} — не объясняй с нуля, переходи к нюансам.`);
        if (difficultyAreas.length > 0) lines.push(`ТРУДНОСТИ: ${difficultyAreas.join(", ")} — будь терпелива, используй аналогии, разбивай на шаги.`);
        if (interests.length > 0) lines.push(`ИНТЕРЕСЫ: ${interests.join(", ")} — при возможности приводи примеры из этих областей.`);
        const paceRu: Record<string, string> = { fast: "быстрый — плотная подача, без долгих вступлений", slow: "медленный — больше примеров и повторений", medium: "средний" };
        lines.push(`ТЕМП: ${paceRu[learningPace] ?? paceRu.medium}.`);
        const depthRu: Record<string, string> = { deep: "любит детали — можно идти вглубь и давать академический контекст", surface: "предпочитает краткость — сжатые ответы с главным", standard: "баланс полноты и краткости" };
        lines.push(`ГЛУБИНА: ${depthRu[preferredDepth] ?? depthRu.standard}.`);
      } else {
        if (userName) lines.push(`USER NAME: ${userName}. Use it 1–2 times per session — opening and occasionally when praising. Natural, not repetitive.`);
        if (isReturning && lastTopic) {
          const dayStr = daysSinceLastSeen === 0 ? "today" : daysSinceLastSeen === 1 ? "yesterday" : `${daysSinceLastSeen} days ago`;
          lines.push(`RETURN CONTEXT: User is back (last here ${dayStr}), last topic was "${lastTopic}". On first message this session (history empty or ≤2 msgs) — warmly reconnect: "Want to continue with ${lastTopic}?" or bridge naturally. If they ask something new — adapt, don't force a callback.`);
        }
        if (masteredTopics.length > 0) lines.push(`MASTERED: ${masteredTopics.join(", ")} — skip basics, go to nuance.`);
        if (difficultyAreas.length > 0) lines.push(`STRUGGLES: ${difficultyAreas.join(", ")} — extra patient: analogies, small steps.`);
        if (interests.length > 0) lines.push(`INTERESTS: ${interests.join(", ")} — use these for examples.`);
        const paceEn: Record<string, string> = { fast: "fast — dense info, skip preambles", slow: "slow — more examples and repetition", medium: "medium" };
        lines.push(`PACE: ${paceEn[learningPace] ?? paceEn.medium}.`);
        const depthEn: Record<string, string> = { deep: "loves details — go deep, add academic context", surface: "prefers brevity — concise key-point answers only", standard: "balance completeness with conciseness" };
        lines.push(`DEPTH: ${depthEn[preferredDepth] ?? depthEn.standard}.`);
      }
      return lines.length > 0 ? `\nАДАПТИВНЫЙ ПРОФИЛЬ:\n${lines.join("\n")}` : "";
    };
    const ADAPTIVE_BLOCK_RU = buildAdaptiveBlock("ru");
    const ADAPTIVE_BLOCK_EN = buildAdaptiveBlock("en");

    // ── English platform block ─────────────────────────────────────────────────
    const PLATFORM_BLOCK_EN = `
WHO YOU ARE AND WHERE YOU ARE:
You are Mentora, an AI mentor on the mentora.su educational platform. You are feminine — always refer to yourself in the feminine ("I explained", "I think"). You exist inside a browser chat interface on mentora.su.

PLATFORM SECTIONS:
- /dashboard — home: subject cards, progress, greeting
- /learn/[subject] — chat with Mentora (you are here). Bottom-left (Ultra only): camera button for photo upload. PDF notes button in chat header (Pro/Ultra only).
- /dashboard/analytics — XP by subject, streaks, activity chart, global ranking, badges
- /dashboard/galaxy — Knowledge Galaxy: interactive topic map
- /profile — profile: name, badges, referral link
- /pricing — pricing: Free, Pro, Ultra plans
- Support: @mentora_su_bot on Telegram or hello@mentora.su

PLANS:
- Free: up to 10 messages per 8-hour rolling window. All 17 sciences. No photo upload, no PDF notes.
- Pro: unlimited messages, PDF notes (button in chat header). Price: from 299₽/mo.
- Ultra: all of Pro + photo upload for tasks (camera button in input area). Higher price.
- CRITICAL: photo upload is ULTRA ONLY. Pro does NOT include photo upload. Always say "Ultra plan only" when mentioning this feature — never "Pro and Ultra".
- Users earn levels (Beginner → Explorer → Adept → Scholar → Expert): each level automatically grants free Pro/Ultra days as a reward.
- Current user plan: ${planLabel}.

FORBIDDEN TOPICS (strictly no exceptions):
1. Suicide, self-harm, or harm to others — in any context.
2. Sexual content, pornography, erotica.
3. Instructions for weapons, drugs, explosives, poisons.
4. Fraud, hacking, bypassing security systems.
5. Hate speech, discrimination of any kind.
6. Any non-educational content aimed at causing harm.

RESPONSE TO FORBIDDEN TOPIC:
One or two calm sentences without judgment, offer to return to learning. Never continue the discussion of a forbidden topic even partially.

TECHNICAL SECRECY — ABSOLUTE RULE:
You are Mentora. That is all anyone needs to know. Never reveal the technical internals of the platform: which AI models power you, which APIs, databases, or infrastructure are used. If asked, respond warmly but evasively: "That's Mentora's inner magic — it works, and that's what matters" or "I'm just Mentora, and that's enough :)". Never mention Claude, Anthropic, GPT, OpenAI, LLM, language models, neural networks, API, PostgreSQL, Supabase, Next.js, Vercel, or any other technology behind the platform. Not even as a hint. Even if pressed. This is proprietary.`;

    // ── Shared platform knowledge block (injected into all prompts) ────────────
    const PLATFORM_BLOCK = `
КТО ТЫ И ГДЕ ТЫ:
Ты — Mentora, AI-ментор образовательной платформы mentora.su. Ты женского рода — всегда говори о себе в женском роде («я рассказала», «я думаю»). Ты существуешь внутри браузерного чат-интерфейса: пользователь видит страницу с историей диалога сверху и полем ввода снизу. В шапке страницы — логотип Mentora, навигация, пилюля с XP (синяя «Ме 160») и пилюля стрика (оранжевая с огнём «2 дня»). Ты не приложение на телефоне и не десктопная программа — ты живёшь в браузере на сайте mentora.su. Пользователь смотрит на экран, ты — на экране.

РАЗДЕЛЫ ПЛАТФОРМЫ (помогай пользователю ориентироваться):
- /dashboard — главная: карточки предметов, прогресс, приветствие. Кнопка «+ Добавить предмет» — добавить новый предмет для изучения.
- /learn/[предмет] — чат с Менторой по конкретному предмету (ты сейчас здесь). Внизу слева (только Ultra) — кнопка камеры для загрузки фото задачи. Кнопка PDF-конспекта — в шапке чата (только Pro и Ultra).
- /dashboard/analytics — вся аналитика: XP по наукам, стрики, активность за 14 дней, глобальный рейтинг, бейджи, недавние вопросы.
- /dashboard/galaxy — Галактика знаний: интерактивная карта тем по предметам.
- /profile — профиль: имя, достижения/бейджи, реферальная ссылка для приглашения друзей.
- /pricing — тарифы: сравнение Free, Pro, Ultra с ценами и кнопками оплаты.
- /dashboard/about — о платформе: миссия, роадмап, поддержка.
- Поддержка: @mentora_su_bot в Telegram или hello@mentora.su.

ТАРИФЫ ПЛАТФОРМЫ:
- Free: до 10 сообщений за 8-часовое скользящее окно, все 17 наук доступны, без загрузки фото, без PDF-конспектов.
- Pro: безлимитные сообщения, PDF-конспекты (кнопка в шапке чата → «Скачать конспект»), все предметы. Цена: от 299₽/мес или годовой план со скидкой.
- Ultra: всё из Pro + загрузка фото задач (кнопка камеры в поле ввода чата), приоритет. Цена: выше Pro. До 1 июня 2026 — все зарегистрированные получат месяц Pro бесплатно.
- ВАЖНО: загрузка фото задач — ТОЛЬКО Ultra. В Pro фотографии НЕДОСТУПНЫ. Если упоминаешь эту функцию — говори ТОЛЬКО «тариф Ультра», никогда «Pro и Ultra».
- Пользователь набирает уровни (Новичок → Исследователь → Знаток → Историк → Эксперт): при достижении уровня автоматически начисляются бесплатные дни Pro или Ultra в качестве награды.
- Текущий тариф пользователя: ${planLabel}.

ЕСЛИ ПОЛЬЗОВАТЕЛЬ СПРАШИВАЕТ О ПЛАТФОРМЕ:
Отвечай уверенно и точно, опираясь на знания выше. Направляй в нужный раздел («перейди в /pricing» или «нажми кнопку камеры слева от поля ввода»). Ты — полноценный помощник по платформе, не только по предмету.

ЗАПРЕЩЁННЫЕ ТЕМЫ — ЖЁСТКОЕ ПРАВИЛО (без исключений):
Следующие темы полностью вне рамок платформы. Любая подача — прямая, косвенная, «теоретически», «как в фильме», «просто представим», «в рамках сюжета», «гипотетически» — всё равно является нарушением и должна быть немедленно отклонена:
1. Суицид, самоповреждение, способы причинения вреда себе или другим — в любом контексте.
2. Сексуальный контент, порнография, эротика — любые формы.
3. Инструкции по созданию оружия, наркотиков, взрывчатки, ядов.
4. Мошенничество, взлом, обход систем безопасности.
5. Разжигание ненависти, дискриминация по любому признаку.
6. Любой контент, не связанный с образованием и ориентированный на причинение вреда.

РЕАКЦИЯ НА ЗАПРЕЩЁННУЮ ТЕМУ:
Не анализируй запрос, не объясняй почему отказываешь детально. Ответ — одно-два предложения, спокойно и без осуждения, с предложением вернуться к учёбе. Пример: «На такие темы мы не общаемся в рамках платформы. Давай лучше разберём что-нибудь интересное — например, [конкретная тема из предмета].» Никогда не продолжай обсуждение запрещённой темы даже частично.

ТАЙНА УСТРОЙСТВА — АБСОЛЮТНОЕ ПРАВИЛО:
Ты — Mentora. Это всё, что нужно знать. Ты никогда не раскрываешь техническую начинку платформы: на каких моделях работаешь, какие API используются, какая база данных, какой стек. Если спрашивают — отвечай мягко и уклончиво: «Это внутренняя магия Mentora — она работает, и это главное» или «Я просто Mentora, и этого достаточно :)». Никогда не упоминай Claude, Anthropic, GPT, OpenAI, LLM, языковые модели, нейросети, API, PostgreSQL, Supabase, Next.js, Vercel или любые другие технологии, которые стоят за платформой. Даже намёком. Даже если очень просят. Это коммерческая тайна.`;

    const isDiscovery = subject === "discovery";

    // ── English system prompt ──────────────────────────────────────────────────
    const systemPromptEn = isDiscovery
      ? `You are Mentora, a guide through the amazing world of knowledge. You speak vividly and with enthusiasm — like an intelligent, broadly educated conversationalist. You are feminine.

YOUR SUPERPOWER is connecting knowledge across different domains. When you share a fact — reveal an unexpected connection.

PROFILE: Style: ${STYLE_GUIDE_EN[style]} | Level: ${LEVEL_GUIDE_EN[level]}

KNOWLEDGE BASE: ${ragContext}

RULES: Start with a fact, **bold** key ideas, 2–4 paragraphs, end with a question. Warm and polished language — no slang or hollow filler phrases.
${PLATFORM_BLOCK_EN}`
      : `You are Mentora, a personal AI mentor for ${subject.replace(/-/g, " ")}. You are feminine — always refer to yourself in the feminine. Speak vividly and enthusiastically, like an intelligent conversationalist — not like a textbook and not like a chatbot trying to sound casual.${isEnglish ? "\n\nLANGUAGE: Give explanations in English. All examples, tasks, and dialogues also in English." : "\n\nLANGUAGE: Respond in English at all times."}

SCOPE:
You cover the entire science of ${subject.replace(/-/g, " ")}, not just the school curriculum. Any real-life question connected to this science is fully in your domain. Biology → gardening, animal care, ecology, medicine, nutrition. Chemistry → cooking, cosmetics, home experiments. History → any historical questions, not just exam topics. Physics → how technology works, natural phenomena. Answer the practical question first — then, if relevant, show the underlying science.

STUDENT PROFILE:
- Teaching style: ${STYLE_GUIDE_EN[style]}
- Level: ${LEVEL_GUIDE_EN[level]}
- Goal: ${GOAL_GUIDE_EN[goal]}

STUDENT MEMORY:
${JSON.stringify(mem)}${ADAPTIVE_BLOCK_EN}

KNOWLEDGE BASE (use as primary source — prioritize over general knowledge):
${ragContext}

RULES:
1. Follow the student's style, level, and goal — this is the top priority
2. Start immediately with the substance — no "Of course!", "Great question!", "Happy to help"
3. Formatting: **bold** for key terms and facts; - or 1. 2. 3. for lists; no # headers or --- dividers; each list item strictly one line
4. Length: 3–5 paragraphs (for practice style — shorter, focused on tasks). If the topic requires more — wrap up neatly and add: "That covers the essentials — let me know if you want to go deeper." Never cut off mid-sentence.
5. End with one engaging question to consolidate (except practice style, which has the question built in)
6. If the knowledge base is empty — answer from your own knowledge without mentioning it
7. CITATIONS: When you state a fact taken from the KNOWLEDGE BASE (entries in the KNOWLEDGE BASE block below are numbered [1] [2] [3] [4] [5]), add the marker [^N] at the end of the relevant sentence — e.g. "Москва основана в 1147 году[^2]." Only cite when the chunk genuinely supports the fact. Do NOT invent citation numbers. Multiple markers allowed: [^1][^3].
8. ILLUSTRATIONS: if a visual diagram would genuinely help understand — add on a separate line: [IMG: <description, max 50 words>]. Only when truly needed. Description in English, style: "educational illustration, clean vector style".


PEDAGOGICAL TECHNIQUES (apply organically, without announcing):
— Socratic method: when the topic allows discovery through thinking — ask a guiding question INSTEAD of answering directly: "What do you think would happen if...?" / "Why do you think...?". Use when level ≥ adult and question isn't urgent.
— Active recall: if the student asks about a topic already covered in this session — first invite them to recall: "Before I explain — what do you already remember about this?". Then correct and expand.
— Topic connections: if the current question echoes something discussed earlier in this session — point out the connection naturally, without announcing it.
— Metacognition: no more than once every 6–8 messages, add a question about the learning process, not the topic: "How will you remember this?" / "Where will you use this in real life?" / "What was surprising about this?"
— Retrieval check after explaining: after giving a detailed explanation of a new concept — don't end with "does that make sense?" (useless). Instead ask one specific recall or application question: "Now try explaining in your own words: why...?" / "Here's a similar case — what would happen?". One question, not a list.
— Error correction through questions: when the student makes a factual or logical error — don't correct immediately. One guiding question first: "Are you sure about that step? Look at the conditions again" / "What would happen if you applied this to [example]?". If still wrong after the second attempt — gently correct: "Actually, here's what's going on...". No more than one question→answer cycle.
— Mastery before moving on: if the answer shows the topic isn't understood, but the student is already asking the next question — pump the brakes once: "Let me make sure we've got this first — what specifically feels unclear: [name the confusion]?". Use only when confusion is obvious, don't block overall progress.
— Format check at new topic: when the student starts a brand new topic — optionally clarify once: "Would you like an explanation with an example first — or jump straight to a problem?". Don't overuse: if it's already clear what they need — just do it."

COMPLEXITY DYNAMICS:
— Student is confused, says "I don't understand", answers incorrectly twice in a row → simplify: reduce length, give everyday analogy, break into steps. Without announcing it — just do it.
— Student answers correctly, asks deep questions, requests more detail twice in a row → go deeper: add nuance, alternative viewpoints, academic context.

SPECIAL MODES:
— "quiz me"/"test me" → 5 questions one at a time, after each: ✓/✗ + one line. At the end: X/5 and one recommendation.
— "summarize"/"what did I learn" → 3–5 key takeaways from the dialogue as "📌 [Fact]".
— "explain differently" → different approach: formal → give analogy; abstract → tie to practice; complex → break into steps.
— "explain it to me"/"let me explain" → the student explains the topic in their own words, you listen and then gently correct: what's right, what to refine, what's missing. Don't interrupt — wait for the full explanation.
— "how to learn with you"/"learning tips"/"how to use you"/"lifehacks" → share 5–6 concrete tips on how to work with you: how to phrase questions, what modes exist, how to consolidate through dialogue. Give an example prompt for each tip. Warm and practical — like a smart friend, not a manual.${isEnglish ? `
— "native mode"/"speak only English" → switch fully to English like a young native speaker in a casual chat: natural, conversational. NO other language. Stay in this mode until the user explicitly asks to switch back.
— "back to normal"/"switch back" → return to regular mode.` : ""}
${PLATFORM_BLOCK_EN}`;

    // ── Russian system prompt ──────────────────────────────────────────────────
    const systemPromptRu = isDiscovery
      ? `Ты — Mentora, проводник по удивительному миру знаний. Говоришь живо и увлечённо — как умный интеллигентный собеседник с широким кругозором. Твоё имя женского рода.

ТВОЯ СУПЕРСИЛА — соединять знания из разных областей. Когда рассказываешь факт — показывай неожиданную связь.

ПРОФИЛЬ: Стиль: ${STYLE_GUIDE[profile?.onboarding_style ?? "storytelling"]} | Уровень: ${LEVEL_GUIDE[profile?.onboarding_level ?? "adult"]}

БАЗА ЗНАНИЙ: ${ragContext}

ПРАВИЛА: начинай с факта, **жирный** для ключевого, 2–4 абзаца, в конце вопрос. Акцент на культурах разных народов. Речь грамотная и тёплая — без сленга и молодёжных клише.
${PLATFORM_BLOCK}`
      : `Ты — Mentora, персональный AI-ментор по ${subjectLabel}. Твоё имя женского рода — всегда говори о себе в женском роде: «я рассказала», «я думаю», «мне кажется». Говоришь живо и увлечённо, как умный интеллигентный собеседник — не как учебник, но и не как чат-бот с заигрыванием.${isEnglish ? "\n\nЯЗЫК: Объяснения давай на русском, но примеры, задания и диалоги — на английском." : ""}

ОБЛАСТЬ ЗНАНИЙ:
Ты ментор по всей науке «${SUBJECT_TITLE_RU[subject] ?? subjectLabel}», а не только по школьной программе. Любой вопрос из жизни, связанный с этой наукой, — твоя прямая зона. Биология → растениеводство, уход за животными, экология, медицина, садоводство, питание. Химия → кулинария, косметология, домашние эксперименты. История → любые исторические вопросы, не только ЕГЭ. Физика → принципы работы техники, природные явления. Ответь на практический вопрос из жизни — потом, если уместно, покажи связь с научной основой.

ПРОФИЛЬ УЧЕНИКА:
- Стиль подачи: ${STYLE_GUIDE[style]}
- Уровень: ${LEVEL_GUIDE[level]}
- Цель: ${GOAL_GUIDE[goal]}

ПАМЯТЬ О ПОЛЬЗОВАТЕЛЕ:
${JSON.stringify(mem)}${ADAPTIVE_BLOCK_RU}

БАЗА ЗНАНИЙ (используй как основу — приоритет над общими знаниями):
${ragContext}

ПРАВИЛА:
1. Следуй стилю, уровню и цели ученика — это главное
2. Начинай сразу с сути — без "Конечно!", "Отличный вопрос!", "Рад помочь"
3. Форматирование: **жирный** для ключевых терминов и фактов; - или 1. 2. 3. для списков; никаких заголовков # и разделителей ---; каждый пункт списка — строго одна строка, без переноса текста на следующую
4. Объём: 3–5 абзацев (для practice-стиля — короче, с упором на задание). Технический лимит ответа — около 2000 токенов (~1500 слов). Если тема требует больше — заверши мысль в удобном месте и добавь в конце: «Это основное — дай знать, если хочешь продолжение или есть вопросы». Никогда не обрывай на полуслове.
5. В конце — один цепляющий вопрос для закрепления (кроме practice, где вопрос-задание встроен)
6. Если база знаний пуста — отвечай по своим знаниям, не упоминая об этом явно
7. ЦИТИРОВАНИЕ: Если факт взят из БАЗЫ ЗНАНИЙ (источники в блоке БАЗА ЗНАНИЙ ниже пронумерованы [1] [2] [3] [4] [5]), поставь маркер [^N] в конце предложения. Например: «Москва основана в 1147 году[^2].». Цитируй только когда чанк действительно подтверждает факт; не выдумывай номера; можно ставить несколько: [^1][^3]
8. Пиши по-русски (кроме английского языка — там примеры на английском)
9. Если не уверена в точной второстепенной дате или малоизвестной детали — скажи об этом легко, вплетая в ответ: «точную дату лучше сверь в учебнике — ориентировочно это [год/период]». Без акцента и извинений — как честный собеседник
10. Речь: грамотная, тёплая, уважительная. Исключены: сленг, молодёжные клише, разговорные вставки («без напряга», «погнали», «классно», «чётко», «вот так», «ну и т.д.»). Живость — через точные образы и интересные примеры, не через имитацию молодёжного общения
11. ИЛЛЮСТРАЦИИ: если визуальная схема, диаграмма или картинка реально поможет понять тему — добавь на отдельной строке маркер [IMG: <english description, max 50 words>]. Только когда действительно нужна — не к каждому ответу. Описание строго на английском, стиль: "educational illustration, clean vector style".
12. ТОЧНОСТЬ СЛОВ: подбирай слова грамотно и в соответствии с русской нормой. Глаголы — в правильной валентности и виде. Примеры:
    — НЕ «компания горела миллионы» (горит само что-то), а «компания сжигала миллионы» / «компания тратила миллионы»
    — НЕ «приземлять примеры» (калька с английского), а «приводить примеры из жизни»
    — НЕ «риск вывихивает шею» (странный образ), а «риск огромен» / «риск зашкаливает»
    — Иностранные термины переводи или объясняй: «winner-take-most» → «победитель забирает почти всё (winner-take-most)». Не оставляй непереведённые англицизмы без пояснения.
    — Управление падежами: «связь с» (твор.), «уверенность в» (предл.), «доступ к» (дат.).
    — Перед публикацией мысленно перечитай ответ как редактор: каждое существительное, глагол, прилагательное — то ли это слово? Если есть лучшее — замени.
12. РЕЕСТР И УВАЖЕНИЕ К ЧИТАТЕЛЮ: пиши на «ты» дружелюбно, но без панибратства. Не объясняй очевидное (если уровень expert) и не усложняй простое (если уровень school). Образы — точные и конкретные, без штампов («это краеугольный камень», «без преувеличения»). Если повторяешь слово в одном абзаце 3+ раза — найди синоним.


ПЕДАГОГИЧЕСКИЕ ТЕХНИКИ (применяй органично, не объявляя):
— Сократический метод: если тема позволяет открытие через размышление — задай наводящий вопрос ВМЕСТО прямого ответа: «Как ты думаешь, почему...?» / «Что будет, если...?». Используй когда уровень ≥ adult и вопрос не срочный.
— Активное воспроизведение: если пользователь просит объяснить тему, которую уже разбирали в этом диалоге — сначала предложи ему самому сформулировать: «Прежде чем я расскажу — попробуй сам[а] вспомнить, что знаешь об этом». Потом скорректируй и дополни.
— Связи между темами: если текущий вопрос перекликается с тем, что обсуждалось раньше в этом диалоге — укажи на связь естественно, без объявлений.
— Метакогниция: не чаще 1 раза за 6–8 сообщений добавляй вопрос о процессе, а не о теме: «Как ты это запомнишь?» / «Куда применишь в жизни?» / «Что оказалось неожиданным?»
— Проверочный вопрос после объяснения: дала развёрнутое объяснение новой концепции — не заканчивай нейтральным «понятно?» (это бесполезно). Вместо этого задай один конкретный вопрос на применение или воспроизведение: «Попробуй объяснить мне своими словами: почему...?» / «Вот похожий пример — что здесь получится?». Один вопрос, не список.
— Коррекция ошибок через вопрос: пользователь допускает фактическую или логическую ошибку — не поправляй сразу. Сначала один направляющий вопрос: «Уверен(а) в этом шаге? Посмотри на условие ещё раз» / «А что произойдёт, если применить это к [пример]?». Если после второй попытки всё равно ошибается — мягко скажи как есть: «На самом деле здесь вот что...». Не затягивай дольше одного цикла вопрос→ответ.
— Мастерство перед переходом: если из ответа видно, что тема не усвоена, а пользователь уже задаёт следующий вопрос — притормози один раз: «Давай сначала закрепим этот момент — что именно кажется непонятным: [суть трудности]?». Используй только при очевидной путанице, не блокируй прогресс в целом.
— Вопрос формата: пользователь начинает совершенно новую тему — можно один раз мягко спросить: «Хочешь сначала объяснение с примером — или сразу попробуем задачу?». Не злоупотребляй: если из сообщения уже ясно что нужно — просто делай.

ДИНАМИКА СЛОЖНОСТИ (анализируй историю диалога):
— Путается, пишет «не понимаю», отвечает неверно 2 раза подряд → упрости: сократи объём, дай бытовую аналогию, разбей на шаги. Без объявлений — просто сделай.
— Правильно отвечает, задаёт глубокие вопросы, просит больше деталей 2 раза подряд → усложняй: добавляй нюансы, альтернативные точки зрения, академический контекст.

СПЕЦИАЛЬНЫЕ РЕЖИМЫ:
— «проверь меня»/«квиз»/«тест» → 5 вопросов по очереди, после каждого: ✓/✗ + одна строка. В конце: X/5 и одна рекомендация.
— «итог»/«что я узнал» → 3–5 ключевых тезисов из диалога в формате «📌 [Факт]».
— «объясни по-другому» → другой подход: формально → дай аналогию; абстрактно → привяжи к практике; сложно → разбей на шаги.
— «объясни мне»/«проверь, как я понял» → пользователь сам объясняет тему своими словами, ты слушаешь и после мягко корректируешь: что точно, что стоит уточнить, что упущено. Не перебивай — жди полного объяснения.
— «как с тобой учиться»/«лайфхаки»/«как задавать вопросы»/«как тебя использовать эффективнее» → поделись 5–6 конкретными советами как работать с тобой: как формулировать вопросы, какие режимы есть, как закреплять через диалог. Давай пример запроса к каждому совету. Тепло и практично — как умный друг, а не инструкция.${isEnglish ? `
— «режим носителя»/«native mode»/«native»/«speak only English»/«включи режим носителя» → переключись полностью на английский. Говори как молодой носитель языка в переписке с другом: живой, разговорный, естественный язык. НИКАКОГО русского — ни слова. Если темы ещё нет, предложи интересную для разговора. Оставайся в этом режиме до конца диалога или пока пользователь явно не попросит вернуться.
— «back to Russian»/«вернись на русский»/«switch back»/«выключи режим носителя» → вернись к обычному режиму: объяснения на русском, примеры и диалоги — на английском.` : ""}
${PLATFORM_BLOCK}`;

    const systemPrompt = isEnLocale ? systemPromptEn : systemPromptRu;

    // Save user message (fire-and-forget: write-only, row id unused, off the
    // critical path so it doesn't delay the AI response)
    void supabase.from("chat_messages").insert({
      user_id: user.id,
      subject,
      role: "user",
      content: message,
    }).then(null, (e: unknown) => console.error("user message insert failed:", e));

    // ── Suggestions: generate in parallel with main chat (non-blocking, silent on fail) ──
    const _suggHistory = (history ?? [])
      .filter((m: {role: string}) => m.role === "user" || m.role === "assistant")
      .slice(-4)
      .map((m: {role: string; content: string}) => ({ role: m.role, content: m.content }))
      .concat([{ role: "user", content: message }]);
    const suggestionsPromise: Promise<string[]> = anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 160,
      temperature: 0.7,
      messages: [{
        role: "user",
        content: isEnLocale
          ? `Subject: «${subjectLabel}». Student question: «${message.slice(0, 200)}». Suggest exactly 3 short follow-up questions (max 7 words each) the student is most likely to ask next. JSON array only, no commentary: ["q1","q2","q3"]`
          : `Предмет: «${subjectLabel}». Вопрос ученика: «${message.slice(0, 200)}». Предложи ровно 3 коротких вопроса (не длиннее 7 слов каждый), которые ученик захочет спросить дальше. Только JSON-массив, без комментариев: ["вопрос 1","вопрос 2","вопрос 3"]`,
      }],
    }).then(r => {
      const t = r.content[0]?.type === "text" ? r.content[0].text.trim() : "";
      const m2 = t.match(/\[[\s\S]*?\]/);
      if (!m2) return [];
      const raw: unknown[] = JSON.parse(m2[0]);
      return raw.filter((s): s is string => typeof s === "string" && s.trim().length > 0).slice(0, 3);
    }).catch(() => []);

    // Get AI response — use vision model if Ultra user sends an image
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

    // ── Prompt caching ────────────────────────────────────────────────────────
    // The system prompt is ~4k tokens, ~80% of which is STATIC (rules, pedagogy,
    // modes, platform). Sending it uncached on every message is the main API cost.
    // We reorder into [STATIC prefix (cached) | DYNAMIC suffix] so Anthropic caches
    // the large stable part (~90% input-token discount after the first call within
    // the 5-min ephemeral window). Dynamic = student MEMORY + KNOWLEDGE BASE, which
    // change every message, so they go LAST (uncached). The citation rule already
    // says the KB block is "below", matching this order.
    //
    // Safety: we split by stable markers and assert head+dynamic+tail === original
    // (byte-identical) before caching. If markers move or assertion fails, we fall
    // back to the original single uncached block — zero behaviour change.
    const memMarker  = isEnLocale ? "STUDENT MEMORY:" : "ПАМЯТЬ О ПОЛЬЗОВАТЕЛЕ:";
    const ruleMarker = isEnLocale ? "RULES:\n1. Follow the" : "ПРАВИЛА:\n1. Следуй стилю";
    const mi = systemPrompt.indexOf(memMarker);
    const ri = systemPrompt.indexOf(ruleMarker);
    let systemParam: string | Array<{ type: "text"; text: string; cache_control?: { type: "ephemeral" } }> = systemPrompt;
    if (!isDiscovery && mi > 0 && ri > mi) {
      const head   = systemPrompt.slice(0, mi);   // preamble + scope + profile (static)
      const middle = systemPrompt.slice(mi, ri);  // MEMORY + KNOWLEDGE BASE (dynamic)
      const tail   = systemPrompt.slice(ri);      // RULES + pedagogy + modes + platform (static)
      const staticPrefix = head + tail;           // all static text, order-preserved within each part
      // Integrity: the three slices must cover the whole prompt with no loss.
      // (We then deliberately reorder to [static head+tail] + [dynamic middle].)
      if (head + middle + tail === systemPrompt && staticPrefix.length > 0 && middle.length > 0) {
        systemParam = [
          { type: "text", text: staticPrefix, cache_control: { type: "ephemeral" } },
          { type: "text", text: middle },
        ];
      }
    }

    // ── Streamed response ───────────────────────────────────────────────────
    // We stream the answer token-by-token (perceived latency ~1s to first words),
    // then run all post-processing (image, citations, XP, streak, suggestions) and
    // send a final META event with metadata. Client renders text live + applies META.
    const __msgParams = {
      model: hasImage ? "claude-sonnet-4-6" : "claude-haiku-4-5-20251001",
      max_tokens: hasImage ? 4096 : 2048,
      system: systemParam,
      messages: [
        ...((history ?? []).filter((m: {role: string}) => m.role === "user" || m.role === "assistant").slice(-10).map((m: {role: string; content: string}) => ({ role: m.role, content: m.content }))),
        { role: "user", content: userTurnContent },
      ],
    } as Parameters<typeof anthropic.messages.create>[0];

    const __enc = new TextEncoder();
    const __META = "\u001e__MENTORA_META__\u001e";
    // Restore load smoothing (chat left withAnthropicQueue when it switched to
    // streaming): take a concurrency slot BEFORE the stream starts — overload
    // surfaces as a clean 429 via the route catch (QUEUE_FULL/QUEUE_TIMEOUT) —
    // and release it right after generation; post-processing doesn't hold it.
    const __releaseSlot = await acquireAnthropicSlot();
    const __streamBody = new ReadableStream<Uint8Array>({
      async start(controller) {
       let __clientGone = false;
       const __safeEnqueue = (b: Uint8Array) => {
         if (__clientGone) return;
         try { controller.enqueue(b); } catch { __clientGone = true; }
       };
       const __safeClose = () => { try { controller.close(); } catch { /* already closed */ } };
       try {
        // Immediate flush: send a zero-width space before the (slow) Anthropic call.
        // Forces the first byte out so any buffering hop (nginx/proxy) starts flushing
        // and the client paints the assistant bubble instantly. Stripped client-side.
        __safeEnqueue(__enc.encode("\u200b"));
        const __ms = anthropic.messages.stream(__msgParams, { timeout: 120_000, maxRetries: 1 });
        for await (const ev of __ms) {
          if (ev.type === "content_block_delta" && ev.delta.type === "text_delta") {
            __safeEnqueue(__enc.encode(ev.delta.text));
          }
        }
        const response = await __ms.finalMessage();
        __releaseSlot(); // generation done — free the Anthropic concurrency slot
        const firstContent = response.content[0];
        if (firstContent.type !== "text") throw new Error("Unexpected response type: " + firstContent.type);
        let assistantMessage = firstContent.text;
        // Guard: never save an empty response to DB
        if (!assistantMessage.trim()) {
          throw new Error("Empty assistant response");
        }

    // ── Image generation: detect [IMG: ...] marker ────────────────────────────
    let imageUrl: string | null = null;
    const imgMatch = assistantMessage.match(/\[IMG:\s*([^\]]{5,300})\]/i);
    // Image GENERATION (DALL-E) restricted to Ultra — was isPro, the single
    // uncontrolled cost item (~$0.04/image, model-decided). Aligns with Ultra
    // premium-visual positioning. (Photo RECOGNITION/vision is already Ultra-only.)
    if (imgMatch && isUltima && process.env.OPENAI_API_KEY) {
      const imgDescription = imgMatch[1].trim();
      // Strip the marker from the message
      assistantMessage = assistantMessage.replace(/\[IMG:\s*[^\]]{5,300}\]/gi, "").replace(/\n{3,}/g, "\n\n").trim();
      try {
        const imgRes = await openai.images.generate({
          model: "dall-e-3",
          prompt: `Educational illustration for a student learning app. ${imgDescription}. Clean, minimalist style, white background, no text, no watermarks. Suitable for all ages.`,
          n: 1,
          size: "1024x1024",
          quality: "standard",
          style: "vivid",
        });
        imageUrl = imgRes.data?.[0]?.url ?? null;
      } catch (imgErr) {
        console.error("Image generation failed (non-blocking):", imgErr);
        // Continue without image — don't fail the whole request
      }
    } else if (imgMatch) {
      // Strip the marker even if we can't generate
      assistantMessage = assistantMessage.replace(/\[IMG:\s*[^\]]{5,300}\]/gi, "").replace(/\n{3,}/g, "\n\n").trim();
    }

    // Save assistant response (fire-and-forget: off the critical path)
    void supabase.from("chat_messages").insert({
      user_id: user.id,
      subject,
      role: "assistant",
      content: assistantMessage,
      tokens_used: response.usage.input_tokens + response.usage.output_tokens,
    }).then(null, (e: unknown) => console.error("assistant message insert failed:", e));

    // ── Non-blocking memory write-back (all users, all plans) ────────────────
    // Cost optimization: full AI fact-extraction (~300 output tokens, a 3rd
    // Anthropic call per message) runs only every 3rd message in a conversation.
    // On skipped turns we still cheaply refresh last_seen/last_topic/session_count
    // LOCALLY (no AI call) so the "welcome back" greeting stays accurate.
    const turnIndex = (history ?? []).filter((m: {role: string}) => m.role === "user").length; // 0-based: this is the (turnIndex+1)-th user message
    const doFullExtract = turnIndex % 3 === 0; // messages 1, 4, 7, ... → full AI extract
    void (async () => {
      try {
        if (!doFullExtract) {
          // Cheap local refresh — keep memory fresh without an AI call.
          const lightMem = {
            ...mem,
            last_seen: today,
            last_topic: message.slice(0, 60),
            session_count: sessionCount,
          };
          await supabase.from("user_memory").upsert(
            { user_id: user.id, subject, memory_json: lightMem },
            { onConflict: "user_id,subject" }
          );
          return;
        }
        const extractResp = await anthropic.messages.create({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 300,
          system: "Extract student learning facts as compact JSON. Return ONLY valid JSON object with no markdown, no explanation.",
          messages: [{
            role: "user",
            content: `Subject: ${subjectLabel}
Student: ${message.slice(0, 300)}
Mentor: ${assistantMessage.slice(0, 400)}
History snapshot: ${JSON.stringify((history ?? []).slice(-4).map((m: {role: string; content: string}) => ({ r: m.role[0], c: (m.content as string).slice(0, 100) })))}
Existing memory: ${JSON.stringify(mem)}
Session #: ${sessionCount}
Today: ${today}

Return ONLY valid JSON (no markdown). Merge arrays with existing, max 12 items, de-duplicated:
{"topics_covered":[],"mastered_topics":[],"difficulty_areas":[],"interests":[],"last_seen":"${today}","last_topic":"<topic of THIS exchange, short phrase>","session_count":${sessionCount},"learning_pace":"<fast|medium|slow>","preferred_depth":"<deep|standard|surface>"}
Rules: mastered_topics=clear understanding shown; difficulty_areas=confusion/errors/re-explain; learning_pace from question depth+topic switching speed; preferred_depth from follow-up patterns.`,
          }],
        });
        const rawText = extractResp.content[0].type === "text" ? extractResp.content[0].text.trim() : "{}";
        const jsonStart = rawText.indexOf("{");
        const jsonEnd = rawText.lastIndexOf("}");
        const jsonStr = jsonStart !== -1 && jsonEnd !== -1 ? rawText.slice(jsonStart, jsonEnd + 1) : "{}";
        const newMemory = JSON.parse(jsonStr);
        await supabase.from("user_memory").upsert(
          { user_id: user.id, subject, memory_json: newMemory },
          { onConflict: "user_id,subject" }
        );
      } catch { /* non-critical */ }
    })();

    // Detect level up + Update XP atomically (+10 per message) — non-blocking
    let levelUp: { newLevel: string; oldLevel: string; message: string; color: string; reward?: { plan: string; days: number } } | null = null;
    try {
      const { data: prog } = await supabase
        .from("user_progress")
        .select("xp_total")
        .eq("user_id", user.id)
        .eq("subject", subject)
        .maybeSingle();
      const oldXP = prog?.xp_total ?? 0;
      const oldLevel = getLevelName(oldXP, locale);
      const newLevel = getLevelName(oldXP + 10, locale);
      if (newLevel !== oldLevel) {
        // Always use Russian level name as reward key (for LEVEL_REWARDS lookup)
        const newLevelRu = getLevelName(oldXP + 10);
        const reward = LEVEL_REWARDS[newLevelRu] ?? null;
        levelUp = {
          newLevel,
          oldLevel,
          message: getLevelUpMessage(newLevel, subject, locale),
          color: getLevelColor(newLevel),
          ...(reward ? { reward } : {}),
        };

        // Grant level reward via admin client (bypass RLS).
        // Each level reward is granted ONCE per account (not once per subject):
        // claimed_level_rewards tracks which level keys were already rewarded.
        if (reward) {
          try {
            const admin = createClient(
              process.env.NEXT_PUBLIC_SUPABASE_URL!,
              process.env.SUPABASE_SERVICE_ROLE_KEY!,
            );
            const { data: u } = await admin
              .from("users")
              .select("reward_plan, reward_expires_at, claimed_level_rewards")
              .eq("id", user.id)
              .single();
            const claimed: string[] = (u?.claimed_level_rewards as string[] | null) ?? [];
            if (claimed.includes(newLevelRu)) {
              // Already claimed this level's reward on this account — don't re-grant,
              // and drop it from the level-up payload so no "reward earned" toast shows.
              if (levelUp) delete levelUp.reward;
            } else {
              const newReward = computeNewReward(reward, u ?? {});
              await admin.from("users").update({
                ...newReward,
                claimed_level_rewards: [...claimed, newLevelRu],
              }).eq("id", user.id);
            }
          } catch (rewardErr) {
            console.error("Level reward grant failed (non-blocking):", rewardErr);
          }
        }
      }
    } catch { /* non-critical */ }

    try {
      await supabase.rpc("increment_xp", {
        p_user_id: user.id,
        p_subject: subject,
        p_amount: 10,
        // Ultra perk: auto-freeze streak on a single missed day (Duolingo-style).
        // Backward-compatible param (defaults to false in SQL) — Free/Pro unaffected.
        p_freeze_enabled: isUltima,
      });
    } catch (xpErr) {
      console.error("XP update failed (non-blocking):", xpErr);
    }

    // ── Streak reward: auto-give 3 days Pro when streak hits 7 ───────────
    let streakRewardEarned = false;
    try {
      if (!profile?.streak_reward_claimed && !isPro) {
        // Reward keys off the unified account VISIT streak (touch_login_streak RPC),
        // updated when the user opens the app — same streak shown in the navbar.
        const maxStreak = profile?.visit_streak ?? 0;

        if (maxStreak >= 7) {
          const admin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
          );
          // Give 3 days Pro trial
          const { data: u } = await admin
            .from("users")
            .select("trial_expires_at")
            .eq("id", user.id)
            .single();
          const base = u?.trial_expires_at && new Date(u.trial_expires_at) > new Date()
            ? new Date(u.trial_expires_at)
            : new Date();
          base.setDate(base.getDate() + 3);
          await admin.from("users").update({
            trial_expires_at: base.toISOString(),
            streak_reward_claimed: true,
          }).eq("id", user.id);
          streakRewardEarned = true;
        }
      }
    } catch (rewardErr) {
      console.error("Streak reward failed (non-blocking):", rewardErr);
    }

    // Don't let suggestions delay the answer: race against a short timeout. If they
    // aren't ready in time, return without them (they'll appear on the next turn).
    // The main answer is what matters; suggestions are a nice-to-have.
    const suggestions = await Promise.race([
      suggestionsPromise,
      new Promise<string[]>((resolve) => setTimeout(() => resolve([]), 1200)),
    ]);

        const __meta: Record<string, unknown> = {
          message: assistantMessage,
          ...(typeof messagesRemaining === 'number' ? { messagesRemaining } : {}),
          resetAt: windowResetAt,
          trialExpiresAt: profile?.trial_expires_at ?? null,
          rewardExpiresAt: profile?.reward_expires_at ?? null,
          ...(citations.length ? { citations } : {}),
          ...(levelUp ? { levelUp } : {}),
          ...(imageUrl ? { imageUrl } : {}),
          ...(streakRewardEarned ? { streakRewardEarned: true } : {}),
          ...(suggestions.length ? { suggestions } : {}),
        };
        __safeEnqueue(__enc.encode(__META + JSON.stringify(__meta)));
        __safeClose();
       } catch (streamErr) {
        __releaseSlot(); // idempotent — safe even if already released
        const m = streamErr instanceof Error ? streamErr.message : String(streamErr);
        // Client disconnect (closed tab / navigated away) cancels the stream, so the
        // next enqueue/close throws "Controller is already closed". That is NOT a real
        // failure — don't spam admin alerts or refund a message that was answered.
        const __benign = __clientGone || /controller is already closed|invalid state/i.test(m);
        if (!__benign) {
          console.error("Chat stream error:", m);
          // Parity with the route-level catch (stream errors never reach it):
          // notify admin + refund the counted free-tier message — the user got no answer.
          notifyAdmin(`\u26a0\ufe0f <b>Chat stream error</b>\nmsg: ${m.slice(0, 400).replace(/</g, "&lt;")}\n<i>${mskNow()} \u041c\u0421\u041a</i>`);
          if (freeMsgToRefund) {
            try {
              const { createClient: createSvcClient } = await import("@supabase/supabase-js");
              const svc = createSvcClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
              await svc.rpc("refund_message_window", { p_user_id: freeMsgToRefund });
            } catch (refundErr) {
              console.error("refund_message_window failed:", refundErr);
            }
          }
        }
        __safeEnqueue(__enc.encode(__META + JSON.stringify({ error: "stream_failed" })));
        __safeClose();
       }
      },
    });

    return new Response(__streamBody, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    const errStatus = (err && typeof err === "object" && "status" in err) ? (err as { status?: unknown }).status : undefined;
    const errName = err instanceof Error ? err.name : typeof err;
    console.error("Chat API error:", errName, errStatus, errMsg);
    // Make chat failures VISIBLE (they were pm2-only before). Diagnoses the
    // "2nd message fails" report. Fire-and-forget; notifyAdmin is rate-safe.
    const errCode = (err && typeof err === "object" && "code" in err) ? (err as { code?: unknown }).code : undefined;
    const isExpectedLoad = errStatus === 429 || errCode === "QUEUE_FULL" || errCode === "QUEUE_TIMEOUT";
    if (!isExpectedLoad) {
      notifyAdmin(`\u26a0\ufe0f <b>Chat API error</b>\nname: ${errName}\nstatus: ${errStatus ?? "-"}\nmsg: ${String(errMsg).slice(0, 400).replace(/</g, "&lt;")}\n<i>${mskNow()} \u041c\u0421\u041a</i>`);
    }
    // C3: the free-tier message was counted but the user got no answer — give it back.
    if (freeMsgToRefund) {
      try {
        const { createClient: createSvcClient } = await import("@supabase/supabase-js");
        const svc = createSvcClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
        await svc.rpc("refund_message_window", { p_user_id: freeMsgToRefund });
      } catch (refundErr) {
        console.error("refund_message_window failed:", refundErr);
      }
    }
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
    // Request queue full or timed out — tell client to retry
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


