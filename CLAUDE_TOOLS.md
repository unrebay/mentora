# CLAUDE_TOOLS.md — Карта инструментов Claude (Cowork)

> Дата: 2026-05-27  
> Назначение: полная карта скиллов, плагинов, MCP-серверов и коннекторов доступных в этой сессии.  
> Обновляй при добавлении/удалении плагинов.

---

## 📦 Установленные плагины

| Плагин | Описание |
|--------|----------|
| `bio-research` | Инструменты биомедицинских исследований (PubMed, bioRxiv, ChEMBL, ClinicalTrials, scvi-tools, nf-core) |
| `cowork-plugin-management` | Создание и кастомизация плагинов Cowork |
| `engineering` | Инженерные скиллы (code-review, debug, architecture, docs, incident, standup, deploy, tech-debt, testing) |
| `enterprise-search` | Поиск по всем подключённым источникам (Slack, email, Drive, Notion и др.) |
| `legal` | Юридические инструменты (NDA, контракты, compliance, подпись, vendor-check) |
| `marketing` | Маркетинговые скиллы (контент, SEO, кампании, email-цепочки, отчёты, конкуренты) |
| `product-tracking-skills` | Телеметрия и продуктовая аналитика (аудит, план, имплементация, watchdog) |
| `productivity` | Управление задачами, память, dashboard |
| `sales` | Продажи (account research, call prep/summary, outreach, pipeline, forecast, battlecards) |

---

## 🛠 Скиллы по категориям

### Engineering
- `engineering:architecture` — ADR, выбор технологий
- `engineering:code-review` — ревью кода, безопасность
- `engineering:debug` — отладка, поиск причины
- `engineering:deploy-checklist` — чеклист перед деплоем
- `engineering:documentation` — README, runbook, API docs
- `engineering:incident-response` — инцидент, postmortem
- `engineering:standup` — daily standup из активности
- `engineering:system-design` — дизайн систем и сервисов
- `engineering:tech-debt` — технический долг
- `engineering:testing-strategy` — стратегия тестирования

### Marketing
- `marketing:brand-review` — проверка тональности бренда
- `marketing:campaign-plan` — план кампании с метриками
- `marketing:competitive-brief` — конкурентная разведка, battlecard
- `marketing:content-creation` — контент для каналов
- `marketing:draft-content` — черновик поста/письма/лендинга
- `marketing:email-sequence` — email-цепочки с логикой
- `marketing:performance-report` — отчёт по эффективности
- `marketing:seo-audit` — SEO аудит сайта

### Sales
- `sales:account-research` — исследование компании/человека
- `sales:call-prep` — подготовка к звонку
- `sales:call-summary` — обработка транскрипта звонка
- `sales:competitive-intelligence` — конкурентная разведка
- `sales:create-an-asset` — создание sales-материалов
- `sales:daily-briefing` — утренний брифинг по сделкам
- `sales:draft-outreach` — персонализированный cold outreach
- `sales:forecast` — прогноз продаж
- `sales:pipeline-review` — анализ пайплайна

### Legal
- `legal:brief` — юридический брифинг
- `legal:compliance-check` — проверка на соответствие нормам
- `legal:legal-response` — ответы на юридические запросы
- `legal:legal-risk-assessment` — оценка юридических рисков
- `legal:meeting-briefing` — подготовка к встрече
- `legal:review-contract` — ревью контракта
- `legal:signature-request` — маршрутизация на подпись
- `legal:triage-nda` — быстрый триаж NDA
- `legal:vendor-check` — проверка статуса соглашений с вендором

### Productivity
- `productivity:memory-management` — двухуровневая память (CLAUDE.md + memory/)
- `productivity:start` — инициализация системы, dashboard
- `productivity:task-management` — задачи в TASKS.md
- `productivity:update` — синхронизация задач и памяти

### Product Tracking
- `product-tracking-skills:product-tracking-model-product` — модель продукта
- `product-tracking-skills:product-tracking-audit-current-tracking` — аудит текущего трекинга
- `product-tracking-skills:product-tracking-design-tracking-plan` — план трекинга
- `product-tracking-skills:product-tracking-generate-implementation-guide` — SDK-гайд
- `product-tracking-skills:product-tracking-implement-tracking` — генерация кода
- `product-tracking-skills:product-tracking-instrument-new-feature` — трекинг новой фичи
- `product-tracking-skills:product-tracking-business-case` — бизнес-кейс для телеметрии

### Bio Research
- `bio-research:start` — инициализация окружения
- `bio-research:instrument-data-to-allotrope` — конвертация лабораторных данных
- `bio-research:nextflow-development` — запуск nf-core биоинформатических пайплайнов
- `bio-research:scientific-problem-selection` — выбор научной задачи
- `bio-research:scvi-tools` — deep learning для single-cell анализа
- `bio-research:single-cell-rna-qc` — QC scRNA-seq данных

### Enterprise Search
- `enterprise-search:digest` — дайджест активности
- `enterprise-search:knowledge-synthesis` — синтез из нескольких источников
- `enterprise-search:search` — поиск по всем источникам
- `enterprise-search:search-strategy` — декомпозиция запроса
- `enterprise-search:source-management` — управление источниками

### Built-in (всегда доступны)
- `docx` — создание/редактирование Word документов
- `xlsx` — создание/редактирование Excel таблиц
- `pptx` — создание/редактирование PowerPoint презентаций
- `pdf` — работа с PDF
- `schedule` — создание расписания (cronExpression или fireAt)
- `setup-cowork` — настройка Cowork
- `skill-creator` — создание и оптимизация скиллов
- `cowork-plugin-management:create-cowork-plugin` — создание плагина
- `cowork-plugin-management:cowork-plugin-customizer` — кастомизация плагина

---

## 🔌 MCP-серверы

### PostHog (`mcp__4179e100-...`)
Полный доступ к PostHog: feature flags, insights, cohorts, experiments, session recordings, error tracking, data warehouse, LLM observability, surveys, annotations.
- Ключевые команды: `query-trends`, `query-funnel`, `query-retention`, `execute-sql`, `insight-create`, `create-feature-flag`, `experiment-create`

### Supabase (`mcp__86e130ab-...`)
Управление Supabase проектами: SQL, миграции, edge functions, branches, logs.
- Ключевые: `execute_sql`, `apply_migration`, `get_logs`, `list_tables`, `deploy_edge_function`
- Проект Mentora: `sgfhxwhmdtgpqqucfwuf`

### Notion (`mcp__f5c3c5ba-...`)
Чтение и запись в Notion: страницы, базы данных, комментарии, поиск.
- Ключевые: `notion-search`, `notion-create-pages`, `notion-update-page`, `notion-fetch`

### Vercel (`mcp__b4c9a2a8-...`)
Деплой и управление Vercel проектами: deployments, logs, toolbar comments, domain check.
- Ключевые: `deploy_to_vercel`, `get_deployment`, `get_runtime_logs`, `list_deployments`

### Context7 / Library Docs (`mcp__68b0632e-...`)
Документация библиотек: resolve-library-id + query-docs для любой npm/PyPI/etc библиотеки.
- Использование: сначала `resolve-library-id`, потом `query-docs`

### Computer Use (`mcp__computer-use__*`)
Управление рабочим столом: скриншоты, клики, ввод текста, scroll.
- Тир браузеров — только чтение. Тиры IDE — только клик. Остальное — full.
- Загружать все инструменты через `ToolSearch: "computer-use", max_results: 30`

### Claude in Chrome (`mcp__Claude_in_Chrome__*`)
Браузерная автоматизация через Chrome extension: navigate, find, form_input, javascript, screenshots.
- Использовать вместо computer-use для веб-приложений.
- Загружать через `ToolSearch: "chrome", max_results: 20`

### PowerPoint (`mcp__PowerPoint__By_Anthropic___*`)
Прямое управление PowerPoint на Mac: create, add_slide, add_text, insert_image, export_pdf.

### Scheduled Tasks (`mcp__scheduled-tasks__*`)
Создание расписания: `create_scheduled_task` (cronExpression или fireAt), `list_scheduled_tasks`, `update_scheduled_task`.

### Cowork (`mcp__cowork__*`)
Создание артефактов (живых HTML страниц), запрос доступа к папкам, список артефактов.
- `create_artifact` — создать живой артефакт с данными коннекторов
- `request_cowork_directory` — попросить пользователя выбрать папку

### MCP Registry (`mcp__mcp-registry__*`)
Поиск новых коннекторов: `search_mcp_registry`, `suggest_connectors`, `suggest_plugin_install`.

### PDF Viewer (`mcp__pdf-viewer__*`)
Отображение и взаимодействие с PDF в интерфейсе.

### Session Info (`mcp__session_info__*`)
Список сессий, чтение транскриптов (`read_transcript`).

---

## 🔗 Подключаемые (но не подключённые) коннекторы

Доступны для подключения через MCP Registry или authenticate:
- **Productivity**: Slack, Asana, Atlassian/Jira, Linear, ClickUp, Monday, Notion (уже есть), MS365
- **Engineering**: GitHub, Datadog, PagerDuty
- **Marketing**: Amplitude, Figma, Canva, Klaviyo, Ahrefs, SimilarWeb, Supermetrics
- **Sales**: HubSpot, Fireflies, Apollo, ZoomInfo, Outreach, Clay, Close
- **Legal**: DocuSign, Box, Egnyte
- **Enterprise Search**: Guru
- **Bio Research**: BioRender, Synapse, Wiley, Owkin

---

## 📁 Файловая система

| Назначение | Путь (file tools) | Путь (bash) |
|-----------|------------------|-------------|
| Workspace проекта | `/Users/unrebay/Documents/Claude/Projects/Образовательная ИИ-платформа/` | `/sessions/ecstatic-festive-cerf/mnt/Образовательная ИИ-платформа/` |
| Outputs (temp) | `/Users/unrebay/Library/.../outputs/` | `/sessions/ecstatic-festive-cerf/mnt/outputs/` |
| Uploads (uploaded files) | `/Users/unrebay/Library/.../uploads/` | `/sessions/ecstatic-festive-cerf/mnt/uploads/` (read-only) |
| Skills | `/var/folders/.../skills/` | `/sessions/ecstatic-festive-cerf/mnt/.claude/skills/` (read-only) |

---

## 🧠 Память

- **MEMORY.md** — индекс, загружается в каждую сессию
- **memory/*.md** — отдельные файлы памяти (user, feedback, project, reference)
- **MENTORA_CONTEXT.md** — главный контекст-файл проекта, читать первым
- Путь: `/Users/unrebay/Library/.../spaces/.../memory/`

---

## ⚡ Паттерны использования

```
# Поиск в интернете
ToolSearch "select:WebSearch" → WebSearch

# Создание Word/Excel/PPT
Read SKILL.md → выполнить скрипт

# Запуск браузера
ToolSearch "chrome, max_results: 20" → mcp__Claude_in_Chrome__navigate

# Computer use
ToolSearch "computer-use, max_results: 30" → mcp__computer-use__screenshot

# Поиск нового коннектора
mcp__mcp-registry__search_mcp_registry → mcp__mcp-registry__suggest_connectors
```

---

*Обновлено: 2026-05-27*
