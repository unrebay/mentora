"use client";
import { useTheme } from "./ThemeProvider";

export default function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      className={`relative w-14 h-7 rounded-full transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
        theme === "dark"
          ? "bg-[#1a1a2e] border border-white/10"
          : "bg-gray-100 border border-gray-200"
      } ${className}`}
      aria-label={theme === "dark" ? "Включить светлую тему" : "Включить тёмную тему"}
      title={theme === "dark" ? "Светлая тема" : "Тёмная тема"}
    >
      {/* Track icons */}
      <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[11px] select-none">☀️</span>
      <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[11px] select-none">🌙</span>
      {/* Thumb */}
      <span
        className={`absolute top-0.5 w-6 h-6 rounded-full shadow-sm transition-all duration-300 flex items-center justify-center text-xs ${
          theme === "dark"
            ? "translate-x-7 bg-[#4561E8]"
            : "translate-x-0.5 bg-white"
        }`}
      />
    </button>
  );
}
