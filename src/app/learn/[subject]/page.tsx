import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SUBJECTS } from "@/lib/types";
import ChatInterface from "@/components/chat/ChatInterface";

const DAILY_LIMIT = 30;

interface Props {
  params: Promise<{ subject: string }>;
}

export default async function LearnPage({ params }: Props) {
  const { subject } = await params;
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

  // Calculate remaining messages for today
  const { data: profile } = await supabase
    .from("users")
    .select("plan, messages_today, messages_date")
    .eq("id", user.id)
    .single();

  let initialMessagesRemaining: number | null = null;

  if (profile?.plan !== "pro") {
    const today = new Date().toISOString().slice(0, 10);
    const isNewDay = profile?.messages_date !== today;
    const usedToday = isNewDay ? 0 : (profile?.messages_today ?? 0);
    initialMessagesRemaining = Math.max(0, DAILY_LIMIT - usedToday);
  }

  return (
    <ChatInterface
      subject={subject}
      subjectTitle={subjectData.title}
      initialHistory={history ?? []}
      initialMessagesRemaining={initialMessagesRemaining}
    />
  );
}
