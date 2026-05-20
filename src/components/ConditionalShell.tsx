/**
 * ConditionalShell — server component that picks the right nav + footer based
 * on whether the user is authenticated.
 *
 * Use on pages that BOTH unauthenticated guests AND logged-in users can land on:
 *   - /terms, /privacy, /guide, /pricing, /repetitor, /repetitor/[subject], /podgotovka-k-ege
 *
 * For guests: <LandingNav /> + <PublicFooter />
 * For users:  <DashboardNav> with their actual XP/streak/plan + <AppFooter />
 *
 * Why: previously these pages forced LandingNav even for logged-in users —
 * they would see "Войти" in the nav instead of their avatar and didn't get
 * back to their dashboard easily. Now the shell auto-switches.
 */

import { createClient } from "@/lib/supabase/server";
import DashboardNav from "@/components/DashboardNav";
import LandingNav from "@/components/LandingNav";
import { PublicFooter, AppFooter } from "@/components/SiteFooter";

export interface ConditionalShellProps {
  children: React.ReactNode;
  /** Color scheme of DashboardNav when user is logged-in. Default theme-aware. */
  dashboardNavVariant?: "default" | "dark";
  /** Force PublicFooter dark variant for guests (used on dark hero pages like /). */
  publicFooterDark?: boolean;
  /** Hint to LandingNav (for guests) — which top-level link to mark active. */
  guestActivePage?: "pricing";
}

/* ── Logout action — shared across all pages (server action) ────────── */
async function logoutAction() {
  "use server";
  const supabase = await createClient();
  await supabase.auth.signOut();
  const { redirect } = await import("next/navigation");
  redirect("/");
}

export async function ConditionalNav({ dashboardNavVariant, guestActivePage }: {
  dashboardNavVariant?: "default" | "dark";
  guestActivePage?: "pricing";
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return <LandingNav activePage={guestActivePage} />;
  }

  // Fetch the minimum data DashboardNav needs (plan + xp + streak)
  const [profileRes, progressRes] = await Promise.all([
    supabase.from("users").select("plan, trial_expires_at").eq("id", user.id).single(),
    supabase.from("user_progress").select("xp_total, streak_days, best_streak").eq("user_id", user.id),
  ]);
  const profile = profileRes.data;
  const progressData = progressRes.data;
  const isTrialActive = profile?.trial_expires_at ? new Date(profile.trial_expires_at) > new Date() : false;
  const isUltima = profile?.plan === "ultima";
  const isPro = isUltima || profile?.plan === "pro" || isTrialActive;
  const totalXP = progressData?.reduce((s, p) => s + (p.xp_total ?? 0), 0) ?? 0;
  const currentStreak = progressData?.reduce((m, p) => Math.max(m, p.streak_days ?? 0), 0) ?? 0;
  const bestStreak = progressData?.reduce((m, p) => Math.max(m, p.best_streak ?? 0), 0) ?? 0;

  return (
    <DashboardNav
      isPro={isPro}
      isUltima={isUltima}
      totalXP={totalXP}
      currentStreak={currentStreak}
      bestStreak={bestStreak}
      logoutAction={logoutAction}
      variant={dashboardNavVariant}
    />
  );
}

export async function ConditionalFooter({ publicFooterDark }: { publicFooterDark?: boolean }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user ? <AppFooter /> : <PublicFooter dark={publicFooterDark} />;
}

/** Convenience wrapper that renders nav + page body + footer in one go. */
export default async function ConditionalShell(props: ConditionalShellProps) {
  return (
    <>
      <ConditionalNav dashboardNavVariant={props.dashboardNavVariant} guestActivePage={props.guestActivePage} />
      {props.children}
      <ConditionalFooter publicFooterDark={props.publicFooterDark} />
    </>
  );
}
