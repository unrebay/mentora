import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import DashboardNav from "@/components/DashboardNav";
import OnboardingTour from "@/components/OnboardingTour";
import { TourButtonMobile } from "@/components/TourButton";
import ReferralProcessor from "@/components/ReferralProcessor";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

// Pages with a forced dark background — nav should always be dark on these
const DARK_PAGES: string[] = [];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const [{ data: profile }, { data: progressData },
    { data: profileRow },
    { data: rankRow }
  ] = await Promise.all([
    supabase.from("users").select("plan, trial_expires_at, display_name, full_name").eq("id", user.id).single(),
    supabase.from("user_progress").select("xp_total, streak_days, best_streak").eq("user_id", user.id),
    supabase.from("user_profiles").select("selected_avatar, serial_id").eq("user_id", user.id).maybeSingle(),
    supabase.rpc("get_user_global_rank", { p_user_id: user.id }).maybeSingle(),
  ]);

  const isTrialActive = profile?.trial_expires_at ? new Date(profile.trial_expires_at) > new Date() : false;
  const isUltima = profile?.plan === "ultima";
  const isPro = isUltima || profile?.plan === "pro" || isTrialActive;
  const totalXP = progressData?.reduce((s: number, p: { xp_total?: number }) => s + (p.xp_total ?? 0), 0) ?? 0;
  const currentStreak = progressData?.reduce((m: number, p: { streak_days?: number }) => Math.max(m, p.streak_days ?? 0), 0) ?? 0;
  const bestStreak = progressData?.reduce((m: number, p: { best_streak?: number }) => Math.max(m, p.best_streak ?? 0), 0) ?? 0;

  // Detect if current page needs forced dark nav
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? "";
  const navVariant = DARK_PAGES.some(p => pathname.startsWith(p)) ? "dark" : "default";

  async function handleLogout() {
    "use server";
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/");
  }

  return (
    <>
      <DashboardNav
        isPro={isPro}
        isUltima={isUltima}
        totalXP={totalXP}
        currentStreak={currentStreak}
        bestStreak={bestStreak}
        selectedAvatarLevel={(profileRow as { selected_avatar?: number | null } | null)?.selected_avatar ?? null}
        serialId={(profileRow as { serial_id?: number | null } | null)?.serial_id ?? null}
        displayName={(profile as { full_name?: string | null; display_name?: string | null } | null)?.full_name ?? (profile as { display_name?: string | null } | null)?.display_name ?? null}
        email={user.email ?? null}
        initialRank={(rankRow as { rank?: number | string | null } | null)?.rank ? Number((rankRow as { rank: number | string }).rank) : null}
        initialTotal={(rankRow as { total?: number | string | null } | null)?.total ? Number((rankRow as { total: number | string }).total) : null}
        logoutAction={handleLogout}
        variant={navVariant}
      />
      {/*
        Overlap trick: pull content up behind the transparent nav (76px = pill height + gaps).
        The paddingTop compensates so actual content starts at the right visual position.
        background: var(--bg) fills the 76px strip that shows through the nav.
      */}
      <div style={{ marginTop: "-76px", paddingTop: "76px", background: "var(--bg)" }}>
        {children}
      </div>
      <OnboardingTour />
      <TourButtonMobile />
      <ReferralProcessor />
    </>
  );
}
