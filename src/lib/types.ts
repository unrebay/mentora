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
}

// Available subjects for MVP
export const SUBJECTS: Subject[] = [
  {
    id: "russian-history",
    title: "История России",
    description: "От Рюрика до наших дней",
    emoji: "🏰",
    available: true,
  },
  {
    id: "world-history",
    title: "Всемирная история",
    description: "История цивилизаций мира",
    emoji: "🌍",
    available: false, // coming soon
  },
];
