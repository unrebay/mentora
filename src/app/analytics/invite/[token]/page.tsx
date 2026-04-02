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
const SUBJECTS: Record<string, string> = { history: 'История', math: 'Математика', physics: 'Физика', literature: 'Литература', biology: 'Биология', chemistry: 'Химия', geography: 'География', english: 'Английский' }
const fmt = (iso: string) => new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })

export default function AnalyticsInvitePage() {
  const { token } = useParams<{ token: string }>()
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    fetch(`/api/analytics/invite/${token}`).then(r => r.json())
      .then(d => d.error ? setError(d.error) : setData(d))
      .catch(() => setError('Ошибка загрузки')).finally(() => setLoading(false))
  }, [token])
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="text-gray-400 text-sm">Загрузка…</div></div>
  if (error) return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center"><div className="text-4xl mb-4">🔗</div>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Ссылка недоступна</h1>
        <p className="text-gray-500 text-sm mb-6">{error}</p>
        <Link href="/" className="text-sm text-indigo-600 hover:underline">На главную</Link>
      </div>
    </div>
  )
  if (!data) return null
  const totalXP = data.progress.reduce((s, p) => s + p.xp_total, 0)
  const maxStreak = data.progress.reduce((s, p) => Math.max(s, p.streak_days), 0)
  const active = data.progress.filter(p => p.xp_total > 0)
  const days = Object.entries(data.messages_by_day).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 14).reverse()
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-6 py-5 flex items-center justify-between">
          <div><span className="text-lg font-semibold text-gray-900">Mentora</span><span className="ml-2 text-sm text-gray-400">Аналитика ученика</span></div>
          <Link href="/" className="text-sm text-indigo-600 hover:underline">Попробовать самому →</Link>
        </div>
      </div>
      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{data.invite.label ? `Аналитика: ${data.invite.label}` : 'Аналитика ученика'}</h1>
          <p className="text-sm text-gray-400 mt-1">Доступ с {fmt(data.invite.created_at)}{data.last_active && ` · активность ${fmt(data.last_active)}`}</p>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[{label:'Сообщений',value:data.total_messages},{label:'Опыта XP',value:totalXP.toLocaleString('ru')},{label:'Макс. streak',value:`${maxStreak} дн.`}].map(c => (
            <div key={c.label} className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="text-2xl font-bold text-gray-900">{c.value}</div>
              <div className="text-xs text-gray-400 mt-1">{c.label}</div>
            </div>
          ))}
        </div>
        {active.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">По предметам</h2>
            <div className="space-y-3">
              {active.sort((a, b) => b.xp_total - a.xp_total).map(p => {
                const max = Math.max(...active.map(s => s.xp_total), 1)
                return (
                  <div key={p.subject}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-700 font-medium">{SUBJECTS[p.subject] ?? p.subject}</span>
                      <span className="text-gray-400">{data.messages_by_subject[p.subject] ?? 0} сообщ. · {p.xp_total} XP · Ур. {p.level}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full" style={{width:`${(p.xp_total/max)*100}%`}} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
        {days.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Активность за 2 недели</h2>
            <div className="flex items-end gap-1.5 h-20">
              {days.map(([day, count]) => {
                const m = Math.max(...days.map(d => d[1]), 1)
                return (
                  <div key={day} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full bg-indigo-400 rounded-t-sm" style={{height:`${Math.max((count/m)*100,8)}%`}} title={`${day}: ${count}`} />
                    <span className="text-[9px] text-gray-300">{new Date(day).getDate()}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
        {data.total_messages === 0 && <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center"><div className="text-3xl mb-3">📚</div><p className="text-gray-500 text-sm">Ученик ещё не начал заниматься</p></div>}
        <div className="text-center text-xs text-gray-300 pb-4">Аналитика в реальном времени · Mentora</div>
      </div>
    </div>
  )
}
