import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, createAdminSupabase } from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const forbidden = await requireAdmin();
  if (forbidden) return forbidden;

  const { searchParams } = new URL(req.url);
  const page   = parseInt(searchParams.get("page")  ?? "1");
  const limit  = parseInt(searchParams.get("limit") ?? "30");
  const plan   = searchParams.get("plan")   ?? "";
  const search = searchParams.get("search") ?? "";
  const offset = (page - 1) * limit;

  const sb = createAdminSupabase();

  let q = sb
    .from("users")
    .select("id, email, plan, created_at, last_active_at, messages_today, trial_expires_at, referred_by", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (plan)   q = q.eq("plan", plan);
  if (search) q = q.ilike("email", `%${search}%`);

  const { data: userData, count, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Fetch total message count per user (user-role only = actual queries sent)
  const userIds = (userData ?? []).map(u => u.id);
  let msgCounts: Record<string, number> = {};
  if (userIds.length > 0) {
    const { data: msgRows } = await sb
      .from("chat_messages")
      .select("user_id")
      .in("user_id", userIds)
      .eq("role", "user");
    for (const m of msgRows ?? []) {
      msgCounts[m.user_id] = (msgCounts[m.user_id] ?? 0) + 1;
    }
  }

  // Fetch subject count per user (distinct subjects studied)
  let subjectCounts: Record<string, number> = {};
  if (userIds.length > 0) {
    const { data: progRows } = await sb
      .from("user_progress")
      .select("user_id, subject")
      .in("user_id", userIds);
    for (const r of progRows ?? []) {
      subjectCounts[r.user_id] = (subjectCounts[r.user_id] ?? 0) + 1;
    }
  }

  const users = (userData ?? []).map(u => ({
    ...u,
    messages_total:  msgCounts[u.id]     ?? 0,
    subjects_count:  subjectCounts[u.id] ?? 0,
  }));

  return NextResponse.json({ users, total: count ?? 0, page, limit });
}
