import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

const YOOKASSA_SHOP_ID = process.env.YOOKASSA_SHOP_ID!;
const YOOKASSA_SECRET_KEY = process.env.YOOKASSA_SECRET_KEY!;
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://mentora.su";

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Проверяем — нет ли уже активной подписки
    const { data: existing } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active")
      .gt("expires_at", new Date().toISOString())
      .single();

    if (existing) {
      return NextResponse.json({ error: "Already subscribed" }, { status: 400 });
    }

    // Создаём платёж в YooKassa
    const idempotenceKey = randomUUID();
    const response = await fetch("https://api.yookassa.ru/v3/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotence-Key": idempotenceKey,
        Authorization: "Basic " + Buffer.from(`${YOOKASSA_SHOP_ID}:${YOOKASSA_SECRET_KEY}`).toString("base64"),
      },
      body: JSON.stringify({
        amount: { value: "499.00", currency: "RUB" },
        confirmation: {
          type: "redirect",
          return_url: `${BASE_URL}/dashboard?payment=success`,
        },
        capture: true,
        description: "Mentora Pro — подписка на 1 месяц",
        metadata: { user_id: user.id },
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      console.error("YooKassa error:", err);
      return NextResponse.json({ error: "Payment creation failed" }, { status: 500 });
    }

    const payment = await response.json();

    // Сохраняем pending-запись в БД
    const supabaseAdmin = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { cookies: { getAll: () => [], setAll: () => {} } }
    );

    await supabaseAdmin.from("subscriptions").insert({
      user_id: user.id,
      status: "inactive",
      yookassa_payment_id: payment.id,
      amount: 49900,
    });

    return NextResponse.json({ confirmation_url: payment.confirmation.confirmation_url });
  } catch (error) {
    console.error("Payment create error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
