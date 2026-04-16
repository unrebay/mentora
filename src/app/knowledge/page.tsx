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
      <nav className="flex-shrink-0 border-b border-white/8 px-4 py-3 flex items-center justify-between"
        style={{ background: "rgba(6,6,15,0.90)", backdropFilter: "blur(12px)" }}>
        <div className="flex items-center gap-3">
          <Logo size="sm" textColor="white" />
          <Link href="/dashboard" className="text-sm text-white/40 hover:text-white/70 transition-colors">
            ← Назад
          </Link>
        </div>
        <p className="text-xs font-bold text-white/50 tracking-wide uppercase hidden sm:block">
          Галактика знаний
        </p>
      </nav>

      {/* Title */}
      <div className="flex-shrink-0 px-4 pt-4 pb-2">
        <h1 className="text-xl md:text-2xl font-bold leading-tight">
          Все знания{" "}
          <span style={{ color: "#6b8fff" }}>в одной галактике</span>
        </h1>
        <p className="text-xs text-white/40 mt-1 leading-relaxed">
          Каждый предмет — звезда. Каждая тема — созвездие.{" "}
          Наведи на звезду, чтобы увидеть темы и перейти к изучению.{" "}
          <span className="text-[#ffa040]">Оранжевым</span>{" "}
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
