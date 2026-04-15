import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { nanoid } from "nanoid";

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
    const code = nanoid(8).toUpperCase();
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

// Called when a referred user signs up with ref code
export async function POST(req: NextRequest) {
  const { code, newUserId } = await req.json();
  if (!code || !newUserId) return NextResponse.json({ error: "Missing params" }, { status: 400 });

  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

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

  // Reward referrer: 3 days Pro trial extension
  const { data: referrer } = await admin.from("users").select("trial_expires_at, plan").eq("id", referral.referrer_id).single();
  if (referrer && referrer.plan === "pro") {
    // Already pro - just log it
  } else {
    const base = referrer?.trial_expires_at && new Date(referrer.trial_expires_at) > new Date()
      ? new Date(referrer.trial_expires_at)
      : new Date();
    base.setDate(base.getDate() + 3);
    await admin.from("users").update({ trial_expires_at: base.toISOString() }).eq("id", referral.referrer_id);
  }

  // Mark as rewarded
  await admin.from("referrals").update({ status: "rewarded", rewarded_at: new Date().toISOString() }).eq("id", referral.id);

  return NextResponse.json({ ok: true });
}
