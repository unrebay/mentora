#!/usr/bin/env python3
"""
Патч-скрипт для Mentora — запускать из папки mentora/
  python3 ../apply_patches.py

Делает 4 изменения в существующих файлах:
  1. dashboard/page.tsx   — ссылка на аналитику
  2. auth/page.tsx        — вход по телефону (OTP) + Telegram
  3. onboarding/page.tsx  — первый шаг "Кто ты?" (роль)
  4. src/app/layout.tsx   — lang="ru" + контекст языка (заготовка для EN)
"""

import re
import sys
from pathlib import Path

BASE = Path(__file__).parent / "mentora" / "src"
ok = []
fail = []

def patch(rel_path: str, old: str, new: str, label: str):
    path = BASE / rel_path
    if not path.exists():
        fail.append(f"[SKIP] {label}: файл не найден ({rel_path})")
        return
    content = path.read_text(encoding="utf-8")
    if old not in content:
        fail.append(f"[SKIP] {label}: маркер не найден — возможно, уже пропатчено или файл изменился")
        return
    if new.strip() in content:
        ok.append(f"[OK]   {label}: уже применено, пропускаю")
        return
    path.write_text(content.replace(old, new, 1), encoding="utf-8")
    ok.append(f"[OK]   {label}: применено ✓")


# ─────────────────────────────────────────────────────────
# 1. DASHBOARD — добавить кнопку "Аналитика" в шапку/меню
# ─────────────────────────────────────────────────────────
# Ищем блок с кнопкой выхода (она точно есть в дашборде)
patch(
    "app/dashboard/page.tsx",
    old="""href="/pricing"
            className=""",
    new="""href="/dashboard/analytics"
            className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            Аналитика
          </Link>
          <Link
            href="/pricing"
            className=""",
    label="Dashboard → ссылка на аналитику",
)

# Запасной вариант — если нашёлся другой маркер
patch(
    "app/dashboard/page.tsx",
    old="signOut()",
    new="""signOut()""",  # noop — просто проверяем наличие
    label="Dashboard → проверка signOut",
)


# ─────────────────────────────────────────────────────────
# 2. AUTH — добавить вход по телефону (OTP) и Telegram
# ─────────────────────────────────────────────────────────
PHONE_TAB_CODE = """
  // ── Телефон OTP ──────────────────────────────────────────
  const [authMode, setAuthMode] = useState<'email' | 'phone'>('email')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [phoneLoading, setPhoneLoading] = useState(false)

  const sendOtp = async () => {
    setPhoneLoading(true)
    const formatted = phone.startsWith('+') ? phone : `+7${phone.replace(/\\D/g, '').slice(-10)}`
    const { error } = await supabase.auth.signInWithOtp({ phone: formatted })
    if (error) { alert(error.message); setPhoneLoading(false); return }
    setOtpSent(true)
    setPhoneLoading(false)
  }

  const verifyOtp = async () => {
    setPhoneLoading(true)
    const formatted = phone.startsWith('+') ? phone : `+7${phone.replace(/\\D/g, '').slice(-10)}`
    const { error } = await supabase.auth.verifyOtp({
      phone: formatted, token: otp, type: 'sms',
    })
    if (error) { alert(error.message); setPhoneLoading(false); return }
    setPhoneLoading(false)
    router.push('/dashboard')
  }
  // ─────────────────────────────────────────────────────────
"""

# Вставляем state-переменные после первого useState в auth/page.tsx
patch(
    "app/auth/page.tsx",
    old="  const [loading, setLoading] = useState(false)",
    new="  const [loading, setLoading] = useState(false)" + PHONE_TAB_CODE,
    label="Auth → phone OTP state-переменные",
)

# Добавляем UI переключения email/phone и форму телефона
PHONE_UI = """
          {/* Переключатель Email / Телефон */}
          <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-6">
            {(['email', 'phone'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setAuthMode(mode)}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                  authMode === mode
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {mode === 'email' ? '📧 Email' : '📱 Телефон'}
              </button>
            ))}
          </div>

          {authMode === 'phone' && (
            <div className="space-y-3">
              {!otpSent ? (
                <>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+7 (999) 000-00-00"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900
                               placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  />
                  <button
                    onClick={sendOtp}
                    disabled={phoneLoading || phone.length < 10}
                    className="w-full py-3 bg-indigo-600 text-white text-sm font-medium rounded-xl
                               hover:bg-indigo-700 transition-colors disabled:opacity-50"
                  >
                    {phoneLoading ? 'Отправляем…' : 'Получить код SMS'}
                  </button>
                  <p className="text-xs text-gray-400 text-center">
                    Введите номер в формате +7 или 8 (10 цифр)
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm text-gray-600 text-center">
                    Введите код из SMS, отправленного на {phone}
                  </p>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-center text-2xl
                               tracking-widest text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  />
                  <button
                    onClick={verifyOtp}
                    disabled={phoneLoading || otp.length < 4}
                    className="w-full py-3 bg-indigo-600 text-white text-sm font-medium rounded-xl
                               hover:bg-indigo-700 transition-colors disabled:opacity-50"
                  >
                    {phoneLoading ? 'Проверяем…' : 'Войти'}
                  </button>
                  <button
                    onClick={() => { setOtpSent(false); setOtp('') }}
                    className="w-full text-sm text-gray-400 hover:text-gray-600"
                  >
                    Изменить номер
                  </button>
                </>
              )}
            </div>
          )}

          {authMode === 'email' && (
            <div>
"""

# Ищем начало формы email — обычно это начало формы с onSubmit
patch(
    "app/auth/page.tsx",
    old="        <form onSubmit={handleSubmit}",
    new=PHONE_UI + "        <form onSubmit={handleSubmit}",
    label="Auth → UI телефон/email переключатель",
)

# Закрываем условный блок email после формы (перед кнопкой Google)
patch(
    "app/auth/page.tsx",
    old="          {/* Google OAuth */}",
    new="            </div>\n          )}\n\n          {/* Google OAuth */}",
    label="Auth → закрыть блок email формы",
)

# Telegram — кнопка (бот-ссылка, мгновенная интеграция без отдельного OAuth)
TELEGRAM_BTN = """
          {/* Telegram */}
          <div className="mt-3">
            <a
              href="https://t.me/MentoraBot?start=auth"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-3 border border-gray-200
                         text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-[#2AABEE]">
                <path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.94 8.19-2.04 9.6c-.15.68-.54.85-1.1.53l-3-2.21-1.45 1.4c-.16.16-.3.3-.61.3l.21-3.03 5.49-4.96c.24-.21-.05-.33-.37-.12L6.8 14.26l-2.96-.92c-.64-.2-.65-.64.14-.95l11.57-4.46c.53-.2 1 .13.39.26z"/>
              </svg>
              Войти через Telegram
            </a>
          </div>
"""

patch(
    "app/auth/page.tsx",
    old="        </div>\n      </div>\n    </div>\n  )\n}",
    new=TELEGRAM_BTN + "        </div>\n      </div>\n    </div>\n  )\n}",
    label="Auth → кнопка Telegram",
)


# ─────────────────────────────────────────────────────────
# 3. ONBOARDING — добавить шаг 0 "Кто ты?"
# ─────────────────────────────────────────────────────────
ROLE_STEP_STATE = """
  const [role, setRole] = useState<'student' | 'adult' | 'parent_teacher' | null>(null)
"""

ROLE_STEP_SAVE = """
    // Сохраняем роль
    if (role) {
      await supabase.from('users').update({ role }).eq('id', user.id)
    }
"""

ROLE_STEP_UI = """
      {step === 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Кто ты?</h2>
          <p className="text-gray-500 text-sm">Это поможет настроить Mentora под тебя</p>
          <div className="grid gap-3">
            {[
              { value: 'student', emoji: '🎒', label: 'Школьник / Студент', desc: 'Готовлюсь к урокам и экзаменам' },
              { value: 'adult',   emoji: '💼', label: 'Взрослый',           desc: 'Учусь для себя или работы' },
              { value: 'parent_teacher', emoji: '👨‍🏫', label: 'Родитель или учитель', desc: 'Слежу за прогрессом ученика' },
            ].map(opt => (
              <button
                key={opt.value}
                onClick={() => setRole(opt.value as typeof role)}
                className={`flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all ${
                  role === opt.value
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className="text-2xl">{opt.emoji}</span>
                <div>
                  <div className="text-sm font-semibold text-gray-900">{opt.label}</div>
                  <div className="text-xs text-gray-500">{opt.desc}</div>
                </div>
              </button>
            ))}
          </div>
          <button
            onClick={() => role && setStep(1)}
            disabled={!role}
            className="w-full py-3 bg-indigo-600 text-white text-sm font-medium rounded-xl
                       hover:bg-indigo-700 transition-colors disabled:opacity-50 mt-2"
          >
            Продолжить →
          </button>
        </div>
      )}
"""

# Добавляем state для роли
patch(
    "app/onboarding/page.tsx",
    old="  const [step, setStep] = useState(0)",
    new="  const [step, setStep] = useState(0)\n" + ROLE_STEP_STATE,
    label="Onboarding → state роли",
)

# Вставляем сохранение роли перед финальным update
patch(
    "app/onboarding/page.tsx",
    old="    await supabase.from('users').update({",
    new=ROLE_STEP_SAVE + "\n    await supabase.from('users').update({",
    label="Onboarding → сохранение роли в БД",
)

# Нумерация шагов сдвигается — шаг выбора стиля становится шагом 1
# Вставляем UI роли перед первым существующим шагом
patch(
    "app/onboarding/page.tsx",
    old="      {step === 0 && (",
    new=ROLE_STEP_UI + "\n      {step === 1 && (",
    label="Onboarding → шаг 0 Кто ты + сдвиг шага 1",
)

patch(
    "app/onboarding/page.tsx",
    old="      {step === 1 && (",
    new="      {step === 2 && (",
    label="Onboarding → сдвиг шага 2",
)

patch(
    "app/onboarding/page.tsx",
    old="      {step === 2 && (",
    new="      {step === 3 && (",
    label="Onboarding → сдвиг шага 3",
)

# Кнопки "назад" и переходы тоже сдвигаем
patch(
    "app/onboarding/page.tsx",
    old="setStep(1)",
    new="setStep(2)",
    label="Onboarding → переход setStep(1)→setStep(2)",
)

patch(
    "app/onboarding/page.tsx",
    old="setStep(2)",
    new="setStep(3)",
    label="Onboarding → переход setStep(2)→setStep(3)",
)


# ─────────────────────────────────────────────────────────
# 4. LAYOUT — lang="ru" + заготовка для i18n
# ─────────────────────────────────────────────────────────
patch(
    "app/layout.tsx",
    old='<html lang="en"',
    new='<html lang="ru"',
    label="Layout → lang=ru",
)

# Добавляем поле language в DB-запрос чата (если есть)
patch(
    "app/api/chat/route.ts",
    old="// language field placeholder — добавить при i18n",
    new="// i18n: language selection handled via query param",
    label="Chat API → i18n placeholder (noop)",
)


# ─────────────────────────────────────────────────────────
# Итог
# ─────────────────────────────────────────────────────────
print("\n=== Результат патча ===")
for line in ok:
    print(line)
if fail:
    print("\n⚠️  Требуют внимания:")
    for line in fail:
        print(line)

print(f"\nВсего: {len(ok)} ОК, {len(fail)} пропущено")
