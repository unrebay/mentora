import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SUBJECTS } from "@/lib/types";
import ChatInterface from "@/components/chat/ChatInterface";

const WINDOW_LIMIT = 20;
const WINDOW_HOURS = 24;

interface Props {
  params: Promise<{ subject: string }>;
  searchParams: Promise<{ topic?: string }>;
}

const SUBJECT_META: Record<string, { title: string; description: string; keywords: string[] }> = {
  "russian-history": {
    title: "История России — AI-репетитор Mentora",
    description: "Учи историю России с AI-ментором: от Древней Руси до современности. Подготовка к ЕГЭ и ОГЭ, разборы событий, дат и личностей в формате живого диалога.",
    keywords: ["история России ЕГЭ", "репетитор по истории", "подготовка к ЕГЭ история", "история России онлайн", "AI репетитор история"],
  },
  "world-history": {
    title: "Всемирная история — AI-репетитор Mentora",
    description: "Изучай всемирную историю с AI: цивилизации, войны, революции и ключевые события человечества. Объяснения в диалоге, удобно для школьников и студентов.",
    keywords: ["всемирная история", "история мира онлайн", "репетитор всемирная история", "история цивилизаций"],
  },
  "mathematics": {
    title: "Математика — AI-репетитор Mentora",
    description: "Решай математические задачи с AI-ментором. Алгебра, геометрия, тригонометрия — разборы с объяснениями шаг за шагом. Подготовка к ЕГЭ и ОГЭ.",
    keywords: ["репетитор по математике", "математика ЕГЭ", "алгебра онлайн", "геометрия задачи", "AI репетитор математика"],
  },
  "physics": {
    title: "Физика — AI-репетитор Mentora",
    description: "Разбирай физику с AI: механика, термодинамика, электричество и оптика. Понятные объяснения законов и формул, решение задач для школьников и студентов.",
    keywords: ["репетитор по физике", "физика ЕГЭ", "физика онлайн", "задачи по физике", "AI репетитор физика"],
  },
  "chemistry": {
    title: "Химия — AI-репетитор Mentora",
    description: "Учи химию в диалоге с AI: реакции, формулы, органическая и неорганическая химия. Объяснения с примерами для подготовки к ЕГЭ и урокам.",
    keywords: ["репетитор по химии", "химия ЕГЭ", "химия онлайн", "органическая химия"],
  },
  "biology": {
    title: "Биология — AI-репетитор Mentora",
    description: "Изучай биологию с AI-ментором: клетки, генетика, экология, анатомия. Понятные объяснения для ЕГЭ, ОГЭ и школьных уроков.",
    keywords: ["репетитор по биологии", "биология ЕГЭ", "биология онлайн", "генетика задачи"],
  },
  "english": {
    title: "Английский язык — AI-репетитор Mentora",
    description: "Учи английский с AI: грамматика, лексика, разговорные фразы и подготовка к ЕГЭ. Практика через живой диалог с ментором.",
    keywords: ["репетитор английский", "английский ЕГЭ", "английский онлайн", "грамматика английского", "AI репетитор английский"],
  },
  "russian-language": {
    title: "Русский язык — AI-репетитор Mentora",
    description: "Подготовка к ЕГЭ и ОГЭ по русскому языку с AI: орфография, пунктуация, сочинение. Разборы правил и ошибок в формате диалога.",
    keywords: ["репетитор русский язык", "русский язык ЕГЭ", "орфография онлайн", "подготовка ЕГЭ русский"],
  },
  "literature": {
    title: "Литература — AI-репетитор Mentora",
    description: "Разбирай произведения русской и мировой литературы с AI-ментором. Анализ, образы, темы и аргументы для сочинений ЕГЭ.",
    keywords: ["репетитор литература", "литература ЕГЭ", "анализ произведений", "сочинение ЕГЭ"],
  },
  "social-studies": {
    title: "Обществознание — AI-репетитор Mentora",
    description: "Учи обществознание с AI: право, экономика, политология и социология. Понятные объяснения для ЕГЭ и ОГЭ.",
    keywords: ["репетитор обществознание", "обществознание ЕГЭ", "право ЕГЭ", "обществознание онлайн"],
  },
  "geography": {
    title: "География — AI-репетитор Mentora",
    description: "Изучай географию с AI: страны, климат, рельеф, экономическая и физическая география. Подготовка к ЕГЭ и школьным урокам.",
    keywords: ["репетитор география", "география ЕГЭ", "физическая география", "экономическая география"],
  },
  "computer-science": {
    title: "Информатика — AI-репетитор Mentora",
    description: "Учи информатику с AI: алгоритмы, программирование, логика и ЕГЭ по информатике. Разборы задач и объяснения с примерами кода.",
    keywords: ["репетитор информатика", "информатика ЕГЭ", "программирование школа", "алгоритмы задачи"],
  },
  "discovery": {
    title: "Кругозор — AI-проводник по знаниям Mentora",
    description: "Удивительные факты из науки, истории, природы и культур мира.",
    keywords: ["интересные факты", "расширить кругозор", "удивительные факты о мире"],
  },
  "economics": {
    title: "Экономика — AI-репетитор Mentora",
    description: "Разбирай экономику с AI: микро- и макроэкономика, рыночные механизмы, финансы. Объяснения для студентов и школьников.",
    keywords: ["репетитор экономика", "экономика онлайн", "микроэкономика", "макроэкономика"],
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

export default async function LearnPage({ params, searchParams }: Props) {
  const { subject } = await params;
  const { topic } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  const subjectData = SUBJECTS.find((s) => s.id === subject);
  if (!subjectData || !subjectData.available) redirect("/dashboard");

  // Load recent chat history (last 20 messages)
  const { data: history } = await supabase
    .from("chat_messages")
    .select("role, content, created_at")
    .eq("user_id", user.id)
    .eq("subject", subject)
    .order("created_at", { ascending: true })
    .limit(20);

  // Calculate remaining messages using the same window logic as the API
  const { data: profile } = await supabase
    .from("users")
    .select("plan, messages_today, messages_window_start")
    .eq("id", user.id)
    .single();

  const isUltima = profile?.plan === "ultima";
  let initialMessagesRemaining: number | null = null;

  if (profile?.plan !== "pro" && profile?.plan !== "ultima") {
    const windowStart = profile?.messages_window_start
      ? new Date(profile.messages_window_start)
      : null;
    const windowExpired =
      !windowStart ||
      Date.now() - windowStart.getTime() > WINDOW_HOURS * 3_600_000;
    const usedInWindow = windowExpired ? 0 : (profile?.messages_today ?? 0);
    initialMessagesRemaining = Math.max(0, WINDOW_LIMIT - usedInWindow);
  }

  // If topic passed from topics map — prepend as initial message
  const initialTopic = topic ? decodeURIComponent(topic) : undefined;

  return (
    <ChatInterface
      subject={subject}
      subjectTitle={subjectData.title}
      initialHistory={history ?? []}
      initialMessagesRemaining={initialMessagesRemaining}
      initialTopic={initialTopic}
      isUltima={isUltima}
    />
  );
}
