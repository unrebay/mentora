export type OnboardingStyle = "storytelling" | "facts" | "practice";
export type OnboardingLevel = "school" | "student" | "adult" | "expert";
export type MessageRole = "user" | "assistant";

export interface User {
  id: string;
  email: string | null;
  tenant_id: string | null;
  onboarding_style: OnboardingStyle | null;
  onboarding_level: OnboardingLevel | null;
  onboarding_goal: string | null;
  onboarding_completed: boolean;
  created_at: string;
}

export interface UserProgress {
  id: string;
  user_id: string;
  subject: string;
  xp_total: number;
  streak_days: number;
  level: number;
  last_active_at: string;
}

export interface ChatMessage {
  id: string;
  user_id: string;
  subject: string;
  role: MessageRole;
  content: string;
  tokens_used: number;
  created_at: string;
}

export interface KnowledgeChunk {
  id: string;
  subject: string;
  topic: string | null;
  content: string;
  source: string | null;
}

export interface Subject {
  id: string;
  title: string;
  description: string;
  emoji: string;
  available: boolean;
  beta: boolean;
  verified: boolean;
}

// Available subjects
export const SUBJECTS: Subject[] = [
  {
    id: "russian-history",
    title: "История России",
    description: "От Рюрика до наших дней",
    emoji: "🏰",
    available: true,
    beta: false,
    verified: true,
  },
  {
    id: "world-history",
    title: "Всемирная история",
    description: "История цивилизаций мира",
    emoji: "🌍",
    available: true,
    beta: true,
    verified: false,
  },
  {
    id: "mathematics",
    title: "Математика",
    description: "Алгебра, геометрия, анализ",
    emoji: "📐",
    available: true,
    beta: true,
    verified: false,
  },
  {
    id: "physics",
    title: "Физика",
    description: "От механики до квантового мира",
    emoji: "⚡",
    available: true,
    beta: true,
    verified: false,
  },
  {
    id: "chemistry",
    title: "Химия",
    description: "Вещества, реакции, законы",
    emoji: "🧪",
    available: true,
    beta: true,
    verified: false,
  },
  {
    id: "biology",
    title: "Биология",
    description: "Живые организмы и их законы",
    emoji: "🧬",
    available: true,
    beta: true,
    verified: false,
  },
  {
    id: "russian-language",
    title: "Русский язык",
    description: "Грамматика, орфография, стилистика",
    emoji: "📝",
    available: true,
    beta: true,
    verified: false,
  },
  {
    id: "literature",
    title: "Литература",
    description: "Классика и современная проза",
    emoji: "📚",
    available: true,
    beta: true,
    verified: false,
  },
  {
    id: "english",
    title: "Английский язык",
    description: "Grammar, vocabulary, speaking",
    emoji: "🇬🇧",
    available: true,
    beta: true,
    verified: false,
  },
  {
    id: "social-studies",
    title: "Обществознание",
    description: "Право, экономика, социология",
    emoji: "🏛️",
    available: true,
    beta: true,
    verified: false,
  },
  {
    id: "geography",
    title: "География",
    description: "Природа, страны, климат",
    emoji: "🗺️",
    available: true,
    beta: true,
    verified: false,
  },
  {
    id: "computer-science",
    title: "Информатика",
    description: "Алгоритмы, программирование, системы",
    emoji: "💻",
    available: true,
    beta: true,
    verified: false,
  },
  {
    id: "astronomy",
    title: "Астрономия",
    description: "Звёзды, планеты, вселенная",
    emoji: "🔭",
    available: true,
    beta: true,
    verified: false,
  },
  {
    id: "discovery",
    title: "Кругозор",
    description: "Удивительные факты о мире",
    emoji: "🌐",
    available: true,
    beta: false,
    verified: true,
  },
  {
    id: "psychology",
    title: "Психология",
    description: "Разум, поведение, личность",
    emoji: "🧠",
    available: true,
    beta: true,
    verified: false,
  },
  {
    id: "economics",
    title: "Экономика",
    description: "Рынки, финансы, поведение",
    emoji: "📊",
    available: true,
    beta: true,
    verified: false,
  },
  {
    id: "philosophy",
    title: "Философия",
    description: "Смысл, этика, мышление",
    emoji: "💭",
    available: true,
    beta: true,
    verified: false,
  },
];

// ======= Badge system =======
export interface BadgeDefinition {
  id: string;
  emoji: string;
  title: string;
  description: string;
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    id: "first_steps",
    emoji: "🌱",
    title: "Первые шаги",
    description: "Первое сообщение с Ментором",
  },
  {
    id: "curious_mind",
    emoji: "🔍",
    title: "Любознательный",
    description: "100 XP в одном предмете",
  },
  {
    id: "deep_diver",
    emoji: "🌊",
    title: "Глубокое погружение",
    description: "500 XP в одном предмете",
  },
  {
    id: "on_a_roll",
    emoji: "🔥",
    title: "В ударе",
    description: "Стрик 3 дня подряд",
  },
  {
    id: "week_warrior",
    emoji: "⚡",
    title: "Неделя знаний",
    description: "Стрик 7 дней подряд",
  },
  {
    id: "knowledge_seeker",
    emoji: "📚",
    title: "Искатель знаний",
    description: "1000 XP суммарно",
  },
  {
    id: "scholar",
    emoji: "🎓",
    title: "Учёный",
    description: "5000 XP суммарно",
  },
];
