import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/admin/dismiss-message
 * Clears the admin_message for the currently logged-in user.
 * Uses the standard server client (anon key + RLS): users_update_own
 * policy allows the user to update their own row; admin_message is not
 * in the protect_users_columns trigger.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabase
    .from("users")
    .update({ admin_message: null })
    .eq("id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
