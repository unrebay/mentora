import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

const LEVEL_2_XP_GATE = 100;

/**
 * POST /api/payments/enable-recurring
 *
 * Turns auto-renewal ON. Gated behind level 2 (totalXP ≥ 100) per
 * project_mentora_recurring_billing_milestone.md — mitigates churn after the
 * first paid month.
 *
 * Caller pre-condition: the user must already have a saved card
 * (payment_method_id IS NOT NULL); otherwise we tell the client to start a
 * fresh /api/payments/create flow which tokenises the card.
 *
 * Returns:
 *   200 { ok: true, auto_renew: true }
 *   403 { error: "level_gate", required_xp, current_xp }
 *   409 { error: "no_payment_method" }  — client should redirect to create flow
 */
export async function POST() {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Level-2 gate: sum xp_total across all (subject, topic) rows for this user.
    const { data: progressRows } = await supabase
      .from("user_progress")
      .select("xp_total")
      .eq("user_id", user.id);
    const currentXp =
      (progressRows ?? []).reduce((acc, r: { xp_total: number | null }) => acc + (r.xp_total ?? 0), 0);
    if (currentXp < LEVEL_2_XP_GATE) {
      return NextResponse.json(
        { error: "level_gate", required_xp: LEVEL_2_XP_GATE, current_xp: currentXp },
        { status: 403 }
      );
    }

    // Must have a saved card already.
    const { data: u } = await supabase
      .from("users")
      .select("payment_method_id")
      .eq("id", user.id)
      .single();
    if (!u?.payment_method_id) {
      return NextResponse.json({ error: "no_payment_method" }, { status: 409 });
    }

    // Use service-role client to write protected billing columns.
    const admin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { error } = await admin
      .from("users")
      .update({ auto_renew: true, cancel_reason: null })
      .eq("id", user.id);
    if (error) {
      console.error("enable-recurring DB error:", error);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }
    return NextResponse.json({ ok: true, auto_renew: true });
  } catch (error) {
    console.error("enable-recurring error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
