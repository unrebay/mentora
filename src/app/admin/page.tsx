"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type ServiceStatus = { ok: boolean; latencyMs: number; error?: string };
type EnvVar = { name: string; present: boolean; preview: string | null };
type HealthData = {
  status: "healthy" | "degraded";
  services: { anthropic: ServiceStatus; openai: ServiceStatus; supabase: ServiceStatus };
  envVars: EnvVar[];
  checkedAt: string;
};
type StatsData = {
  users: { total: number; pro: number; free: number; newToday: number; activeToday: number; activeWeek: number; trialExpired: number };
  chat: { totalMessages: number; messagesToday: number; userMessagesWeek: number; aiResponsesWeek: number; aiResponseRate: number; topSubjects: { subject: string; count: number }[] };
  billing: { activeSubscriptions: number };
  knowledge: { chunks: number };
  recentUsers: { id: string; email: string; plan: string; created_at: string; last_active_at: string; messages_today: number }[];
  generatedAt: string;
};

const SUBJECT_LABELS: Record<string, string> = {
  "russian-history": "История России", "world-history": "Всемирная история",
  history: "История", math: "Математика", physics: "Физика",
  chemistry: "Химия", biology: "Биология", literature: "Литература",
  geography: "География", english: "Английский",
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} мин назад`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} ч назад`;
  return `${Math.floor(hours / 24)} дн назад`;
}

function StatusBadge({ ok, label, latency, error }: { ok: boolean; label: string; latency: number; error?: string }) {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border ${ok ? "border-green-500/20 bg-green-500/5" : "border-red-500/20 bg-red-500/5"}`}>
      <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${ok ? "bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.6)]" : "bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.6)]"}`} />
      <div className="min-w-0">
        <div className="text-sm font-semibold text-white">{label}</div>
        {ok ? <div className="text-xs text-white/40">{latency}ms</div> : <div className="text-xs text-red-400 truncate">{error}</div>}
      </div>
    </div>
  );
}

function MetricCard({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: boolean }) {
  return (
    <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-4">
      <div className="text-xs text-white/40 mb-1">{label}</div>
      <div className={`text-2xl font-bold ${accent ? "text-[#4561E8]" : "text-white"}`}>{value}</div>
      {sub && <div className="text-xs text-white/30 mt-0.5">{sub}</div>}
    </div>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const [health, setHealth] = useState<HealthData | null>(null);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [healthLoading, setHealthLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const loadStats = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/stats");
    if (res.status === 403) { router.push("/dashboard"); return; }
    if (res.ok) setStats(await res.json());
    setLoading(false);
    setLastRefresh(new Date());
  }, [router]);

  const loadHealth = useCallback(async () => {
    setHealthLoading(true);
    const res = await fetch("/api/admin/health");
    if (res.ok) setHealth(await res.json());
    setHealthLoading(false);
  }, []);

  useEffect(() => {
    loadStats(); loadHealth();
    const interval = setInterval(() => { loadStats(); loadHealth(); }, 60_000);
    return () => clearInterval(interval);
  }, [loadStats, loadHealth]);

  const aiRateColor = (r: number) => r >= 80 ? "text-green-400" : r >= 50 ? "text-yellow-400" : "text-red-400";

  return (
    <div className="min-h-screen bg-[#06060f] text-white">
      <header className="sticky top-0 z-50 border-b border-white/8 px-6 py-4 flex items-center justify-between"
        style={{ background: "rgba(6,6,15,0.92)", backdropFilter: "blur(12px)" }}>
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-sm text-white/40 hover:text-white/70 transition-colors">← Дашборд</Link>
          <div className="w-px h-4 bg-white/10" />
          <span className="text-sm font-semibold text-white/80 tracking-wide">ADMIN PANEL</span>
          {health && (
            <div className={`text-xs px-2 py-0.5 rounded-full border ${health.status === "healthy" ? "border-green-500/30 text-green-400 bg-green-500/10" : "border-red-500/30 text-red-400 bg-red-500/10"}`}>
              {health.status === "healthy" ? "● Всё работает" : "● Есть проблемы"}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          {lastRefresh && <span className="text-xs text-white/30">обновлено {lastRefresh.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>}
          <button onClick={() => { loadStats(); loadHealth(); }}
            className="text-xs px-3 py-1.5 rounded-lg border border-white/10 text-white/50 hover:text-white/80 hover:border-white/20 transition-all">
            ↻ Обновить
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">

        <section>
          <h2 className="text-xs font-semibold text-white/40 tracking-[0.15em] uppercase mb-3">Состояние сервисов</h2>
          {healthLoading
            ? <div className="grid grid-cols-3 gap-3">{[0,1,2].map(i => <div key={i} className="h-16 bg-white/[0.03] rounded-xl animate-pulse border border-white/5" />)}</div>
            : health && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <StatusBadge ok={health.services.anthropic.ok} label="Anthropic API" latency={health.services.anthropic.latencyMs} error={health.services.anthropic.error} />
                <StatusBadge ok={health.services.openai.ok} label="OpenAI API" latency={health.services.openai.latencyMs} error={health.services.openai.error} />
                <StatusBadge ok={health.services.supabase.ok} label="Supabase DB" latency={health.services.supabase.latencyMs} error={health.services.supabase.error} />
              </div>
            )}
        </section>

        <section>
          <h2 className="text-xs font-semibold text-white/40 tracking-[0.15em] uppercase mb-3">Пользователи</h2>
          {!loading && stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              <MetricCard label="Всего" value={stats.users.total} />
              <MetricCard label="Pro" value={stats.users.pro} accent sub={`${Math.round(stats.users.pro / Math.max(stats.users.total, 1) * 100)}% платят`} />
              <MetricCard label="Free" value={stats.users.free} />
              <MetricCard label="Новых сегодня" value={stats.users.newToday} />
              <MetricCard label="Активных сегодня" value={stats.users.activeToday} />
              <MetricCard label="Активных за неделю" value={stats.users.activeWeek} />
              <MetricCard label="Подписок активных" value={stats.billing.activeSubscriptions} />
            </div>
          )}
        </section>

        <section>
          <h2 className="text-xs font-semibold text-white/40 tracking-[0.15em] uppercase mb-3">Чаты и сообщения</h2>
          {!loading && stats && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
                <MetricCard label="Сообщений всего" value={stats.chat.totalMessages} />
                <MetricCard label="Сегодня" value={stats.chat.messagesToday} />
                <MetricCard label="Запросов за неделю" value={stats.chat.userMessagesWeek} />
                <MetricCard label="AI ответов за неделю" value={stats.chat.aiResponsesWeek} />
                <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-4">
                  <div className="text-xs text-white/40 mb-1">AI Response Rate</div>
                  <div className={`text-2xl font-bold ${aiRateColor(stats.chat.aiResponseRate)}`}>{stats.chat.aiResponseRate}%</div>
                  <div className="text-xs text-white/30 mt-0.5">{stats.chat.aiResponseRate < 80 ? "⚠ Возможны сбои" : "Норма"}</div>
                </div>
              </div>
              {stats.chat.topSubjects.length > 0 && (
                <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-4">
                  <div className="text-xs text-white/40 mb-3">Топ предметов (30 дней)</div>
                  <div className="space-y-2">
                    {stats.chat.topSubjects.map(({ subject, count }) => (
                      <div key={subject} className="flex items-center gap-3">
                        <div className="text-sm text-white/70 w-40 truncate flex-shrink-0">{SUBJECT_LABELS[subject] ?? subject}</div>
                        <div className="flex-1 bg-white/5 rounded-full h-2 overflow-hidden">
                          <div className="h-full bg-[#4561E8] rounded-full" style={{ width: `${Math.round(count / stats.chat.topSubjects[0].count * 100)}%` }} />
                        </div>
                        <div className="text-xs text-white/40 w-8 text-right">{count}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-xs font-semibold text-white/40 tracking-[0.15em] uppercase mb-3">Переменные окружения</h2>
          {!healthLoading && health && (
            <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {health.envVars.map(({ name, present, preview }) => (
                  <div key={name} className="flex items-center gap-2.5 py-1.5">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${present ? "bg-green-400" : "bg-red-400"}`} />
                    <span className="text-sm font-mono text-white/70 flex-1 truncate">{name}</span>
                    {present ? <span className="text-xs font-mono text-white/25">{preview}</span> : <span className="text-xs text-red-400">НЕ ЗАДАН</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        <section>
          <h2 className="text-xs font-semibold text-white/40 tracking-[0.15em] uppercase mb-3">Последние пользователи</h2>
          {!loading && stats && (
            <div className="bg-white/[0.03] border border-white/8 rounded-2xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left text-xs text-white/30 px-4 py-3 font-normal">Email</th>
                    <th className="text-left text-xs text-white/30 px-4 py-3 font-normal">План</th>
                    <th className="text-left text-xs text-white/30 px-4 py-3 font-normal hidden sm:table-cell">Зарегистрирован</th>
                    <th className="text-left text-xs text-white/30 px-4 py-3 font-normal hidden md:table-cell">Был активен</th>
                    <th className="text-right text-xs text-white/30 px-4 py-3 font-normal">Сообщ. сегодня</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentUsers.map((u) => (
                    <tr key={u.id} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02]">
                      <td className="px-4 py-3 text-white/70 truncate max-w-[180px]">{u.email || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${u.plan === "pro" ? "bg-[#4561E8]/20 text-[#6b8fff]" : "bg-white/5 text-white/40"}`}>{u.plan}</span>
                      </td>
                      <td className="px-4 py-3 text-white/40 text-xs hidden sm:table-cell">{timeAgo(u.created_at)}</td>
                      <td className="px-4 py-3 text-white/40 text-xs hidden md:table-cell">{u.last_active_at ? timeAgo(u.last_active_at) : "—"}</td>
                      <td className="px-4 py-3 text-right"><span className={u.messages_today > 0 ? "text-white/70" : "text-white/20"}>{u.messages_today}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section>
          <h2 className="text-xs font-semibold text-white/40 tracking-[0.15em] uppercase mb-3">Быстрые ссылки</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "База знаний", href: "/dashboard/admin", desc: "Управление чанками" },
              { label: "Supabase", href: "https://supabase.com/dashboard/project/bhpkpkqzkvjuincqksow", desc: "DB + Auth + Logs" },
              { label: "Vercel", href: "https://vercel.com/unrebay", desc: "Деплои + Env" },
              { label: "Anthropic", href: "https://console.anthropic.com", desc: "API + Баланс" },
            ].map(({ label, href, desc }) => (
              <a key={href} href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer"
                className="bg-white/[0.03] border border-white/8 rounded-xl p-4 hover:border-white/15 hover:bg-white/[0.05] transition-all group">
                <div className="text-sm font-medium text-white/80 group-hover:text-white transition-colors">{label}</div>
                <div className="text-xs text-white/30 mt-0.5">{desc}</div>
              </a>
            ))}
          </div>
        </section>

        <div className="text-center text-xs text-white/20 pb-4">Mentora Admin · только для unrebay@gmail.com</div>
      </main>
    </div>
  );
}
