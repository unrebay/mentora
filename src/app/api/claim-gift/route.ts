import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

// Gift Pro: free 1-month Pro trial for all registered users, activatable from June 1, 2026
// Expires: January 1, 2027
const GIFT_AVAILABLE_FROM = new Date("2026-06-01T00:00:00+03:00");
const GIFT_EXPIRES_AT = "2027-01-01T00:00:00Z";

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

    // Check gift window is open
    if (Date.now() < GIFT_AVAILABLE_FROM.getTime()) {
      return NextResponse.json({ error: "Gift not available yet" }, { status: 403 });
    }

    // Fetch current profile
    const { data: profile } = await supabase
      .from("users")
      .select("plan, gift_pro_claimed")
      .eq("id", user.id)
      .single();

    if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    if (profile.gift_pro_claimed) {
      return NextResponse.json({ error: "Already claimed" }, { status: 409 });
    }

    // Ultima users: mark claimed but don't downgrade their plan
    const updates: Record<string, unknown> = { gift_pro_claimed: true };
    if (profile.plan !== "ultima") {
      updates.plan = "pro";
      updates.trial_expires_at = GIFT_EXPIRES_AT;
    }

    const { error: updateErr } = await supabase
      .from("users")
      .update(updates)
      .eq("id", user.id);

    if (updateErr) throw updateErr;

    return NextResponse.json({ ok: true, expiresAt: GIFT_EXPIRES_AT });
  } catch (err) {
    console.error("claim-gift error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
