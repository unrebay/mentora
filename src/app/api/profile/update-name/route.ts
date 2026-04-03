import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

const NICK_RE = /^[a-z0-9]{3,20}$/;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, fullName, age, phone } = body as { name?: string; fullName?: string; age?: number; phone?: string };
    if (name !== undefined && !NICK_RE.test(name))
      return NextResponse.json({ error: "Никнейм: только строчные a–z и 0–9, от 3 до 20 символов" }, { status: 400 });
    if (age !== undefined && (typeof age !== "number" || age < 1 || age > 119))
      return NextResponse.json({ error: "Возраст: число от 1 до 119" }, { status: 400 });
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    );
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    const { data: profile } = await supabase.from("users").select("name_changes_count").eq("id", user.id).single();
    if (name !== undefined && (profile?.name_changes_count ?? 0) >= 2)
      return NextResponse.json({ error: "Никнейм можно изменить только 2 раза" }, { status: 400 });
    const admin = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const updates: Record<string, unknown> = {};
    if (name !== undefined)     { updates.display_name = name; updates.name_changes_count = (profile?.name_changes_count ?? 0) + 1; }
    if (fullName !== undefined) updates.full_name = fullName;
    if (age !== undefined)      updates.age = age;
    if (phone !== undefined)    updates.phone = phone;
    if (Object.keys(updates).length === 0) return NextResponse.json({ ok: true });
    const { error: updateError } = await admin.from("users").update(updates).eq("id", user.id);
    if (updateError) { console.error("update-profile error:", updateError); return NextResponse.json({ error: "Ошибка базы данных" }, { status: 500 }); }
    return NextResponse.json({ ok: true, name });
  } catch (err) {
    console.error("update-profile exception:", err);
    return NextResponse.json({ error: "Внутренняя ошибка" }, { status: 500 });
  }
}
