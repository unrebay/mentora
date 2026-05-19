import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * POST /api/payments/delete-payment-method
 *
 * Полностью отвязывает сохранённую карту пользователя от магазина:
 *   - payment_method_id = NULL
 *   - card_last4 / card_type = NULL
 *   - auto_renew = false (без карты автопродление невозможно)
 *
 * Цикл, отвечающий требованию ЮKassa «нужно иметь UI для отвязки карты».
 * Текущий оплаченный период не отменяется (plan_expires_at не трогаем).
 *
 * После этого ЮKassa-side ничего удалять не нужно — мы просто перестаём
 * использовать payment_method_id (см. документацию: «В ЮKassa нельзя удалить
 * сохранённый способ оплаты или отменить его сохранение, вы можете сделать
 * это только на своей стороне»).
 */
export async function POST(_req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { error } = await supabase
      .from("users")
      .update({
        payment_method_id: null,
        card_last4: null,
        card_type: null,
        auto_renew: false,
        recurring_failed_attempts: 0,
      })
      .eq("id", user.id);
    if (error) {
      console.error("delete-payment-method DB error:", error);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("delete-payment-method error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
