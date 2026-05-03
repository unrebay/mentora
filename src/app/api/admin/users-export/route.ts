import { NextResponse } from "next/server";
import { requireAdmin, createAdminSupabase } from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const forbidden = await requireAdmin();
  if (forbidden) return forbidden;

  const sb = createAdminSupabase();
  const { data, error } = await sb
    .from("users")
    .select("id, email, full_name, plan, trial_expires_at, gift_pro_claimed, onboarding_completed, created_at, last_active_at")
    .order("created_at", { ascending: false })
    .limit(5000);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = data ?? [];
  const headers = ["id", "email", "full_name", "plan", "trial_expires_at", "gift_pro_claimed", "onboarding_completed", "created_at", "last_active_at"];

  const csv = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => {
      const v = (r as Record<string, unknown>)[h];
      if (v === null || v === undefined) return "";
      const s = String(v).replace(/"/g, '""');
      return /[,"\n]/.test(s) ? `"${s}"` : s;
    }).join(",")),
  ].join("\n");

  const filename = `mentora-users-${new Date().toISOString().slice(0, 10)}.csv`;
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
