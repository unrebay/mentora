# Mentora — правила разработки

## Ветки

| Ветка | Назначение | Деплой |
|---|---|---|
| `main` | **Продакшн** — то, что видят пользователи. Всегда работает. | mentora.su |
| `dev` | **Staging** — тестируем здесь перед релизом | mentora-git-dev-*.vercel.app |
| `feature/*` | Отдельные задачи | авто-preview Vercel |

## Рабочий процесс

```
feature/моя-задача  →  dev  →  main
                    тест    релиз
```

1. **Новая задача** — создаём ветку от `dev`:
   ```bash
   git checkout dev
   git pull
   git checkout -b feature/название-задачи
   ```

2. **Работаем** — коммитим в `feature/*`. Vercel даёт preview URL автоматически.

3. **Проверили** → мёрджим в `dev`:
   ```bash
   git checkout dev
   git merge feature/название-задачи
   git push origin dev
   ```
   Смотрим staging URL (mentora-git-dev-*.vercel.app) — убеждаемся что всё работает.

4. **Готово к релизу** → мёрджим `dev` в `main`:
   ```bash
   git checkout main
   git merge dev
   git push origin main
   ```
   Vercel деплоит на mentora.su (~2-3 мин).

## Правила

- ❌ Никогда не пушим сломанный код напрямую в `main`
- ❌ Никогда не мёрджим `feature/*` сразу в `main` — только через `dev`
- ✅ `main` должен всегда собираться и работать для пользователей
- ✅ Большие фичи — обязательно через `dev` staging

## Откат (если что-то сломалось)

```bash
# Посмотреть историю
git log --oneline main

# Откатить к предыдущему коммиту
git revert HEAD
git push origin main
```

Vercel также хранит все предыдущие деплои — можно мгновенно откатиться через dashboard.
