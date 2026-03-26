import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SUBJECTS } from "@/lib/types";
import ChatInterface from "@/components/chat/ChatInterface";

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

  return (
    <ChatInterface
      subject={subject}
      subjectTitle={subjectData.title}
      initialHistory={history ?? []}
    />
  );
}
