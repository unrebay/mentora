import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, createAdminSupabase } from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const forbidden = await requireAdmin();
  if (forbidden) return forbidden;

  const sb = createAdminSupabase();

  // Optional cohort window: ?days=N restricts the funnel to users who SIGNED UP
  // in the last N days (and their activity). No param = all-time (legacy view).
  const daysRaw = parseInt(req.nextUrl.searchParams.get("days") ?? "0", 10);
  const days = Number.isFinite(daysRaw) && daysRaw > 0 ? Math.min(daysRaw, 365) : 0;
  const since = days ? new Date(Date.now() - days * 86400_000).toISOString() : null;

  const withSince = <T extends { gte: (c: string, v: string) => T }>(q: T) =>
    since ? q.gte("created_at", since) : q;

  // 1) Signups (in window)
  const { count: totalUsers } = await withSince(
    sb.from("users").select("*", { count: "exact", head: true })
  );

  // 2) Onboarded
  const { count: onboardedCount } = await withSince(
    sb.from("users").select("*", { count: "exact", head: true }).eq("onboarding_completed", true)
  );

  // Cohort user ids (only needed when filtering by window)
  let cohortIds: Set<string> | null = null;
  if (since) {
    const { data: cohortUsers } = await sb
      .from("users").select("id").gte("created_at", since).limit(20000);
    cohortIds = new Set((cohortUsers ?? []).map((r) => r.id));
  }

  // 3) First message sent — distinct user_id from chat_messages where role=user
  let msgQuery = sb.from("chat_messages").select("user_id").eq("role", "user").limit(10000);
  if (since) msgQuery = msgQuery.gte("created_at", since);
  const { data: chatUsers } = await msgQuery;
  const rows = (chatUsers ?? []).filter((r) => !cohortIds || cohortIds.has(r.user_id));
  const usersWithMessages = new Set(rows.map((r) => r.user_id));

  // 4) 3+ messages — count msgs per user, threshold ≥3
  const userMsgCount = new Map<string, number>();
  for (const r of rows) {
    userMsgCount.set(r.user_id, (userMsgCount.get(r.user_id) ?? 0) + 1);
  }
  const usersWith3PlusMessages = Array.from(userMsgCount.values()).filter((v) => v >= 3).length;

  // 5) Upgraded — plan in (pro, ultima) OR active trial (within cohort)
  const { count: paidUsers } = await withSince(
    sb.from("users").select("*", { count: "exact", head: true }).in("plan", ["pro", "ultima"])
  );

  const { count: trialUsers } = await withSince(
    sb.from("users").select("*", { count: "exact", head: true })
      .eq("plan", "free").gt("trial_expires_at", new Date().toISOString())
  );

  const upgraded = (paidUsers ?? 0) + (trialUsers ?? 0);

  const stages = [
    { key: "signup",    label: "Регистрация",     count: totalUsers ?? 0 },
    { key: "onboarded", label: "Онбординг пройден", count: onboardedCount ?? 0 },
    { key: "first_msg", label: "Первое сообщение", count: usersWithMessages.size },
    { key: "engaged",   label: "3+ сообщений",     count: usersWith3PlusMessages },
    { key: "upgraded",  label: "Pro / Ultra / Trial", count: upgraded },
  ];

  // Calculate % of preceding stage and % of total
  const top = stages[0].count || 1;
  const enriched = stages.map((s, i) => ({
    ...s,
    pctOfTotal: Math.round((s.count / top) * 100),
    pctOfPrev: i === 0 ? 100 : Math.round((s.count / Math.max(stages[i - 1].count, 1)) * 100),
  }));

  return NextResponse.json({ stages: enriched, windowDays: days || null, generatedAt: new Date().toISOString() });
}
