import type { Metadata, Viewport } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "@/i18n/navigation";
import { SUBJECTS } from "@/lib/types";
import ChatInterface from "@/components/chat/ChatInterface";

// iOS Safari paints its bottom toolbar / safe-area zone using the page's
// theme-color meta. The chat bg is --chat-bg (#f4f4f8 light / #06060f dark) —
// different from the global page bg (#ffffff / #050a14). Without this override,
// iOS shows a visible band at the bottom where chat-bg ends and body-bg begins.
// Two themed metas so iOS picks the matching one; matches globals.css vars.
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f4f8" },
    { media: "(prefers-color-scheme: dark)",  color: "#06060f" },
  ],
};

const WINDOW_LIMIT = 20; // rolling 24h window, matches api/chat/route.ts

interface Props {
  params: Promise<{ locale: string; subject: string }>;
  searchParams: Promise<{ topic?: string }>;
}

const SUBJECT_META: Record<string, { title: string; description: string; keywords: string[] }> = {
  "russian-history": {
    title: "История России — ИИ-репетитор Mentora",
    description: "Учи историю России с ИИ-ментором: от Древней Руси до современности. Подготовка к ЕГЭ и ОГЭ, разборы событий, дат и личностей в формате живого диалога.",
    keywords: ["история России ЕГЭ", "репетитор по истории", "подготовка к ЕГЭ история", "история России онлайн", "AI репетитор история"],
  },
  "world-history": {
    title: "Всемирная история — ИИ-репетитор Mentora",
    description: "Изучай всемирную историю с нейросетью Mentora: цивилизации, войны, революции и ключевые события человечества. Объяснения в диалоге, удобно для школьников и студентов.",
    keywords: ["всемирная история", "история мира онлайн", "репетитор всемирная история", "история цивилизаций"],
  },
  "mathematics": {
    title: "Математика — ИИ-репетитор Mentora",
    description: "Решай математические задачи с ИИ-ментором. Алгебра, геометрия, тригонометрия — разборы с объяснениями шаг за шагом. Подготовка к ЕГЭ и ОГЭ.",
    keywords: ["репетитор по математике", "математика ЕГЭ", "алгебра онлайн", "геометрия задачи", "AI репетитор математика"],
  },
  "physics": {
    title: "Физика — ИИ-репетитор Mentora",
    description: "Разбирай физику с нейросетью Mentora: механика, термодинамика, электричество и оптика. Понятные объяснения законов и формул, решение задач для школьников и студентов.",
    keywords: ["репетитор по физике", "физика ЕГЭ", "физика онлайн", "задачи по физике", "AI репетитор физика"],
  },
  "chemistry": {
    title: "Химия — ИИ-репетитор Mentora",
    description: "Учи химию в диалоге с нейросетью Mentora: реакции, формулы, органическая и неорганическая химия. Объяснения с примерами для подготовки к ЕГЭ и урокам.",
    keywords: ["репетитор по химии", "химия ЕГЭ", "химия онлайн", "органическая химия"],
  },
  "biology": {
    title: "Биология — ИИ-репетитор Mentora",
    description: "Изучай биологию с ИИ-ментором: клетки, генетика, экология, анатомия. Понятные объяснения для ЕГЭ, ОГЭ и школьных уроков.",
    keywords: ["репетитор по биологии", "биология ЕГЭ", "биология онлайн", "генетика задачи"],
  },
  "english": {
    title: "Английский язык — ИИ-репетитор Mentora",
    description: "Учи английский с нейросетью Mentora: грамматика, лексика, разговорные фразы и подготовка к ЕГЭ. Практика через живой диалог с ментором.",
    keywords: ["репетитор английский", "английский ЕГЭ", "английский онлайн", "грамматика английского", "AI репетитор английский"],
  },
  "russian-language": {
    title: "Русский язык — ИИ-репетитор Mentora",
    description: "Подготовка к ЕГЭ и ОГЭ по русскому языку с нейросетью Mentora: орфография, пунктуация, сочинение. Разборы правил и ошибок в формате диалога.",
    keywords: ["репетитор русский язык", "русский язык ЕГЭ", "орфография онлайн", "подготовка ЕГЭ русский"],
  },
  "literature": {
    title: "Литература — ИИ-репетитор Mentora",
    description: "Разбирай произведения русской и мировой литературы с ИИ-ментором. Анализ, образы, темы и аргументы для сочинений ЕГЭ.",
    keywords: ["репетитор литература", "литература ЕГЭ", "анализ произведений", "сочинение ЕГЭ"],
  },
  "social-studies": {
    title: "Обществознание — ИИ-репетитор Mentora",
    description: "Учи обществознание с нейросетью Mentora: право, экономика, политология и социология. Понятные объяснения для ЕГЭ и ОГЭ.",
    keywords: ["репетитор обществознание", "обществознание ЕГЭ", "право ЕГЭ", "обществознание онлайн"],
  },
  "geography": {
    title: "География — ИИ-репетитор Mentora",
    description: "Изучай географию с нейросетью Mentora: страны, климат, рельеф, экономическая и физическая география. Подготовка к ЕГЭ и школьным урокам.",
    keywords: ["репетитор география", "география ЕГЭ", "физическая география", "экономическая география"],
  },
  "computer-science": {
    title: "Информатика — ИИ-репетитор Mentora",
    description: "Учи информатику с нейросетью Mentora: алгоритмы, программирование, логика и ЕГЭ по информатике. Разборы задач и объяснения с примерами кода.",
    keywords: ["репетитор информатика", "информатика ЕГЭ", "программирование школа", "алгоритмы задачи"],
  },
  "discovery": {
    title: "Кругозор — AI-проводник по знаниям Mentora",
    description: "Удивительные факты из науки, истории, природы и культур мира.",
    keywords: ["интересные факты", "расширить кругозор", "удивительные факты о мире"],
  },
  "economics": {
    title: "Экономика — ИИ-репетитор Mentora",
    description: "Разбирай экономику с нейросетью Mentora: микро- и макроэкономика, рыночные механизмы, финансы. Объяснения для студентов и школьников.",
    keywords: ["репетитор экономика", "экономика онлайн", "микроэкономика", "макроэкономика"],
  },
  "psychology": {
    title: "Психология — ИИ-репетитор Mentora",
    description: "Учи психологию с ИИ-ментором: когнитивные процессы, личность, эмоции, социальная психология. Понятные объяснения для любого уровня.",
    keywords: ["психология онлайн", "репетитор психология", "когнитивная психология", "изучить психологию"],
  },
  "philosophy": {
    title: "Философия — ИИ-репетитор Mentora",
    description: "Изучай философию с нейросетью Mentora: великие мыслители, этика, логика, метафизика. Понятные объяснения сложных идей в формате живого диалога.",
    keywords: ["философия онлайн", "репетитор философия", "этика", "изучить философию"],
  },
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { subject } = await params;
  const meta = SUBJECT_META[subject];
  if (!meta) return { robots: { index: false, follow: false } };
  return {
    title: meta.title,
    description: meta.description,
    keywords: meta.keywords,
    alternates: { canonical: `https://mentora.su/learn/${subject}` },
    openGraph: {
      title: meta.title,
      description: meta.description,
      url: `https://mentora.su/learn/${subject}`,
    },
  };
}

export default async function LearnSubjectPage({ params, searchParams }: Props) {
  const { subject } = await params;
  const { topic } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  const subjectData = SUBJECTS.find((s) => s.id === subject);
  if (!subjectData || !subjectData.available) redirect("/dashboard");

  // Load LAST 50 messages (newest first) and reverse to chronological order.
  // The old query was .order("created_at", { ascending: true }).limit(20) —
  // that returned the OLDEST 20 messages, so any user with >20 messages saw
  // ancient history instead of their recent conversation, and messages from
  // another device wouldn't appear because the desktop session pushed past 20.
  // Cross-device sync bug: same user_id + subject on phone after laptop session
  // saw stale start-of-conversation instead of the laptop messages.
  const { data: historyDesc } = await supabase
    .from("chat_messages")
    .select("role, content, created_at")
    .eq("user_id", user.id)
    .eq("subject", subject)
    .order("created_at", { ascending: false })
    .limit(50);
  const history = (historyDesc ?? []).slice().reverse();

  // Calculate remaining messages for today
  const { data: profile } = await supabase
    .from("users")
    .select("plan, trial_expires_at, messages_today, messages_window_start")
    .eq("id", user.id)
    .single();

  const isUltima = profile?.plan === "ultima";
  const isTrialActive = profile?.trial_expires_at
    ? new Date(profile.trial_expires_at) > new Date()
    : false;
  const isPaidOrTrial = profile?.plan === "pro" || profile?.plan === "ultima" || isTrialActive;

  let initialMessagesRemaining: number | null = null;
  let initialResetAt: string | null = null;

  if (!isPaidOrTrial) {
    const windowStart = profile?.messages_window_start ? new Date(profile.messages_window_start) : null;
    const todayUtc = new Date(); todayUtc.setUTCHours(0, 0, 0, 0);
    const windowExpired = !windowStart || windowStart < todayUtc;
    const usedToday = windowExpired ? 0 : (profile?.messages_today ?? 0);
    initialMessagesRemaining = Math.max(0, WINDOW_LIMIT - usedToday);
    const nextMidnight = new Date(); nextMidnight.setUTCHours(24, 0, 0, 0);
    initialResetAt = nextMidnight.toISOString();
  }

  const initialTopic = topic ? decodeURIComponent(topic) : undefined;

  return (
    <ChatInterface
      subject={subject}
      subjectTitle={subjectData.title}
      initialHistory={history ?? []}
      initialMessagesRemaining={initialMessagesRemaining}
      initialResetAt={initialResetAt}
      initialTopic={initialTopic}
      isUltima={isUltima}
      isPro={isPaidOrTrial}
    />
  );
}
