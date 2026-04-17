'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

interface ProgressItem { subject: string; xp_total: number; streak_days: number; level: number; last_active_at: string }
interface AnalyticsData {
  invite: { label: string | null; created_at: string }
  progress: ProgressItem[]
  messages_by_subject: Record<string, number>
  messages_by_day: Record<string, number>
  total_messages: number
  last_active: string | null
}

const SUBJECT_NAMES: Record<string, string> = {
  'russian-history': 'История России',
  'world-history':   'История мира',
  history:           'История',
  math:              'Математика',
  mathematics:       'Математика',
  physics:           'Физика',
  literature:        'Литература',
  biology:           'Биология',
  chemistry:         'Химия',
  geography:         'География',
  english:           'Английский',
  'russian-language': 'Русский язык',
  'social-studies':  'Обществознание',
  'computer-science': 'Информатика',
  astronomy:         'Астрономия',
}

const SUBJECT_COLORS: Record<string, string> = {
  'russian-history': '#e05252',
  'world-history':   '#c0724a',
  history:           '#e05252',
  math:              '#4561E8',
  mathematics:       '#4561E8',
  physics:           '#3b82f6',
  literature:        '#8B5CF6',
  biology:           '#10B981',
  chemistry:         '#0EA5E9',
  geography:         '#22c55e',
  english:           '#6366f1',
  'russian-language': '#f59e0b',
  'social-studies':  '#ec4899',
  'computer-science': '#06b6d4',
  astronomy:         '#9F7AFF',
}

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
const fmtShort = (iso: string) =>
  new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })

export default function AnalyticsInvitePage() {
  const { token } = useParams<{ token: string }>() ?? {}
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/analytics/invite/${token}`)
      .then(r => r.json())
      .then(d => d.error ? setError(d.error) : setData(d))
      .catch(() => setError('Ошибка загрузки'))
      .finally(() => setLoading(false))
  }, [token])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#06060f]">
      <div className="flex flex-col items-center gap-4">
        <div className="flex gap-1.5">
          {[0, 1, 2].map(i => (
            <div key={i} className="w-2 h-2 bg-[#4561E8] rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>Загрузка аналитики…</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#06060f]">
      <div className="text-center">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: "rgba(69,97,232,0.12)" }}>
          <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="#4561E8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-white mb-2">Ссылка недоступна</h1>
        <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.4)" }}>{error}</p>
        <Link href="/" className="text-sm font-medium" style={{ color: "#4561E8" }}>← На главную</Link>
      </div>
    </div>
  )

  if (!data) return null

  const totalXP = data.progress.reduce((s, p) => s + p.xp_total, 0)
  const maxStreak = data.progress.reduce((s, p) => Math.max(s, p.streak_days), 0)
  const active = data.progress.filter(p => p.xp_total > 0).sort((a, b) => b.xp_total - a.xp_total)
  const days = Object.entries(data.messages_by_day).sort((a, b) => a[0].localeCompare(b[0])).slice(-14)
  const maxDay = Math.max(...days.map(d => d[1]), 1)
  const label = data.invite.label ?? 'Ученик'

  return (
    <div className="min-h-screen bg-[#06060f] text-white">
      {/* Nav */}
      <div className="border-b" style={{ background: "rgba(6,6,15,0.92)", backdropFilter: "blur(16px)", borderColor: "rgba(255,255,255,0.07)" }}>
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-base font-bold text-white">Mentora</span>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full"
              style={{ background: "rgba(69,97,232,0.15)", color: "#6B8FFF", border: "1px solid rgba(69,97,232,0.25)" }}>
              Аналитика
            </span>
          </div>
          <Link href="/auth"
            className="btn-glow px-4 py-1.5 rounded-lg text-sm font-semibold text-white">
            Попробовать →
          </Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-5">

        {/* Profile card */}
        <div className="rounded-2xl border px-6 py-5"
          style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)" }}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold text-white"
              style={{ background: "linear-gradient(135deg, #4561E8, #6B8FFF)", boxShadow: "0 4px 20px rgba(69,97,232,0.3)" }}>
              {label.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">{label}</h1>
              <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                Прогресс с {fmt(data.invite.created_at)}
                {data.last_active && ` · последняя активность ${fmtShort(data.last_active)}`}
              </p>
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-4">
          {[
            {
              icon: (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="#6B8FFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              ),
              color: "#6B8FFF",
              label: 'Сообщений',
              value: data.total_messages.toLocaleString('ru'),
            },
            {
              icon: (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="#FFB84C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              ),
              color: "#FFB84C",
              label: 'Очков XP',
              value: totalXP.toLocaleString('ru'),
            },
            {
              icon: (
                <svg viewBox="0 0 24 24" fill="none" style={{ width: 20, height: 20 }}>
                  <path d="M12 2C12 2 7 7 7 12c0 2.761 2.239 5 5 5s5-2.239 5-5c0-1.5-.5-2.5-1-3.5 0 0 0 2-2 2.5C15.5 9 14 7 12 2z"
                    fill="#FF7A00" />
                </svg>
              ),
              color: "#FF7A00",
              label: 'Макс. стрик',
              value: `${maxStreak} дн.`,
            },
          ].map(c => (
            <div key={c.label} className="rounded-2xl border p-5"
              style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)" }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                style={{ background: `${c.color}18` }}>
                {c.icon}
              </div>
              <div className="text-xl font-bold text-white">{c.value}</div>
              <div className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>{c.label}</div>
            </div>
          ))}
        </div>

        {/* Activity chart */}
        {days.length > 0 && (
          <div className="rounded-2xl border p-5"
            style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)" }}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-white">Активность</span>
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                последние {days.length} дней
              </span>
            </div>
            <div className="flex items-end gap-1.5 h-24">
              {days.map(([day, count]) => (
                <div key={day} className="flex-1 flex flex-col items-center gap-1"
                  title={`${fmtShort(day)}: ${count} сообщ.`}>
                  <div
                    className="w-full rounded-t-md transition-all"
                    style={{
                      height: `${Math.max((count / maxDay) * 100, 6)}%`,
                      background: count > 0
                        ? `linear-gradient(180deg, #6B8FFF, #4561E8)`
                        : 'rgba(255,255,255,0.06)',
                      opacity: count > 0 ? 0.6 + (count / maxDay) * 0.4 : 1,
                    }}
                  />
                  <span className="text-[9px] leading-none" style={{ color: "rgba(255,255,255,0.25)" }}>
                    {new Date(day + 'T12:00:00').getDate()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* By subjects */}
        {active.length > 0 && (
          <div className="rounded-2xl border p-5"
            style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)" }}>
            <span className="text-sm font-semibold text-white block mb-4">По предметам</span>
            <div className="space-y-4">
              {active.map(p => {
                const maxXP = Math.max(...active.map(s => s.xp_total), 1)
                const name = SUBJECT_NAMES[p.subject] ?? p.subject
                const color = SUBJECT_COLORS[p.subject] ?? "#4561E8"
                const msgs = data.messages_by_subject[p.subject] ?? 0
                return (
                  <div key={p.subject}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                        <span className="text-sm font-medium text-white">{name}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full"
                          style={{ background: `${color}18`, color: color }}>
                          Ур. {p.level}
                        </span>
                      </div>
                      <span className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                        {msgs} сообщ. · {p.xp_total} XP
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden"
                      style={{ background: "rgba(255,255,255,0.06)" }}>
                      <div className="h-full rounded-full transition-all"
                        style={{
                          width: `${(p.xp_total / maxXP) * 100}%`,
                          background: `linear-gradient(90deg, ${color}cc, ${color})`,
                        }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Empty state */}
        {data.total_messages === 0 && (
          <div className="rounded-2xl border p-10 text-center"
            style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)" }}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
              style={{ background: "rgba(69,97,232,0.12)" }}>
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="#4561E8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-white mb-1">Ученик ещё не начал заниматься</p>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
              Статистика появится после первых сессий
            </p>
          </div>
        )}

        {/* Footer note */}
        <div className="text-center pb-4">
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>
            Аналитика в реальном времени · Mentora
          </p>
        </div>
      </div>
    </div>
  )
}
