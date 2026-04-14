import type { Metadata } from "next";
import dynamic from "next/dynamic";
import Link from "next/link";
import Logo from "@/components/Logo";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Галактика знаний",
  description: "Интерактивная карта всех предметов Mentora. Нажмите на звезду чтобы увидеть темы.",
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
        .from("user_progress")
        .select("subject, xp_total")
        .eq("user_id", user.id);
      userProgress = data ?? [];
    }
  } catch { /* guest view */ }

  return (
    <div className="min-h-screen bg-[#06060f] text-white flex flex-col" style={{ minHeight: "100dvh" }}>
      <nav className="sticky top-0 z-50 border-b border-white/8 px-4 py-3 flex items-center justify-between"
        style={{ background: "rgba(6,6,15,0.90)", backdropFilter: "blur(12px)" }}>
        <div className="flex items-center gap-3">
          <Logo size="sm" />
          <Link href="/dashboard" className="text-sm text-white/40 hover:text-white/70 transition-colors">
            ← Назад
          </Link>
        </div>
        <p className="text-xs font-bold text-white/50 tracking-wide uppercase hidden sm:block">
          Галактика знаний
        </p>
      </nav>

      <div className="px-4 pt-4 pb-2">
        <h1 className="text-xl md:text-2xl font-bold">
          Все знания <span className="text-white/90">в одной галактике</span>
        </h1>
        <p className="text-xs text-white/30 mt-1">
          Нажми на звезду · Тяни для перемещения · Скролл для масштаба
        </p>
      </div>

      <div className="flex-1 relative overflow-hidden" style={{ minHeight: 400 }}>
        <KnowledgeGraph
          className="absolute inset-0 w-full h-full"
          userProgress={userProgress}
        />
      </div>

      <div className="px-4 py-3 text-center text-[10px] text-white/20 border-t border-white/5">
        <a href="mailto:hi@mentora.su" className="hover:text-white/40 transition-colors">
          Предложить новый предмет
        </a>
      </div>
    </div>
  );
}
