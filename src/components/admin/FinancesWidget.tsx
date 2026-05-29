"use client";
import { useEffect, useState } from "react";

interface Tok {
  TEXT: string; MUTED: string; CARD: string; BOR: string;
  isDark: boolean;
}

interface Expense {
  id: string; category: string; name: string;
  amount_rub: number | null; percent_of_revenue: number | null;
  period: "monthly" | "annual" | "one_time" | "per_transaction";
  started_at: string; ended_at: string | null; notes: string | null;
}
interface MonthRow { month: string; gross: number; net: number; commission: number; costs: number; count: number; pnl: number; }
interface Data {
  expenses: Expense[]; byMonth: MonthRow[];
  thisMonth: MonthRow;
  allTime: { gross: number; net: number; costs: number; pnl: number };
  monthlyFixed: number; commissionRate: number;
  breakEvenSubscribers: number; monthsSinceStart: number;
}

const RU_MONTH: Record<string, string> = { "01":"Янв","02":"Фев","03":"Мар","04":"Апр","05":"Май","06":"Июн","07":"Июл","08":"Авг","09":"Сен","10":"Окт","11":"Ноя","12":"Дек" };
const R = (n: number) => `${n.toLocaleString("ru-RU")} ₽`;
const sign = (n: number) => n >= 0 ? `+${R(n)}` : `−${R(Math.abs(n))}`;
const GREEN = "#22c55e", RED = "#ef4444", AMBER = "#f59e0b", BRAND = "#4561E8";

export default function FinancesWidget({ TEXT, MUTED, CARD, BOR, isDark }: Tok) {

  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ category: "Infrastructure", name: "", amount_rub: "", period: "monthly", notes: "" });
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try { const r = await fetch("/api/admin/finances"); if (r.ok) setData(await r.json()); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function addExpense() {
    if (!form.name || !form.amount_rub) return;
    setSaving(true);
    await fetch("/api/admin/finances", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, amount_rub: parseFloat(form.amount_rub) }) });
    setSaving(false); setAddOpen(false); setForm({ category: "Infrastructure", name: "", amount_rub: "", period: "monthly", notes: "" });
    load();
  }

  async function removeExpense(id: string) {
    if (!confirm("Завершить эту статью расходов?")) return;
    await fetch(`/api/admin/finances?id=${id}`, { method: "DELETE" });
    load();
  }

  const cardStyle = { background: CARD, border: `1px solid ${BOR}`, borderRadius: 14, padding: "18px 20px" };
  const inp = { background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)", border: `1px solid ${BOR}`, borderRadius: 8, padding: "8px 10px", color: TEXT, fontSize: 13, width: "100%", outline: "none" };

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: MUTED, fontSize: 13 }}>Загрузка...</div>;
  if (!data) return <div style={{ padding: 40, textAlign: "center", color: RED, fontSize: 13 }}>Ошибка загрузки данных</div>;

  const { thisMonth: tm, allTime: at, byMonth, monthlyFixed, commissionRate, breakEvenSubscribers } = data;
  const last6 = byMonth.slice(-6);
  const maxBar = Math.max(...last6.map(m => Math.max(m.costs, m.gross)), 1);

  const CATEGORIES = ["AI", "Infrastructure", "Platform", "Fees", "Marketing", "Other"];
  const PERIODS = [{ v: "monthly", l: "Ежемесячно" }, { v: "annual", l: "Ежегодно" }, { v: "one_time", l: "Разово" }];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* ── P&L Summary ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px,1fr))", gap: 12 }}>
        {[
          { label: "Доход этот месяц", value: R(tm.gross), sub: `${tm.count} платежей`, color: GREEN },
          { label: "Расходы этот месяц", value: R(tm.costs), sub: `Фикс ${R(monthlyFixed)} + комиссии`, color: RED },
          { label: "P&L этот месяц", value: sign(tm.pnl), sub: tm.pnl >= 0 ? "В плюсе 🎉" : `До безубытка: ${breakEvenSubscribers} Pro`, color: tm.pnl >= 0 ? GREEN : AMBER },
          { label: "P&L всего по проекту", value: sign(at.pnl), sub: `${data.monthsSinceStart} мес · доход ${R(at.gross)}`, color: at.pnl >= 0 ? GREEN : MUTED },
        ].map(({ label, value, sub, color }) => (
          <div key={label} style={cardStyle}>
            <p style={{ fontSize: 11, fontWeight: 600, color: MUTED, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 8px" }}>{label}</p>
            <p style={{ fontSize: 24, fontWeight: 800, color, margin: "0 0 4px", letterSpacing: "-0.5px" }}>{value}</p>
            <p style={{ fontSize: 12, color: MUTED, margin: 0 }}>{sub}</p>
          </div>
        ))}
      </div>

      {/* ── Bar chart last 6 months ── */}
      <div style={cardStyle}>
        <p style={{ fontSize: 11, fontWeight: 600, color: MUTED, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>Доходы vs расходы (последние 6 мес)</p>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 120 }}>
          {last6.map((m) => {
            const grossH = Math.round((m.gross / maxBar) * 100);
            const costH = Math.round((m.costs / maxBar) * 100);
            const [yr, mo] = m.month.split("-");
            return (
              <div key={m.month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <div style={{ width: "100%", display: "flex", alignItems: "flex-end", gap: 3, height: 100 }}>
                  <div title={`Доход: ${R(m.gross)}`} style={{ flex: 1, height: `${grossH}%`, minHeight: 2, background: m.pnl >= 0 ? GREEN : "rgba(34,197,94,0.5)", borderRadius: "4px 4px 0 0", transition: "height 0.3s" }} />
                  <div title={`Расходы: ${R(m.costs)}`} style={{ flex: 1, height: `${costH}%`, minHeight: 2, background: "rgba(239,68,68,0.6)", borderRadius: "4px 4px 0 0", transition: "height 0.3s" }} />
                </div>
                <span style={{ fontSize: 10, color: MUTED }}>{RU_MONTH[mo]} {yr.slice(2)}</span>
                <span style={{ fontSize: 10, fontWeight: 600, color: m.pnl >= 0 ? GREEN : RED }}>{m.pnl >= 0 ? "+" : "−"}{Math.abs(m.pnl).toLocaleString("ru-RU")}</span>
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
          <span style={{ fontSize: 11, color: MUTED, display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: GREEN, display: "inline-block" }} />Доходы</span>
          <span style={{ fontSize: 11, color: MUTED, display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: "rgba(239,68,68,0.6)", display: "inline-block" }} />Расходы</span>
        </div>
      </div>

      {/* ── Break-even ── */}
      <div style={{ ...cardStyle, background: isDark ? "rgba(69,97,232,0.08)" : "rgba(69,97,232,0.04)", borderColor: "rgba(69,97,232,0.2)" }}>
        <p style={{ fontSize: 13, color: TEXT, margin: 0, lineHeight: 1.7 }}>
          💡 Точка безубытка: <strong style={{ color: BRAND }}>{breakEvenSubscribers} Pro-подписчиков</strong> в месяц при текущих расходах {R(monthlyFixed)}/мес.
          Комиссия ЮKassa: <strong>{(commissionRate * 100).toFixed(1)}%</strong>.
        </p>
      </div>

      {/* ── Expenses table ── */}
      <div style={cardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: MUTED, textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>Статьи расходов</p>
          <button onClick={() => setAddOpen(!addOpen)} style={{ fontSize: 12, fontWeight: 600, color: BRAND, background: "rgba(69,97,232,0.08)", border: "1px solid rgba(69,97,232,0.2)", borderRadius: 8, padding: "5px 12px", cursor: "pointer" }}>
            {addOpen ? "Отмена" : "+ Добавить"}
          </button>
        </div>

        {/* Add form */}
        {addOpen && (
          <div style={{ marginBottom: 16, padding: 14, background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)", borderRadius: 10, border: `1px solid ${BOR}`, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div><label style={{ fontSize: 11, color: MUTED, display: "block", marginBottom: 4 }}>Название</label><input style={inp} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Название расхода" /></div>
            <div><label style={{ fontSize: 11, color: MUTED, display: "block", marginBottom: 4 }}>Сумма ₽</label><input style={inp} type="number" value={form.amount_rub} onChange={e => setForm(f => ({ ...f, amount_rub: e.target.value }))} placeholder="0" /></div>
            <div><label style={{ fontSize: 11, color: MUTED, display: "block", marginBottom: 4 }}>Категория</label>
              <select style={inp} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div><label style={{ fontSize: 11, color: MUTED, display: "block", marginBottom: 4 }}>Период</label>
              <select style={inp} value={form.period} onChange={e => setForm(f => ({ ...f, period: e.target.value }))}>
                {PERIODS.map(p => <option key={p.v} value={p.v}>{p.l}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: "1/-1" }}><label style={{ fontSize: 11, color: MUTED, display: "block", marginBottom: 4 }}>Примечание</label><input style={inp} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Опционально" /></div>
            <button onClick={addExpense} disabled={saving || !form.name || !form.amount_rub} style={{ gridColumn: "1/-1", padding: "9px 0", background: BRAND, color: "#fff", fontWeight: 700, fontSize: 14, border: "none", borderRadius: 9, cursor: "pointer", opacity: saving ? 0.6 : 1 }}>
              {saving ? "Сохраняю..." : "Добавить статью расходов"}
            </button>
          </div>
        )}

        {/* Expense rows */}
        <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {data.expenses.filter(e => !e.ended_at).map((e) => (
            <div key={e.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 2px", borderBottom: `1px solid ${BOR}` }}>
              <div>
                <span style={{ fontSize: 13, color: TEXT, fontWeight: 500 }}>{e.name}</span>
                <span style={{ fontSize: 11, color: MUTED, marginLeft: 8 }}>{e.category}</span>
                {e.notes && <span style={{ fontSize: 11, color: MUTED, marginLeft: 8, opacity: 0.7 }}>· {e.notes}</span>}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: RED }}>
                  {e.period === "per_transaction"
                    ? `${((e.percent_of_revenue ?? 0) * 100).toFixed(1)}%`
                    : R(e.amount_rub ?? 0)}
                  <span style={{ fontSize: 11, color: MUTED, fontWeight: 400, marginLeft: 4 }}>
                    {e.period === "monthly" ? "/мес" : e.period === "annual" ? "/год" : e.period === "per_transaction" ? "с платежа" : ""}
                  </span>
                </span>
                <button onClick={() => removeExpense(e.id)} title="Завершить" style={{ fontSize: 12, color: MUTED, background: "none", border: "none", cursor: "pointer", padding: 2, opacity: 0.5 }}>✕</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
