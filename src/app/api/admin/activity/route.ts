import { NextResponse } from "next/server";
import { requireAdmin, createAdminSupabase } from "@/lib/admin";

export const dynamic = "force-dynamic";

interface ActivityEvent {
  type: "signup" | "subscription" | "referral" | "gift_claim" | "trial_extension";
  ts: string;
  title: string;
  detail?: string;
  amount?: number;
}

export async function GET() {
  const forbidden = await requireAdmin();
  if (forbidden) return forbidden;

  const sb = createAdminSupabase();
  const events: ActivityEvent[] = [];

  // Recent signups (last 50)
  const { data: signups } = await sb
    .from("users")
    .select("id, created_at, full_name, plan")
    .order("created_at", { ascending: false })
    .limit(50);
  for (const u of signups ?? []) {
    events.push({
      type: "signup",
      ts: u.created_at,
      title: "Новая регистрация",
      detail: u.full_name || "—",
    });
  }

  // Recent successful subscriptions (last 50)
  const { data: subs } = await sb
    .from("subscriptions")
    .select("user_id, started_at, plan, amount, status")
    .eq("status", "active")
    .order("started_at", { ascending: false })
    .limit(50);
  for (const s of subs ?? []) {
    events.push({
      type: "subscription",
      ts: s.started_at,
      title: `Оплата · ${s.plan}`,
      detail: s.user_id?.slice(0, 8),
      amount: s.amount ? Math.round(s.amount / 100) : undefined,
    });
  }

  // Recent successful referrals
  const { data: refs } = await sb
    .from("referrals")
    .select("code, completed_at, status")
    .in("status", ["completed", "rewarded"])
    .order("completed_at", { ascending: false })
    .limit(50);
  for (const r of refs ?? []) {
    if (!r.completed_at) continue;
    events.push({
      type: "referral",
      ts: r.completed_at,
      title: "Реферал использован",
      detail: r.code,
    });
  }

  // Sort all by timestamp desc, limit 50
  events.sort((a, b) => (b.ts || "").localeCompare(a.ts || ""));
  return NextResponse.json({ events: events.slice(0, 50), generatedAt: new Date().toISOString() });
}
