import { NextResponse } from "next/server";
import { requireAdmin, createAdminSupabase } from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const forbidden = await requireAdmin();
  if (forbidden) return forbidden;

  const sb = createAdminSupabase();

  // 1) Total signups (all users)
  const { count: totalUsers } = await sb
    .from("users")
    .select("*", { count: "exact", head: true });

  // 2) Onboarded — users with onboarding_completed = true
  const { count: onboardedCount } = await sb
    .from("users")
    .select("*", { count: "exact", head: true })
    .eq("onboarding_completed", true);

  // 3) First message sent — distinct user_id from chat_messages where role=user
  const { data: chatUsers } = await sb
    .from("chat_messages")
    .select("user_id")
    .eq("role", "user")
    .limit(10000); // safe cap; aggregate after fetch
  const usersWithMessages = new Set((chatUsers ?? []).map((r) => r.user_id));

  // 4) 3+ messages — count msgs per user, threshold ≥3
  const userMsgCount = new Map<string, number>();
  for (const r of chatUsers ?? []) {
    userMsgCount.set(r.user_id, (userMsgCount.get(r.user_id) ?? 0) + 1);
  }
  const usersWith3PlusMessages = [...userMsgCount.values()].filter((v) => v >= 3).length;

  // 5) Upgraded — plan in (pro, ultima) OR active trial
  const { count: paidUsers } = await sb
    .from("users")
    .select("*", { count: "exact", head: true })
    .in("plan", ["pro", "ultima"]);

  const { count: trialUsers } = await sb
    .from("users")
    .select("*", { count: "exact", head: true })
    .eq("plan", "free")
    .gt("trial_expires_at", new Date().toISOString());

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

  return NextResponse.json({ stages: enriched, generatedAt: new Date().toISOString() });
}
