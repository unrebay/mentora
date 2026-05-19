import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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
      console.error("Webhook: YooKassa re-fetch failed", verifyResp.status);
      return NextResponse.json({ ok: true });
    }

    // Use the verified payment object, not the webhook body
    const payment = await verifyResp.json();
    if (payment.status !== "succeeded") return NextResponse.json({ ok: true });

    const userId = payment.metadata?.user_id;
    if (!userId) { console.error("Webhook: no user_id", payment.id); return NextResponse.json({ ok: true }); }

    const rawPlan = payment.metadata?.plan ?? "monthly";
    type PlanKey = "monthly" | "annual" | "ultima_monthly" | "ultima_annual";
    const validPlans: PlanKey[] = ["monthly", "annual", "ultima_monthly", "ultima_annual"];
    const planKey: PlanKey = validPlans.includes(rawPlan) ? rawPlan as PlanKey : "monthly";

    const isUltima = planKey.startsWith("ultima");
    const isAnnual = planKey.endsWith("annual");
    const days = isAnnual ? 365 : 30;
    const userPlan = isUltima ? "ultima" : "pro";

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

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
      payment_method_id?: string;
      card_last4?: string;
      card_type?: string;
    };
    const userUpdate: UserUpdate = {
      plan: userPlan,
      plan_expires_at: expiresAt.toISOString(),
      recurring_failed_attempts: 0,
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
    console.error("Webhook error:", error);
    return NextResponse.json({ ok: true });
  }
}
