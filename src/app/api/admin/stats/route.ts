import { NextResponse } from "next/server";
import { requireAdmin, createAdminSupabase } from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const forbidden = await requireAdmin();
  if (forbidden) return forbidden;

  const sb = createAdminSupabase();
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [
    totalUsersRes, proUsersRes, ultimaUsersRes, newTodayRes, activeTodayRes, activeWeekRes,
    totalMsgsRes, msgsTodayRes, userMsgsWeekRes, aiMsgsWeekRes,
    activeSubsRes, chunksRes, recentUsersRes, subjectMsgsRes, trialExpiredRes,
  ] = await Promise.all([
    sb.from("users").select("*", { count: "exact", head: true }),
    sb.from("users").select("*", { count: "exact", head: true }).eq("plan", "pro"),
    sb.from("users").select("*", { count: "exact", head: true }).eq("plan", "ultima"),
    sb.from("users").select("*", { count: "exact", head: true }).gte("created_at", todayStart),
    sb.from("users").select("*", { count: "exact", head: true }).gte("last_active_at", todayStart),
    sb.from("users").select("*", { count: "exact", head: true }).gte("last_active_at", weekAgo),
    sb.from("chat_messages").select("*", { count: "exact", head: true }),
    sb.from("chat_messages").select("*", { count: "exact", head: true }).gte("created_at", todayStart),
    sb.from("chat_messages").select("*", { count: "exact", head: true }).eq("role", "user").gte("created_at", weekAgo),
    sb.from("chat_messages").select("*", { count: "exact", head: true }).eq("role", "assistant").gte("created_at", weekAgo),
    sb.from("subscriptions").select("*", { count: "exact", head: true }).eq("status", "active"),
    sb.from("knowledge_chunks").select("*", { count: "exact", head: true }),
    sb.from("users").select("id, email, plan, created_at, last_active_at").order("created_at", { ascending: false }).limit(10),
    sb.from("chat_messages").select("subject").eq("role", "user").gte("created_at", monthAgo),
    sb.from("users").select("*", { count: "exact", head: true }).not("trial_expires_at", "is", null).lt("trial_expires_at", now.toISOString()).eq("plan", "free"),
  ]);

  // Compute actual today's message count per recent user from chat_messages
  const recentUserIds = (recentUsersRes.data ?? []).map(u => u.id);
  let todayMsgCounts: Record<string, number> = {};
  if (recentUserIds.length > 0) {
    const { data: todayMsgs } = await sb
      .from("chat_messages")
      .select("user_id")
      .in("user_id", recentUserIds)
      .eq("role", "user")
      .gte("created_at", todayStart);
    for (const m of todayMsgs ?? []) {
      todayMsgCounts[m.user_id] = (todayMsgCounts[m.user_id] ?? 0) + 1;
    }
  }

  const subjectCounts: Record<string, number> = {};
  for (const msg of subjectMsgsRes.data ?? []) {
    const s = msg.subject || "unknown";
    subjectCounts[s] = (subjectCounts[s] || 0) + 1;
  }
  const topSubjects = Object.entries(subjectCounts)
    .sort((a, b) => b[1] - a[1]).slice(0, 5)
    .map(([subject, count]) => ({ subject, count }));

  const totalUsers = totalUsersRes.count ?? 0;
  const proUsers = proUsersRes.count ?? 0;
  const ultimaUsers = ultimaUsersRes.count ?? 0;
  const userMsgsWeek = userMsgsWeekRes.count ?? 0;
  const aiMsgsWeek = aiMsgsWeekRes.count ?? 0;

  return NextResponse.json({
    users: { total: totalUsers, pro: proUsers, ultima: ultimaUsers, free: totalUsers - proUsers - ultimaUsers, newToday: newTodayRes.count ?? 0, activeToday: activeTodayRes.count ?? 0, activeWeek: activeWeekRes.count ?? 0, trialExpired: trialExpiredRes.count ?? 0 },
    chat: { totalMessages: totalMsgsRes.count ?? 0, messagesToday: msgsTodayRes.count ?? 0, userMessagesWeek: userMsgsWeek, aiResponsesWeek: aiMsgsWeek, aiResponseRate: userMsgsWeek > 0 ? Math.round((aiMsgsWeek / userMsgsWeek) * 100) : 0, topSubjects },
    billing: { activeSubscriptions: activeSubsRes.count ?? 0 },
    knowledge: { chunks: chunksRes.count ?? 0 },
    recentUsers: (recentUsersRes.data ?? []).map(u => ({
      ...u,
      messages_today: todayMsgCounts[u.id] ?? 0,
    })),
    generatedAt: now.toISOString(),
  });
}
