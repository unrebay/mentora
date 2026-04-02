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

  const load = () => { setLoading(true); fetch('/api/analytics/invite').then(r=>r.json()).then(d=>setInvites(Array.isArray(d)?d:[])).finally(()=>setLoading(false)) }
  useEffect(() => { load() }, [])

  const create = async () => { setCreating(true); await fetch('/api/analytics/invite',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({label:newLabel||null})}); setNewLabel(''); setCreating(false); load() }
  const revoke = async (id: string) => { await fetch(`/api/analytics/invite?id=${id}`,{method:'DELETE'}); load() }
  const copy = (token: string) => { navigator.clipboard.writeText(`${window.location.origin}/analytics/invite/${token}`); setCopied(token); setTimeout(()=>setCopied(null),2000) }

  const active = invites.filter(i=>!i.revoked_at)
  const revoked = invites.filter(i=>i.revoked_at)

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 space-y-8">
      <div>
        <Link href="/dashboard" className="text-sm text-gray-400 hover:text-gray-600 mb-4 inline-block">← Назад</Link>
        <h1 className="text-2xl font-bold text-gray-900">Аналитика для родителей и учителей</h1>
        <p className="text-gray-500 text-sm mt-1">Создайте ссылку — получатель увидит прогресс ученика без регистрации.</p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Новая ссылка</h2>
        <div className="flex gap-3">
          <input type="text" value={newLabel} onChange={e=>setNewLabel(e.target.value)} onKeyDown={e=>e.key==='Enter'&&create()}
            placeholder="Название (напр. «Мама» или «Класс 9А»)"
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/30" />
          <button onClick={create} disabled={creating}
            className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 disabled:opacity-50 whitespace-nowrap">
            {creating?'Создаём…':'Создать ссылку'}
          </button>
        </div>
      </div>
      {loading ? <div className="text-sm text-gray-300 py-4">Загрузка…</div> : active.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center"><div className="text-3xl mb-3">🔗</div><p className="text-gray-400 text-sm">Ещё нет активных ссылок</p></div>
      ) : (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Активные ссылки</h2>
          {active.map(inv => (
            <div key={inv.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900">{inv.label ?? 'Без названия'}</div>
                <div className="text-xs text-gray-300 truncate mt-0.5">{typeof window!=='undefined'?`${window.location.origin}/analytics/invite/${inv.token}`:''}</div>
                <div className="text-xs text-gray-400 mt-0.5">Создана {fmt(inv.created_at)}</div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={()=>copy(inv.token)} className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">{copied===inv.token?'✓ Скопировано':'Копировать'}</button>
                <Link href={`/analytics/invite/${inv.token}`} target="_blank" className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">Открыть</Link>
                <button onClick={()=>revoke(inv.id)} className="px-3 py-1.5 text-xs font-medium rounded-lg text-red-400 hover:bg-red-50">Отозвать</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {revoked.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Отозванные</h2>
          {revoked.map(inv => (
            <div key={inv.id} className="bg-gray-50 rounded-xl px-4 py-3 opacity-50">
              <span className="text-sm text-gray-500 line-through">{inv.label ?? 'Без названия'}</span>
            </div>
          ))}
        </div>
      )}
      <div className="bg-indigo-50 rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-indigo-800 mb-2">Как это работает</h3>
        <ul className="text-sm text-indigo-700 space-y-1.5">
          <li>📎 Создайте ссылку и отправьте родителю или учителю</li>
          <li>📊 Они увидят прогресс, активность и статистику по предметам</li>
          <li>🔒 Можно отозвать в любой момент</li>
          <li>👤 Регистрация для просмотра не нужна</li>
        </ul>
      </div>
    </div>
  )
}
