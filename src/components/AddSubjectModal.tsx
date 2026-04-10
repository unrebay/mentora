"use client";
import { useState, useTransition } from "react";
import { SUBJECTS } from "@/lib/types";
import { addUserSubject } from "@/app/dashboard/actions";

interface Props {
  open: boolean;
  onClose: () => void;
  existingSubjectIds: string[];
}

export default function AddSubjectModal({ open, onClose, existingSubjectIds }: Props) {
  const [pending, startTransition] = useTransition();
  const [adding, setAdding] = useState<string | null>(null);

  if (!open) return null;

  const available = SUBJECTS.filter((s) => s.available && !existingSubjectIds.includes(s.id));
  const unavailable = SUBJECTS.filter((s) => !s.available);

  function handleAdd(subjectId: string) {
    setAdding(subjectId);
    startTransition(async () => {
      await addUserSubject(subjectId);
      setAdding(null);
      onClose();
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-lg rounded-2xl border shadow-xl overflow-hidden"
        style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b"
          style={{ borderColor: "var(--border)" }}>
          <div>
            <h2 className="text-lg font-bold text-[var(--text)]">Добавить предмет</h2>
            <p className="text-sm text-[var(--text-secondary)] mt-0.5">Выбери из каталога Mentora</p>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--text-muted)] hover:text-[var(--text)] transition-colors text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Subject list */}
        <div className="p-4 max-h-[60vh] overflow-y-auto space-y-2">
          {available.length === 0 && (
            <p className="text-center text-sm text-[var(--text-muted)] py-6">
              Все доступные предметы уже добавлены 🎉
            </p>
          )}

          {available.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between p-3.5 rounded-xl border transition-colors"
              style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{s.emoji}</span>
                <div>
                  <div className="font-medium text-sm text-[var(--text)]">{s.title}</div>
                  <div className="text-xs text-[var(--text-muted)]">{s.description}</div>
                </div>
                {s.verified && (
                  <span className="text-[10px] font-bold bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 px-1.5 py-0.5 rounded-md">
                    VERIFIED
                  </span>
                )}
                {s.beta && !s.verified && (
                  <span className="text-[10px] font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded-md">
                    BETA
                  </span>
                )}
              </div>
              <button
                onClick={() => handleAdd(s.id)}
                disabled={pending && adding === s.id}
                className="px-4 py-1.5 bg-brand-600 text-white text-xs font-medium rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-60 shrink-0"
              >
                {pending && adding === s.id ? "..." : "Добавить"}
              </button>
            </div>
          ))}

          {unavailable.length > 0 && (
            <>
              <div className="pt-2 pb-1">
                <span className="text-[10px] font-semibold text-[var(--text-muted)] tracking-widest uppercase">
                  Скоро
                </span>
              </div>
              {unavailable.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center gap-3 p-3.5 rounded-xl border opacity-50"
                  style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}
                >
                  <span className="text-2xl">{s.emoji}</span>
                  <div>
                    <div className="font-medium text-sm text-[var(--text)]">{s.title}</div>
                    <div className="text-xs text-[var(--text-muted)]">{s.description}</div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
