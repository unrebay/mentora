import { NextResponse, NextRequest } from "next/server";
import { requireAdmin, createAdminSupabase } from "@/lib/admin";

export const dynamic = "force-dynamic";

interface AuditEntry {
  id: string;
  admin_email: string;
  action: string;
  target?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

// GET — list recent audit entries
export async function GET() {
  const forbidden = await requireAdmin();
  if (forbidden) return forbidden;

  const sb = createAdminSupabase();
  const { data, error } = await sb
    .from("admin_audit_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  // Table may not exist yet — return empty list with note instead of crashing.
  if (error) {
    return NextResponse.json({
      entries: [],
      tableMissing: true,
      note: "Создай таблицу admin_audit_log в Supabase (см. инструкции).",
      sql: `CREATE TABLE IF NOT EXISTS admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_email TEXT NOT NULL,
  action TEXT NOT NULL,
  target TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;`,
    });
  }

  return NextResponse.json({ entries: data as AuditEntry[] });
}

// POST — admin can log a custom action (used by other admin routes too)
export async function POST(req: NextRequest) {
  const forbidden = await requireAdmin();
  if (forbidden) return forbidden;

  const body = await req.json().catch(() => ({}));
  const { action, target, metadata } = body as { action?: string; target?: string; metadata?: Record<string, unknown> };
  if (!action) return NextResponse.json({ error: "action required" }, { status: 400 });

  const sb = createAdminSupabase();
  const { error } = await sb.from("admin_audit_log").insert({
    admin_email: "unrebay@gmail.com",
    action,
    target,
    metadata,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
