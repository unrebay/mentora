import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface NeighborRow {
  rank: number;
  serial_id: number;
  xp: number;
  messages: number;
  streak: number;
  is_bot: boolean;
  primary_subject: string | null;
}

export async function GET(req: Request) {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const url = new URL(req.url);
  const limit = Math.min(100, Math.max(10, parseInt(url.searchParams.get("limit") ?? "50", 10)));

  const [topRes, profileRes, rankRes, progressRes, neighborRes] = await Promise.all([
    sb.rpc("get_leaderboard", { p_limit: limit }),
    sb.from("user_profiles").select("serial_id").eq("user_id", user.id).maybeSingle(),
    sb.rpc("get_user_global_rank", { p_user_id: user.id }).maybeSingle(),
    sb.from("user_progress").select("subject, xp_total, streak_days").eq("user_id", user.id),
    sb.rpc("get_leaderboard_around_user", { p_user_id: user.id, p_radius: 1 }),
  ]);

  if (topRes.error) {
    return NextResponse.json({ error: topRes.error.message }, { status: 500 });
  }

  const progress = progressRes.data ?? [];
  const myXP      = progress.reduce((s, r) => s + (r.xp_total ?? 0), 0);
  const myStreak  = progress.reduce((m, r) => Math.max(m, r.streak_days ?? 0), 0);
  const mySubject = progress.slice().sort((a, b) => (b.xp_total ?? 0) - (a.xp_total ?? 0))[0]?.subject ?? null;

  return NextResponse.json({
    top: topRes.data ?? [],
    neighbors: (neighborRes.data ?? []) as NeighborRow[],
    mySerialId: profileRes.data?.serial_id ?? null,
    myRank:     (rankRes.data as { rank?: number } | null)?.rank ?? null,
    myTotal:    (rankRes.data as { total?: number } | null)?.total ?? null,
    myXP,
    myStreak,
    mySubject,
  });
}
