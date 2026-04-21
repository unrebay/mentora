'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Invite { id: string; token: string; label: string | null; expires_at: string | null; revoked_at: string | null; created_at: string }
const fmt = (iso: string) => new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })

export default function AnalyticsDashboard() {
  const [invites, setInvites] = useState<Invite[]>([])
  const [loading, setLoading] = useState(true)
  const [newLabel, setNewLabel] = useState('')
  const [creating, setCreating] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    fetch('/api/analytics/invite').then(r => r.json()).then(d => setInvites(Array.isArray(d) ? d : [])).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const create = async () => {
    setCreating(true)
    await fetch('/api/analytics/invite', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ label: newLabel || null }) })
    setNewLabel('')
    setCreating(false)
    load()
  }
  const revoke = async (id: string) => {
    await fetch(`/api/analytics/invite?id=${id}`, { method: 'DELETE' })
    load()
  }
  const copy = (token: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/analytics/invite/${token}`)
    setCopied(token)
    setTimeout(() => setCopied(null), 2000)
  }

  const active = invites.filter(i => !i.revoked_at)
  const revoked = invites.filter(i => i.revoked_at)

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">

        {/* Header */}
        <div>

          <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--text)" }}>
            Аналитика для{" "}
            <span style={{
              background: "linear-gradient(120deg, #6B8FFF, #4561E8, #9F7AFF)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              родителей и учителей
            </span>
          </h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Создайте ссылку — получатель увидит прогресс ученика без регистрации.
          </p>
        </div>

        {/* Create new */}
        <div className="rounded-2xl border p-5"
          style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "rgba(69,97,232,0.12)" }}>
              <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="#4561E8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 3v10M3 8h10" />
              </svg>
            </div>
            <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>Новая ссылка</span>
          </div>
          <div className="flex gap-3">
            <input
              type="text"
              value={newLabel}
              onChange={e => setNewLabel(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && create()}
              placeholder="Название (напр. «Мама» или «Класс 9А»)"
              className="flex-1 px-4 py-2.5 rounded-xl text-sm focus:outline-none"
              style={{
                background: "var(--bg-secondary)",
                border: "1px solid var(--border)",
                color: "var(--text)",
              }}
            />
            <button
              onClick={create}
              disabled={creating}
              className="btn-glow px-5 py-2.5 text-white text-sm font-semibold rounded-xl disabled:opacity-50 whitespace-nowrap">
              {creating ? 'Создаём…' : 'Создать'}
            </button>
          </div>
        </div>

        {/* Links list */}
        {loading ? (
          <div className="flex items-center justify-center py-8 gap-1">
            {[0, 1, 2].map(i => (
              <div key={i} className="w-1.5 h-1.5 rounded-full animate-bounce"
                style={{ background: "#4561E8", animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        ) : active.length === 0 ? (
          <div className="rounded-2xl border p-10 text-center"
            style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
              style={{ background: "rgba(69,97,232,0.08)" }}>
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="#4561E8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
            </div>
            <p className="text-sm font-medium mb-1" style={{ color: "var(--text)" }}>Нет активных ссылок</p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>Создайте первую ссылку выше</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs font-bold tracking-widest uppercase" style={{ color: "var(--text-muted)" }}>
              Активные ссылки
            </p>
            {active.map(inv => (
              <div key={inv.id} className="rounded-2xl border p-4"
                style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold mb-0.5" style={{ color: "var(--text)" }}>
                      {inv.label ?? 'Без названия'}
                    </div>
                    <div className="text-xs truncate mb-1" style={{ color: "var(--text-muted)" }}>
                      {typeof window !== 'undefined' ? `${window.location.origin}/analytics/invite/${inv.token}` : ''}
                    </div>
                    <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                      Создана {fmt(inv.created_at)}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0 flex-wrap justify-end">
                    <button
                      onClick={() => copy(inv.token)}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg transition-all"
                      style={{
                        background: copied === inv.token ? "rgba(16,185,129,0.12)" : "var(--bg-secondary)",
                        border: `1px solid ${copied === inv.token ? "rgba(16,185,129,0.3)" : "var(--border)"}`,
                        color: copied === inv.token ? "#10b981" : "var(--text-secondary)",
                      }}>
                      {copied === inv.token ? '✓ Скопировано' : 'Копировать'}
                    </button>
                    <Link
                      href={`/analytics/invite/${inv.token}`}
                      target="_blank"
                      className="px-3 py-1.5 text-xs font-medium rounded-lg transition-all"
                      style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
                      Открыть
                    </Link>
                    <button
                      onClick={() => revoke(inv.id)}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors"
                      style={{ color: "#ef4444", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}>
                      Отозвать
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Revoked */}
        {revoked.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-bold tracking-widest uppercase" style={{ color: "var(--text-muted)", opacity: 0.6 }}>
              Отозванные
            </p>
            {revoked.map(inv => (
              <div key={inv.id} className="rounded-xl px-4 py-3 opacity-40"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                <span className="text-sm line-through" style={{ color: "var(--text-secondary)" }}>
                  {inv.label ?? 'Без названия'}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* How it works */}
        <div className="rounded-2xl border p-5"
          style={{ background: "rgba(69,97,232,0.05)", borderColor: "rgba(69,97,232,0.2)" }}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: "rgba(69,97,232,0.12)" }}>
              <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="#4561E8" strokeWidth="1.5" strokeLinecap="round">
                <circle cx="8" cy="8" r="6" />
                <path d="M8 5v3M8 10.5h.01" />
              </svg>
            </div>
            <span className="text-sm font-semibold" style={{ color: "#4561E8" }}>Как это работает</span>
          </div>
          <ul className="space-y-2.5 text-sm" style={{ color: "var(--text-secondary)" }}>
            {[
              {
                icon: <svg className="w-4 h-4 shrink-0" viewBox="0 0 16 16" fill="none" stroke="#4561E8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M7 9a3 3 0 0 0 4.54.32l1.8-1.8a3 3 0 0 0-4.24-4.24l-1.04 1.03"/><path d="M9 7a3 3 0 0 0-4.54-.32L2.66 8.48a3 3 0 0 0 4.24 4.24L7.93 11.7"/></svg>,
                text: "Создайте ссылку и отправьте родителю или учителю",
              },
              {
                icon: <svg className="w-4 h-4 shrink-0" viewBox="0 0 16 16" fill="none" stroke="#4561E8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="10" width="3" height="5" rx="0.5"/><rect x="6" y="6" width="3" height="9" rx="0.5"/><rect x="11" y="2" width="3" height="13" rx="0.5"/></svg>,
                text: "Они увидят прогресс, активность и статистику по предметам",
              },
              {
                icon: <svg className="w-4 h-4 shrink-0" viewBox="0 0 16 16" fill="none" stroke="#4561E8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="7" width="10" height="8" rx="1.5"/><path d="M5 7V5a3 3 0 0 1 6 0v2"/></svg>,
                text: "Можно отозвать в любой момент",
              },
              {
                icon: <svg className="w-4 h-4 shrink-0" viewBox="0 0 16 16" fill="none" stroke="#4561E8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="5" r="3"/><path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6"/></svg>,
                text: "Регистрация для просмотра не нужна",
              },
            ].map(item => (
              <li key={item.text} className="flex items-center gap-3">
                {item.icon}
                <span>{item.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
