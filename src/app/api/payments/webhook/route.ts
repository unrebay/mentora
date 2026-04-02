import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // YooKassa присылает объект события
    if (body.type !== "notification") {
      return NextResponse.json({ ok: true });
    }

    const payment = body.object;

    // Нас интересует только успешная оплата
    if (payment.status !== "succeeded") {
      return NextResponse.json({ ok: true });
    }

    const userId = payment.metadata?.user_id;
    if (!userId) {
      console.error("Webhook: no user_id in metadata", payment.id);
      return NextResponse.json({ ok: true });
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { cookies: { getAll: () => [], setAll: () => {} } }
    );

    // Активируем подписку на 30 дней
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await supabase
      .from("subscriptions")
      .upsert({
        user_id: userId,
        status: "active",
        yookassa_payment_id: payment.id,
        amount: Math.round(parseFloat(payment.amount.value) * 100),
        started_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
      }, { onConflict: "yookassa_payment_id" });

    // Обновляем план пользователя
    await supabase
      .from("users")
      .update({ plan: "pro" })
      .eq("id", userId);

    console.log(`✅ Pro activated for user ${userId}, payment ${payment.id}`);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Webhook error:", error);
    // YooKassa ждёт 200 даже при ошибке, иначе будет ретраить
    return NextResponse.json({ ok: true });
  }
}
