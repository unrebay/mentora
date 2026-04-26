import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Get or create referral code for this user
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  let { data: existing } = await admin.from("referrals")
    .select("code, status, completed_at, referred_id")
    .eq("referrer_id", user.id)
    .limit(10);

  if (!existing || existing.length === 0) {
    // Create a referral code for this user
    const code = Array.from(crypto.getRandomValues(new Uint8Array(6))).map(b => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[b % 32]).join("");
    const { data: newRef } = await admin.from("referrals")
      .insert({ referrer_id: user.id, code })
      .select()
      .single();
    existing = newRef ? [newRef] : [];
  }

  const completed = existing?.filter(r => r.status === "completed" || r.status === "rewarded") ?? [];
  const rewarded = existing?.filter(r => r.status === "rewarded") ?? [];
  const myCode = existing?.[0]?.code ?? "";

  return NextResponse.json({
    code: myCode,
    link: `${process.env.NEXT_PUBLIC_BASE_URL}/auth?ref=${myCode}`,
    totalInvited: existing?.length ?? 0,
    completed: completed.length,
    rewarded: rewarded.length,
  });
}

// Called when a referred user signs up with ref code.
// NOTE: No session cookie required — signup happens before email confirmation,
// so there is no active session yet. We verify the user via the admin client instead.
export async function POST(req: NextRequest) {
  const { code, newUserId } = await req.json();
  if (!code || !newUserId) return NextResponse.json({ error: "Missing params" }, { status: 400 });

  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  // Verify the user actually exists in Supabase Auth (prevents fake UUID injection)
  const { data: authUserData, error: authLookupError } = await admin.auth.admin.getUserById(newUserId);
  if (authLookupError || !authUserData?.user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Prevent double-processing (idempotency): if this user was already referred, skip
  const { data: alreadyReferred } = await admin
    .from("referrals")
    .select("id")
    .eq("referred_id", newUserId)
    .maybeSingle();
  if (alreadyReferred) return NextResponse.json({ ok: false, reason: "already_referred" });

  const { data: referral } = await admin.from("referrals")
    .select("*")
    .eq("code", code)
    .eq("status", "pending")
    .single();

  if (!referral) return NextResponse.json({ ok: false, reason: "invalid_code" });
  if (referral.referrer_id === newUserId) return NextResponse.json({ ok: false, reason: "self_referral" });

  // Mark referral as completed
  await admin.from("referrals").update({
    referred_id: newUserId,
    status: "completed",
    completed_at: new Date().toISOString(),
  }).eq("id", referral.id);

  // Helper: extend trial by N days for a user (skip if already on paid pro)
  async function extendTrial(userId: string, days: number) {
    const { data: u } = await admin.from("users").select("trial_expires_at, plan").eq("id", userId).single();
    if (u?.plan === "pro" || u?.plan === "ultima") return; // already paid — no need
    const base = u?.trial_expires_at && new Date(u.trial_expires_at) > new Date()
      ? new Date(u.trial_expires_at)
      : new Date();
    base.setDate(base.getDate() + days);
    await admin.from("users").update({ trial_expires_at: base.toISOString() }).eq("id", userId);
  }

  // Reward referrer: +3 days Pro trial
  await extendTrial(referral.referrer_id, 3);

  // Reward referred user: +3 days Pro trial (wait for their row to exist)
  // The users table row is created by a DB trigger after auth.users insert,
  // so it should already exist at this point.
  await extendTrial(newUserId, 3);

  // Mark as rewarded
  await admin.from("referrals").update({ status: "rewarded", rewarded_at: new Date().toISOString() }).eq("id", referral.id);

  return NextResponse.json({ ok: true });
}
