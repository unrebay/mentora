import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { sendEmail, streakSaverEmailHtml } from "@/lib/email";
import { getEffectivePlan } from "@/lib/plan";

// Streak-saver nudge. Vercel cron at 17:00 UTC (20:00 MSK) — evening, before
// midnight UTC when an unprotected streak would reset.
// Targets users with a live streak (>=2) who were active YESTERDAY but not today.
// Ultra users are skipped: their streak auto-freezes (handled in increment_xp).
// Protected by CRON_SECRET. Adds an Ultra upsell for Free/Pro.
export async function GET(req: NextRequest) {
  if (!process.env.CRON_SECRET) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }
  const secret = req.headers.get("authorization");
  if (secret !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // UTC day boundaries (match increment_xp's current_date / ::date logic, which runs in UTC).
  const now = new Date();
  const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);

  // Progress rows with a live streak (>=2) last touched yesterday (not today).
  const { data: rows, error } = await supabase
    .from("user_progress")
    .select("user_id, streak_days, last_active_at")
    .gte("streak_days", 2)
    .gte("last_active_at", yesterdayStart.toISOString())
    .lt("last_active_at", todayStart.toISOString());

  if (error) {
    console.error("Streak-saver cron error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Dedupe to one entry per user, keeping their max at-risk streak.
  const maxStreak = new Map<string, number>();
  for (const r of rows ?? []) {
    const cur = maxStreak.get(r.user_id) ?? 0;
    if ((r.streak_days ?? 0) > cur) maxStreak.set(r.user_id, r.streak_days ?? 0);
  }
  const userIds = [...maxStreak.keys()];
  if (userIds.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, failed: 0, total: 0 });
  }

  let sent = 0, failed = 0, skipped = 0;

  // Fetch user plan + email in chunks; decide per user.
  const CHUNK = 200;
  for (let i = 0; i < userIds.length; i += CHUNK) {
    const ids = userIds.slice(i, i + CHUNK);
    const { data: users } = await supabase
      .from("users")
      .select("id, email, plan, plan_expires_at, trial_expires_at, reward_plan, reward_expires_at, last_active_at, streak_saver_sent_at")
      .in("id", ids);

    for (const u of users ?? []) {
      if (!u.email) { skipped++; continue; }
      // Active again today already → not at risk.
      if (u.last_active_at && new Date(u.last_active_at) >= todayStart) { skipped++; continue; }
      // Ultra → streak auto-freezes, no nudge needed.
      if (getEffectivePlan(u) === "ultima") { skipped++; continue; }
      // Already nudged today → don't double-send.
      if (u.streak_saver_sent_at && new Date(u.streak_saver_sent_at) >= todayStart) { skipped++; continue; }

      const streak = maxStreak.get(u.id) ?? 2;
      const ok = await sendEmail({
        to: u.email,
        subject: `🔥 Не потеряй стрик ${streak} дн. — одно сообщение спасёт его`,
        html: streakSaverEmailHtml(streak),
      });
      if (ok) {
        await supabase.from("users").update({ streak_saver_sent_at: now.toISOString() }).eq("id", u.id);
        sent++;
      } else {
        failed++;
      }
    }
  }

  console.log(`Streak-saver cron: ${sent} sent, ${failed} failed, ${skipped} skipped, ${userIds.length} at-risk`);
  return NextResponse.json({ ok: true, sent, failed, skipped, total: userIds.length });
}
