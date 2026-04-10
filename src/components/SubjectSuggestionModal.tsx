"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  open: boolean;
  onClose: () => void;
  userId?: string;
}

export default function SubjectSuggestionModal({ open, onClose, userId }: Props) {
  const [name, setName] = useState("");
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setStatus("loading");
    try {
      const supabase = createClient();
      const { error } = await supabase.from("subject_suggestions").insert({
        subject_name: name.trim(),
        comment: comment.trim() || null,
        user_id: userId ?? null,
      });
      if (error) throw error;
      setStatus("success");
      setTimeout(() => { onClose(); setName(""); setComment(""); setStatus("idle"); }, 1800);
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-md rounded-2xl border p-6 shadow-xl"
        style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
      >
        {status === "success" ? (
          <div className="text-center py-6">
            <div className="text-4xl mb-3">✅</div>
            <p className="font-semibold text-[var(--text)]">Отправлено, спасибо!</p>
            <p className="text-sm text-[var(--text-secondary)] mt-1">Мы рассмотрим предложение.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="flex items-start justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-[var(--text)]">Предложить предмет</h2>
                <p className="text-sm text-[var(--text-secondary)] mt-0.5">
                  Расскажи, какой предмет добавить в Mentora
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="text-[var(--text-muted)] hover:text-[var(--text)] transition-colors text-xl leading-none mt-0.5"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text)] mb-1.5">
                  Название предмета <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Например: Обществознание, Английский..."
                  required
                  maxLength={80}
                  className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all"
                  style={{
                    background: "var(--bg-secondary)",
                    borderColor: "var(--border)",
                    color: "var(--text)",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "var(--brand)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text)] mb-1.5">
                  Комментарий{" "}
                  <span className="text-[var(--text-muted)] font-normal">(необязательно)</span>
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Зачем нужен этот предмет, для какого класса или цели..."
                  rows={3}
                  maxLength={500}
                  className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all resize-none"
                  style={{
                    background: "var(--bg-secondary)",
                    borderColor: "var(--border)",
                    color: "var(--text)",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "var(--brand)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 rounded-xl border text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors"
                style={{ borderColor: "var(--border)" }}
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={!name.trim() || status === "loading"}
                className="flex-1 px-4 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {status === "loading" ? "Отправка..." : status === "error" ? "Ошибка, повторить" : "Отправить →"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
