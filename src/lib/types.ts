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
    beta: true,
    verified: false,
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
];
