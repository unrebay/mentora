import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

/**
 * POST /api/payments/cancel-recurring
 *
 * Turns off auto-renewal — user keeps the rest of the currently paid period
 * (plan_expires_at), but no headless charge will be attempted by the cron.
 * Saved card metadata (payment_method_id / card_last4) is intentionally kept
 * so re-enabling is one click; user can wipe it via /change-card if they wish.
 *
 * Optional body { reason: string } → stored in users.cancel_reason for UX research.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const reason: string | null =
      typeof body.reason === "string" ? body.reason.trim().slice(0, 500) || null : null;

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Use service-role client to write protected billing columns
    // (BEFORE UPDATE trigger blocks authenticated role from changing auto_renew).
    const admin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { error } = await admin
      .from("users")
      .update({ auto_renew: false, cancel_reason: reason })
      .eq("id", user.id);
    if (error) {
      console.error("cancel-recurring DB error:", error);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }
    return NextResponse.json({ ok: true, auto_renew: false });
  } catch (error) {
    console.error("cancel-recurring error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
