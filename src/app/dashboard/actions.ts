"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function addUserSubject(subjectId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  await supabase
    .from("user_subjects")
    .upsert({ user_id: user.id, subject_id: subjectId }, { onConflict: "user_id,subject_id" });

  revalidatePath("/dashboard");
}

export async function removeUserSubject(subjectId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  await supabase
    .from("user_subjects")
    .delete()
    .eq("user_id", user.id)
    .eq("subject_id", subjectId);

  revalidatePath("/dashboard");
}
