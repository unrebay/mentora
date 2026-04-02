import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = await createClient()
  const { data: invite, error } = await supabase
    .from('analytics_invites').select('*').eq('token', token).is('revoked_at', null).single()
  if (error || !invite) return NextResponse.json({ error: 'Ссылка недействительна или была отозвана' }, { status: 404 })
  if (invite.expires_at && new Date(invite.expires_at) < new Date())
    return NextResponse.json({ error: 'Срок действия ссылки истёк' }, { status: 410 })
  const userId = invite.user_id
  const [progressRes, messagesRes] = await Promise.all([
    supabase.from('user_progress').select('subject,xp_total,streak_days,level,last_active_at').eq('user_id', userId),
    supabase.from('chat_messages').select('subject,created_at').eq('user_id', userId).eq('role', 'user').order('created_at', { ascending: false }).limit(200),
  ])
  const messagesBySubject: Record<string, number> = {}
  const messagesByDay: Record<string, number> = {}
  for (const msg of messagesRes.data ?? []) {
    messagesBySubject[msg.subject] = (messagesBySubject[msg.subject] ?? 0) + 1
    const day = msg.created_at.slice(0, 10)
    messagesByDay[day] = (messagesByDay[day] ?? 0) + 1
  }
  return NextResponse.json({
    invite: { label: invite.label, created_at: invite.created_at },
    progress: progressRes.data ?? [],
    messages_by_subject: messagesBySubject,
    messages_by_day: messagesByDay,
    total_messages: messagesRes.data?.length ?? 0,
    last_active: progressRes.data?.[0]?.last_active_at ?? null,
  })
}
