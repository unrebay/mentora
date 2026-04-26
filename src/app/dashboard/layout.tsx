import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DashboardNav from "@/components/DashboardNav";
import OnboardingTour from "@/components/OnboardingTour";
import { TourButtonMobile } from "@/components/TourButton";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const [{ data: profile }, { data: progressData }] = await Promise.all([
    supabase.from("users").select("plan, trial_expires_at").eq("id", user.id).single(),
    supabase.from("user_progress").select("xp_total, streak_days, best_streak").eq("user_id", user.id),
  ]);

  const isTrialActive = profile?.trial_expires_at ? new Date(profile.trial_expires_at) > new Date() : false;
  const isUltima = profile?.plan === "ultima";
  const isPro = isUltima || profile?.plan === "pro" || isTrialActive;
  const totalXP = progressData?.reduce((s: number, p: { xp_total?: number }) => s + (p.xp_total ?? 0), 0) ?? 0;
  // currentStreak = best active streak right now (resets if a day was missed)
  const currentStreak = progressData?.reduce((m: number, p: { streak_days?: number }) => Math.max(m, p.streak_days ?? 0), 0) ?? 0;
  // bestStreak = all-time record, never resets
  const bestStreak = progressData?.reduce((m: number, p: { best_streak?: number }) => Math.max(m, p.best_streak ?? 0), 0) ?? 0;

  async function handleLogout() {
    "use server";
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/");
  }

  return (
    <>
      <DashboardNav isPro={isPro} isUltima={isUltima} totalXP={totalXP} currentStreak={currentStreak} bestStreak={bestStreak} logoutAction={handleLogout} />
      {children}
      {/* Onboarding tour — auto-shows on first visit, reopenable via TourButton */}
      <OnboardingTour />
      {/* Mobile floating tour button — appears after 10s of inactivity */}
      <TourButtonMobile />
    </>
  );
}
