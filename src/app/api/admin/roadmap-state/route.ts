import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, createAdminSupabase } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** GET — fetch latest saved roadmap state for the current admin. */
export async function GET() {
  const forbidden = await requireAdmin();
  if (forbidden) return forbidden;

  const userSb = await createClient();
  const { data: { user } } = await userSb.auth.getUser();
  const adminEmail = user?.email ?? "unknown";

  const sb = createAdminSupabase();
  const { data, error } = await sb
    .from("admin_roadmap_state")
    .select("state, updated_at")
    .eq("admin_email", adminEmail)
    .maybeSingle();

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 200 });
  return NextResponse.json({ ok: true, state: data?.state ?? null, updatedAt: data?.updated_at ?? null });
}

/** POST — replace saved roadmap state + push snapshot to history. */
export async function POST(req: NextRequest) {
  const forbidden = await requireAdmin();
  if (forbidden) return forbidden;

  let body: { state?: unknown; action?: string };
  try { body = await req.json(); } catch { body = {}; }

  if (!Array.isArray(body.state)) {
    return NextResponse.json({ ok: false, error: "state must be array" }, { status: 400 });
  }
  const state = body.state as unknown[];
  const action = typeof body.action === "string" ? body.action.slice(0, 200) : "save";

  const userSb = await createClient();
  const { data: { user } } = await userSb.auth.getUser();
  const adminEmail = user?.email ?? "unknown";

  const sb = createAdminSupabase();

  // Upsert latest state
  const { error: upsertErr } = await sb
    .from("admin_roadmap_state")
    .upsert({ admin_email: adminEmail, state, updated_at: new Date().toISOString() }, { onConflict: "admin_email" });

  // Append history snapshot (best-effort, don't block if it fails)
  await sb.from("admin_roadmap_state_history").insert({
    admin_email: adminEmail,
    state,
    task_count: state.length,
    action,
  });

  // Trim history beyond 100 entries per admin
  await sb.rpc("admin_roadmap_state_history_trim", { p_admin_email: adminEmail, p_keep: 100 }).catch(() => {});

  if (upsertErr) {
    return NextResponse.json({ ok: false, error: upsertErr.message }, { status: 200 });
  }
  return NextResponse.json({ ok: true });
}
