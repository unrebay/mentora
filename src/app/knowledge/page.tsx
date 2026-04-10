import type { Metadata } from "next";
import dynamic from "next/dynamic";
import Link from "next/link";
import Logo from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";

export const metadata: Metadata = {
  title: "База знаний",
  description: "Интерактивная карта знаний Mentora — все предметы, темы и курсы в одной визуализации",
  robots: { index: false, follow: false },
};

// Dynamically import the canvas component (client-only)
const KnowledgeGraph = dynamic(() => import("@/components/KnowledgeGraph"), { ssr: false });

export default function KnowledgePage() {
  return (
    <div className="min-h-screen bg-[#06060f] text-white flex flex-col">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-white/8 px-6 py-4 flex items-center justify-between"
        style={{ background: "rgba(6,6,15,0.88)", backdropFilter: "blur(12px)" }}>
        <div className="flex items-center gap-6">
          <Logo size="sm" />
          <Link href="/dashboard"
            className="text-sm text-white/40 hover:text-white/80 transition-colors">
            ← Назад
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-xs font-bold text-white/80 tracking-wide">БАЗА ЗНАНИЙ</span>
            <span className="text-[10px] text-white/30">Интерактивная карта</span>
          </div>
          <ThemeToggle />
        </div>
      </nav>

      {/* Hero */}
      <div className="px-6 pt-10 pb-6 max-w-3xl">
        <p className="text-xs font-semibold text-white/30 tracking-[0.2em] uppercase mb-3">
          Mentora · Галактика знаний
        </p>
        <h1 className="text-3xl md:text-4xl font-bold mb-3 leading-tight">
          Все знания{" "}
          <span className="text-[#6b8fff]">в одной карте</span>
        </h1>
        <p className="text-white/40 text-base leading-relaxed">
          Каждый предмет — звезда. Каждая тема — орбита. Наводи на крупные узлы, чтобы увидеть содержание.
          Оранжевым светится то, что ты изучаешь прямо сейчас.
        </p>
      </div>

      {/* Graph — fills remaining space */}
      <div className="flex-1 px-4 pb-8" style={{ minHeight: 520 }}>
        <div className="w-full h-full rounded-2xl overflow-hidden border border-white/5"
          style={{ minHeight: 520 }}>
          <KnowledgeGraph className="w-full h-full" />
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 pb-6 text-center text-xs text-white/20">
        Новые предметы появятся, как только станут доступны · 
        <a href="mailto:hi@mentora.su" className="text-white/30 hover:text-white/50 ml-1 transition-colors">
          Предложить предмет
        </a>
      </div>
    </div>
  );
}
