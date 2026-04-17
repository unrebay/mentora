"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{ background: "var(--bg)" }}>
      {/* Ambient glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[300px] pointer-events-none rounded-full"
        style={{ background: "radial-gradient(ellipse, rgba(239,68,68,0.07) 0%, transparent 70%)" }} />

      {/* Card */}
      <div className="relative z-10 text-center max-w-sm w-full px-8 py-10 rounded-3xl"
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          boxShadow: "0 8px 40px rgba(0,0,0,0.12)",
        }}>
        {/* Error icon */}
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
          style={{ background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.18)" }}>
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="#ef4444" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>

        <h2 className="text-lg font-bold mb-2" style={{ color: "var(--text)" }}>Что-то пошло не так</h2>
        <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
          Произошла неожиданная ошибка. Попробуйте перезагрузить страницу.
        </p>

        <button
          onClick={reset}
          className="btn-glow px-6 py-2.5 text-white text-sm font-semibold rounded-xl"
        >
          Попробовать снова
        </button>
      </div>
    </main>
  );
}
