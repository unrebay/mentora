import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const level = Number(body?.level);
  if (!Number.isInteger(level) || level < 0 || level > 7) {
    return NextResponse.json({ error: "invalid level" }, { status: 400 });
  }

  const { data, error } = await sb.rpc("set_user_avatar", { p_user_id: user.id, p_level: level }).maybeSingle();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true, level: data });
}
