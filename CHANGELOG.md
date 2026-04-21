# Changelog — Mentora AI Platform

## [4.0.0] — 2026-04-14  ★ Major Release

### Семантика версий
- `X.0.0` — крупный знаковый апдейт
- `0.X.0` — добавление незначительных функций  
- `0.0.X` — исправление ошибок

---

### Добавлено

- **Тариф Ultima** — новый максимальный план (799 ₽/мес, 5990 ₽/год). Включает всё из Pro + распознавание фото, генерация презентаций, аудио-разборы. Полная интеграция во все файлы и API (chat, learn, dashboard, profile, pricing, payments).
- **API `/api/onboarding/complete`** — надёжный серверный маршрут для завершения онбординга через service role (обходит RLS). Кнопка «Пропустить» теперь всегда работает.
- **Тёмная тема** — полная поддержка dark mode: ChatInterface, auth, pricing, profile, dashboard, privacy, terms. CSS переменные с правильными контрастными соотношениями (WCAG AA).
- **Семантические CSS-утилиты** — `.t-primary`, `.t-secondary`, `.t-muted`, `.s-page`, `.s-raised`, `.s-input` в `@layer utilities`.
- **Защита `/profile`** — маршрут добавлен в middleware `protectedPaths`.

### Исправлено

- **`[4.0.0]` Буква «е» в логотипе** — убран `display: inline-block` и `position: relative` из логотипа; теперь `inline-flex items-baseline` контейнера корректно выравнивает по базовой линии без дополнительных трюков.
- **`[3.0.2]` SplashScreen белый фон** — `bg-white` → `style={{ background: "var(--bg)" }}`; экран загрузки теперь тёмный в тёмной теме.
- **`[3.0.2]` Онбординг бесконечный цикл** — `ultima_expires_at` в SELECT несуществующей колонки давал `profile=null` → редирект обратно в /onboarding. Колонка убрана.
- **`[3.0.2]` Онбординг поля** — STEPS.field исправлены с `onboarding_style` → `style` чтобы совпадать с API.
- **`[3.0.1]` PostHogProvider двойная инициализация** — добавлена проверка `if (!posthog.__loaded)`.
- **`[3.0.1]` Admin health HTTP 405** — `checkAnthropic()` переведён с `GET /v1/models` → `POST /v1/messages`.
- **`[3.0.1]` Demo API** — исправлено имя модели (`claude-haiku-4-5` → `claude-haiku-4-5-20251001`) и добавлена поддержка Vercel-прокси.
- **`[3.0.1]` Дублирование сообщений в чате** — удалён двойной `setMessages()` вызов.
- **`[3.0.1]` Admin SUBJECTS** — устаревшие слаги обновлены (`history` → `russian-history`, etc.).
- **`[3.0.1]` Дублирующийся knowledge route** — удалён ошибочно вложенный файл.

### Инфраструктура

- **Vercel прокси** (`/api/anthropic-proxy/[...path]`) — обход гео-блокировки Anthropic для российского VPS.
- **SWC авто-восстановление** — `npm run build || (npm install && npm run build)` в deploy скрипте для исправления пропавших `@next/swc` бинарей.
- **Vercel Protection Bypass** — заголовок `x-vercel-protection-bypass` для автоматического доступа VPS к защищённому Vercel деплою.

---

## [3.0.1] — 2026-04-14

### Исправлено

- **Demo API: прокси** — `src/app/api/demo/route.ts` теперь инициализирует Anthropic-клиент с поддержкой `ANTHROPIC_BASE_URL` и `VERCEL_BYPASS_SECRET`. Ранее демо-диалог падал с 500-ошибкой из-за прямого обращения VPS к `api.anthropic.com` (гео-блокировка).
- **Demo API: модель** — исправлено имя модели: `claude-haiku-4-5` → `claude-haiku-4-5-20251001`.
- **Middleware: защита /profile** — маршрут `/profile` добавлен в `protectedPaths`. Ранее страница профиля была доступна без авторизации.
- **Admin health check: HTTP 405** — `checkAnthropic()` переведён с `GET /v1/models` на `POST /v1/messages` (прокси принимает только POST). Статус в админке теперь зелёный.
- **Admin knowledge: дублирующийся файл** — удалён ошибочно вложенный `route.ts`, оставшийся после предыдущего коммита.
- **PostHogProvider: двойная инициализация** — добавлена проверка `if (!posthog.__loaded)` перед `posthog.init()`.
- **Admin SUBJECTS: устаревшие слаги** — обновлён список предметов в `dashboard/admin/page.tsx` до актуальных слагов.

### Добавлено (в рамках этой серии фиксов)

- **Anthropic proxy** (`src/app/api/anthropic-proxy/[...path]/route.ts`) — прозрачный проксирующий маршрут на Vercel для обхода гео-блокировки на российском VPS.
- **Vercel Protection Bypass** — автоматическая передача заголовка `x-vercel-protection-bypass` при каждом запросе через прокси.

---

## Состояние платформы v3.0.1

### Архитектура
- **Хостинг**: Российский VPS (mentora.su) + Vercel EU/US (прокси для Anthropic API)
- **Stack**: Next.js 14 · Supabase · Claude Haiku · OpenAI Embeddings · YooKassa · Resend · PostHog

### Предметы (13)
`russian-history`, `world-history`, `mathematics`, `physics`, `chemistry`, `biology`, `russian-language`, `literature`, `english`, `social-studies`, `geography`, `computer-science`, `astronomy`

### Тарифы
- **Free**: 20 сообщений/день
- **Pro Monthly**: 399 ₽/мес
- **Pro Annual**: 2990 ₽/год

### Сервисы (статус 2026-04-14)
| Сервис | Статус | Задержка |
|--------|--------|----------|
| Anthropic API (через прокси) | ✅ | ~600ms |
| OpenAI Embeddings | ✅ | ~7ms |
| Supabase DB | ✅ | ~94ms |
| YooKassa | ✅ | — |
| Resend Email | ✅ | — |
| PostHog Analytics | ✅ | — |

<!-- ci: fix Vercel proxy auth -->
