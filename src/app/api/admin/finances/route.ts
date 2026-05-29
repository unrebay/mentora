import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, createAdminSupabase } from "@/lib/admin";

export const dynamic = "force-dynamic";

function monthKey(d: string | Date) { return (typeof d === "string" ? d : d.toISOString()).slice(0, 7); }
function R(n: number) { return Math.round(n); }

export async function GET() {
  const forbidden = await requireAdmin();
  if (forbidden) return forbidden;

  const sb = createAdminSupabase();
  const [{ data: expenses }, { data: payments }] = await Promise.all([
    sb.from("admin_expenses").select("*").order("category").order("name"),
    sb.from("subscriptions").select("amount, started_at, plan, status").eq("status", "active").order("started_at", { ascending: true }),
  ]);

  const now = new Date();
  const active = (expenses ?? []).filter((e: Record<string, unknown>) => !e.ended_at || new Date(e.ended_at as string) > now);
  const monthlyFixed = active.filter((e: Record<string, unknown>) => e.period === "monthly" && e.amount_rub != null).reduce((s: number, e: Record<string, unknown>) => s + Number(e.amount_rub), 0);
  const annualMonthly = active.filter((e: Record<string, unknown>) => e.period === "annual" && e.amount_rub != null).reduce((s: number, e: Record<string, unknown>) => s + Number(e.amount_rub) / 12, 0);
  const commissionRate = active.filter((e: Record<string, unknown>) => e.period === "per_transaction" && e.percent_of_revenue != null).reduce((s: number, e: Record<string, unknown>) => s + Number(e.percent_of_revenue), 0);
  const totalMonthlyFixed = R(monthlyFixed + annualMonthly);

  const byMonthMap = new Map<string, { gross: number; count: number }>();
  for (const p of (payments ?? []) as Array<{ amount: number | null; started_at: string | null }>) {
    const m = monthKey(p.started_at ?? new Date());
    const cur = byMonthMap.get(m) ?? { gross: 0, count: 0 };
    cur.gross += R((p.amount ?? 0) / 100);
    cur.count += 1;
    byMonthMap.set(m, cur);
  }

  const months: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  for (const m of byMonthMap.keys()) if (!months.includes(m)) months.push(m);
  months.sort();

  const byMonth = months.map((month) => {
    const inc = byMonthMap.get(month);
    const gross = inc?.gross ?? 0;
    const commission = R(gross * commissionRate);
    const net = gross - commission;
    return { month, gross, net, commission, costs: totalMonthlyFixed + commission, count: inc?.count ?? 0, pnl: net - totalMonthlyFixed };
  });

  const curMonth = monthKey(now);
  const tm = byMonth.find((m) => m.month === curMonth) ?? { gross: 0, net: 0, commission: 0, costs: totalMonthlyFixed, count: 0, pnl: -totalMonthlyFixed };

  const projectStart = new Date(2026, 3, 1);
  const monthsSinceStart = (now.getFullYear() - projectStart.getFullYear()) * 12 + (now.getMonth() - projectStart.getMonth()) + 1;
  const allTimeGross = R((payments ?? [] as Array<{ amount: number | null }>).reduce((s: number, p: { amount: number | null }) => s + (p.amount ?? 0) / 100, 0));
  const allTimeCommission = R(allTimeGross * commissionRate);
  const allTimePnl = (allTimeGross - allTimeCommission) - R(totalMonthlyFixed * monthsSinceStart);

  const breakEvenSubscribers = totalMonthlyFixed > 0 ? Math.ceil(totalMonthlyFixed / R(499 * (1 - commissionRate))) : 0;

  return NextResponse.json({ expenses: expenses ?? [], byMonth, thisMonth: tm, allTime: { gross: allTimeGross, net: allTimeGross - allTimeCommission, costs: R(totalMonthlyFixed * monthsSinceStart + allTimeCommission), pnl: allTimePnl }, monthlyFixed: totalMonthlyFixed, commissionRate, breakEvenSubscribers, monthsSinceStart });
}

export async function POST(req: NextRequest) {
  const forbidden = await requireAdmin();
  if (forbidden) return forbidden;
  const sb = createAdminSupabase();
  const body = await req.json().catch(() => ({}));
  const { data, error } = await sb.from("admin_expenses").insert({ category: body.category ?? "Other", name: body.name, amount_rub: body.amount_rub ?? null, percent_of_revenue: body.percent_of_revenue ?? null, period: body.period ?? "monthly", started_at: body.started_at ?? new Date().toISOString().slice(0, 10), ended_at: body.ended_at ?? null, notes: body.notes ?? null }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, data });
}

export async function DELETE(req: NextRequest) {
  const forbidden = await requireAdmin();
  if (forbidden) return forbidden;
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const sb = createAdminSupabase();
  const { error } = await sb.from("admin_expenses").update({ ended_at: new Date().toISOString().slice(0, 10) }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
