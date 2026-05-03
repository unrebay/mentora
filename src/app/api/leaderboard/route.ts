import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const url = new URL(req.url);
  const limit = Math.min(100, Math.max(10, parseInt(url.searchParams.get("limit") ?? "50", 10)));

  const { data: top, error: topErr } = await sb.rpc("get_leaderboard", { p_limit: limit });
  if (topErr) return NextResponse.json({ error: topErr.message }, { status: 500 });

  const { data: profile } = await sb.from("user_profiles").select("serial_id").eq("user_id", user.id).maybeSingle();
  const { data: rankRow } = await sb.rpc("get_user_global_rank", { p_user_id: user.id }).maybeSingle();
  const { data: progress } = await sb.from("user_progress").select("subject, xp_total, streak_days").eq("user_id", user.id);

  const myXP      = (progress ?? []).reduce((s, r) => s + (r.xp_total ?? 0), 0);
  const myStreak  = (progress ?? []).reduce((m, r) => Math.max(m, r.streak_days ?? 0), 0);
  const mySubject = (progress ?? []).slice().sort((a, b) => (b.xp_total ?? 0) - (a.xp_total ?? 0))[0]?.subject ?? null;

  return NextResponse.json({
    top: top ?? [],
    mySerialId: profile?.serial_id ?? null,
    myRank:     (rankRow as { rank?: number } | null)?.rank ?? null,
    myTotal:    (rankRow as { total?: number } | null)?.total ?? null,
    myXP,
    myStreak,
    mySubject,
  });
}
