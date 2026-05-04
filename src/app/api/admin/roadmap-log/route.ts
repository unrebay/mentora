import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, createAdminSupabase } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface LogPayload {
  action: string;
  taskCount: number;
  ts: number;
}

export async function POST(req: NextRequest) {
  const forbidden = await requireAdmin();
  if (forbidden) return forbidden;

  let body: LogPayload;
  try {
    body = (await req.json()) as LogPayload;
  } catch {
    return NextResponse.json({ ok: false, error: "bad json" }, { status: 400 });
  }
  if (!body || typeof body.action !== "string") {
    return NextResponse.json({ ok: false, error: "missing action" }, { status: 400 });
  }

  // Get admin email for the audit row
  const userSb = await createClient();
  const { data: { user } } = await userSb.auth.getUser();
  const adminEmail = user?.email ?? "unknown";

  const sb = createAdminSupabase();
  const { error } = await sb.from("admin_audit_log").insert({
    admin_email: adminEmail,
    action: `roadmap:${body.action}`,
    target: `tasks_count=${body.taskCount}`,
    metadata: { ts: body.ts ?? Date.now() },
  });

  // Best-effort — never block the client
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 200 });
  }
  return NextResponse.json({ ok: true });
}
