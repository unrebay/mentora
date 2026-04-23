"use client";
import { useTheme } from "./ThemeProvider";

// Heroicons-style monochrome SVG icons
const SunIcon = () => (
  <svg width="11" height="11" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
    <path
      fillRule="evenodd"
      d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
      clipRule="evenodd"
    />
  </svg>
);

const MoonIcon = () => (
  <svg width="10" height="10" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
  </svg>
);

interface ThemeToggleProps {
  className?: string;
  /** Force the toggle to always render with dark-background styling */
  forceDark?: boolean;
}

export default function ThemeToggle({ className = "", forceDark = false }: ThemeToggleProps) {
  const { theme, toggle } = useTheme();
  const isDark = forceDark || theme === "dark";

  return (
    <button
      onClick={toggle}
      className={`relative w-14 h-7 rounded-full overflow-hidden transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
        isDark
          ? "bg-[#1a1a2e] border border-white/10"
          : "bg-gray-100 border border-gray-200"
      } ${className}`}
      aria-label={isDark ? "Включить светлую тему" : "Включить тёмную тему"}
      title={isDark ? "Светлая тема" : "Тёмная тема"}
    >
      {/* Sun icon — left track */}
      <span
        className="absolute left-[7px] top-1/2 -translate-y-1/2 flex items-center justify-center"
        style={{ color: isDark ? "#2e2e4a" : "#9ca3af" }}
      >
        <SunIcon />
      </span>

      {/* Moon icon — right track */}
      <span
        className="absolute right-[7px] top-1/2 -translate-y-1/2 flex items-center justify-center"
        style={{ color: isDark ? "#2e2e4a" : "#9ca3af" }}
      >
        <MoonIcon />
      </span>

      {/* Sliding thumb — 3D sphere via radial-gradient shading */}
      <span
        className={`absolute left-0 top-0.5 w-6 h-6 rounded-full transition-all duration-300 ${
          theme === "dark" ? "translate-x-7" : "translate-x-0.5"
        }`}
        style={{
          background: theme === "dark"
            ? "radial-gradient(circle at 33% 30%, #B8CCFF 0%, #6B8FFF 30%, #4561E8 60%, #1A2A8A 100%)"
            : "radial-gradient(circle at 33% 30%, #FFFFFF 0%, #E8E8E8 40%, #C0C0C0 75%, #909090 100%)",
          boxShadow: theme === "dark"
            ? "0 2px 8px rgba(0,0,0,0.45), 0 0 12px rgba(69,97,232,0.45)"
            : "0 2px 8px rgba(0,0,0,0.25), 0 1px 3px rgba(0,0,0,0.15)",
        }}
      />
    </button>
  );
}
