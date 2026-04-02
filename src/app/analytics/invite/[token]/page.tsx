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

const SUBJECTS: Record<string, { name: string; emoji: string }> = {
  'russian-history': { name: 'История России', emoji: '📜' },
  'world-history':   { name: 'История мира',   emoji: '🌍' },
  history:           { name: 'История',         emoji: '📜' },
  math:              { name: 'Математика',      emoji: '🧮' },
  physics:           { name: 'Физика',          emoji: '⚡' },
  literature:        { name: 'Литература',      emoji: '📚' },
  biology:           { name: 'Биология',        emoji: '🌿' },
  chemistry:         { name: 'Химия',           emoji: '⚗️' },
  geography:         { name: 'География',       emoji: '🗺️' },
  english:           { name: 'Английский',      emoji: '💬' },
}

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
const fmtShort = (iso: string) =>
  new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })

export default function AnalyticsInvitePage() {
  const { token } = useParams<{ token: string }>()
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <div className="flex gap-1">
          {[0,1,2].map(i => (
            <div key={i} className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />
          ))}
        </div>
        <p className="text-sm text-gray-400">Загрузка аналитики…</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
      <div className="text-center">
        <div className="text-5xl mb-4">🔗</div>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Ссылка недоступна</h1>
        <p className="text-gray-500 text-sm mb-6">{error}</p>
        <Link href="/" className="text-sm text-indigo-600 hover:underline">На главную</Link>
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
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold text-gray-900">Mentora</span>
            <span className="text-xs bg-indigo-50 text-indigo-600 font-medium px-2.5 py-1 rounded-full">Аналитика</span>
          </div>
          <Link href="/auth" className="text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors px-4 py-1.5 rounded-lg">
            Попробовать →
          </Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-5">
        <div className="bg-white rounded-2xl border border-gray-100 px-6 py-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center text-xl font-bold text-indigo-600">
              {label.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{label}</h1>
              <p className="text-sm text-gray-400 mt-0.5">
                Прогресс с {fmt(data.invite.created_at)}
                {data.last_active && ` · последняя активность ${fmtShort(data.last_active)}`}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: '💬', label: 'Сообщений', value: data.total_messages.toLocaleString('ru') },
            { icon: '⚡', label: 'Очков XP', value: totalXP.toLocaleString('ru') },
            { icon: '🔥', label: 'Макс. streak', value: `${maxStreak} дн.` },
          ].map(c => (
            <div key={c.label} className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="text-2xl mb-2">{c.icon}</div>
              <div className="text-2xl font-bold text-gray-900">{c.value}</div>
              <div className="text-xs text-gray-400 mt-1">{c.label}</div>
            </div>
          ))}
        </div>

        {days.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-700">Активность</h2>
              <span className="text-xs text-gray-400">последние {days.length} дней</span>
            </div>
            <div className="flex items-end gap-1.5 h-24">
              {days.map(([day, count]) => (
                <div key={day} className="flex-1 flex flex-col items-center gap-1" title={`${fmtShort(day)}: ${count} сообщ.`}>
                  <div
                    className="w-full rounded-t-md transition-all"
                    style={{
                      height: `${Math.max((count / maxDay) * 100, 6)}%`,
                      backgroundColor: count > 0 ? '#6366f1' : '#e5e7eb',
                      opacity: count > 0 ? 0.7 + (count / maxDay) * 0.3 : 1,
                    }}
                  />
                  <span className="text-[9px] text-gray-300 leading-none">{new Date(day + 'T12:00:00').getDate()}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {active.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">По предметам</h2>
            <div className="space-y-4">
              {active.map(p => {
                const maxXP = Math.max(...active.map(s => s.xp_total), 1)
                const subj = SUBJECTS[p.subject] ?? { name: p.subject, emoji: '📖' }
                const msgs = data.messages_by_subject[p.subject] ?? 0
                return (
                  <div key={p.subject}>
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <div className="flex items-center gap-2">
                        <span>{subj.emoji}</span>
                        <span className="font-medium text-gray-800">{subj.name}</span>
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Ур. {p.level}</span>
                      </div>
                      <span className="text-gray-400 text-xs">{msgs} сообщ. · {p.xp_total} XP</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(p.xp_total / maxXP) * 100}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {data.total_messages === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
            <div className="text-4xl mb-3">📚</div>
            <p className="text-gray-500 text-sm">Ученик ещё не начал заниматься</p>
          </div>
        )}

        <div className="text-center text-xs text-gray-300 pb-4">Аналитика в реальном времени · Mentora</div>
      </div>
    </div>
  )
}
