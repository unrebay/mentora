import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (body.type !== "notification") return NextResponse.json({ ok: true });
    const payment = body.object;
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

    await supabase.from("users").update({ plan: userPlan }).eq("id", userId);
    console.log(`✅ ${userPlan} (${planKey}, ${days}d) activated: user ${userId}`);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ ok: true });
  }
}
