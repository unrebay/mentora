"use client";

import { useState } from "react";

const FAQ = [
  { q: "Можно ли попробовать без оплаты?",
    a: "Да. Бесплатный план не требует карты — регистрируйся и начинай сразу. Даже без аккаунта можно попробовать демо-чат на главной." },
  { q: "Что значит «безлимитные сообщения»?",
    a: "На Pro нет ограничений на количество сообщений в день. Учись столько, сколько хочешь." },
  { q: "Когда появятся новые предметы?",
    a: "Математика, биология и английский выйдут в первую очередь. Подписчики Pro получат доступ сразу при релизе." },
  { q: "Как работает Ultima?",
    a: "Ultima добавляет к Pro три новых возможности: сфотографируй задачу — Mentora объяснит решение, создай презентацию по любой теме, получи аудио-разбор сложного раздела." },
  { q: "Как отменить подписку?",
    a: "В любой момент в настройках аккаунта — без звонков и объяснений." },
];

export default function PricingFAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="space-y-2">
      {FAQ.map(({ q, a }, i) => (
        <div
          key={q}
          className="border rounded-2xl overflow-hidden transition-all duration-200"
          style={{
            background: "var(--bg-card)",
            borderColor: open === i ? "var(--brand)" : "var(--border)",
            boxShadow: open === i ? "0 0 0 1px var(--brand)" : "none",
          }}
        >
          <button
            className="w-full flex items-center justify-between px-6 py-4 text-left gap-4 group"
            onClick={() => setOpen(open === i ? null : i)}
          >
            <span className="font-semibold text-[var(--text)] text-sm leading-snug">{q}</span>
            <span
              className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200"
              style={{
                background: open === i ? "var(--brand)" : "var(--bg-secondary)",
                transform: open === i ? "rotate(45deg)" : "rotate(0deg)",
              }}
            >
              <svg viewBox="0 0 12 12" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d={open === i ? "M2 6h8M6 2v8" : "M2 6h8M6 2v8"} style={{ color: open === i ? "white" : "var(--text-muted)" }} />
              </svg>
            </span>
          </button>

          <div
            className="overflow-hidden transition-all duration-300 ease-in-out"
            style={{ maxHeight: open === i ? "200px" : "0px" }}
          >
            <p className="px-6 pb-5 text-sm text-[var(--text-muted)] leading-relaxed">
              {a}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
