"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";

export default function LandingNav() {
  const [scrolled, setScrolled]   = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const close = () => setMobileOpen(false);
    window.addEventListener("scroll", close, { passive: true, once: true });
    return () => window.removeEventListener("scroll", close);
  }, [mobileOpen]);

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: scrolled
          ? "rgba(8,8,20,0.90)"
          : "transparent",
        backdropFilter: scrolled ? "blur(20px) saturate(180%)" : "none",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "1px solid transparent",
      }}
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between px-5 py-4">
        {/* Logo */}
        <Logo size="sm" fontSize="1.44rem" textColor="white" />

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          <a href="#subjects"
            className="text-sm font-medium text-white/60 hover:text-white/90 transition-colors">
            Предметы
          </a>
          <a href="#how"
            className="text-sm font-medium text-white/60 hover:text-white/90 transition-colors">
            Как работает
          </a>
          <Link href="/pricing"
            className="text-sm font-medium text-white/60 hover:text-white/90 transition-colors">
            Тарифы
          </Link>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          <Link href="/auth"
            className="hidden md:inline text-sm font-medium text-white/55 hover:text-white/80 transition-colors px-3 py-1.5">
            Войти
          </Link>

          {/* CTA pill */}
          <Link href="/auth"
            className="hidden md:inline-flex items-center gap-2 text-sm font-semibold text-white px-5 py-2.5 rounded-full transition-all duration-200"
            style={{
              background: "linear-gradient(135deg, #4561E8 0%, #6b87ff 100%)",
              boxShadow: "0 4px 20px rgba(69,97,232,0.40), inset 0 1px 0 rgba(255,255,255,0.15)",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 6px 28px rgba(69,97,232,0.65), inset 0 1px 0 rgba(255,255,255,0.15)";
              (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-1px)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 4px 20px rgba(69,97,232,0.40), inset 0 1px 0 rgba(255,255,255,0.15)";
              (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(0)";
            }}
          >
            Начать бесплатно
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>

          {/* Mobile CTA */}
          <Link href="/auth"
            className="md:hidden text-sm font-semibold text-white px-4 py-2 rounded-full"
            style={{
              background: "linear-gradient(135deg, #4561E8 0%, #6b87ff 100%)",
              boxShadow: "0 4px 16px rgba(69,97,232,0.4)",
            }}>
            Начать
          </Link>

          {/* Mobile hamburger */}
          <button
            className="md:hidden flex flex-col justify-center items-center w-9 h-9 gap-[5px] rounded-lg"
            onClick={() => setMobileOpen(v => !v)}
            aria-label={mobileOpen ? "Закрыть меню" : "Открыть меню"}
          >
            <span className="block w-5 h-[2px] rounded-full bg-white/80 transition-all duration-200 origin-center"
              style={{ transform: mobileOpen ? "rotate(45deg) translate(0, 7px)" : "none" }} />
            <span className="block w-5 h-[2px] rounded-full bg-white/80 transition-all duration-200"
              style={{ opacity: mobileOpen ? 0 : 1 }} />
            <span className="block w-5 h-[2px] rounded-full bg-white/80 transition-all duration-200 origin-center"
              style={{ transform: mobileOpen ? "rotate(-45deg) translate(0, -7px)" : "none" }} />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          className="md:hidden px-5 py-4 flex flex-col gap-1 border-t"
          style={{
            background: "rgba(8,8,20,0.97)",
            borderColor: "rgba(255,255,255,0.06)",
            backdropFilter: "blur(20px)",
          }}
        >
          {[
            { href: "#subjects", label: "Предметы" },
            { href: "#how", label: "Как работает" },
            { href: "/pricing", label: "Тарифы" },
            { href: "/auth", label: "Войти" },
          ].map(({ href, label }) => (
            <a key={href} href={href}
              className="text-sm font-medium text-white/65 hover:text-white py-3 border-b border-white/5 last:border-0 transition-colors"
              onClick={() => setMobileOpen(false)}>
              {label}
            </a>
          ))}
        </div>
      )}
    </nav>
  );
}
