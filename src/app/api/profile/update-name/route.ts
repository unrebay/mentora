import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

const NAME_RE = /^[a-z0-9]{3,20}$/;

export async function POST(request: Request) {
  try {
    const { name } = await request.json();
    if (!name || !NAME_RE.test(name)) {
      return NextResponse.json({ error: "Только строчные буквы a–z и цифры 0–9. От 3 до 20 символов." }, { status: 400 });
    }
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    );
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    const { data: profile } = await supabase.from("users").select("name_changes_count").eq("id", user.id).single();
    if ((profile?.name_changes_count ?? 0) >= 2) {
      return NextResponse.json({ error: "Имя можно изменить только 2 раза" }, { status: 400 });
    }
    const admin = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const { error: updateError } = await admin.from("users").update({
      display_name: name,
      name_changes_count: (profile?.name_changes_count ?? 0) + 1,
    }).eq("id", user.id);
    if (updateError) { console.error("update-name error:", updateError); return NextResponse.json({ error: "Ошибка базы данных" }, { status: 500 }); }
    return NextResponse.json({ ok: true, name });
  } catch (err) {
    console.error("update-name exception:", err);
    return NextResponse.json({ error: "Внутренняя ошибка" }, { status: 500 });
  }
}
