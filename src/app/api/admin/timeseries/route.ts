import { NextResponse, NextRequest } from "next/server";
import { requireAdmin, createAdminSupabase } from "@/lib/admin";

export const dynamic = "force-dynamic";

interface DayPoint {
  date: string; // YYYY-MM-DD
  signups: number;
  activeUsers: number;
  messages: number;
  revenue: number; // rubles
}

interface Subject {
  id: string;
  count: number;
}

function dayKey(ts: string | Date): string {
  const d = typeof ts === "string" ? new Date(ts) : ts;
  return d.toISOString().slice(0, 10);
}

function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function GET(req: NextRequest) {
  const forbidden = await requireAdmin();
  if (forbidden) return forbidden;

  const days = Math.max(1, Math.min(90, parseInt(req.nextUrl.searchParams.get("days") ?? "30", 10)));
  const since = daysAgo(days - 1).toISOString();

  const sb = createAdminSupabase();

  // Initialize empty buckets for every day in range so the chart doesn't have gaps
  const points = new Map<string, DayPoint>();
  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    const k = dayKey(d);
    points.set(k, { date: k, signups: 0, activeUsers: 0, messages: 0, revenue: 0 });
  }

  // Signups by day
  const { data: signupsRows } = await sb
    .from("users")
    .select("created_at")
    .gte("created_at", since);
  for (const r of signupsRows ?? []) {
    const k = dayKey(r.created_at);
    const p = points.get(k);
    if (p) p.signups += 1;
  }

  // Active users by day (last_active_at)
  const { data: activeRows } = await sb
    .from("users")
    .select("last_active_at")
    .gte("last_active_at", since);
  // For activeUsers we want "DAU per day" — count distinct users active that day
  // but we only have last_active_at (most recent). So this counts only users whose
  // last_active_at falls in that day. Approximation, fine for trend signal.
  for (const r of activeRows ?? []) {
    if (!r.last_active_at) continue;
    const k = dayKey(r.last_active_at);
    const p = points.get(k);
    if (p) p.activeUsers += 1;
  }

  // Messages by day (chat_messages where role=user)
  const { data: msgRows } = await sb
    .from("chat_messages")
    .select("created_at, subject")
    .eq("role", "user")
    .gte("created_at", since);

  const subjectCounts = new Map<string, number>();
  for (const r of msgRows ?? []) {
    const k = dayKey(r.created_at);
    const p = points.get(k);
    if (p) p.messages += 1;
    if (r.subject) subjectCounts.set(r.subject, (subjectCounts.get(r.subject) ?? 0) + 1);
  }

  // Revenue by day (subscriptions)
  const { data: subRows } = await sb
    .from("subscriptions")
    .select("started_at, amount, status")
    .eq("status", "active")
    .gte("started_at", since);
  for (const r of subRows ?? []) {
    if (!r.started_at) continue;
    const k = dayKey(r.started_at);
    const p = points.get(k);
    if (p) p.revenue += Math.round((r.amount ?? 0) / 100);
  }

  const series = Array.from(points.values()).sort((a, b) => a.date.localeCompare(b.date));

  // Top subjects — sorted desc, top 10
  const topSubjects: Subject[] = Array.from(subjectCounts.entries())
    .map(([id, count]) => ({ id, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Totals + previous-period totals for delta
  const halfPoint = Math.floor(series.length / 2);
  const recent = series.slice(halfPoint);
  const prior = series.slice(0, halfPoint);
  const totals = (arr: DayPoint[]) => arr.reduce((acc, p) => ({
    signups: acc.signups + p.signups,
    activeUsers: acc.activeUsers + p.activeUsers,
    messages: acc.messages + p.messages,
    revenue: acc.revenue + p.revenue,
  }), { signups: 0, activeUsers: 0, messages: 0, revenue: 0 });

  return NextResponse.json({
    days,
    series,
    topSubjects,
    totals: totals(series),
    deltaVsPrev: {
      recent: totals(recent),
      prior: totals(prior),
    },
    generatedAt: new Date().toISOString(),
  });
}
