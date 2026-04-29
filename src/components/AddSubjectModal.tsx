"use client";
import { useState, useTransition } from "react";
import { SUBJECTS } from "@/lib/types";
import { addUserSubject } from "@/app/dashboard/actions";
import SubjectIcon, { subjectColor } from "@/components/SubjectIcon";
import { useTranslations } from "next-intl";

interface Props {
  open: boolean;
  onClose: () => void;
  existingSubjectIds: string[];
}

export default function AddSubjectModal({ open, onClose, existingSubjectIds }: Props) {
  const t = useTranslations("addSubjectModal");
  const [pending, startTransition] = useTransition();
  const [adding, setAdding] = useState<string | null>(null);

  if (!open) return null;

  const available = SUBJECTS.filter((s) => s.available && !existingSubjectIds.includes(s.id));

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
        className="w-full max-w-2xl rounded-2xl border shadow-xl overflow-hidden"
        style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b"
          style={{ borderColor: "var(--border)" }}>
          <div>
            <h2 className="text-lg font-bold" style={{ color: "var(--text)" }}>{t("title")}</h2>
            <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>{t("subtitle")}</p>
          </div>
          <button
            onClick={onClose}
            className="text-2xl leading-none transition-colors"
            style={{ color: "var(--text-muted)" }}
          >
            ×
          </button>
        </div>

        {/* Subject tile grid */}
        <div className="p-4 max-h-[65vh] overflow-y-auto">
          {available.length === 0 ? (
            <p className="text-center text-sm py-8" style={{ color: "var(--text-muted)" }}>
              {t("allAdded")}
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {available.map((s) => {
                const color = subjectColor(s.id);
                const isAdding = pending && adding === s.id;
                return (
                  <div
                    key={s.id}
                    className="relative rounded-2xl border overflow-hidden flex flex-col"
                    style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}
                  >
                    {/* Color accent bar */}
                    <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl"
                      style={{ background: `linear-gradient(90deg, ${color}, ${color}44)` }} />

                    <div className="p-4 flex flex-col flex-1 pt-5">
                      {/* Icon + badge row */}
                      <div className="flex items-start justify-between mb-3">
                        <SubjectIcon id={s.id} size={40} />
                        {s.verified && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md"
                            style={{ background: "rgba(69,97,232,0.1)", color: "#4561E8" }}>
                            ✶ verified
                          </span>
                        )}
                        {s.beta && !s.verified && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md"
                            style={{ background: `${color}18`, color }}>
                            ✶ beta
                          </span>
                        )}
                      </div>

                      <div className="font-semibold text-sm leading-snug mb-0.5" style={{ color: "var(--text)" }}>
                        {s.title}
                      </div>
                      <div className="text-xs flex-1 mb-3" style={{ color: "var(--text-muted)" }}>
                        {s.description}
                      </div>

                      <button
                        onClick={() => handleAdd(s.id)}
                        disabled={isAdding}
                        className="w-full py-1.5 rounded-xl text-xs font-semibold transition-all disabled:opacity-60"
                        style={{
                          background: isAdding ? `${color}22` : `${color}15`,
                          color,
                          border: `1px solid ${color}30`,
                        }}
                      >
                        {isAdding ? t("adding") : t("add")}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
