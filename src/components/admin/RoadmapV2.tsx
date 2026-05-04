"use client";

import { useEffect, useMemo, useState, useRef } from "react";

// ── Types ────────────────────────────────────────────────────────────────────
export type Bucket = "now" | "soon" | "ideas" | "notes";
export type Category = "tech" | "marketing" | "design" | "content" | "product" | "ops";
export type TaskState = "planned" | "in_progress" | "done" | "blocked";

export interface SubTask {
  id: string;
  text: string;
  done: boolean;
}

export interface RoadmapTaskV2 {
  id: string;
  title: string;
  notes?: string;
  subtasks?: SubTask[];
  bucket: Bucket;
  category: Category;
  state: TaskState;
  isMilestone?: boolean;
  due?: string;          // ISO date (only for milestones)
  createdAt: string;     // ISO
}

// ⚠️ STABLE — DO NOT BUMP. Bumping wipes user data.
// To add new seed tasks for existing installs, push them via mergeNewSeedTasks() instead.
const STORAGE_KEY = "mentora_admin_roadmap_v8";
const LEGACY_KEYS = [
  "mentora_admin_roadmap_v7",
  "mentora_admin_roadmap_v6",
  "mentora_admin_roadmap_v5",
  "mentora_admin_roadmap_v4",
];

// ⚠️ STABLE — DO NOT BUMP. History stores full timestamped snapshots; capped at last 100.
const HISTORY_KEY = "mentora_admin_roadmap_history";
const HISTORY_MAX = 100;
const DELETED_KEY = "mentora_admin_roadmap_deleted_ids";  // ids user explicitly deleted — never re-add via seed merge

interface HistoryEntry {
  ts: number;            // unix ms
  action: string;        // human label e.g. "edit:title", "add", "delete", "move:bucket"
  tasksSnapshot: RoadmapTaskV2[];
}
const LAUNCH_DATE = "2026-06-01";

// ── Category & state metadata ────────────────────────────────────────────────
const CAT_META: Record<Category, { label: string; color: string }> = {
  tech:      { label: "Технологии", color: "#4561E8" },
  marketing: { label: "Маркетинг",  color: "#ec4899" },
  design:    { label: "Дизайн",     color: "#a78bfa" },
  content:   { label: "Контент",    color: "#22c55e" },
  product:   { label: "Продукт",    color: "#FF7A00" },
  ops:       { label: "Ops",        color: "#94a3b8" },
};

const STATE_META: Record<TaskState, { label: string; color: string; icon: string }> = {
  planned:     { label: "В плане",   color: "#94a3b8", icon: "○" },
  in_progress: { label: "В работе",  color: "#FF7A00", icon: "◐" },
  done:        { label: "Готово",    color: "#22c55e", icon: "●" },
  blocked:     { label: "Заблок.",   color: "#ef4444", icon: "⚠" },
};

const BUCKET_META: Record<Bucket, { label: string; subtitle: string; color: string }> = {
  now:   { label: "Сейчас",     subtitle: "Активный спринт",        color: "#4561E8" },
  soon:  { label: "Скоро",      subtitle: "1–3 недели",             color: "#a78bfa" },
  ideas: { label: "Идеи",       subtitle: "Без срока",              color: "#22c55e" },
  notes: { label: "Заметки",    subtitle: "Чтобы не забыть",        color: "#94a3b8" },
};

// ── Default seed (overwritten only on first load) ────────────────────────────
const SEED: RoadmapTaskV2[] = [
  // ═══ Milestones до 1 июня ═══
  { id: "ms_rag",           title: "RAG: индекс ФГОС-учебников + 5+ публичных источников на каждую из 17 наук",
    bucket: "now", category: "tech",      state: "done",        isMilestone: true, due: "2026-05-25",
    notes: "✅ ГОТОВО (04.05.2026 вечер): 952 чанка на все 17 наук. pgvector + Edge Function embed (gte-small 384d). search_knowledge RPC + /api/chat retrieval. История РФ — 204 чанка, всемирная — 120, остальные 49-52. Sparse: психология/философия/экономика по 8 — добор предстоит. Критический баг с дублирующейся RPC overload устранён.",
    createdAt: new Date().toISOString() },
  { id: "ms_factcheck",     title: "Multi-agent fact-check (B читает A против тех же chunks)",
    bucket: "now", category: "tech",      state: "planned",     isMilestone: true, due: "2026-05-28",
    createdAt: new Date().toISOString() },
  { id: "ms_benchmark",     title: "Бенчмарк 100 вопросов: фактическая точность ≥92%",
    bucket: "now", category: "tech",      state: "planned",     isMilestone: true, due: "2026-05-29",
    createdAt: new Date().toISOString() },
  { id: "ms_citations",     title: "Citation linking: hover на параграф → источник",
    bucket: "now", category: "tech",      state: "planned",     isMilestone: true, due: "2026-05-30",
    createdAt: new Date().toISOString() },
  { id: "ms_marketing_kit", title: "Маркетинг-кит: тизер + посты VK/TG/X + email рассылка",
    bucket: "soon", category: "marketing", state: "planned",     isMilestone: true, due: "2026-05-30",
    createdAt: new Date().toISOString() },
  { id: "ms_gift",          title: "Подарок 1 июня — Pro месяц всем зарегистрированным",
    bucket: "soon", category: "product",   state: "done",        isMilestone: true, due: "2026-06-01",
    notes: "Логика в коде. Нужно протестировать активацию вручную",
    createdAt: new Date().toISOString() },
  { id: "ms_perf",          title: "Стресс-тест 100+ одновременных пользователей",
    bucket: "soon", category: "tech",     state: "planned",     isMilestone: true, due: "2026-05-29",
    createdAt: new Date().toISOString() },
  { id: "ms_landing_pol",   title: "Финал лендинга: ритм, sticky-CTA, тексты",
    bucket: "soon", category: "design",   state: "planned",     isMilestone: true, due: "2026-05-31",
    createdAt: new Date().toISOString() },

  // ═══ Чек-лист «Сейчас»: десктоп-проход всех страниц ═══
  { id: "ds_landing", title: "🖥️ Десктоп — Лендинг (/)", bucket: "now", category: "design", state: "done", createdAt: new Date().toISOString() },
  { id: "ds_pricing", title: "🖥️ Десктоп — Тарифы (/pricing)", bucket: "now", category: "design", state: "done", createdAt: new Date().toISOString() },
  { id: "ds_guide", title: "🖥️ Десктоп — Гайд (/guide)", bucket: "now", category: "design", state: "done", createdAt: new Date().toISOString() },
  { id: "ds_auth", title: "🖥️ Десктоп — Вход (/auth)", bucket: "now", category: "design", state: "planned", createdAt: new Date().toISOString() },
  { id: "ds_about", title: "🖥️ Десктоп — О проекте (/dashboard/about)", bucket: "now", category: "design", state: "done", createdAt: new Date().toISOString() },
  { id: "ds_dashboard", title: "🖥️ Десктоп — Главная dashboard", bucket: "now", category: "design", state: "planned", createdAt: new Date().toISOString() },
  { id: "ds_analytics", title: "🖥️ Десктоп — Аналитика+Прогресс", bucket: "now", category: "design", state: "done", createdAt: new Date().toISOString() },
  { id: "ds_profile", title: "🖥️ Десктоп — Профиль", bucket: "now", category: "design", state: "done", createdAt: new Date().toISOString() },
  { id: "ds_knowledge", title: "🖥️ Десктоп — Galaxy of Knowledge", bucket: "now", category: "design", state: "planned", createdAt: new Date().toISOString() },
  { id: "ds_learn", title: "🖥️ Десктоп — Чат /learn/[subject]", bucket: "now", category: "design", state: "planned", createdAt: new Date().toISOString() },
  { id: "ds_admin", title: "🖥️ Десктоп — Админка", bucket: "now", category: "design", state: "done", createdAt: new Date().toISOString() },
  { id: "ds_privacy", title: "🖥️ Десктоп — Privacy / Terms", bucket: "now", category: "design", state: "planned", createdAt: new Date().toISOString() },

  // ═══ Чек-лист «Скоро»: мобильный проход всех страниц ═══
  { id: "mb_landing", title: "📱 Мобайл (375/414/768) — Лендинг (/)", bucket: "soon", category: "design", state: "planned", createdAt: new Date().toISOString() },
  { id: "mb_pricing", title: "📱 Мобайл (375/414/768) — Тарифы (/pricing)", bucket: "soon", category: "design", state: "planned", createdAt: new Date().toISOString() },
  { id: "mb_guide", title: "📱 Мобайл (375/414/768) — Гайд (/guide)", bucket: "soon", category: "design", state: "planned", createdAt: new Date().toISOString() },
  { id: "mb_auth", title: "📱 Мобайл (375/414/768) — Вход (/auth)", bucket: "soon", category: "design", state: "planned", createdAt: new Date().toISOString() },
  { id: "mb_about", title: "📱 Мобайл (375/414/768) — О проекте (/dashboard/about)", bucket: "soon", category: "design", state: "planned", createdAt: new Date().toISOString() },
  { id: "mb_dashboard", title: "📱 Мобайл (375/414/768) — Главная dashboard", bucket: "soon", category: "design", state: "planned", createdAt: new Date().toISOString() },
  { id: "mb_analytics", title: "📱 Мобайл (375/414/768) — Аналитика+Прогресс", bucket: "soon", category: "design", state: "planned", createdAt: new Date().toISOString() },
  { id: "mb_profile", title: "📱 Мобайл (375/414/768) — Профиль", bucket: "soon", category: "design", state: "planned", createdAt: new Date().toISOString() },
  { id: "mb_knowledge", title: "📱 Мобайл (375/414/768) — Galaxy of Knowledge", bucket: "soon", category: "design", state: "planned", createdAt: new Date().toISOString() },
  { id: "mb_learn", title: "📱 Мобайл (375/414/768) — Чат /learn/[subject]", bucket: "soon", category: "design", state: "planned", createdAt: new Date().toISOString() },
  { id: "mb_admin", title: "📱 Мобайл (375/414/768) — Админка", bucket: "soon", category: "design", state: "planned", createdAt: new Date().toISOString() },
  { id: "mb_privacy", title: "📱 Мобайл (375/414/768) — Privacy / Terms", bucket: "soon", category: "design", state: "planned", createdAt: new Date().toISOString() },

  // ═══ Чек-лист «Идеи»: технический аудит всех страниц ═══
  { id: "tc_landing", title: "🔧 Тех-аудит — Лендинг (/)", bucket: "ideas", category: "tech", state: "planned", createdAt: new Date().toISOString() },
  { id: "tc_pricing", title: "🔧 Тех-аудит — Тарифы (/pricing)", bucket: "ideas", category: "tech", state: "planned", createdAt: new Date().toISOString() },
  { id: "tc_guide", title: "🔧 Тех-аудит — Гайд (/guide)", bucket: "ideas", category: "tech", state: "planned", createdAt: new Date().toISOString() },
  { id: "tc_auth", title: "🔧 Тех-аудит — Вход (/auth)", bucket: "ideas", category: "tech", state: "planned", createdAt: new Date().toISOString() },
  { id: "tc_about", title: "🔧 Тех-аудит — О проекте (/dashboard/about)", bucket: "ideas", category: "tech", state: "planned", createdAt: new Date().toISOString() },
  { id: "tc_dashboard", title: "🔧 Тех-аудит — Главная dashboard", bucket: "ideas", category: "tech", state: "planned", createdAt: new Date().toISOString() },
  { id: "tc_analytics", title: "🔧 Тех-аудит — Аналитика+Прогресс", bucket: "ideas", category: "tech", state: "planned", createdAt: new Date().toISOString() },
  { id: "tc_profile", title: "🔧 Тех-аудит — Профиль", bucket: "ideas", category: "tech", state: "planned", createdAt: new Date().toISOString() },
  { id: "tc_knowledge", title: "🔧 Тех-аудит — Galaxy of Knowledge", bucket: "ideas", category: "tech", state: "planned", createdAt: new Date().toISOString() },
  { id: "tc_learn", title: "🔧 Тех-аудит — Чат /learn/[subject]", bucket: "ideas", category: "tech", state: "planned", createdAt: new Date().toISOString() },
  { id: "tc_admin", title: "🔧 Тех-аудит — Админка", bucket: "ideas", category: "tech", state: "planned", createdAt: new Date().toISOString() },
  { id: "tc_privacy", title: "🔧 Тех-аудит — Privacy / Terms", bucket: "ideas", category: "tech", state: "planned", createdAt: new Date().toISOString() },

  // ═══ Прочее «Сейчас» ═══
  { id: "now_nonce_csp",     title: "Nonce-CSP для script-src → A+ rating",
    bucket: "now", category: "tech",       state: "planned",
    notes: "Next.js 14 поддерживает из коробки. ~полдня",
    createdAt: new Date().toISOString() },
  { id: "now_avatars_done",  title: "Космические аватарки + UserDropdown",
    bucket: "now", category: "product",    state: "done",
    createdAt: new Date().toISOString() },
  { id: "now_dropdown_v2",   title: "UserDropdown v2 (имя/ранг/контакты, без дублей nav, без Выйти)",
    bucket: "now", category: "design",     state: "done",
    createdAt: new Date().toISOString() },
  { id: "now_white_stripe",  title: "Mobile белая полоса — overflow-x:hidden на body+html",
    bucket: "now", category: "design",     state: "done",
    createdAt: new Date().toISOString() },
  { id: "now_test_email",    title: "Email-доставка: resend.com или smtp.yandex.ru",
    bucket: "now", category: "ops",        state: "planned",
    createdAt: new Date().toISOString() },

  // ═══ Заметки ═══
  { id: "note_pricing",     title: "Годовой план — дискаунт ×2 или ×3 от месячного",
    bucket: "notes", category: "product",  state: "planned",
    createdAt: new Date().toISOString() },
  { id: "note_neuro",       title: "База знаний с нейронной анимацией — beta→verified",
    bucket: "notes", category: "design",   state: "planned",
    createdAt: new Date().toISOString() },
  { id: "note_b2b",         title: "B2B-лендинг для школ — после 100 первых публичных пользователей",
    bucket: "notes", category: "marketing", state: "planned",
    createdAt: new Date().toISOString() },
];

// ── Storage ──────────────────────────────────────────────────────────────────
/** Load tasks. Always merges from current + legacy keys + adds new SEED tasks.
 *  Honours deleted-ids set so user deletions stick across reloads.
 *  Tasks present in current STORAGE_KEY are kept regardless of deletion-set
 *  (user authoritative). Legacy/seed sources are filtered. */
function loadTasks(): RoadmapTaskV2[] {
  if (typeof window === "undefined") return SEED;
  try {
    const merged: RoadmapTaskV2[] = [];
    const seenIds = new Set<string>();
    const deletedIds = loadDeletedIds();

    // Pull tasks from a key. allowDeleted=true → include tasks even if id in deleted-set.
    const pullFrom = (key: string, allowDeleted: boolean): number => {
      const raw = localStorage.getItem(key);
      if (raw === null) return 0;
      try {
        const arr = JSON.parse(raw) as RoadmapTaskV2[];
        if (!Array.isArray(arr)) return 0;
        let added = 0;
        for (const t of arr) {
          if (!t || typeof t.id !== "string") continue;
          if (seenIds.has(t.id)) continue;
          if (!allowDeleted && deletedIds.has(t.id)) continue;
          merged.push(t);
          seenIds.add(t.id);
          added++;
        }
        return added;
      } catch { return 0; }
    };

    // 1. Current key — authoritative user state, deletions already reflected here
    pullFrom(STORAGE_KEY, /* allowDeleted */ true);
    // 2. Legacy keys — recover orphan tasks, but skip ids user explicitly deleted
    for (const lk of LEGACY_KEYS) {
      pullFrom(lk, /* allowDeleted */ false);
    }
    // 3. First install: nothing anywhere → seed (filtered)
    if (merged.length === 0) {
      const seeded = SEED.filter(s => !deletedIds.has(s.id));
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded)); } catch {}
      return seeded;
    }
    // 4. Add new SEED tasks user doesn't have yet, except deleted ones
    for (const s of SEED) {
      if (seenIds.has(s.id)) continue;
      if (deletedIds.has(s.id)) continue;
      merged.push(s);
      seenIds.add(s.id);
    }
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(merged)); } catch {}
    return merged;
  } catch { return SEED; }
}

function saveTasks(t: RoadmapTaskV2[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(t)); } catch {}
}

// ── Deleted-ids tracking — ensures deleted SEED/legacy tasks don't reappear ──
function loadDeletedIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(DELETED_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? new Set(arr) : new Set();
  } catch { return new Set(); }
}
function addDeletedIds(ids: string[]) {
  if (typeof window === "undefined" || ids.length === 0) return;
  try {
    const cur = loadDeletedIds();
    for (const id of ids) cur.add(id);
    localStorage.setItem(DELETED_KEY, JSON.stringify(Array.from(cur)));
  } catch {}
}
function removeDeletedIds(ids: string[]) {
  if (typeof window === "undefined" || ids.length === 0) return;
  try {
    const cur = loadDeletedIds();
    for (const id of ids) cur.delete(id);
    localStorage.setItem(DELETED_KEY, JSON.stringify(Array.from(cur)));
  } catch {}
}

/** Append a timestamped snapshot to history. Bounded to HISTORY_MAX entries.
 *  Best-effort: never throws. */
function pushHistorySnapshot(action: string, tasks: RoadmapTaskV2[]) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    let log: HistoryEntry[] = [];
    if (raw) {
      try { const parsed = JSON.parse(raw); if (Array.isArray(parsed)) log = parsed; } catch {}
    }
    log.push({ ts: Date.now(), action, tasksSnapshot: tasks });
    if (log.length > HISTORY_MAX) log = log.slice(log.length - HISTORY_MAX);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(log));
    // Best-effort server-side mirror — fire and forget
    try {
      fetch("/api/admin/roadmap-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, taskCount: tasks.length, ts: Date.now() }),
        keepalive: true,
      }).catch(() => {});
    } catch {}
  } catch {}
}

function loadHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

// ── Theme tokens (mirrored from admin/page.tsx, simplified) ──────────────────
function useTok() {
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const update = () => setIsDark(document.documentElement.classList.contains("dark"));
    update();
    const obs = new MutationObserver(update);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);
  return {
    isDark,
    BG:    isDark ? "#0a0d18" : "#f7f8fb",
    CARD:  isDark ? "#141625" : "#ffffff",
    BOR:   isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
    TEXT:  isDark ? "#e6e9ef" : "#1a1d28",
    MUTED: isDark ? "rgba(230,233,239,0.55)" : "rgba(26,29,40,0.55)",
  };
}

// ── Hero: Launch Tracker ─────────────────────────────────────────────────────
export function LaunchTracker({ tasks }: { tasks: RoadmapTaskV2[] }) {
  const { CARD, BOR, TEXT, MUTED, isDark } = useTok();
  const milestones = tasks.filter(t => t.isMilestone);
  const done = milestones.filter(t => t.state === "done").length;
  const total = milestones.length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const daysLeft = Math.max(0, Math.ceil((new Date(LAUNCH_DATE).getTime() - Date.now()) / 86400000));
  const inProgress = milestones.filter(t => t.state === "in_progress").length;
  const blocked    = milestones.filter(t => t.state === "blocked").length;

  return (
    <div style={{
      marginBottom: 28, padding: "20px 24px", background: CARD, borderRadius: 16,
      border: `1px solid ${BOR}`,
      boxShadow: isDark
        ? "inset 0 1px 0 rgba(255,255,255,0.04), 0 4px 20px rgba(0,0,0,0.20)"
        : "0 4px 16px rgba(0,0,0,0.04)",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: MUTED }}>
            Цель запуска
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: TEXT, marginTop: 2 }}>
            1 июня 2026 — публичный запуск
          </div>
          <div style={{ fontSize: 12, color: MUTED, marginTop: 4 }}>
            {daysLeft > 0 ? `Осталось ${daysLeft} ${dayWord(daysLeft)}` : "Запуск сегодня! 🚀"}
            {" · "}{done}/{total} milestone задач{inProgress > 0 ? ` · ${inProgress} в работе` : ""}{blocked > 0 ? ` · ${blocked} блок` : ""}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{
            fontSize: 36, fontWeight: 900, lineHeight: 1,
            background: "linear-gradient(135deg, #4561E8, #a78bfa, #FF7A00)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>
            {pct}%
          </div>
          <div style={{ fontSize: 11, color: MUTED, marginTop: 4 }}>готовность</div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{
        position: "relative", height: 8,
        background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
        borderRadius: 99, overflow: "hidden",
      }}>
        <div style={{
          height: "100%", width: pct + "%", borderRadius: 99,
          background: "linear-gradient(90deg, #4561E8 0%, #a78bfa 50%, #FF7A00 100%)",
          boxShadow: "0 0 12px rgba(167,139,250,0.55)",
          transition: "width .7s cubic-bezier(.4,0,.2,1)",
        }} />
      </div>

      {/* Milestone chips */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
        {milestones.map(m => (
          <div key={m.id} style={{
            fontSize: 11, padding: "4px 10px", borderRadius: 99,
            background: m.state === "done"
              ? "rgba(34,197,94,0.12)" : m.state === "in_progress"
              ? "rgba(255,122,0,0.12)" : m.state === "blocked"
              ? "rgba(239,68,68,0.12)" : (isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)"),
            color: STATE_META[m.state].color,
            border: `1px solid ${STATE_META[m.state].color}30`,
            display: "flex", alignItems: "center", gap: 6,
          }}
          title={`${STATE_META[m.state].label}${m.due ? ` · до ${m.due}` : ""}`}>
            <span style={{ fontSize: 9 }}>{STATE_META[m.state].icon}</span>
            <span>{m.title.length > 40 ? m.title.slice(0, 38) + "…" : m.title}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function dayWord(n: number): string {
  const last2 = n % 100;
  const last  = n % 10;
  if (last2 >= 11 && last2 <= 14) return "дней";
  if (last === 1) return "день";
  if (last >= 2 && last <= 4) return "дня";
  return "дней";
}

// ── Task Card ────────────────────────────────────────────────────────────────
function TaskCard({ task, onUpdate, onDelete }: {
  task: RoadmapTaskV2;
  onUpdate(t: RoadmapTaskV2): void;
  onDelete(id: string): void;
}) {
  const { CARD, BOR, TEXT, MUTED, isDark } = useTok();
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [draftTitle, setDraftTitle] = useState(task.title);
  const [draftNotes, setDraftNotes] = useState(task.notes ?? "");
  const [menuOpen, setMenuOpen] = useState(false);
  const [newSub, setNewSub] = useState("");
  const cat = CAT_META[task.category];
  const st  = STATE_META[task.state];

  const subtasks = task.subtasks ?? [];

  function moveTo(b: Bucket) { onUpdate({ ...task, bucket: b }); setMenuOpen(false); }
  function changeCategory(c: Category) { onUpdate({ ...task, category: c }); setMenuOpen(false); }
  function addSubtask() {
    const t = newSub.trim();
    if (!t) return;
    const next: SubTask[] = [...subtasks, { id: `s_${Date.now()}_${Math.random().toString(36).slice(2,6)}`, text: t, done: false }];
    onUpdate({ ...task, subtasks: next });
    setNewSub("");
  }
  function toggleSub(id: string) {
    const next = subtasks.map(s => s.id === id ? { ...s, done: !s.done } : s);
    onUpdate({ ...task, subtasks: next });
  }
  function delSub(id: string) {
    onUpdate({ ...task, subtasks: subtasks.filter(s => s.id !== id) });
  }
  function editSub(id: string, text: string) {
    onUpdate({ ...task, subtasks: subtasks.map(s => s.id === id ? { ...s, text } : s) });
  }

  const subDone = subtasks.filter(s => s.done).length;

  return (
    <div style={{
      padding: "10px 12px", borderRadius: 10,
      background: isDark ? "rgba(255,255,255,0.025)" : "rgba(0,0,0,0.025)",
      border: `1px solid ${BOR}`,
      borderLeft: `3px solid ${cat.color}`,
      marginBottom: 8, position: "relative",
      transition: "background .15s",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
        {/* State toggle */}
        <button onClick={() => {
          const next: TaskState = task.state === "done" ? "planned" : task.state === "planned" ? "in_progress" : task.state === "in_progress" ? "done" : "planned";
          onUpdate({ ...task, state: next });
        }}
          title={`${st.label} (клик для смены)`}
          style={{
            flexShrink: 0, width: 18, height: 18, borderRadius: 4,
            border: `1.5px solid ${st.color}`,
            background: task.state === "done" ? st.color : "transparent",
            cursor: "pointer", fontSize: 11, lineHeight: 1,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: task.state === "done" ? "white" : st.color, marginTop: 1,
          }}>
          {task.state === "done" ? "✓" : task.state === "in_progress" ? "◐" : task.state === "blocked" ? "⚠" : ""}
        </button>

        {/* Title (inline edit) */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {editingTitle ? (
            <input value={draftTitle} autoFocus
              onChange={e => setDraftTitle(e.target.value)}
              onBlur={() => { onUpdate({ ...task, title: draftTitle.trim() || task.title }); setEditingTitle(false); }}
              onKeyDown={e => {
                if (e.key === "Enter") { onUpdate({ ...task, title: draftTitle.trim() || task.title }); setEditingTitle(false); }
                if (e.key === "Escape") { setDraftTitle(task.title); setEditingTitle(false); }
              }}
              style={{
                width: "100%", fontSize: 13, padding: "4px 6px", borderRadius: 6,
                background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                color: TEXT, border: `1px solid ${BOR}`, outline: "none",
              }} />
          ) : (
            <div onClick={() => { setDraftTitle(task.title); setEditingTitle(true); }} style={{
              fontSize: 13, lineHeight: 1.45,
              color: task.state === "done" ? MUTED : TEXT,
              textDecoration: task.state === "done" ? "line-through" : "none",
              cursor: "text",
            }}>
              {task.title}
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
            <span style={{
              fontSize: 9, fontWeight: 700, letterSpacing: "0.06em",
              padding: "1px 6px", borderRadius: 4,
              background: cat.color + "20", color: cat.color, border: `1px solid ${cat.color}30`,
              textTransform: "uppercase",
            }}>{cat.label}</span>
            {task.isMilestone && (
              <span style={{
                fontSize: 9, fontWeight: 700, letterSpacing: "0.06em",
                padding: "1px 6px", borderRadius: 4, color: "#FF7A00",
                background: "rgba(255,122,0,0.10)", border: "1px solid rgba(255,122,0,0.25)",
                textTransform: "uppercase",
              }}>★ milestone</span>
            )}
            {task.due && (
              <span style={{ fontSize: 10, color: MUTED }}>до {task.due}</span>
            )}
            {subtasks.length > 0 && (
              <span style={{
                fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 4,
                background: subDone === subtasks.length ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.06)",
                color: subDone === subtasks.length ? "#22c55e" : MUTED,
                border: `1px solid ${subDone === subtasks.length ? "rgba(34,197,94,0.30)" : "rgba(255,255,255,0.10)"}`,
              }}>{subDone}/{subtasks.length}</span>
            )}
          </div>

          {/* Notes — click to edit, multi-line */}
          {editingNotes ? (
            <textarea value={draftNotes} autoFocus
              onChange={e => setDraftNotes(e.target.value)}
              onBlur={() => { onUpdate({ ...task, notes: draftNotes.trim() || undefined }); setEditingNotes(false); }}
              onKeyDown={e => {
                if (e.key === "Escape") { setDraftNotes(task.notes ?? ""); setEditingNotes(false); }
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  onUpdate({ ...task, notes: draftNotes.trim() || undefined }); setEditingNotes(false);
                }
              }}
              placeholder="Заметки. Cmd/Ctrl+Enter — сохранить."
              rows={3}
              style={{
                width: "100%", fontSize: 11, padding: "6px 8px", borderRadius: 6,
                background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                color: TEXT, border: `1px solid ${BOR}`, outline: "none",
                marginTop: 6, fontFamily: "inherit", lineHeight: 1.5, resize: "vertical",
              }} />
          ) : task.notes ? (
            <div onClick={() => { setDraftNotes(task.notes ?? ""); setEditingNotes(true); }} style={{
              fontSize: 11, color: MUTED, marginTop: 6, lineHeight: 1.4,
              cursor: "text", whiteSpace: "pre-wrap",
            }}>{task.notes}</div>
          ) : (
            <button onClick={() => { setDraftNotes(""); setEditingNotes(true); }}
              style={{
                marginTop: 6, fontSize: 10, color: MUTED, opacity: 0.6,
                background: "none", border: "none", padding: 0, cursor: "pointer",
                fontFamily: "inherit",
              }}>+ заметка</button>
          )}

          {/* Subtasks list */}
          {subtasks.length > 0 && (
            <div style={{ marginTop: 8, paddingLeft: 4 }}>
              {subtasks.map(s => (
                <SubtaskItem key={s.id} sub={s} onToggle={() => toggleSub(s.id)} onDelete={() => delSub(s.id)} onEdit={(t) => editSub(s.id, t)} />
              ))}
            </div>
          )}

          {/* Add subtask input */}
          <div style={{ display: "flex", gap: 6, marginTop: 6, alignItems: "center" }}>
            <input value={newSub} onChange={e => setNewSub(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") addSubtask(); }}
              placeholder="+ подзадача"
              style={{
                flex: 1, fontSize: 11, padding: "4px 8px", borderRadius: 6,
                background: "transparent", color: TEXT,
                border: `1px dashed ${BOR}`, outline: "none",
              }} />
            {newSub.trim() && (
              <button onClick={addSubtask}
                style={{
                  fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 6,
                  background: cat.color + "20", color: cat.color, border: `1px solid ${cat.color}40`,
                  cursor: "pointer",
                }}>↵</button>
            )}
          </div>
        </div>

        {/* Menu (···) */}
        <div style={{ position: "relative", flexShrink: 0 }}>
          <button onClick={() => setMenuOpen(o => !o)}
            style={{
              background: "none", border: "none", cursor: "pointer", color: MUTED,
              fontSize: 16, padding: "0 4px", lineHeight: 1, opacity: 0.6,
            }} title="Меню">⋯</button>
          {menuOpen && (
            <>
              <div onClick={() => setMenuOpen(false)} style={{
                position: "fixed", inset: 0, zIndex: 49,
              }} />
              <div style={{
                position: "absolute", top: "100%", right: 0,
                marginTop: 4, minWidth: 180, zIndex: 50,
                background: CARD, border: `1px solid ${BOR}`,
                borderRadius: 8, padding: 4, boxShadow: "0 8px 24px rgba(0,0,0,0.30)",
              }}>
                <div style={{ fontSize: 9, fontWeight: 700, padding: "4px 8px", color: MUTED, letterSpacing: "0.06em", textTransform: "uppercase" }}>Перенести в</div>
                {(["now","soon","ideas","notes"] as Bucket[]).filter(b => b !== task.bucket).map(b => (
                  <button key={b} onClick={() => moveTo(b)}
                    style={{
                      width: "100%", textAlign: "left", padding: "6px 8px",
                      fontSize: 12, color: TEXT, background: "none", border: "none",
                      borderRadius: 4, cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: BUCKET_META[b].color }} />
                    {BUCKET_META[b].label}
                  </button>
                ))}
                <div style={{ height: 1, background: BOR, margin: "4px 0" }} />
                <div style={{ fontSize: 9, fontWeight: 700, padding: "4px 8px", color: MUTED, letterSpacing: "0.06em", textTransform: "uppercase" }}>Категория</div>
                {(Object.keys(CAT_META) as Category[]).filter(c => c !== task.category).map(c => (
                  <button key={c} onClick={() => changeCategory(c)}
                    style={{
                      width: "100%", textAlign: "left", padding: "6px 8px",
                      fontSize: 12, color: TEXT, background: "none", border: "none",
                      borderRadius: 4, cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: CAT_META[c].color }} />
                    {CAT_META[c].label}
                  </button>
                ))}
                <div style={{ height: 1, background: BOR, margin: "4px 0" }} />
                <button onClick={() => { if (confirm("Удалить задачу?")) onDelete(task.id); setMenuOpen(false); }}
                  style={{
                    width: "100%", textAlign: "left", padding: "6px 8px",
                    fontSize: 12, color: "#ef4444", background: "none", border: "none",
                    borderRadius: 4, cursor: "pointer",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(239,68,68,0.10)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                  Удалить
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── SubtaskItem ──────────────────────────────────────────────────────────────
function SubtaskItem({ sub, onToggle, onDelete, onEdit }: {
  sub: SubTask;
  onToggle(): void;
  onDelete(): void;
  onEdit(text: string): void;
}) {
  const { TEXT, MUTED, BOR, isDark } = useTok();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(sub.text);

  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 6, padding: "2px 0" }}>
      <button onClick={onToggle}
        style={{
          flexShrink: 0, width: 14, height: 14, borderRadius: 3,
          border: `1.5px solid ${sub.done ? "#22c55e" : MUTED}`,
          background: sub.done ? "#22c55e" : "transparent",
          cursor: "pointer", fontSize: 9, lineHeight: 1, marginTop: 2,
          color: "white", display: "flex", alignItems: "center", justifyContent: "center",
        }}>
        {sub.done ? "✓" : ""}
      </button>
      {editing ? (
        <input value={draft} autoFocus
          onChange={e => setDraft(e.target.value)}
          onBlur={() => { if (draft.trim()) onEdit(draft.trim()); setEditing(false); }}
          onKeyDown={e => {
            if (e.key === "Enter") { if (draft.trim()) onEdit(draft.trim()); setEditing(false); }
            if (e.key === "Escape") { setDraft(sub.text); setEditing(false); }
          }}
          style={{
            flex: 1, fontSize: 11, padding: "1px 4px", borderRadius: 4,
            background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
            color: TEXT, border: `1px solid ${BOR}`, outline: "none",
          }} />
      ) : (
        <span onClick={() => { setDraft(sub.text); setEditing(true); }}
          style={{
            flex: 1, fontSize: 11, lineHeight: 1.4, cursor: "text",
            color: sub.done ? MUTED : TEXT,
            textDecoration: sub.done ? "line-through" : "none",
          }}>{sub.text}</span>
      )}
      <button onClick={onDelete}
        style={{
          flexShrink: 0, background: "none", border: "none", cursor: "pointer",
          color: MUTED, fontSize: 11, opacity: 0.4, padding: 0, lineHeight: 1,
        }} title="Удалить">×</button>
    </div>
  );
}

// ── BucketColumn ─────────────────────────────────────────────────────────────
function BucketColumn({ bucket, tasks, onAdd, onUpdate, onDelete }: {
  bucket: Bucket; tasks: RoadmapTaskV2[];
  onAdd(bucket: Bucket): void;
  onUpdate(t: RoadmapTaskV2): void;
  onDelete(id: string): void;
}) {
  const { CARD, BOR, TEXT, MUTED, isDark } = useTok();
  const meta = BUCKET_META[bucket];
  const inThis = tasks.filter(t => t.bucket === bucket);

  return (
    <div style={{
      padding: 16, background: CARD, borderRadius: 14,
      border: `1px solid ${BOR}`, minHeight: 200,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: meta.color, boxShadow: `0 0 6px ${meta.color}` }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: TEXT }}>{meta.label}</span>
          </div>
          <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>{meta.subtitle}</div>
        </div>
        <span style={{ fontSize: 11, fontWeight: 600, color: MUTED }}>{inThis.length}</span>
      </div>
      <div>
        {inThis.map(t => <TaskCard key={t.id} task={t} onUpdate={onUpdate} onDelete={onDelete} />)}
      </div>
      <button onClick={() => onAdd(bucket)}
        style={{
          width: "100%", padding: "8px", marginTop: 4,
          fontSize: 12, fontWeight: 600, color: meta.color,
          background: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)",
          border: `1px dashed ${meta.color}50`, borderRadius: 8, cursor: "pointer",
        }}>
        + Добавить задачу
      </button>
    </div>
  );
}

// ── Add modal (simple form) ──────────────────────────────────────────────────
function AddTaskModal({ initialBucket, onSubmit, onClose }: {
  initialBucket: Bucket;
  onSubmit(t: RoadmapTaskV2): void;
  onClose(): void;
}) {
  const { CARD, BOR, TEXT, MUTED, isDark } = useTok();
  const [title, setTitle] = useState("");
  const [bucket, setBucket] = useState<Bucket>(initialBucket);
  const [category, setCategory] = useState<Category>("tech");
  const [isMilestone, setIsMilestone] = useState(false);
  const [due, setDue] = useState("");
  const [notes, setNotes] = useState("");

  const submit = () => {
    if (!title.trim()) return;
    onSubmit({
      id: `t_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      title: title.trim(),
      bucket, category, state: "planned",
      isMilestone: isMilestone || undefined,
      due: due || undefined,
      notes: notes.trim() || undefined,
      createdAt: new Date().toISOString(),
    });
    onClose();
  };

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 1000, padding: 20,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: "100%", maxWidth: 520, background: CARD, borderRadius: 14,
        padding: 24, border: `1px solid ${BOR}`,
      }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: TEXT, marginBottom: 16 }}>
          Новая задача
        </div>
        <input autoFocus placeholder="Что нужно сделать?" value={title} onChange={e => setTitle(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) submit(); }}
          style={{
            width: "100%", padding: "10px 12px", fontSize: 14, borderRadius: 8,
            background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
            border: `1px solid ${BOR}`, color: TEXT, outline: "none", marginBottom: 12,
          }} />
        <textarea placeholder="Заметки (опционально)" value={notes} onChange={e => setNotes(e.target.value)} rows={2}
          style={{
            width: "100%", padding: "10px 12px", fontSize: 12, borderRadius: 8,
            background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
            border: `1px solid ${BOR}`, color: TEXT, outline: "none", marginBottom: 12, resize: "vertical",
          }} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: MUTED, marginBottom: 6 }}>Бакет</div>
            <select value={bucket} onChange={e => setBucket(e.target.value as Bucket)}
              style={{ width: "100%", padding: "8px 10px", fontSize: 13, borderRadius: 8, background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)", border: `1px solid ${BOR}`, color: TEXT }}>
              {(Object.keys(BUCKET_META) as Bucket[]).map(b => <option key={b} value={b}>{BUCKET_META[b].label}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: MUTED, marginBottom: 6 }}>Категория</div>
            <select value={category} onChange={e => setCategory(e.target.value as Category)}
              style={{ width: "100%", padding: "8px 10px", fontSize: 13, borderRadius: 8, background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)", border: `1px solid ${BOR}`, color: TEXT }}>
              {(Object.keys(CAT_META) as Category[]).map(c => <option key={c} value={c}>{CAT_META[c].label}</option>)}
            </select>
          </div>
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: TEXT, marginBottom: 12, cursor: "pointer" }}>
          <input type="checkbox" checked={isMilestone} onChange={e => setIsMilestone(e.target.checked)} />
          <span>★ Milestone (входит в прогресс к 1 июня)</span>
        </label>
        {isMilestone && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: MUTED, marginBottom: 6 }}>Дедлайн</div>
            <input type="date" value={due} onChange={e => setDue(e.target.value)} max={LAUNCH_DATE}
              style={{ width: "100%", padding: "8px 10px", fontSize: 13, borderRadius: 8, background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)", border: `1px solid ${BOR}`, color: TEXT }} />
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button onClick={onClose} style={{ padding: "8px 16px", fontSize: 13, fontWeight: 600, color: MUTED, background: "none", border: `1px solid ${BOR}`, borderRadius: 8, cursor: "pointer" }}>
            Отмена
          </button>
          <button onClick={submit} disabled={!title.trim()}
            style={{
              padding: "8px 16px", fontSize: 13, fontWeight: 700, color: "white",
              background: title.trim() ? "linear-gradient(135deg, #4561E8, #a78bfa)" : "rgba(127,127,127,0.4)",
              border: "none", borderRadius: 8, cursor: title.trim() ? "pointer" : "not-allowed",
              boxShadow: title.trim() ? "0 4px 16px rgba(69,97,232,0.35)" : "none",
            }}>
            Создать
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main exported tab ────────────────────────────────────────────────────────
export default function RoadmapV2Tab() {
  const [tasks, setTasks] = useState<RoadmapTaskV2[]>([]);
  const [addingFor, setAddingFor] = useState<Bucket | null>(null);
  const [filterCat, setFilterCat] = useState<Category | null>(null);

  useEffect(() => { setTasks(loadTasks()); }, []);

  const persist = (next: RoadmapTaskV2[], action: string = "save") => {
    setTasks(next);
    saveTasks(next);
    pushHistorySnapshot(action, next);
  };

  const update = (t: RoadmapTaskV2) => {
    const prev = tasks.find(x => x.id === t.id);
    let action = "edit";
    if (prev) {
      if (prev.bucket !== t.bucket) action = `move:${prev.bucket}→${t.bucket}`;
      else if (prev.state !== t.state) action = `state:${prev.state}→${t.state}`;
      else if (prev.category !== t.category) action = `category:${prev.category}→${t.category}`;
      else if (prev.title !== t.title) action = "edit:title";
      else if ((prev.notes ?? "") !== (t.notes ?? "")) action = "edit:notes";
      else if (JSON.stringify(prev.subtasks ?? []) !== JSON.stringify(t.subtasks ?? [])) action = "edit:subtasks";
    }
    persist(tasks.map(x => x.id === t.id ? t : x), action);
  };
  const remove = (id: string) => {
    const t = tasks.find(x => x.id === id);
    addDeletedIds([id]);  // ⚠ remember deletion so seed/legacy merge doesn't bring it back
    persist(tasks.filter(x => x.id !== id), `delete:${t?.title?.slice(0, 30) ?? id}`);
  };
  const add    = (t: RoadmapTaskV2) => {
    removeDeletedIds([t.id]);  // un-delete if user re-creates with same id
    persist([...tasks, t], `add:${t.title.slice(0, 30)}`);
  };

  const filtered = useMemo(() => filterCat ? tasks.filter(t => t.category === filterCat) : tasks, [tasks, filterCat]);

  return (
    <div>
      <LaunchTracker tasks={tasks} />

      {/* Top toolbar — backup / restore + filter */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12, alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <CategoryChip active={filterCat === null} label="Все" color="#94a3b8" onClick={() => setFilterCat(null)} count={tasks.length} />
          {(Object.keys(CAT_META) as Category[]).map(c => (
            <CategoryChip key={c}
              active={filterCat === c} label={CAT_META[c].label} color={CAT_META[c].color}
              count={tasks.filter(t => t.category === c).length}
              onClick={() => setFilterCat(filterCat === c ? null : c)} />
          ))}
        </div>
        <BackupTools tasks={tasks} onImport={(t) => persist(t, "import")} onRestore={(t) => persist(t, "restore-history")} />
      </div>

      {/* 4-bucket grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(Object.keys(BUCKET_META) as Bucket[]).map(b => (
          <BucketColumn key={b} bucket={b} tasks={filtered}
            onAdd={() => setAddingFor(b)} onUpdate={update} onDelete={remove} />
        ))}
      </div>

      {addingFor && (
        <AddTaskModal initialBucket={addingFor} onSubmit={add} onClose={() => setAddingFor(null)} />
      )}
    </div>
  );
}

// ── CategoryChip ─────────────────────────────────────────────────────────────
function CategoryChip({ active, label, color, count, onClick }: {
  active: boolean; label: string; color: string; count: number; onClick(): void;
}) {
  const { isDark } = useTok();
  return (
    <button onClick={onClick} style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "5px 12px", borderRadius: 99, fontSize: 12, fontWeight: 600,
      background: active ? `${color}20` : (isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)"),
      color: active ? color : (isDark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.55)"),
      border: `1px solid ${active ? color + "60" : "transparent"}`,
      cursor: "pointer", transition: "all .15s",
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: color }} />
      <span>{label}</span>
      <span style={{ opacity: 0.6, fontSize: 11 }}>{count}</span>
    </button>
  );
}

// ── BackupTools — Export/Import JSON + History snapshots ────────────────────
function BackupTools({ tasks, onImport, onRestore }: { tasks: RoadmapTaskV2[]; onImport: (t: RoadmapTaskV2[]) => void; onRestore: (t: RoadmapTaskV2[]) => void }) {
  const { isDark, MUTED, TEXT, BOR, CARD } = useTok();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  useEffect(() => {
    if (historyOpen) setHistory(loadHistory().slice().reverse()); // newest first
  }, [historyOpen]);

  function exportJson() {
    const blob = new Blob([JSON.stringify(tasks, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const today = new Date().toISOString().split("T")[0];
    a.href = url;
    a.download = `mentora-roadmap-${today}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = String(ev.target?.result ?? "");
        const parsed = JSON.parse(text) as RoadmapTaskV2[];
        if (!Array.isArray(parsed)) throw new Error("not an array");
        // Merge by id — incoming wins for matched ids
        const map = new Map<string, RoadmapTaskV2>();
        for (const t of tasks) map.set(t.id, t);
        for (const t of parsed) if (t && t.id) map.set(t.id, t);
        const merged = Array.from(map.values());
        if (confirm(`Импорт: ${parsed.length} задач из файла. Текущих: ${tasks.length}. После мержа: ${merged.length}. Продолжить?`)) {
          onImport(merged);
        }
      } catch (err) {
        alert("Ошибка импорта: " + String(err));
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const btnStyle: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", gap: 6,
    padding: "5px 12px", borderRadius: 99, fontSize: 12, fontWeight: 600,
    background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
    color: MUTED,
    border: "1px solid transparent",
    cursor: "pointer", transition: "all .15s",
  };

  return (
    <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
      <button onClick={exportJson}
        title="Скачать JSON-бэкап всех задач"
        style={btnStyle}
        onMouseEnter={e => (e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)")}
        onMouseLeave={e => (e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)")}>
        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
        </svg>
        Backup
      </button>
      <button onClick={() => fileInputRef.current?.click()}
        title="Восстановить из JSON-файла (мерж с текущими)"
        style={btnStyle}
        onMouseEnter={e => (e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)")}
        onMouseLeave={e => (e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)")}>
        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
        </svg>
        Restore
      </button>
      <button onClick={() => setHistoryOpen(true)}
        title="История изменений — снапшоты после каждого изменения"
        style={btnStyle}
        onMouseEnter={e => (e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)")}
        onMouseLeave={e => (e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)")}>
        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5M12 7v5l3 3"/>
        </svg>
        История
      </button>
      <input ref={fileInputRef} type="file" accept="application/json,.json" onChange={onPickFile} style={{ display: "none" }} />

      {/* History modal */}
      {historyOpen && (
        <div onClick={() => setHistoryOpen(false)} style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)",
          backdropFilter: "blur(4px)", zIndex: 100,
          display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            width: "100%", maxWidth: 520, maxHeight: "80vh",
            background: CARD, border: `1px solid ${BOR}`, borderRadius: 16,
            display: "flex", flexDirection: "column", overflow: "hidden",
            boxShadow: "0 20px 60px rgba(0,0,0,0.50)",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px", borderBottom: `1px solid ${BOR}` }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: TEXT }}>История изменений</div>
                <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>{history.length} {history.length === 1 ? "снапшот" : history.length < 5 ? "снапшота" : "снапшотов"} · хранится последние 100</div>
              </div>
              <button onClick={() => setHistoryOpen(false)} style={{
                width: 28, height: 28, borderRadius: 7,
                background: "transparent", border: `1px solid ${BOR}`,
                cursor: "pointer", color: MUTED,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "8px 4px" }}>
              {history.length === 0 ? (
                <div style={{ padding: 30, textAlign: "center", fontSize: 12, color: MUTED }}>
                  Пока пусто. Каждое изменение в роадмапе автоматически записывается сюда.
                </div>
              ) : history.map((h, i) => {
                const d = new Date(h.ts);
                const date = d.toLocaleDateString("ru-RU", { day: "2-digit", month: "short", year: "numeric" });
                const time = d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
                return (
                  <div key={h.ts + ":" + i} style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "10px 14px", borderRadius: 10, margin: "2px 8px",
                    background: "transparent", transition: "background .12s",
                  }}
                    onMouseEnter={e => (e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                    <div style={{
                      width: 6, height: 6, borderRadius: "50%",
                      background: h.action.startsWith("delete") ? "#ef4444" :
                                  h.action.startsWith("add") ? "#22c55e" :
                                  h.action.startsWith("move") ? "#a78bfa" :
                                  h.action.startsWith("state") ? "#FF7A00" :
                                  h.action.startsWith("import") ? "#0EA5E9" :
                                  h.action.startsWith("restore") ? "#0EA5E9" :
                                  "#6B8FFF",
                      flexShrink: 0,
                    }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: TEXT, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {h.action}
                      </div>
                      <div style={{ fontSize: 10, color: MUTED, marginTop: 1 }}>
                        {date} · {time} · {h.tasksSnapshot.length} задач
                      </div>
                    </div>
                    <button onClick={() => {
                      if (confirm(`Восстановить состояние от ${date} ${time}? Текущие данные будут заменены (но автоматически сохранятся в этой же истории).`)) {
                        onRestore(h.tasksSnapshot);
                        setHistoryOpen(false);
                      }
                    }}
                      style={{
                        flexShrink: 0, padding: "4px 10px", borderRadius: 6,
                        fontSize: 11, fontWeight: 600,
                        background: "rgba(69,97,232,0.15)", color: "#6B8FFF",
                        border: "1px solid rgba(69,97,232,0.30)",
                        cursor: "pointer",
                      }}>
                      Восстановить
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
