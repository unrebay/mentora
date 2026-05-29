import { NextResponse } from "next/server";
import { requireAdmin, createAdminSupabase } from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const forbidden = await requireAdmin();
  if (forbidden) return forbidden;

  const sb = createAdminSupabase();
  const now = new Date();
  const todayStart     = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const monthStart     = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const thirtyDaysAgo  = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const fiveDaysAgo    = new Date(Date.now() - 5  * 24 * 60 * 60 * 1000).toISOString();
  const sevenDaysAgo   = new Date(Date.now() - 7  * 24 * 60 * 60 * 1000).toISOString();
  const fourteenDaysAgo  = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
  const twentyOneDaysAgo = new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString();
  const twentyEightDaysAgo = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString();
  const thirtyFiveDaysAgo  = new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString();

  const [
    userMsgsRes, churnRiskUsersRes,
    cohortW1TotalRes, cohortW1ActiveRes,
    cohortW2TotalRes, cohortW2ActiveRes,
    cohortW4TotalRes, cohortW4ActiveRes,
    trialToPaidRes,
    aiMsgsTodayRes, aiMsgsMonthRes,
    heatmapMsgsRes,
  ] = await Promise.all([
    sb.from("chat_messages").select("user_id").eq("role", "user").gte("created_at", thirtyDaysAgo).limit(5000),
    sb.from("users").select("id, email, plan, last_active_at, created_at").in("plan", ["pro", "ultima"]).lt("last_active_at", fiveDaysAgo).order("last_active_at", { ascending: true }).limit(20),
    sb.from("users").select("*", { count: "exact", head: true }).gte("created_at", fourteenDaysAgo).lt("created_at", sevenDaysAgo),
    sb.from("users").select("*", { count: "exact", head: true }).gte("created_at", fourteenDaysAgo).lt("created_at", sevenDaysAgo).gte("last_active_at", sevenDaysAgo),
    sb.from("users").select("*", { count: "exact", head: true }).gte("created_at", twentyOneDaysAgo).lt("created_at", fourteenDaysAgo),
    sb.from("users").select("*", { count: "exact", head: true }).gte("created_at", twentyOneDaysAgo).lt("created_at", fourteenDaysAgo).gte("last_active_at", fourteenDaysAgo),
    sb.from("users").select("*", { count: "exact", head: true }).gte("created_at", thirtyFiveDaysAgo).lt("created_at", twentyEightDaysAgo),
    sb.from("users").select("*", { count: "exact", head: true }).gte("created_at", thirtyFiveDaysAgo).lt("created_at", twentyEightDaysAgo).gte("last_active_at", twentyEightDaysAgo),
    sb.from("users").select("*", { count: "exact", head: true }).in("plan", ["pro", "ultima"]).not("trial_expires_at", "is", null),
    sb.from("chat_messages").select("*", { count: "exact", head: true }).eq("role", "assistant").gte("created_at", todayStart),
    sb.from("chat_messages").select("*", { count: "exact", head: true }).eq("role", "assistant").gte("created_at", monthStart),
    sb.from("chat_messages").select("created_at").eq("role", "user").gte("created_at", thirtyDaysAgo).limit(10000),
  ]);

  const msgCounts: Record<string, number> = {};
  for (const m of userMsgsRes.data ?? []) {
    if (m.user_id) msgCounts[m.user_id] = (msgCounts[m.user_id] ?? 0) + 1;
  }
  const topUserIds = Object.entries(msgCounts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([id]) => id);

  let powerUsers: { id: string; email: string; plan: string; messages: number; last_active_at: string | null }[] = [];
  if (topUserIds.length > 0) {
    const { data: topUsersData } = await sb.from("users").select("id, email, plan, last_active_at").in("id", topUserIds);
    powerUsers = topUserIds.map(id => {
      const u = (topUsersData ?? []).find(x => x.id === id);
      return { id, email: u?.email ?? "—", plan: u?.plan ?? "free", messages: msgCounts[id], last_active_at: u?.last_active_at ?? null };
    });
  }

  const calcPct = (total: number | null, active: number | null) =>
    (total ?? 0) > 0 ? Math.round(((active ?? 0) / (total ?? 1)) * 100) : null;

  const cohortRetention = {
    W1: { total: cohortW1TotalRes.count ?? 0, active: cohortW1ActiveRes.count ?? 0, pct: calcPct(cohortW1TotalRes.count, cohortW1ActiveRes.count) },
    W2: { total: cohortW2TotalRes.count ?? 0, active: cohortW2ActiveRes.count ?? 0, pct: calcPct(cohortW2TotalRes.count, cohortW2ActiveRes.count) },
    W4: { total: cohortW4TotalRes.count ?? 0, active: cohortW4ActiveRes.count ?? 0, pct: calcPct(cohortW4TotalRes.count, cohortW4ActiveRes.count) },
  };

  // $0.0025 per message × 92 RUB/USD = ~0.23 RUB/msg (Haiku 3.5 blended estimate)
  const COST_PER_MSG_RUB = 0.23;
  const aiMsgsToday = aiMsgsTodayRes.count ?? 0;
  const aiMsgsMonth = aiMsgsMonthRes.count ?? 0;

  // Heatmap 7×24 in Moscow time (UTC+3)
  const heatmap: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
  for (const m of heatmapMsgsRes.data ?? []) {
    const mskMs = new Date(m.created_at).getTime() + 3 * 60 * 60 * 1000;
    const msk = new Date(mskMs);
    heatmap[msk.getUTCDay()][msk.getUTCHours()]++;
  }

  return NextResponse.json({
    powerUsers,
    churnRiskUsers: churnRiskUsersRes.data ?? [],
    cohortRetention,
    trialToPaid: trialToPaidRes.count ?? 0,
    aiCost: {
      msgsToday: aiMsgsToday,
      msgsMonth: aiMsgsMonth,
      costTodayRub: Math.round(aiMsgsToday * COST_PER_MSG_RUB),
      costMonthRub: Math.round(aiMsgsMonth * COST_PER_MSG_RUB),
    },
    heatmap,
    heatmapDays: ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"],
    generatedAt: now.toISOString(),
  });
}
