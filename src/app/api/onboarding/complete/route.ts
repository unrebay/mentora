import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const cookieStore = await cookies();

    // Verify session via anon client
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Service-role client — bypasses RLS so the update always works
    const admin = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { cookies: { getAll: () => [], setAll: () => {} } }
    );

    const updateData: Record<string, unknown> = { onboarding_completed: true };
    if (body.style) updateData.onboarding_style = body.style;
    if (body.level) updateData.onboarding_level = body.level;
    if (body.goal)  updateData.onboarding_goal  = body.goal;

    const { error } = await admin.from("users").upsert(
      { id: user.id, email: user.email, ...updateData },
      { onConflict: "id" }
    );

    if (error) {
      console.error("Onboarding complete error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Onboarding route error:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
