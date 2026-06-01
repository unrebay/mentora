import { notifyAdmin, mskNow } from "@/lib/notifyAdmin";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { annualPromoActive, ANNUAL_PROMO_BONUS_DAYS } from "@/lib/promo";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (body.type !== "notification") return NextResponse.json({ ok: true });

    // Never trust the webhook body — re-fetch payment from YooKassa API to verify
    const notifiedPaymentId = body.object?.id;
    if (!notifiedPaymentId) return NextResponse.json({ ok: true });

    const verifyResp = await fetch(`https://api.yookassa.ru/v3/payments/${notifiedPaymentId}`, {
      headers: {
        Authorization: "Basic " + Buffer.from(
          `${process.env.YOOKASSA_SHOP_ID}:${process.env.YOOKASSA_SECRET_KEY}`
        ).toString("base64"),
      },
    });
    if (!verifyResp.ok) {
      notifyAdmin(`⚠️ <b>ЮKassa API недоступен</b>\nstatus: ${verifyResp.status}\npaymentId: <code>${notifiedPaymentId}</code>\n<i>${mskNow()} МСК</i>`);
      return NextResponse.json({ ok: true });
    }

    // Use the verified payment object, not the webhook body
    const payment = await verifyResp.json();
    if (payment.status !== "succeeded") {
      if (payment.status === "canceled") {
        const amt = payment.amount?.value ?? "?";
        const plan = payment.metadata?.plan ?? "?";
        notifyAdmin(`❌ <b>Платёж отменён</b>\nid: <code>${payment.id}</code>\nsumma: ${amt}₽\nplan: ${plan}\nuser: <code>${payment.metadata?.user_id ?? "?"}</code>\n<i>${mskNow()} МСК</i>`);
      }
      return NextResponse.json({ ok: true });
    }

    const userId = payment.metadata?.user_id;
    if (!userId) { console.error("Webhook: no user_id", payment.id); return NextResponse.json({ ok: true }); }

    const rawPlan = payment.metadata?.plan ?? "monthly";
    type PlanKey = "monthly" | "annual" | "ultima_monthly" | "ultima_annual";
    const validPlans: PlanKey[] = ["monthly", "annual", "ultima_monthly", "ultima_annual"];
    const planKey: PlanKey = validPlans.includes(rawPlan) ? rawPlan as PlanKey : "monthly";

    const isUltima = planKey.startsWith("ultima");
    const isAnnual = planKey.endsWith("annual");
    // Annual launch promo: +bonus days while the promo is active (see src/lib/promo.ts).
    // Renewals a year later fall outside the window, so they get no bonus automatically.
    const promoBonus = isAnnual && annualPromoActive() ? ANNUAL_PROMO_BONUS_DAYS : 0;
    const days = (isAnnual ? 365 : 30) + promoBonus;
    const userPlan = isUltima ? "ultima" : "pro";

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    // C1: idempotency guard — if this exact payment was already applied, do NOT
    // extend the plan again. YooKassa retries notifications, and a user who knows
    // their own payment.id could otherwise replay it to keep extending for free.
    // (subscriptions.yookassa_payment_id is unique; a row here means "already processed".)
    const { data: alreadyApplied } = await supabase
      .from("subscriptions")
      .select("yookassa_payment_id")
      .eq("yookassa_payment_id", payment.id)
      .maybeSingle();
    if (alreadyApplied) {
      console.log(`Webhook replay ignored for payment ${payment.id} (already applied)`);
      return NextResponse.json({ ok: true });
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);

    await supabase.from("subscriptions").upsert({
      user_id: userId, status: "active", plan: planKey,
      yookassa_payment_id: payment.id,
      amount: Math.round(parseFloat(payment.amount.value) * 100),
      started_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
    }, { onConflict: "yookassa_payment_id" });

    // Recurring billing: if ЮKassa tokenised the card on this payment
    // (save_payment_method:true on create), persist the token + card meta on users
    // so cron /api/payments/charge-recurring can charge headlessly next month.
    // We always sync plan_expires_at + reset failed-attempts counter.
    type UserUpdate = {
      plan: string;
      plan_expires_at: string;
      recurring_failed_attempts: number;
      plan_interval?: "monthly" | "annual";
      payment_method_id?: string;
      card_last4?: string;
      card_type?: string;
    };
    const userUpdate: UserUpdate = {
      plan: userPlan,
      plan_expires_at: expiresAt.toISOString(),
      recurring_failed_attempts: 0,
      plan_interval: isAnnual ? "annual" : "monthly",
    };
    const pm = payment.payment_method;
    if (pm?.saved && pm.id) {
      userUpdate.payment_method_id = pm.id;
      if (pm.card?.last4) userUpdate.card_last4 = pm.card.last4;
      if (pm.card?.card_type) userUpdate.card_type = String(pm.card.card_type).toLowerCase();
    }
    await supabase.from("users").update(userUpdate).eq("id", userId);
    console.log(`✅ ${userPlan} (${planKey}, ${days}d) activated: user ${userId}${pm?.saved ? ` [card saved: ${pm.card?.last4 ?? "?"}]` : ""}`);
    return NextResponse.json({ ok: true });
  } catch (error) {
    notifyAdmin(`🔴 <b>Webhook 500 Exception</b>\nerr: ${String(error).slice(0, 300).replace(/</g, "&lt;")}\n<i>${mskNow()} МСК</i>`);
    console.error("Webhook error:", error);
    // Return 500 on actual exceptions so YooKassa retries on transient failures
    // (brief DB outage, ANTHROPIC proxy hiccup). 2xx tells them "done, don't retry".
    return NextResponse.json({ ok: false, error: "internal" }, { status: 500 });
  }
}
