import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

/**
 * POST /api/payments/charge-recurring
 *
 * Headless renewal cron. Triggered daily (pm2/cron) — for every user with
 *   auto_renew = true AND payment_method_id IS NOT NULL
 *   AND plan_expires_at < now() + interval '24 hours'
 * we charge the saved card via ЮKassa's payment_method_id flow (no
 * confirmation, no redirect).
 *
 * Auth: protected by CRON_SECRET (Authorization: Bearer …). The cron runner
 * holds the secret; nobody else can trigger mass charges.
 *
 * Failure handling:
 *   - on charge fail → users.recurring_failed_attempts += 1
 *   - 3 consecutive fails → auto_renew = false (we stop retrying; user must
 *     re-attach card)
 *
 * Successful charges hit the existing webhook (payment.succeeded) which
 * updates subscriptions + extends plan_expires_at — we don't duplicate that
 * logic here.
 */
export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization") ?? "";
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const PLANS: Record<string, { amount: string; label: string; tier: string }> = {
    monthly:        { amount: "499.00",  label: "Mentora Pro — авто-продление 1 мес",    tier: "pro"    },
    annual:         { amount: "2990.00", label: "Mentora Pro — авто-продление 1 год",    tier: "pro"    },
    ultima_monthly: { amount: "799.00",  label: "Mentora Ultima — авто-продление 1 мес", tier: "ultima" },
    ultima_annual:  { amount: "5990.00", label: "Mentora Ultima — авто-продление 1 год", tier: "ultima" },
  };

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Find users whose paid period ends in the next 24h and who have auto_renew on.
  const cutoff = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const { data: due, error: dueErr } = await supabase
    .from("users")
    .select("id, plan, payment_method_id, recurring_failed_attempts, plan_expires_at")
    .eq("auto_renew", true)
    .not("payment_method_id", "is", null)
    .lt("plan_expires_at", cutoff);
  if (dueErr) {
    console.error("charge-recurring: SELECT failed", dueErr);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }
  if (!due?.length) return NextResponse.json({ ok: true, processed: 0 });

  const results: { user_id: string; status: string; reason?: string }[] = [];

  for (const u of due) {
    // Pick a plan-key matching the user's current tier (default → monthly).
    const planKey = u.plan === "ultima" ? "ultima_monthly" : "monthly";
    const plan = PLANS[planKey];
    try {
      const resp = await fetch("https://api.yookassa.ru/v3/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotence-Key": randomUUID(),
          Authorization:
            "Basic " +
            Buffer.from(
              `${process.env.YOOKASSA_SHOP_ID}:${process.env.YOOKASSA_SECRET_KEY}`
            ).toString("base64"),
        },
        body: JSON.stringify({
          amount: { value: plan.amount, currency: "RUB" },
          payment_method_id: u.payment_method_id,
          capture: true,
          description: plan.label,
          metadata: { user_id: u.id, plan: planKey, recurring: "true" },
        }),
      });
      if (!resp.ok) {
        const fails = (u.recurring_failed_attempts ?? 0) + 1;
        const update: { recurring_failed_attempts: number; auto_renew?: boolean } = {
          recurring_failed_attempts: fails,
        };
        if (fails >= 3) update.auto_renew = false;
        await supabase.from("users").update(update).eq("id", u.id);
        const body = await resp.text();
        console.error(`charge-recurring: YooKassa ${resp.status} for ${u.id}: ${body}`);
        results.push({ user_id: u.id, status: "failed", reason: `yookassa_${resp.status}` });
        continue;
      }
      // Success: webhook will run subscriptions upsert + plan_expires_at extend.
      // We just reset the attempt counter here so it's idempotent if the webhook
      // races slightly.
      await supabase
        .from("users")
        .update({ recurring_failed_attempts: 0 })
        .eq("id", u.id);
      results.push({ user_id: u.id, status: "ok" });
    } catch (e) {
      const fails = (u.recurring_failed_attempts ?? 0) + 1;
      const update: { recurring_failed_attempts: number; auto_renew?: boolean } = {
        recurring_failed_attempts: fails,
      };
      if (fails >= 3) update.auto_renew = false;
      await supabase.from("users").update(update).eq("id", u.id);
      console.error(`charge-recurring: exception for ${u.id}`, e);
      results.push({ user_id: u.id, status: "failed", reason: "exception" });
    }
  }

  return NextResponse.json({ ok: true, processed: results.length, results });
}
