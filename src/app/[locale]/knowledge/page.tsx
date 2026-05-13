import type { Metadata, Viewport } from "next";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/server";
import DashboardNav from "@/components/DashboardNav";
import LandingNav from "@/components/LandingNav";
import BodyScrollLock from "@/components/BodyScrollLock";
import { redirect } from "next/navigation";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const { getTranslations } = await import("next-intl/server");
  const t = await getTranslations({ locale, namespace: "knowledge" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    robots: { index: false, follow: false },
  };
}

// Override the global theme-color so iOS Safari paints the top status-bar area
// dark to match the galaxy (otherwise it shows the body-light colour).
export const viewport: Viewport = {
  themeColor: "#06060f",
};

const KnowledgeGraph = dynamic(() => import("@/components/KnowledgeGraph3D"), { ssr: false });
const ParticleField = dynamic(() => import("@/components/ParticleField"), { ssr: false });
const DeepSpaceBlobs = dynamic(() => import("@/components/DeepSpaceBlobs"), { ssr: false });

export default async function KnowledgePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const { getTranslations } = await import("next-intl/server");
  const t = await getTranslations({ locale, namespace: "knowledge" });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Knowledge galaxy is PUBLIC — anyone can explore. If not logged in, we just
  // skip personalized progress data; the galaxy still renders for marketing.
  const [profileRes, progressRes] = user
    ? await Promise.all([
        supabase.from("users").select("plan, trial_expires_at").eq("id", user.id).single(),
        supabase.from("user_progress").select("xp_total, streak_days, best_streak, subject").eq("user_id", user.id),
      ])
    : [{ data: null }, { data: null }];
  const profile = profileRes.data;
  const progressData = progressRes.data;

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
    <>
      {/* Dark plate fills the viewport AND extends behind the iOS safe-area so any
          rubber-band / overscroll reveals galaxy-dark, not the body's light bg. */}
      <div aria-hidden className="fixed inset-0 z-[-1]" style={{ background: "#06060f" }} />
    <div className="fixed inset-0 flex flex-col bg-[#06060f] text-white" style={{ overflow: "hidden", overscrollBehavior: "none" }}>
      <BodyScrollLock />
      {/* Nav */}
      {/* Nav: full DashboardNav for logged-in users, simple LandingNav for guests */}
      {user ? (
        <DashboardNav isPro={isPro} isUltima={isUltima} totalXP={totalXP} currentStreak={currentStreak} bestStreak={bestStreak} logoutAction={handleLogout} variant="dark" />
      ) : (
        <LandingNav />
      )}

      {/* Title */}
      <div className="flex-shrink-0 px-5 pt-4 pb-2">
        <h1 className="text-xl md:text-2xl font-bold leading-tight text-white">
          {t("titleA")}{" "}
          <span style={{
            background: "linear-gradient(120deg, #6B8FFF 0%, #4561E8 50%, #9F7AFF 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>
            {t("titleB")}
          </span>
        </h1>
        <p className="text-xs mt-1 leading-relaxed" style={{ color: "rgba(255,255,255,0.35)" }}>
          {t("captionA")}{" "}
          <span style={{ color: "#ffa040" }}>{t("captionHighlight")}</span>{" "}
          {t("captionB")}
        </p>
      </div>

      {/* Galaxy — fills all remaining height */}
      <div className="flex-1 relative min-h-0" style={{ background: "#06060f" }}>
        {/* Deep-space frosted-glass blobs — behind everything */}
        <DeepSpaceBlobs className="absolute inset-0 w-full h-full z-0" />
        {/* Constellation particle field */}
        <ParticleField className="absolute inset-0 w-full h-full z-[1]" count={180} />
        {/* Interactive galaxy canvas on top */}
        <KnowledgeGraph className="absolute inset-0 w-full h-full z-10" userProgress={userProgress} />
      </div>
    </div>
    </>
  );
}
