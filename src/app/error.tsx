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
    <main className="min-h-screen bg-[var(--bg)] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
          Что-то пошло не так
        </h2>
        <p className="text-sm text-[var(--text-secondary)] mb-6">
          Произошла неожиданная ошибка. Попробуйте перезагрузить страницу.
        </p>
        <button
          onClick={reset}
          className="px-4 py-2 bg-[#4561E8] text-white text-sm rounded-xl hover:bg-[#3651d8] transition-colors"
        >
          Попробовать снова
        </button>
      </div>
    </main>
  );
}
