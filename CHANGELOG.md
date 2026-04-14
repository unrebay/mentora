# Changelog — Mentora AI Platform

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
