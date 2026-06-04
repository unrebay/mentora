import { NextResponse } from "next/server";
import { requireAdmin, createAdminSupabase } from "@/lib/admin";

export const dynamic = "force-dynamic";

/**
 * Weekly signup cohorts × retention.
 * D1  = active (sent a user-message) on day 1 after signup;
 * D7  = active in days 4–10 (bracketed, tolerant for small cohorts);
 * D30 = active in days 24–36.
 * Returns the last 8 weekly cohorts (newest first).
 */
export async function GET() {
  const forbidden = await requireAdmin();
  if (forbidden) return forbidden;

  const sb = createAdminSupabase();
  const WEEKS = 8;
  const since = new Date(Date.now() - WEEKS * 7 * 86400_000).toISOString();

  const [{ data: users }, { data: msgs }] = await Promise.all([
    sb.from("users").select("id,created_at").gte("created_at", since).limit(20000),
    sb.from("chat_messages").select("user_id,created_at").eq("role", "user").gte("created_at", since).limit(20000),
  ]);

  // signup ts per user
  const signup = new Map<string, number>();
  for (const u of users ?? []) signup.set(u.id, new Date(u.created_at).getTime());

  // per-user set of day-offsets with activity
  const activeDays = new Map<string, Set<number>>();
  for (const m of msgs ?? []) {
    const s = signup.get(m.user_id);
    if (s === undefined) continue;
    const off = Math.floor((new Date(m.created_at).getTime() - s) / 86400_000);
    if (off < 0) continue;
    let set = activeDays.get(m.user_id);
    if (!set) { set = new Set(); activeDays.set(m.user_id, set); }
    set.add(off);
  }

  // Monday-of-week key for a timestamp
  const weekStart = (ts: number) => {
    const d = new Date(ts);
    const day = (d.getUTCDay() + 6) % 7; // 0 = Monday
    const monday = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - day));
    return monday.toISOString().slice(0, 10);
  };

  interface Row { week: string; size: number; d1: number; d7: number; d30: number }
  const byWeek = new Map<string, Row>();
  const nowTs = Date.now();
  for (const [id, s] of signup) {
    const wk = weekStart(s);
    let row = byWeek.get(wk);
    if (!row) { row = { week: wk, size: 0, d1: 0, d7: 0, d30: 0 }; byWeek.set(wk, row); }
    row.size++;
    const days = activeDays.get(id) ?? new Set<number>();
    const has = (a: number, b: number) => { for (let i = a; i <= b; i++) if (days.has(i)) return true; return false; };
    const ageDays = Math.floor((nowTs - s) / 86400_000);
    if (ageDays >= 1 && has(1, 1)) row.d1++;
    if (ageDays >= 4 && has(4, 10)) row.d7++;
    if (ageDays >= 24 && has(24, 36)) row.d30++;
  }

  const cohorts = Array.from(byWeek.values())
    .sort((a, b) => (a.week < b.week ? 1 : -1))
    .map((r) => ({
      ...r,
      d1Pct: r.size ? Math.round((r.d1 / r.size) * 100) : 0,
      d7Pct: r.size ? Math.round((r.d7 / r.size) * 100) : 0,
      d30Pct: r.size ? Math.round((r.d30 / r.size) * 100) : 0,
    }));

  return NextResponse.json({ cohorts, generatedAt: new Date().toISOString() });
}
