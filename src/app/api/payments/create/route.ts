import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

const YOOKASSA_SHOP_ID = process.env.YOOKASSA_SHOP_ID!;
const YOOKASSA_SECRET_KEY = process.env.YOOKASSA_SECRET_KEY!;
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://mentora.su";

const PLANS = {
  monthly: { amount: "399.00",  amountInt: 39900,  label: "Mentora Pro — подписка на 1 месяц" },
  annual:  { amount: "2990.00", amountInt: 299000, label: "Mentora Pro — подписка на 1 год"   },
} as const;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const planKey: "monthly" | "annual" = body.plan === "annual" ? "annual" : "monthly";
    const plan = PLANS[planKey];

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: existing } = await supabase.from("subscriptions").select("*")
      .eq("user_id", user.id).eq("status", "active").gt("expires_at", new Date().toISOString()).single();
    if (existing) return NextResponse.json({ error: "Already subscribed" }, { status: 400 });

    const response = await fetch("https://api.yookassa.ru/v3/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotence-Key": randomUUID(),
        Authorization: "Basic " + Buffer.from(`${YOOKASSA_SHOP_ID}:${YOOKASSA_SECRET_KEY}`).toString("base64"),
      },
      body: JSON.stringify({
        amount: { value: plan.amount, currency: "RUB" },
        confirmation: { type: "redirect", return_url: `${BASE_URL}/dashboard?payment=success` },
        capture: true,
        description: plan.label,
        metadata: { user_id: user.id, plan: planKey },
      }),
    });

    if (!response.ok) {
      console.error("YooKassa error:", await response.json());
      return NextResponse.json({ error: "Payment creation failed" }, { status: 500 });
    }

    const payment = await response.json();

    const admin = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { cookies: { getAll: () => [], setAll: () => {} } }
    );
    await admin.from("subscriptions").insert({
      user_id: user.id, status: "inactive", plan: planKey,
      yookassa_payment_id: payment.id, amount: plan.amountInt,
    });

    return NextResponse.json({ confirmation_url: payment.confirmation.confirmation_url });
  } catch (error) {
    console.error("Payment create error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
