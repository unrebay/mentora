import type { Metadata } from "next";
import dynamic from "next/dynamic";
import Link from "next/link";
import Logo from "@/components/Logo";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Галактика знаний",
  description: "Интерактивная карта всех предметов Mentora. Наведи на звезду чтобы увидеть темы.",
  robots: { index: false, follow: false },
};

const KnowledgeGraph = dynamic(() => import("@/components/KnowledgeGraph"), { ssr: false });

export default async function KnowledgePage() {
  let userProgress: { subject: string; xp_total: number }[] = [];
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from("user_progress").select("subject, xp_total").eq("user_id", user.id);
      userProgress = data ?? [];
    }
  } catch { /* guest */ }

  return (
    <div className="flex flex-col bg-[#06060f] text-white" style={{ height: "100dvh" }}>
      {/* Nav */}
      <nav className="flex-shrink-0 border-b px-4 py-3 flex items-center justify-between"
        style={{ background: "rgba(6,6,15,0.92)", backdropFilter: "blur(16px)", borderColor: "rgba(255,255,255,0.07)" }}>
        <div className="flex items-center gap-3">
          <Logo size="sm" textColor="white" />
          <Link href="/dashboard"
            className="flex items-center gap-1.5 text-sm font-medium rounded-lg px-2.5 py-1.5 transition-colors"
            style={{ color: "rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.05)" }}>
            <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10 12L6 8l4-4" /></svg>
            Назад
          </Link>
        </div>
        <p className="text-[10px] font-bold tracking-[0.18em] uppercase hidden sm:block"
          style={{ color: "rgba(255,255,255,0.3)" }}>
          Галактика знаний
        </p>
      </nav>

      {/* Title */}
      <div className="flex-shrink-0 px-5 pt-4 pb-2">
        <h1 className="text-xl md:text-2xl font-bold leading-tight text-white">
          Все знания{" "}
          <span style={{
            background: "linear-gradient(120deg, #6B8FFF 0%, #4561E8 50%, #9F7AFF 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>
            в одной галактике
          </span>
        </h1>
        <p className="text-xs mt-1 leading-relaxed" style={{ color: "rgba(255,255,255,0.35)" }}>
          Каждый предмет — звезда. Наведи, чтобы увидеть темы.{" "}
          <span style={{ color: "#ffa040" }}>Оранжевым</span>{" "}
          светится то, что ты изучаешь прямо сейчас.
        </p>
      </div>

      {/* Galaxy — fills all remaining height */}
      <div className="flex-1 relative min-h-0">
        <KnowledgeGraph className="absolute inset-0 w-full h-full" userProgress={userProgress} />
      </div>
    </div>
  );
}
