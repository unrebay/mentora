"use client";
import { useState } from "react";
import Link from "next/link";
import AddSubjectModal from "@/components/AddSubjectModal";
import SubjectSuggestionModal from "@/components/SubjectSuggestionModal";

const XP_LEVELS = [
  { name: "Новичок", minXP: 0, maxXP: 100, color: "bg-gray-400" },
  { name: "Исследователь", minXP: 100, maxXP: 300, color: "bg-blue-500" },
  { name: "Знаток", minXP: 300, maxXP: 600, color: "bg-brand-500" },
  { name: "Историк", minXP: 600, maxXP: 1000, color: "bg-purple-500" },
  { name: "Эксперт", minXP: 1000, maxXP: Infinity, color: "bg-amber-500" },
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

const MentoraE = () => (
  <span style={{ fontFamily: "var(--font-playfair), Georgia, serif", color: "#4561E8", fontStyle: "italic", fontWeight: 700, fontSize: "1.2em", lineHeight: 1, display: "inline-block", verticalAlign: "-0.08em", marginRight: "0.1em" }}>е</span>
);

interface SubjectItem {
  id: string;
  title: string;
  description: string;
  emoji: string;
  available: boolean;
  verified?: boolean;
  beta?: boolean;
}

interface ProgressEntry {
  subject: string;
  xp_total: number;
  streak_days: number;
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

  const progressMap = new Map(progressEntries.map((p) => [p.subject, p]));

  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-widest">
          Предметы
        </h2>
        <button
          onClick={() => setSuggestOpen(true)}
          className="flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 transition-colors px-3 py-1.5 rounded-lg"
        >
          <span className="text-base leading-none">+</span>
          Предложить предмет
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {userSubjects.map((subject) => {
          const progress = progressMap.get(subject.id);
          const isVerified = subject.verified;
          const isBeta = subject.beta && !isVerified;
          const isActive = subject.available && (isBeta || isVerified);

          return (
            <div
              key={subject.id}
              className={`relative rounded-2xl border transition-all overflow-hidden ${
                isVerified
                  ? "border-[#4561E8] hover:shadow-lg cursor-pointer"
                  : isActive
                  ? "border-[var(--border)] hover:border-brand-300 hover:shadow-md cursor-pointer"
                  : "bg-[var(--bg-secondary)] border-[var(--border)] opacity-60"
              }`}
              style={isVerified ? { background: "#4561E8" } : { background: "var(--bg-card)" }}
            >
              {isActive ? (
                <Link href={`/learn/${subject.id}`} className="block p-5">
                  {isVerified ? (
                    <span className="absolute top-3 right-3 text-[10px] font-bold bg-white/25 text-white px-1.5 py-0.5 rounded-md">
                      ✶ verified
                    </span>
                  ) : (
                    <span className="absolute top-3 right-3 text-[10px] font-bold bg-brand-50 text-brand-600 px-1.5 py-0.5 rounded-md">
                      ✶ beta
                    </span>
                  )}
                  <div className="text-3xl mb-3">{subject.emoji}</div>
                  <div className={`font-semibold text-sm mb-0.5 ${isVerified ? "text-white" : "text-[var(--text)]"}`}>
                    {subject.title}
                  </div>
                  <div className={`text-xs ${isVerified ? "text-white/70" : "text-[var(--text-muted)]"}`}>
                    {subject.description}
                  </div>
                  {progress ? (
                    (() => {
                      const lvl = getLevel(progress.xp_total ?? 0);
                      const xp = progress.xp_total ?? 0;
                      return (
                        <div className={`mt-3 pt-3 border-t ${isVerified ? "border-white/20" : "border-[var(--border)]"}`}>
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-[10px] font-semibold ${isVerified ? "text-white/70" : "text-[var(--text-muted)]"}`}>
                              {lvl.name}
                            </span>
                            <span className={`text-[10px] font-semibold ${isVerified ? "text-white" : "text-brand-600"}`}>
                              <MentoraE />{xp} {pluralMenty(xp)}
                            </span>
                          </div>
                          <div className={`h-1.5 rounded-full overflow-hidden ${isVerified ? "bg-white/20" : "bg-[var(--bg-secondary)]"}`}>
                            <div
                              className={`h-full rounded-full transition-all ${isVerified ? "bg-white/60" : lvl.color}`}
                              style={{ width: `${lvl.progress}%` }}
                            />
                          </div>
                          {progress.streak_days > 0 && (
                            <div className={`mt-1.5 text-[10px] font-medium ${isVerified ? "text-white/80" : "text-orange-500"}`}>
                              🔥 {progress.streak_days} {pluralDays(progress.streak_days ?? 0)} подряд
                            </div>
                          )}
                        </div>
                      );
                    })()
                  ) : (
                    <div className="mt-3">
                      <span className={`text-xs font-medium ${isVerified ? "text-white" : "text-brand-600"}`}>
                        Начать →
                      </span>
                    </div>
                  )}
                </Link>
              ) : (
                <div className="block p-5">
                  <span className="absolute top-3 right-3 text-[10px] font-medium bg-[var(--bg-secondary)] text-[var(--text-muted)] px-1.5 py-0.5 rounded-md">
                    СКОРО
                  </span>
                  <div className="text-3xl mb-3">{subject.emoji}</div>
                  <div className="font-semibold text-sm text-[var(--text-secondary)] mb-0.5">
                    {subject.title}
                  </div>
                  <div className="text-xs text-[var(--text-muted)]">{subject.description}</div>
                </div>
              )}
            </div>
          );
        })}

        <button
          onClick={() => setAddOpen(true)}
          className="relative rounded-2xl border-2 border-dashed border-[var(--border)] hover:border-brand-300 hover:bg-brand-50 transition-all cursor-pointer flex flex-col items-center justify-center p-5 min-h-[140px] gap-2 group"
          style={{ background: "var(--bg-card)" }}
        >
          <div className="w-10 h-10 rounded-full bg-[var(--bg-secondary)] group-hover:bg-brand-100 flex items-center justify-center transition-colors">
            <span className="text-2xl text-[var(--text-muted)] group-hover:text-brand-500 leading-none">+</span>
          </div>
          <span className="text-xs font-medium text-[var(--text-muted)] group-hover:text-brand-600 text-center transition-colors">
            Добавить предмет
          </span>
        </button>
      </div>

      <AddSubjectModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        existingSubjectIds={existingSubjectIds}
      />
      <SubjectSuggestionModal
        open={suggestOpen}
        onClose={() => setSuggestOpen(false)}
        userId={userId}
      />
    </>
  );
}
