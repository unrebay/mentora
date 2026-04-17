"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function DashboardError({
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
    <main className="min-h-screen bg-[var(--bg)] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 00-3.42 0z" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
          Ошибка загрузки
        </h2>
        <p className="text-sm text-[var(--text-secondary)] mb-6">
          Не удалось загрузить страницу. Попробуйте обновить или вернитесь на главную.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-4 py-2 bg-[#4561E8] text-white text-sm rounded-xl hover:bg-[#3651d8] transition-colors"
          >
            Обновить
          </button>
          <Link
            href="/dashboard"
            className="px-4 py-2 bg-[var(--card)] text-[var(--text-primary)] text-sm rounded-xl hover:bg-[var(--card-hover)] transition-colors border border-[var(--border)]"
          >
            На главную
          </Link>
        </div>
      </div>
    </main>
  );
}
