"use client";

import { useEffect, useMemo, useState } from "react";

// ── Types ────────────────────────────────────────────────────────────────────
export type Bucket = "now" | "soon" | "ideas" | "notes";
export type Category = "tech" | "marketing" | "design" | "content" | "product" | "ops";
export type TaskState = "planned" | "in_progress" | "done" | "blocked";

export interface RoadmapTaskV2 {
  id: string;
  title: string;
  notes?: string;
  bucket: Bucket;
  category: Category;
  state: TaskState;
  isMilestone?: boolean;
  due?: string;          // ISO date (only for milestones)
  createdAt: string;     // ISO
}

const STORAGE_KEY = "mentora_admin_roadmap_v5";
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
  // ═══ Milestones до 1 июня (учитываются в прогрессе) ═══
  { id: "ms_rag",           title: "RAG: индекс учебников ФГОС + публичные источники по 17 наукам",
    bucket: "now", category: "tech",      state: "in_progress", isMilestone: true, due: "2026-05-25",
    notes: "pgvector + Anthropic embeddings. Источники: lib.ru (литература), gramota.ru (рус.яз), элементы.ру (наука), arzamas.academy (гуманитарка), ПостНаука, ВикиЧтение",
    createdAt: new Date().toISOString() },
  { id: "ms_factcheck",     title: "Multi-agent fact-check (модель B проверяет факты A против RAG)",
    bucket: "now", category: "tech",      state: "planned",     isMilestone: true, due: "2026-05-28",
    createdAt: new Date().toISOString() },
  { id: "ms_benchmark",     title: "Тестовый набор 100 вопросов + замер точности до/после RAG",
    bucket: "now", category: "tech",      state: "planned",     isMilestone: true, due: "2026-05-29",
    notes: "10 вопросов на каждую из 10 ключевых наук. Метрики: фактическая точность, релевантность уровню",
    createdAt: new Date().toISOString() },
  { id: "ms_citations",     title: "Citation linking — клик по факту → параграф учебника",
    bucket: "now", category: "tech",      state: "planned",     isMilestone: true, due: "2026-05-30",
    createdAt: new Date().toISOString() },
  { id: "ms_marketing_kit", title: "Маркетинг-кит к запуску: тизер-видео + посты VK/TG/X + email рассылка",
    bucket: "now", category: "marketing", state: "planned",     isMilestone: true, due: "2026-05-30",
    createdAt: new Date().toISOString() },
  { id: "ms_gift",          title: "Подарок 1 июня — Pro месяц всем зарегистрированным до даты",
    bucket: "now", category: "product",   state: "done",        isMilestone: true, due: "2026-06-01",
    notes: "Реализовано в коде (см. Roadmap q8). Активация автоматическая",
    createdAt: new Date().toISOString() },
  { id: "ms_perf",          title: "Стресс-тест: 100+ одновременных пользователей на VPS",
    bucket: "soon", category: "tech",     state: "planned",     isMilestone: true, due: "2026-05-29",
    createdAt: new Date().toISOString() },
  { id: "ms_landing_pol",   title: "Финальная полировка лендинга: тексты, ритм, sticky-CTA",
    bucket: "soon", category: "design",   state: "planned",     isMilestone: true, due: "2026-05-31",
    createdAt: new Date().toISOString() },

  // ═══ Сейчас (этот спринт, не milestone) ═══
  { id: "now_sources_list", title: "Собрать список 5+ источников на каждую из 17 наук",
    bucket: "now", category: "content",   state: "planned",
    notes: "Литература → lib.ru/Imwerden; Биология → элементы.ру; Психология → PsyJournals; Философия → Stanford Encyclopedia; История → arzamas.academy",
    createdAt: new Date().toISOString() },
  { id: "now_test_email",   title: "Проверить email-доставку с VPS (resend или smtp.yandex)",
    bucket: "now", category: "ops",        state: "planned",
    createdAt: new Date().toISOString() },

  // ═══ Скоро ═══
  { id: "soon_b2b_landing", title: "B2B-лендинг: для школ, репетиторов, родителей",
    bucket: "soon", category: "marketing", state: "planned",
    createdAt: new Date().toISOString() },
  { id: "soon_voice",       title: "Голосовой ввод вопросов (Web Speech API)",
    bucket: "soon", category: "product",   state: "planned",
    createdAt: new Date().toISOString() },
  { id: "soon_confidence",  title: "Confidence scoring: «не знаю → проверь в учебнике X стр. Y»",
    bucket: "soon", category: "tech",      state: "planned",
    createdAt: new Date().toISOString() },
  { id: "soon_seasons",     title: "Сезоны и события: майский ивент, летний марафон знаний",
    bucket: "soon", category: "product",   state: "planned",
    createdAt: new Date().toISOString() },

  // ═══ Идеи ═══
  { id: "idea_ege",         title: "ЕГЭ/ОГЭ режим — реальные задания + трекер готовности",
    bucket: "ideas", category: "product",  state: "planned",
    createdAt: new Date().toISOString() },
  { id: "idea_mobile",      title: "Мобильное приложение (PWA → React Native)",
    bucket: "ideas", category: "tech",     state: "planned",
    createdAt: new Date().toISOString() },
  { id: "idea_school_part", title: "Партнёрства со школами: подписка на класс",
    bucket: "ideas", category: "marketing", state: "planned",
    createdAt: new Date().toISOString() },
  { id: "idea_referral_t",  title: "Реферальная программа для учителей: процент с каждого ученика",
    bucket: "ideas", category: "marketing", state: "planned",
    createdAt: new Date().toISOString() },
  { id: "idea_ai_tutor_g",  title: "Генерация ИИ-репетитора с уникальным голосом и стилем",
    bucket: "ideas", category: "product",  state: "planned",
    createdAt: new Date().toISOString() },

  // ═══ Заметки ═══
  { id: "note_whiteboard",  title: "Уайтборд 3 мая — не забыть сверить логику с фотографией",
    bucket: "notes", category: "ops",      state: "planned",
    createdAt: new Date().toISOString() },
  { id: "note_pricing",     title: "Подумать про годовой план — дискаунт ×2 или ×3 от месячного",
    bucket: "notes", category: "product",   state: "planned",
    createdAt: new Date().toISOString() },
  { id: "note_neuro",       title: "Раздел «База знаний» с нейронной анимацией — запустить при beta→verified",
    bucket: "notes", category: "design",   state: "planned",
    createdAt: new Date().toISOString() },
];

// ── Storage ──────────────────────────────────────────────────────────────────
function loadTasks(): RoadmapTaskV2[] {
  if (typeof window === "undefined") return SEED;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED));
      return SEED;
    }
    const parsed = JSON.parse(raw) as RoadmapTaskV2[];
    return Array.isArray(parsed) ? parsed : SEED;
  } catch { return SEED; }
}
function saveTasks(t: RoadmapTaskV2[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(t)); } catch {}
}

// ── Theme tokens (mirrored from admin/page.tsx, simplified) ──────────────────
function useTok() {
  const [isDark, setIsDark] = useState(true);
  useEffect(() => {
    const update = () => setIsDark(document.documentElement.classList.contains("dark") || !document.documentElement.classList.contains("light"));
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
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(task.title);
  const cat = CAT_META[task.category];
  const st  = STATE_META[task.state];

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
          {editing ? (
            <input value={draft} autoFocus
              onChange={e => setDraft(e.target.value)}
              onBlur={() => { onUpdate({ ...task, title: draft.trim() || task.title }); setEditing(false); }}
              onKeyDown={e => {
                if (e.key === "Enter") { onUpdate({ ...task, title: draft.trim() || task.title }); setEditing(false); }
                if (e.key === "Escape") { setDraft(task.title); setEditing(false); }
              }}
              style={{
                width: "100%", fontSize: 13, padding: "4px 6px", borderRadius: 6,
                background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                color: TEXT, border: `1px solid ${BOR}`, outline: "none",
              }} />
          ) : (
            <div onClick={() => setEditing(true)} style={{
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
          </div>

          {task.notes && (
            <div style={{ fontSize: 11, color: MUTED, marginTop: 6, lineHeight: 1.4 }}>
              {task.notes}
            </div>
          )}
        </div>

        {/* Delete */}
        <button onClick={() => { if (confirm("Удалить?")) onDelete(task.id); }}
          style={{
            flexShrink: 0, background: "none", border: "none", cursor: "pointer",
            color: MUTED, fontSize: 14, padding: 2, opacity: 0.5,
          }} title="Удалить">×</button>
      </div>
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

  const persist = (next: RoadmapTaskV2[]) => { setTasks(next); saveTasks(next); };

  const update = (t: RoadmapTaskV2) => persist(tasks.map(x => x.id === t.id ? t : x));
  const remove = (id: string) => persist(tasks.filter(x => x.id !== id));
  const add    = (t: RoadmapTaskV2) => persist([...tasks, t]);

  const filtered = useMemo(() => filterCat ? tasks.filter(t => t.category === filterCat) : tasks, [tasks, filterCat]);

  return (
    <div>
      <LaunchTracker tasks={tasks} />

      {/* Category filter row */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 18 }}>
        <CategoryChip active={filterCat === null} label="Все" color="#94a3b8" onClick={() => setFilterCat(null)} count={tasks.length} />
        {(Object.keys(CAT_META) as Category[]).map(c => (
          <CategoryChip key={c}
            active={filterCat === c} label={CAT_META[c].label} color={CAT_META[c].color}
            count={tasks.filter(t => t.category === c).length}
            onClick={() => setFilterCat(filterCat === c ? null : c)} />
        ))}
      </div>

      {/* 4-bucket grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
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
