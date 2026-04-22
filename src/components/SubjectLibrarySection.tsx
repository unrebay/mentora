"use client";
import MeLogo from "@/components/MeLogo";
import { useState, useTransition } from "react";
import Link from "next/link";
import AddSubjectModal from "@/components/AddSubjectModal";
import SubjectSuggestionModal from "@/components/SubjectSuggestionModal";
import SubjectIcon, { subjectColor } from "@/components/SubjectIcon";
import { removeUserSubject } from "@/app/dashboard/actions";

const XP_LEVELS = [
  { name: "Новичок",       minXP: 0,    maxXP: 100  },
  { name: "Исследователь", minXP: 100,  maxXP: 300  },
  { name: "Знаток",        minXP: 300,  maxXP: 600  },
  { name: "Историк",       minXP: 600,  maxXP: 1000 },
  { name: "Эксперт",       minXP: 1000, maxXP: Infinity },
];

function getLevel(xp: number) {
  const level = XP_LEVELS.slice().reverse().find((l) => xp >= l.minXP) ?? XP_LEVELS[0];
  const idx = XP_LEVELS.indexOf(level);
  const next = XP_LEVELS[idx + 1];
  const progress = next
    ? Math.min(100, Math.round(((xp - level.minXP) / (next.minXP - level.minXP)) * 100))
    : 100;
  return { ...level, idx, next, progress };
}

function pluralDays(n: number): string {
  const m10 = n % 10, m100 = n % 100;
  if (m100 >= 11 && m100 <= 14) return "дней";
  if (m10 === 1) return "день";
  if (m10 >= 2 && m10 <= 4) return "дня";
  return "дней";
}

function pluralMenty(n: number): string {
  const m10 = n % 10, m100 = n % 100;
  if (m100 >= 11 && m100 <= 14) return "мент";
  if (m10 === 1) return "мента";
  if (m10 >= 2 && m10 <= 4) return "менты";
  return "мент";
}

interface SubjectItem {
  id: string; title: string; description: string; emoji: string;
  available: boolean; verified?: boolean; beta?: boolean;
}
interface ProgressEntry {
  subject: string; xp_total: number; streak_days: number;
}
interface Props {
  userSubjects: SubjectItem[];
  existingSubjectIds: string[];
  userId: string;
  progressEntries: ProgressEntry[];
}

export default function SubjectLibrarySection({ userSubjects, existingSubjectIds, userId, progressEntries }: Props) {
  const [addOpen, setAddOpen] = useState(false);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(
    userSubjects.find(s => s.available && (s.beta || s.verified))?.id ?? null
  );
  const [confirmSubject, setConfirmSubject] = useState<SubjectItem | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const [, startRemoveTransition] = useTransition();

  const progressMap = new Map(progressEntries.map((p) => [p.subject, p]));

  function askRemove(e: React.MouseEvent, subject: SubjectItem) {
    e.stopPropagation();
    setConfirmSubject(subject);
  }

  function confirmRemove() {
    if (!confirmSubject) return;
    const id = confirmSubject.id;
    setConfirmSubject(null);
    setRemoving(id);
    startRemoveTransition(async () => {
      await removeUserSubject(id);
      setRemoving(null);
    });
  }

  return (
    <>
      {/* Section header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-bold tracking-[0.18em] uppercase" style={{ color: "var(--text-muted)" }}>
          Предметы
        </h2>
        <button
          onClick={() => setSuggestOpen(true)}
          className="flex items-center gap-1.5 text-xs font-semibold transition-all rounded-lg px-3 py-1.5"
          style={{
            background: "rgba(69,97,232,0.08)",
            color: "var(--brand)",
            border: "1px solid rgba(69,97,232,0.15)",
          }}
        >
          <span className="text-sm leading-none">+</span>
          Предложить предмет
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {userSubjects.map((subject) => {
          const progress = progressMap.get(subject.id);
          const isVerified = subject.verified;
          const isBeta = subject.beta && !isVerified;
          const isActive = subject.available && (isBeta || isVerified);
          const isSelected = subject.id === selectedId;
          const isRemoving = removing === subject.id;
          const lvl = getLevel(progress?.xp_total ?? 0);
          const xp = progress?.xp_total ?? 0;
          const color = subjectColor(subject.id);

          /* ── Coming soon card ─────────────────── */
          if (!isActive) {
            return (
              <div key={subject.id}
                className="relative rounded-2xl border overflow-hidden"
                style={{ background: "var(--bg-secondary)", borderColor: "var(--border)", opacity: 0.5 }}
              >
                <div className="p-5">
                  <span className="absolute top-3 right-3 text-[9px] font-bold px-1.5 py-0.5 rounded-md tracking-wide"
                    style={{ background: "var(--bg-card)", color: "var(--text-muted)" }}>
                    СКОРО
                  </span>
                  <div className="mb-3">
                    <SubjectIcon id={subject.id} size={36} style={{ filter: "grayscale(0.5) opacity(0.7)" }} />
                  </div>
                  <div className="font-semibold text-sm leading-snug" style={{ color: "var(--text-secondary)" }}>{subject.title}</div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{subject.description}</div>
                </div>
              </div>
            );
          }

          /* ── Verified card — premium gradient dark ─── */
          if (isVerified) {
            return (
              <div key={subject.id}
                data-tilt data-tilt-strength="5"
                className="relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 group"
                style={{
                  background: `linear-gradient(145deg, ${color}ee, ${color}99 60%, ${color}cc)`,
                  opacity: isRemoving ? 0.4 : 1,
                  boxShadow: isSelected
                    ? `0 0 0 2px white, 0 8px 32px ${color}50`
                    : `0 4px 20px ${color}30`,
                }}
                onClick={() => setSelectedId(id => id === subject.id ? null : subject.id)}
              >
                {/* Depth overlay */}
                <div className="absolute inset-0 pointer-events-none"
                  style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 50%, rgba(0,0,0,0.1) 100%)" }} />
                {/* Grain */}
                <div className="absolute inset-0 pointer-events-none"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)'/%3E%3C/svg%3E")`,
                    opacity: 0.04, mixBlendMode: "overlay",
                  }}
                />

                {/* Remove button */}
                <button
                  onClick={(e) => askRemove(e, subject)}
                  disabled={isRemoving}
                  aria-label="Удалить предмет"
                  className="absolute -top-2.5 -left-2.5 z-20 w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150 disabled:cursor-not-allowed"
                  style={{ background: "rgba(0,0,0,0.35)", color: "rgba(255,255,255,0.9)" }}
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>

                <div className="relative z-10 p-5">
                  <div className="absolute top-3 right-3 group/badge" onClick={e => e.stopPropagation()}>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md cursor-default"
                      style={{ background: "rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.9)" }}>
                      ✶ verified
                    </span>
                    <div className="absolute right-0 top-full mt-1.5 w-44 pointer-events-none opacity-0 group-hover/badge:opacity-100 transition-opacity duration-200 z-30">
                      <div className="rounded-xl px-3 py-2.5 shadow-xl border"
                        style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
                        <p className="text-[11px] font-semibold mb-0.5" style={{ color: "var(--text)" }}>✶ Verified</p>
                        <p className="text-[10px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
                          Полный курс с базой знаний и регулярными обновлениями
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <SubjectIcon id={subject.id} size={38} light
                      style={{ background: "rgba(255,255,255,0.2)", boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }} />
                  </div>
                  <div className="font-semibold text-sm text-white leading-snug mb-0.5">{subject.title}</div>
                  <div className="text-xs text-white/65">{subject.description}</div>

                  <div className="mt-3 pt-3 border-t border-white/20">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-semibold text-white/65">{lvl.name}</span>
                      {xp > 0 && (
                        <span className="text-[10px] font-bold text-white">
                          <MeLogo height={11} variant="white" style={{ marginRight: 1 }} />{xp} {pluralMenty(xp)}
                        </span>
                      )}
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden mb-2.5" style={{ background: "rgba(255,255,255,0.2)" }}>
                      <div className="h-full rounded-full" style={{ width: `${lvl.progress}%`, background: "rgba(255,255,255,0.65)" }} />
                    </div>
                    {(progress?.streak_days ?? 0) > 0 && (
                      <div className="flex items-center gap-1 text-[10px] font-medium text-white/75 mb-2">
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none">
                          <path d="M12 2C12 2 7 7 7 12c0 2.761 2.239 5 5 5s5-2.239 5-5c0-1.5-.5-2.5-1-3.5 0 0 0 2-2 2.5C15.5 9 14 7 12 2z" fill="currentColor" />
                        </svg>
                        {progress!.streak_days} {pluralDays(progress!.streak_days)} подряд
                      </div>
                    )}
                    <Link href={`/learn/${subject.id}`}
                      onClick={e => e.stopPropagation()}
                      className="inline-flex text-xs font-semibold text-white/90 hover:text-white transition-colors">
                      {xp > 0 ? "Продолжить →" : "Начать →"}
                    </Link>
                  </div>
                </div>
              </div>
            );
          }

          /* ── Beta / active card ───────────────── */
          return (
            <div key={subject.id}
              data-tilt data-tilt-strength="5"
              className="relative rounded-2xl border overflow-hidden cursor-pointer transition-all duration-200 group"
              style={{
                background: "var(--bg-card)",
                opacity: isRemoving ? 0.4 : 1,
                borderColor: isSelected ? color : "var(--border)",
                boxShadow: isSelected ? `0 0 0 1px ${color}, 0 4px 20px ${color}25` : "none",
              }}
              onClick={() => setSelectedId(id => id === subject.id ? null : subject.id)}
            >
              {/* Subject-color top accent */}
              <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl"
                style={{ background: `linear-gradient(90deg, ${color}, ${color}44)` }} />

              {/* Hover glow overlay */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl"
                style={{ background: `radial-gradient(ellipse at 30% 0%, ${color}10 0%, transparent 60%)` }} />

              {/* Remove button */}
              <button
                onClick={(e) => askRemove(e, subject)}
                disabled={isRemoving}
                aria-label="Удалить предмет"
                className="absolute -top-2.5 -left-2.5 z-20 w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150 disabled:cursor-not-allowed"
                style={{ background: "rgba(0,0,0,0.10)", color: "var(--text-secondary)" }}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>

              <div className="relative z-10 p-5">
                <div className="absolute top-4 right-3 group/badge" onClick={e => e.stopPropagation()}>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md cursor-default"
                    style={{ background: `${color}18`, color }}>
                    ✶ beta
                  </span>
                  <div className="absolute right-0 top-full mt-1.5 w-44 pointer-events-none opacity-0 group-hover/badge:opacity-100 transition-opacity duration-200 z-30">
                    <div className="rounded-xl px-3 py-2.5 shadow-xl border"
                      style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
                      <p className="text-[11px] font-semibold mb-0.5" style={{ color: "var(--text)" }}>✶ Beta</p>
                      <p className="text-[10px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
                        Предмет в разработке — контент активно пополняется
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mb-3 mt-1">
                  <SubjectIcon id={subject.id} size={38} />
                </div>
                <div className="font-semibold text-sm leading-snug mb-0.5" style={{ color: "var(--text)" }}>{subject.title}</div>
                <div className="text-xs" style={{ color: "var(--text-muted)" }}>{subject.description}</div>

                <div className="mt-3 pt-3 border-t" style={{ borderColor: "var(--border)" }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-semibold" style={{ color: "var(--text-muted)" }}>{lvl.name}</span>
                    {xp > 0 && (
                      <span className="text-[10px] font-bold" style={{ color }}>
                        <MeLogo height={11} colorM={color} colorE={color} style={{ marginRight: 1 }} />{xp} {pluralMenty(xp)}
                      </span>
                    )}
                  </div>
                  {/* Gradient XP bar */}
                  <div className="h-1.5 rounded-full overflow-hidden mb-2.5" style={{ background: "var(--bg-secondary)" }}>
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${lvl.progress}%`, background: `linear-gradient(90deg, ${color}cc, ${color})` }} />
                  </div>
                  {(progress?.streak_days ?? 0) > 0 && (
                    <div className="flex items-center gap-1 text-[10px] font-medium mb-2" style={{ color: "#FF7A00" }}>
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none">
                        <path d="M12 2C12 2 7 7 7 12c0 2.761 2.239 5 5 5s5-2.239 5-5c0-1.5-.5-2.5-1-3.5 0 0 0 2-2 2.5C15.5 9 14 7 12 2z" fill="currentColor" />
                      </svg>
                      {progress!.streak_days} {pluralDays(progress!.streak_days)} подряд
                    </div>
                  )}
                  <Link href={`/learn/${subject.id}`}
                    onClick={e => e.stopPropagation()}
                    className="inline-flex text-xs font-semibold transition-colors hover:opacity-80"
                    style={{ color }}>
                    {xp > 0 ? "Продолжить →" : "Начать →"}
                  </Link>
                </div>
              </div>
            </div>
          );
        })}

        {/* Add subject button */}
        <button
          onClick={() => setAddOpen(true)}
          className="relative rounded-2xl border-dashed border-2 flex flex-col items-center justify-center p-5 min-h-[160px] gap-2.5 transition-all duration-200 group"
          style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(69,97,232,0.5)";
            (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 20px rgba(69,97,232,0.08)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)";
            (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
          }}
        >
          <div className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200"
            style={{ background: "var(--bg-secondary)" }}>
            <span className="text-xl font-light" style={{ color: "var(--text-muted)" }}>+</span>
          </div>
          <span className="text-xs font-semibold text-center" style={{ color: "var(--text-muted)" }}>
            Добавить предмет
          </span>
        </button>
      </div>

      {/* ── Confirm remove dialog ─────────────────────────────── */}
      {confirmSubject && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
          onClick={() => setConfirmSubject(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border shadow-xl p-6"
            style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <SubjectIcon id={confirmSubject.id} size={40} />
              <div>
                <p className="font-bold text-sm" style={{ color: "var(--text)" }}>Удалить предмет?</p>
                <p className="text-xs mt-0.5 font-medium" style={{ color: subjectColor(confirmSubject.id) }}>{confirmSubject.title}</p>
              </div>
            </div>
            <p className="text-sm leading-relaxed mb-5" style={{ color: "var(--text-secondary)" }}>
              Предмет будет убран из твоей библиотеки. Позже ты сможешь добавить его обратно — весь прогресс сохранится.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmSubject(null)}
                className="flex-1 py-2 rounded-xl text-sm font-semibold transition-colors"
                style={{ background: "var(--bg-secondary)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}
              >
                Отмена
              </button>
              <button
                onClick={confirmRemove}
                className="flex-1 py-2 rounded-xl text-sm font-semibold transition-colors"
                style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}

      <AddSubjectModal open={addOpen} onClose={() => setAddOpen(false)} existingSubjectIds={existingSubjectIds} />
      <SubjectSuggestionModal open={suggestOpen} onClose={() => setSuggestOpen(false)} userId={userId} />
    </>
  );
}
