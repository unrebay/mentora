import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function LearnPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");
  redirect("/dashboard");
}
