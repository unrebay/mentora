import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendWelcomeEmail } from "@/lib/sendEmail";

/**
 * One-off backfill endpoint: send welcome email to users who registered when
 * the RESEND2_API_KEY wiring was broken (commit 7d871637 fix) — their
 * `welcome_sent` flag stayed `false`.
 *
 * Auth: x-admin-token header must match ADMIN_SECRET env.
 *
 * Body (optional JSON):
 *   { limit?: number = 100, dry_run?: boolean = false }
 *
 * Returns:
 *   { ok: true, total_pending: N, sent: M, failed: K, skipped: S, dry_run: bool, samples: [...] }
 *
 * Safety:
 *   - Limits batch to 100 by default (Resend rate-limit).
 *   - Only sends to users with welcome_sent=false (idempotent — re-running safe).
 *   - Updates welcome_sent=true only AFTER successful Resend response.
 */
export async function POST(req: NextRequest) {
  if (!process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "ADMIN_SECRET not configured" }, { status: 500 });
  }
  const auth = req.headers.get("x-admin-token");
  if (auth !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const limit = Math.min(Math.max(Number(body.limit) || 100, 1), 500);
  const dryRun = Boolean(body.dry_run);

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 1. Find pending users
  const { data: pending, error: selErr } = await admin
    .from("users")
    .select("id, email, created_at")
    .eq("welcome_sent", false)
    .not("email", "is", null)
    // Skip all *@mentora.su emails: Telegram pseudo-accounts (tg_<id>@) and
    // test fixtures (test.free@, test.pro@, test.ultima@). We only host outbound
    // for this domain — no inbox — so any send would bounce.
    .not("email", "like", "%@mentora.su")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (selErr) {
    return NextResponse.json({ error: "select failed", details: selErr.message }, { status: 500 });
  }
  const rows = pending ?? [];
  if (rows.length === 0) {
    return NextResponse.json({ ok: true, total_pending: 0, sent: 0, failed: 0, skipped: 0, dry_run: dryRun });
  }

  if (dryRun) {
    return NextResponse.json({
      ok: true,
      dry_run: true,
      total_pending: rows.length,
      samples: rows.slice(0, 10).map(r => ({ email: r.email, created_at: r.created_at })),
    });
  }

  // 2. Send + update one by one (avoid Resend rate-limit + per-user error isolation)
  let sent = 0;
  let failed = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const row of rows) {
    if (!row.email || typeof row.email !== "string") {
      skipped++;
      continue;
    }
    try {
      await sendWelcomeEmail(row.email);
      const { error: updErr } = await admin
        .from("users")
        .update({ welcome_sent: true })
        .eq("id", row.id);
      if (updErr) {
        failed++;
        errors.push(`${row.email}: update failed - ${updErr.message}`);
      } else {
        sent++;
      }
    } catch (e: unknown) {
      failed++;
      errors.push(`${row.email}: ${e instanceof Error ? e.message : String(e)}`);
    }
    // Polite throttle — Resend free is 100/day, 10/sec.
    await new Promise(r => setTimeout(r, 200));
  }

  return NextResponse.json({
    ok: true,
    total_pending: rows.length,
    sent,
    failed,
    skipped,
    errors: errors.slice(0, 10),
  });
}
