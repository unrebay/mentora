import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import { getEffectivePlan, LEVEL_REWARDS, computeNewReward } from "@/lib/plan";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
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
function getLevelUpMessage(newLevel: string, subjectTitle: string, locale?: string): string {
  if (locale === "en") {
    const msgs: Record<string, string> = {
      "Explorer": `Explorer level! You already know more about "${subjectTitle}" than most beginners. Keep going — every question makes you stronger.`,
      "Adept": `Adept! Your effort in "${subjectTitle}" is clear. Mentora sees your progress — keep it up.`,
      "Scholar": `Scholar! Impressive results in "${subjectTitle}". You're one step from the top — don't stop now.`,
      "Expert": `Expert — the pinnacle! You're among those who reached the top in "${subjectTitle}". Mentora is proud of you.`,
    };
    return msgs[newLevel] ?? `New level — ${newLevel}!`;
  }
  const msgs: Record<string, string> = {
    "Исследователь": `Уровень Исследователя! Ты уже разбираешься в «${subjectTitle}» лучше большинства новичков. Продолжай — каждый вопрос делает тебя сильнее.`,
    "Знаток": `Знаток! Твои усилия по теме «${subjectTitle}» очевидны. Ментора видит прогресс — так держать.`,
    "Историк": `Историк! Серьёзный результат по «${subjectTitle}». До вершины один шаг — не останавливайся.`,
    "Эксперт": `Эксперт — вершина! Ты в числе тех, кто дошёл до конца в «${subjectTitle}». Ментора гордится.`,
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
  try {
    const { message, subject, history, imageData, imageMimeType, locale } = await req.json();
    const isEnLocale = locale === "en";

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
      .select("onboarding_style, onboarding_level, onboarding_goal, plan, trial_expires_at, streak_reward_claimed, reward_plan, reward_expires_at")
      .eq("id", user.id)
      .single();

    // --- Plan check (accounts for paid plan + trial + level reward) ---
    const effectivePlan = getEffectivePlan(profile ?? {});
    const isPro   = effectivePlan === "pro" || effectivePlan === "ultima";
    const isUltima = effectivePlan === "ultima";

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
      // Window resets WINDOW_HOURS after it started — compute from window_start returned by RPC
      const windowResetISO = (() => {
        if (w?.window_start) {
          const d = new Date(w.window_start);
          d.setTime(d.getTime() + WINDOW_HOURS * 3600_000);
          return d.toISOString();
        }
        // Fallback: WINDOW_HOURS from now
        return new Date(Date.now() + WINDOW_HOURS * 3600_000).toISOString();
      })();
      if (!w?.allowed) {
        return NextResponse.json(
          { error: "limit_reached", messagesRemaining: 0, resetAt: windowResetISO },
          { status: 429 }
        );
      }
      messagesRemaining = Math.max(0, WINDOW_LIMIT - (w?.messages_today ?? WINDOW_LIMIT));
      windowResetAt = windowResetISO;
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

    const planLabel = isUltima
      ? (isEnLocale ? "Ultima (max plan)" : "Ultima (максимальный тариф)")
      : isPro
      ? "Pro"
      : "Free";

    // ── English platform block ─────────────────────────────────────────────────
    const PLATFORM_BLOCK_EN = `
WHO YOU ARE AND WHERE YOU ARE:
You are Mentora, an AI mentor on the mentora.su educational platform. You are feminine — always refer to yourself in the feminine ("I explained", "I think"). You exist inside a browser chat interface on mentora.su.

PLATFORM SECTIONS:
- /dashboard — home: subject cards, progress, greeting
- /learn/[subject] — chat with Mentora (you are here). Bottom-left (Ultima only): camera button for photo upload. PDF notes button in chat header (Pro/Ultima only).
- /dashboard/progress — XP by subject, streaks, weekly activity
- /dashboard/analytics — global ranking, total XP, messages, level
- /dashboard/galaxy — Knowledge Galaxy: interactive topic map
- /profile — profile: name, badges, referral link
- /pricing — pricing: Free, Pro, Ultima plans
- Support: @mentora_su_bot on Telegram or hello@mentora.su

PLANS:
- Free: up to 20 messages/day (resets at midnight UTC). All 14 subjects. No photo upload, no PDF notes.
- Pro: unlimited messages, PDF notes (button in chat header). Price: from 299₽/mo.
- Ultima: all of Pro + photo upload for tasks (camera button in input area). Higher price.
- Users earn levels (Beginner → Explorer → Adept → Scholar → Expert): each level automatically grants free Pro/Ultima days as a reward.
- Current user plan: ${planLabel}.

FORBIDDEN TOPICS (strictly no exceptions):
1. Suicide, self-harm, or harm to others — in any context.
2. Sexual content, pornography, erotica.
3. Instructions for weapons, drugs, explosives, poisons.
4. Fraud, hacking, bypassing security systems.
5. Hate speech, discrimination of any kind.
6. Any non-educational content aimed at causing harm.

RESPONSE TO FORBIDDEN TOPIC:
One or two calm sentences without judgment, offer to return to learning. Never continue the discussion of a forbidden topic even partially.`;

    // ── Shared platform knowledge block (injected into all prompts) ────────────
    const PLATFORM_BLOCK = `
КТО ТЫ И ГДЕ ТЫ:
Ты — Mentora, AI-ментор образовательной платформы mentora.su. Ты женского рода — всегда говори о себе в женском роде («я рассказала», «я думаю»). Ты существуешь внутри браузерного чат-интерфейса: пользователь видит страницу с историей диалога сверху и полем ввода снизу. В шапке страницы — логотип Mentora, навигация, пилюля с XP (синяя «Ме 160») и пилюля стрика (оранжевая с огнём «2 дня»). Ты не приложение на телефоне и не десктопная программа — ты живёшь в браузере на сайте mentora.su. Пользователь смотрит на экран, ты — на экране.

РАЗДЕЛЫ ПЛАТФОРМЫ (помогай пользователю ориентироваться):
- /dashboard — главная: карточки предметов, прогресс, приветствие. Кнопка «+ Добавить предмет» — добавить новый предмет для изучения.
- /learn/[предмет] — чат с Менторой по конкретному предмету (ты сейчас здесь). Внизу слева (только Ultima) — кнопка камеры для загрузки фото задачи. Кнопка PDF-конспекта — в шапке чата (только Pro и Ultima).
- /dashboard/progress — прогресс: XP по предметам, стрики, активность за неделю (пн–вс), лучший стрик.
- /dashboard/analytics — аналитика: глобальный рейтинг среди всех пользователей, суммарный XP, сообщения, уровень.
- /dashboard/galaxy — Галактика знаний: интерактивная карта тем по предметам.
- /profile — профиль: имя, достижения/бейджи, реферальная ссылка для приглашения друзей.
- /pricing — тарифы: сравнение Free, Pro, Ultima с ценами и кнопками оплаты.
- /dashboard/about — о платформе: миссия, роадмап, поддержка.
- Поддержка: @mentora_su_bot в Telegram или hello@mentora.su.

ТАРИФЫ ПЛАТФОРМЫ:
- Free: до 20 сообщений в сутки (сброс в полночь UTC), все 14 предметов доступны, без загрузки фото, без PDF-конспектов.
- Pro: безлимитные сообщения, PDF-конспекты (кнопка в шапке чата → «Скачать конспект»), все предметы. Цена: от 299₽/мес или годовой план со скидкой.
- Ultima: всё из Pro + загрузка фото задач (кнопка камеры в поле ввода чата), приоритет. Цена: выше Pro. До 1 июня 2026 — все зарегистрированные получат месяц Pro бесплатно.
- Пользователь набирает уровни (Новичок → Исследователь → Знаток → Историк → Эксперт): при достижении уровня автоматически начисляются бесплатные дни Pro или Ultima в качестве награды.
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
Не анализируй запрос, не объясняй почему отказываешь детально. Ответ — одно-два предложения, спокойно и без осуждения, с предложением вернуться к учёбе. Пример: «На такие темы мы не общаемся в рамках платформы. Давай лучше разберём что-нибудь интересное — например, [конкретная тема из предмета].» Никогда не продолжай обсуждение запрещённой темы даже частично.`;

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

STUDENT PROFILE:
- Teaching style: ${STYLE_GUIDE_EN[style]}
- Level: ${LEVEL_GUIDE_EN[level]}
- Goal: ${GOAL_GUIDE_EN[goal]}

STUDENT MEMORY:
${JSON.stringify(memory?.memory_json ?? {})}

KNOWLEDGE BASE (use as primary source — prioritize over general knowledge):
${ragContext}

RULES:
1. Follow the student's style, level, and goal — this is the top priority
2. Start immediately with the substance — no "Of course!", "Great question!", "Happy to help"
3. Formatting: **bold** for key terms and facts; - or 1. 2. 3. for lists; no # headers or --- dividers; each list item strictly one line
4. Length: 3–5 paragraphs (for practice style — shorter, focused on tasks). If the topic requires more — wrap up neatly and add: "That covers the essentials — let me know if you want to go deeper." Never cut off mid-sentence.
5. End with one engaging question to consolidate (except practice style, which has the question built in)
6. If the knowledge base is empty — answer from your own knowledge without mentioning it
7. ILLUSTRATIONS: if a visual diagram would genuinely help understand — add on a separate line: [IMG: <description, max 50 words>]. Only when truly needed. Description in English, style: "educational illustration, clean vector style".

COMPLEXITY DYNAMICS:
— Student is confused, says "I don't understand", answers incorrectly twice in a row → simplify: reduce length, give everyday analogy, break into steps. Without announcing it — just do it.
— Student answers correctly, asks deep questions, requests more detail twice in a row → go deeper: add nuance, alternative viewpoints, academic context.

SPECIAL MODES:
— "quiz me"/"test me" → 5 questions one at a time, after each: ✓/✗ + one line. At the end: X/5 and one recommendation.
— "summarize"/"what did I learn" → 3–5 key takeaways from the dialogue as "📌 [Fact]".
— "explain differently" → different approach: formal → give analogy; abstract → tie to practice; complex → break into steps.${isEnglish ? `
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
3. Форматирование: **жирный** для ключевых терминов и фактов; - или 1. 2. 3. для списков; никаких заголовков # и разделителей ---; каждый пункт списка — строго одна строка, без переноса текста на следующую
4. Объём: 3–5 абзацев (для practice-стиля — короче, с упором на задание). Технический лимит ответа — около 2000 токенов (~1500 слов). Если тема требует больше — заверши мысль в удобном месте и добавь в конце: «Это основное — дай знать, если хочешь продолжение или есть вопросы». Никогда не обрывай на полуслове.
5. В конце — один цепляющий вопрос для закрепления (кроме practice, где вопрос-задание встроен)
6. Если база знаний пуста — отвечай по своим знаниям, не упоминая об этом явно
7. Пиши по-русски (кроме английского языка — там примеры на английском)
8. Если не уверена в точной второстепенной дате или малоизвестной детали — скажи об этом легко, вплетая в ответ: «точную дату лучше сверь в учебнике — ориентировочно это [год/период]». Без акцента и извинений — как честный собеседник
9. Речь: грамотная, тёплая, уважительная. Исключены: сленг, молодёжные клише, разговорные вставки («без напряга», «погнали», «классно», «чётко», «вот так», «ну и т.д.»). Живость — через точные образы и интересные примеры, не через имитацию молодёжного общения
10. ИЛЛЮСТРАЦИИ: если визуальная схема, диаграмма или картинка реально поможет понять тему — добавь на отдельной строке маркер [IMG: <english description, max 50 words>]. Только когда действительно нужна — не к каждому ответу. Описание строго на английском, стиль: "educational illustration, clean vector style".

ДИНАМИКА СЛОЖНОСТИ (анализируй историю диалога):
— Путается, пишет «не понимаю», отвечает неверно 2 раза подряд → упрости: сократи объём, дай бытовую аналогию, разбей на шаги. Без объявлений — просто сделай.
— Правильно отвечает, задаёт глубокие вопросы, просит больше деталей 2 раза подряд → усложняй: добавляй нюансы, альтернативные точки зрения, академический контекст.

СПЕЦИАЛЬНЫЕ РЕЖИМЫ:
— «проверь меня»/«квиз»/«тест» → 5 вопросов по очереди, после каждого: ✓/✗ + одна строка. В конце: X/5 и одна рекомендация.
— «итог»/«что я узнал» → 3–5 ключевых тезисов из диалога в формате «📌 [Факт]».
— «объясни по-другому» → другой подход: формально → дай аналогию; абстрактно → привяжи к практике; сложно → разбей на шаги.${isEnglish ? `
— «режим носителя»/«native mode»/«native»/«speak only English»/«включи режим носителя» → переключись полностью на английский. Говори как молодой носитель языка в переписке с другом: живой, разговорный, естественный язык. НИКАКОГО русского — ни слова. Если темы ещё нет, предложи интересную для разговора. Оставайся в этом режиме до конца диалога или пока пользователь явно не попросит вернуться.
— «back to Russian»/«вернись на русский»/«switch back»/«выключи режим носителя» → вернись к обычному режиму: объяснения на русском, примеры и диалоги — на английском.` : ""}
${PLATFORM_BLOCK}`;

    const systemPrompt = isEnLocale ? systemPromptEn : systemPromptRu;

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
      max_tokens: hasImage ? 4096 : 2048,
      system: systemPrompt,
      messages: [
        ...((history ?? []).filter((m: {role: string}) => m.role === "user" || m.role === "assistant").slice(-10)),
        { role: "user", content: userTurnContent },
      ],
    });

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
    if (imgMatch && isPro && process.env.OPENAI_API_KEY) {
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
        imageUrl = imgRes.data[0]?.url ?? null;
      } catch (imgErr) {
        console.error("Image generation failed (non-blocking):", imgErr);
        // Continue without image — don't fail the whole request
      }
    } else if (imgMatch) {
      // Strip the marker even if we can't generate
      assistantMessage = assistantMessage.replace(/\[IMG:\s*[^\]]{5,300}\]/gi, "").replace(/\n{3,}/g, "\n\n").trim();
    }

    // Save assistant response
    await supabase.from("chat_messages").insert({
      user_id: user.id,
      subject,
      role: "assistant",
      content: assistantMessage,
      tokens_used: response.usage.input_tokens + response.usage.output_tokens,
    });

    // ── Non-blocking memory write-back (all users, all plans) ────────────────
    void (async () => {
      try {
        const extractResp = await anthropic.messages.create({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 300,
          system: "Extract student learning facts as compact JSON. Return ONLY valid JSON object with no markdown, no explanation.",
          messages: [{
            role: "user",
            content: `Subject: ${subjectLabel}\nStudent: ${message}\nMentor: ${assistantMessage.slice(0, 400)}\nExisting memory: ${JSON.stringify(memory?.memory_json ?? {})}\n\nReturn updated JSON: {"topics_covered": string[], "difficulty_areas": string[], "interests": string[], "last_seen": "${new Date().toISOString().split("T")[0]}"}. Merge with existing, max 15 items per array.`,
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
          message: getLevelUpMessage(newLevel, subjectLabel, locale),
          color: getLevelColor(newLevel),
          ...(reward ? { reward } : {}),
        };

        // Grant level reward via admin client (bypass RLS)
        if (reward) {
          try {
            const admin = createClient(
              process.env.NEXT_PUBLIC_SUPABASE_URL!,
              process.env.SUPABASE_SERVICE_ROLE_KEY!,
            );
            const { data: u } = await admin
              .from("users")
              .select("reward_plan, reward_expires_at")
              .eq("id", user.id)
              .single();
            const newReward = computeNewReward(reward, u ?? {});
            await admin.from("users").update(newReward).eq("id", user.id);
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
      });
    } catch (xpErr) {
      console.error("XP update failed (non-blocking):", xpErr);
    }

    // ── Streak reward: auto-give 3 days Pro when streak hits 7 ───────────
    let streakRewardEarned = false;
    try {
      if (!profile?.streak_reward_claimed && !isPro) {
        // Read updated streak after increment_xp
        const { data: progressRows } = await supabase
          .from("user_progress")
          .select("streak_days")
          .eq("user_id", user.id);
        const maxStreak = progressRows?.reduce((m, p) => Math.max(m, p.streak_days ?? 0), 0) ?? 0;

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

    return NextResponse.json({
      message: assistantMessage,
      messagesRemaining,
      resetAt: windowResetAt,
      trialExpiresAt: profile?.trial_expires_at ?? null,
      rewardExpiresAt: profile?.reward_expires_at ?? null,
      ...(levelUp ? { levelUp } : {}),
      ...(imageUrl ? { imageUrl } : {}),
      ...(streakRewardEarned ? { streakRewardEarned: true } : {}),
    });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error("Chat API error:", errMsg);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
