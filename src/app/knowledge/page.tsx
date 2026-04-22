import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/server";
import DashboardNav from "@/components/DashboardNav";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Галактика знаний",
  description: "Интерактивная карта всех предметов Mentora. Наведи на звезду чтобы увидеть темы.",
  robots: { index: false, follow: false },
};

const KnowledgeGraph = dynamic(() => import("@/components/KnowledgeGraph"), { ssr: false });
const SplineScene = dynamic(() => import("@/components/SplineScene"), { ssr: false });

// Spline "Particles 🌑" — https://app.spline.design/community/file/3ff7b617-2fe9-46c7-8e06-b6d7c382f4db
const SPLINE_SCENE = "https://my.spline.design/3ff7b617-2fe9-46c7-8e06-b6d7c382f4db/";

export default async function KnowledgePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const [{ data: profile }, { data: progressData }] = await Promise.all([
    supabase.from("users").select("plan, trial_expires_at").eq("id", user.id).single(),
    supabase.from("user_progress").select("xp_total, streak_days, best_streak, subject").eq("user_id", user.id),
  ]);

  const isTrialActive = profile?.trial_expires_at ? new Date(profile.trial_expires_at) > new Date() : false;
  const isUltima = profile?.plan === "ultima";
  const isPro = isUltima || profile?.plan === "pro" || isTrialActive;
  const totalXP = progressData?.reduce((s: number, p: { xp_total?: number }) => s + (p.xp_total ?? 0), 0) ?? 0;
  const currentStreak = progressData?.reduce((m: number, p: { streak_days?: number }) => Math.max(m, p.streak_days ?? 0), 0) ?? 0;
  const bestStreak = progressData?.reduce((m: number, p: { best_streak?: number }) => Math.max(m, p.best_streak ?? 0), 0) ?? 0;
  const userProgress = progressData?.map((p: { subject?: string; xp_total?: number }) => ({ subject: p.subject ?? "", xp_total: p.xp_total ?? 0 })) ?? [];

  async function handleLogout() {
    "use server";
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    await supabase.auth.signOut();
    const { redirect } = await import("next/navigation");
    redirect("/");
  }

  return (
    <div className="flex flex-col bg-[#06060f] text-white" style={{ height: "100dvh" }}>
      {/* Nav */}
      <DashboardNav isPro={isPro} isUltima={isUltima} totalXP={totalXP} currentStreak={currentStreak} bestStreak={bestStreak} logoutAction={handleLogout} variant="dark" />

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
      <div className="flex-1 relative min-h-0" style={{ background: "#06060f" }}>
        {/* Spline 3D background layer — pointer-events none so canvas stays interactive */}
        <div className="absolute inset-0 z-0" style={{ pointerEvents: "none", opacity: 0.7 }}>
          <SplineScene scene={SPLINE_SCENE} />
        </div>
        {/* Interactive galaxy canvas on top */}
        <KnowledgeGraph className="absolute inset-0 w-full h-full" userProgress={userProgress} />
      </div>
    </div>
  );
}
