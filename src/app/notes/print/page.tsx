"use client";
import { useEffect, useState } from "react";

interface Notes {
  title: string;
  summary: string;
  keyPoints: string[];
  terms: { term: string; definition: string }[];
  practiceQuestion: string;
}

export default function PrintNotesPage() {
  const [notes, setNotes] = useState<Notes | null>(null);
  const [subjectTitle, setSubjectTitle] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("mentora_print_notes");
      if (!raw) { setError(true); return; }
      const data = JSON.parse(raw);
      setNotes(data.notes);
      setSubjectTitle(data.subjectTitle ?? "");
      localStorage.removeItem("mentora_print_notes");
      // Auto-print after render
      setTimeout(() => window.print(), 600);
    } catch {
      setError(true);
    }
  }, []);

  if (error) return (
    <div className="p-10 text-center text-gray-500">
      <p>Не удалось загрузить конспект. Закройте эту вкладку и попробуйте снова.</p>
    </div>
  );

  if (!notes) return (
    <div className="p-10 text-center text-gray-400">Загружаю конспект...</div>
  );

  const today = new Date().toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });

  return (
    <>
      <style>{`
        @media print {
          @page { margin: 20mm 18mm; size: A4; }
          .no-print { display: none !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
        body { font-family: 'Segoe UI', system-ui, sans-serif; background: #fff; color: #111827; margin: 0; }
      `}</style>

      {/* Print button — hidden when printing */}
      <div className="no-print fixed top-4 right-4 flex gap-2 z-50">
        <button onClick={() => window.print()}
          style={{ background: "#4561E8", color: "#fff", border: "none", borderRadius: 12, padding: "10px 20px", fontWeight: 600, cursor: "pointer", fontSize: 14 }}>
          Сохранить PDF
        </button>
        <button onClick={() => window.close()}
          style={{ background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 12, padding: "10px 16px", fontWeight: 500, cursor: "pointer", fontSize: 14 }}>
          Закрыть
        </button>
      </div>

      {/* Page content */}
      <div style={{ maxWidth: 700, margin: "0 auto", padding: "40px 32px 60px" }}>

        {/* Header */}
        <div style={{ borderBottom: "2px solid #4561E8", paddingBottom: 16, marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#4561E8" }} />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: "#4561E8", textTransform: "uppercase" }}>
              Mentora · Учебный конспект
            </span>
          </div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: "#111827", lineHeight: 1.2 }}>
            {notes.title}
          </h1>
          <p style={{ margin: "6px 0 0", fontSize: 12, color: "#9ca3af" }}>
            {subjectTitle} · {today}
          </p>
        </div>

        {/* Summary */}
        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: "#4561E8", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 10px" }}>
            Краткое резюме
          </h2>
          <p style={{ fontSize: 15, lineHeight: 1.7, color: "#374151", margin: 0 }}>{notes.summary}</p>
        </section>

        {/* Key points */}
        <section style={{ marginBottom: 28, background: "#f8faff", borderRadius: 12, padding: "18px 20px", border: "1px solid #e0e7ff" }}>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: "#4561E8", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 12px" }}>
            Ключевые факты
          </h2>
          <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
            {notes.keyPoints.map((point, i) => (
              <li key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: i < notes.keyPoints.length - 1 ? 8 : 0 }}>
                <span style={{ flexShrink: 0, marginTop: 5, width: 7, height: 7, borderRadius: "50%", background: "#4561E8", display: "inline-block" }} />
                <span style={{ fontSize: 14, lineHeight: 1.55, color: "#374151" }}>{point}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Terms */}
        {notes.terms?.length > 0 && (
          <section style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: "#4561E8", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 12px" }}>
              Ключевые термины
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {notes.terms.map((t, i) => (
                <div key={i} style={{ display: "flex", gap: 12, padding: "10px 14px", borderRadius: 8, background: "#f9fafb", border: "1px solid #e5e7eb" }}>
                  <span style={{ fontWeight: 700, fontSize: 14, color: "#111827", flexShrink: 0, minWidth: 120 }}>{t.term}</span>
                  <span style={{ fontSize: 14, color: "#4b5563", lineHeight: 1.5 }}>{t.definition}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Practice question */}
        {notes.practiceQuestion && (
          <section style={{ background: "#f0f9ff", borderRadius: 12, padding: "16px 20px", border: "1px solid #bae6fd" }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: "#0369a1", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 8px" }}>
              Вопрос для самопроверки
            </h2>
            <p style={{ fontSize: 14, color: "#075985", margin: 0, lineHeight: 1.6 }}>{notes.practiceQuestion}</p>
            {/* Answer space */}
            <div style={{ marginTop: 16, borderTop: "1px dashed #7dd3fc", paddingTop: 12 }}>
              <p style={{ fontSize: 11, color: "#94a3b8", margin: "0 0 24px" }}>Ответ:</p>
              <div style={{ borderBottom: "1px solid #e2e8f0", marginBottom: 8 }} />
              <div style={{ borderBottom: "1px solid #e2e8f0", marginBottom: 8 }} />
              <div style={{ borderBottom: "1px solid #e2e8f0" }} />
            </div>
          </section>
        )}

        {/* Footer */}
        <div style={{ marginTop: 40, paddingTop: 16, borderTop: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 11, color: "#9ca3af" }}>mentora.su — AI-ментор</span>
          <span style={{ fontSize: 11, color: "#d1d5db" }}>Ultra</span>
        </div>
      </div>
    </>
  );
}
