"use client";
import { createContext, useContext, useEffect, useState, useCallback } from "react";

export type ThemeMode = "light" | "dark" | "system";
export type Theme = "light" | "dark";

interface Ctx {
  mode: ThemeMode;
  theme: Theme;
  cycle: () => void;
  setMode: (m: ThemeMode) => void;
  toggle: () => void;
}

const ThemeContext = createContext<Ctx>({
  mode: "system",
  theme: "light",
  cycle: () => {},
  setMode: () => {},
  toggle: () => {},
});

const STORAGE_KEY = "mentora-theme";

function readSystem(): Theme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function readStoredMode(): ThemeMode {
  if (typeof window === "undefined") return "system";
  const v = localStorage.getItem(STORAGE_KEY);
  if (v === "light" || v === "dark" || v === "system") return v;
  return "system";
}

function applyTheme(t: Theme) {
  document.documentElement.classList.toggle("dark", t === "dark");
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>("system");
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const m = readStoredMode();
    setModeState(m);
    const eff: Theme = m === "system" ? readSystem() : m;
    setTheme(eff);
    applyTheme(eff);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent | MediaQueryList) => {
      const currentMode = readStoredMode();
      if (currentMode !== "system") return;
      const next: Theme = e.matches ? "dark" : "light";
      setTheme(next);
      applyTheme(next);
    };
    if (mq.addEventListener) mq.addEventListener("change", handler);
    else mq.addListener(handler as never);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", handler);
      else mq.removeListener(handler as never);
    };
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    localStorage.setItem(STORAGE_KEY, next);
    setModeState(next);
    const eff: Theme = next === "system" ? readSystem() : next;
    setTheme(eff);
    applyTheme(eff);
  }, []);

  const cycle = useCallback(() => {
    const next: ThemeMode = mode === "light" ? "system" : mode === "system" ? "dark" : "light";
    setMode(next);
  }, [mode, setMode]);

  const toggle = useCallback(() => {
    const next: Theme = theme === "light" ? "dark" : "light";
    setMode(next);
  }, [theme, setMode]);

  if (!mounted) return <>{children}</>;

  return (
    <ThemeContext.Provider value={{ mode, theme, cycle, setMode, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
