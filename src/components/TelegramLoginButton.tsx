'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface TelegramUser {
  id: number
  first_name: string
  last_name?: string
  username?: string
  photo_url?: string
  auth_date: number
  hash: string
}

interface Props {
  botUsername: string   // напр. "MentoraBot"
  onError?: (msg: string) => void
}

export default function TelegramLoginButton({ botUsername, onError }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (!containerRef.current) return

    // Telegram Login Widget требует глобальный callback
    ;(window as any).onTelegramAuth = async (tgUser: TelegramUser) => {
      // 1. Отправляем данные на наш сервер для верификации
      const res = await fetch('/api/auth/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tgUser),
      })
      const data = await res.json()

      if (!res.ok) {
        onError?.(data.error ?? 'Ошибка входа через Telegram')
        return
      }

      // 2. Подтверждаем magic link токен → получаем сессию
      const { error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: data.token_hash,
        type: 'magiclink',
      })

      if (verifyError) {
        onError?.(verifyError.message)
        return
      }

      router.push('/dashboard')
    }

    // Вставляем скрипт виджета
    const script = document.createElement('script')
    script.src = 'https://telegram.org/js/telegram-widget.js?22'
    script.setAttribute('data-telegram-login', botUsername)
    script.setAttribute('data-size', 'large')
    script.setAttribute('data-onauth', 'onTelegramAuth(user)')
    script.setAttribute('data-request-access', 'write')
    script.async = true

    containerRef.current.innerHTML = ''
    containerRef.current.appendChild(script)

    return () => {
      delete (window as any).onTelegramAuth
    }
  }, [botUsername])

  return (
    <div className="w-full flex justify-center mt-3">
      <div ref={containerRef} />
    </div>
  )
}
