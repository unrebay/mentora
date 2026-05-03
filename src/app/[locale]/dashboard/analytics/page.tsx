import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SUBJECTS } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";
import AnalyticsShareCard from "@/components/AnalyticsShareCard";
import AnalyticsClient, { type BadgeItem, type CareerLevel } from "@/components/analytics/AnalyticsClient";
import { getTranslations, getLocale } from "next-intl/server";

export const dynamic = "force-dynamic";

// ── Career level thresholds ──────────────────────────────────────────────────
const LEVELS = [
  { key: "beginner",  minXP: 0     },
  { key: "explorer",  minXP: 100   },
  { key: "scholar",   minXP: 300   },
  { key: "historian", minXP: 600   },
  { key: "expert",    minXP: 1000  },
  { key: "master",    minXP: 2500  },
  { key: "doctor",    minXP: 5000  },
  { key: "academic",  minXP: 10000 },
] as const;

function getLevelKey(xp: number) {
  return [...LEVELS].reverse().find(l => xp >= l.minXP)?.key ?? "beginner";
}

// ── Badge definitions ────────────────────────────────────────────────────────
type BadgeDef = { id: string; group: BadgeItem["group"]; threshold: number; check: (s: Stats) => number };
interface Stats {
  msgs: number; bestStreak: number; xp: number;
  activeSciences: number; deepest: number; // max XP in any single science
}
const BADGE_DEFS: BadgeDef[] = [
  { id: "first_step",    group: "volume",      threshold: 1,     check: s => s.msgs },
  { id: "talker",        group: "volume",      threshold: 50,    check: s => s.msgs },
  { id: "curious",       group: "volume",      threshold: 200,   check: s => s.msgs },
  { id: "tireless",      group: "volume",      threshold: 500,   check: s => s.msgs },
  { id: "marathoner",    group: "volume",      threshold: 1000,  check: s => s.msgs },

  { id: "warm_spark",    group: "consistency", threshold: 3,     check: s => s.bestStreak },
  { id: "stable",        group: "consistency", threshold: 7,     check: s => s.bestStreak },
  { id: "disciplined",   group: "consistency", threshold: 14,    check: s => s.bestStreak },
  { id: "month_streak",  group: "consistency", threshold: 30,    check: s => s.bestStreak },
  { id: "unshakeable",   group: "consistency", threshold: 100,   check: s => s.bestStreak },

  { id: "novice",        group: "experience",  threshold: 100,   check: s => s.xp },
  { id: "explorer",      group: "experience",  threshold: 500,   check: s => s.xp },
  { id: "erudite",       group: "experience",  threshold: 1000,  check: s => s.xp },
  { id: "scholar",       group: "experience",  threshold: 3000,  check: s => s.xp },
  { id: "sage",          group: "experience",  threshold: 10000, check: s => s.xp },

  { id: "curious_mind",  group: "mastery",     threshold: 3,     check: s => s.activeSciences },
  { id: "polymath",      group: "mastery",     threshold: 5,     check: s => s.activeSciences },
  { id: "encyclopedist", group: "mastery",     threshold: 10,    check: s => s.activeSciences },
  { id: "expert_subj",   group: "mastery",     threshold: 1000,  check: s => s.deepest },
  { id: "guru",          group: "mastery",     threshold: 3000,  check: s => s.deepest },
];

export async function generateMetadata() {
  const t = await getTranslations("analytics");
  return { title: t("title") + " — Mentora" };
}

export default async function AnalyticsPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  // Ensure the user has a serial_id (Telegram-style #N)
  await supabase.rpc("ensure_user_profile", { p_user_id: user.id });
  const { data: profileRow } = await supabase
    .from("user_profiles")
    .select("serial_id")
    .eq("user_id", user.id)
    .maybeSingle();
  const mySerialId: number | null = profileRow?.serial_id ?? null;

  const [locale, t, tSubjects, tLevels, tBadges] = await Promise.all([
    getLocale(),
    getTranslations("analytics"),
    getTranslations("subjects"),
    getTranslations("analytics.levels"),
    getTranslations("analytics.badges.items"),
  ]);

  // ── User progress ──────────────────────────────────────────────────────────
  const { data: progressRows } = await supabase
    .from("user_progress")
    .select("subject, xp_total, streak_days, best_streak, last_active_at")
    .eq("user_id", user.id)
    .order("last_active_at", { ascending: false, nullsFirst: false });

  const progress = progressRows ?? [];
  const totalXP        = progress.reduce((s, r) => s + (r.xp_total ?? 0), 0);
  const currentStreak  = progress.reduce((m, r) => Math.max(m, r.streak_days ?? 0), 0);
  const bestStreak     = progress.reduce((m, r) => Math.max(m, r.best_streak ?? r.streak_days ?? 0), 0);
  const activeSubjectsCount = progress.filter(r => (r.xp_total ?? 0) > 0).length;
  const deepest        = progress.reduce((m, r) => Math.max(m, r.xp_total ?? 0), 0);

  // ── Total messages ─────────────────────────────────────────────────────────
  const { count: totalMessages } = await supabase
    .from("chat_messages")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("role", "user");

  // ── Activity 14 days ───────────────────────────────────────────────────────
  const days14ago = new Date(Date.now() - 14 * 86400_000).toISOString();
  const { data: recentForChart } = await supabase
    .from("chat_messages")
    .select("created_at")
    .eq("user_id", user.id)
    .eq("role", "user")
    .gte("created_at", days14ago);

  const activity14d: { date: string; count: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400_000);
    activity14d.push({ date: d.toISOString().slice(0, 10), count: 0 });
  }
  for (const m of recentForChart ?? []) {
    const day = m.created_at.slice(0, 10);
    const idx = activity14d.findIndex(a => a.date === day);
    if (idx >= 0) activity14d[idx].count++;
  }

  // ── Global rank ────────────────────────────────────────────────────────────
  const { data: rankData } = await supabase.rpc("get_user_global_rank", {
    p_user_id: user.id,
  }).maybeSingle() as { data: { rank: number; total: number } | null };

  // ── Subject stats (for Galaxy bars) ───────────────────────────────────────
  const subjectStats = progress
    .filter(r => (r.xp_total ?? 0) > 0)
    .map(r => {
      const meta = SUBJECTS.find(s => s.id === r.subject);
      const xp = r.xp_total ?? 0;
      const lvlKey = getLevelKey(xp);
      const lvlIdx = LEVELS.findIndex(l => l.key === lvlKey);
      const next = LEVELS[lvlIdx + 1] ?? null;
      const cur = LEVELS[lvlIdx];
      const subjectTitle: string = (() => {
        try { return tSubjects(`${r.subject}.title` as never); } catch { return meta?.title ?? r.subject; }
      })();
      return {
        id: r.subject,
        title: subjectTitle,
        xp,
        streak: r.streak_days ?? 0,
        messages: 0, // computed below
        lastActive: r.last_active_at ?? null,
        level: {
          key: lvlKey,
          name: tLevels(`${lvlKey}.name` as never),
          progress: next ? Math.round(((xp - cur.minXP) / (next.minXP - cur.minXP)) * 100) : 100,
          idx: lvlIdx,
          nextXP: next?.minXP ?? null,
        },
      };
    });

  // ── Recent messages (last 20 stored, show 10 visible by default) ─────────
  const { data: recentRaw } = await supabase
    .from("chat_messages")
    .select("subject, content, created_at")
    .eq("user_id", user.id)
    .eq("role", "user")
    .order("created_at", { ascending: false })
    .limit(20);

  const recentMsgs = (recentRaw ?? []).map(m => {
    const meta = SUBJECTS.find(s => s.id === m.subject);
    const subjectTitle: string = (() => {
      try { return tSubjects(`${m.subject}.title` as never); } catch { return meta?.title ?? m.subject; }
    })();
    return { subject: m.subject, subjectTitle, content: m.content, created_at: m.created_at };
  });

  // ── Badges ─────────────────────────────────────────────────────────────────
  const stats: Stats = {
    msgs: totalMessages ?? 0,
    bestStreak,
    xp: totalXP,
    activeSciences: activeSubjectsCount,
    deepest,
  };
  const badges: BadgeItem[] = BADGE_DEFS.map(d => {
    const cur = d.check(stats);
    return {
      id: d.id,
      group: d.group,
      earned: cur >= d.threshold,
      progress: Math.min(100, (cur / d.threshold) * 100),
      name: tBadges(`${d.id}.name` as never),
      desc: tBadges(`${d.id}.desc` as never),
      threshold: d.threshold,
      current: cur,
    };
  });

  // ── Career levels ──────────────────────────────────────────────────────────
  const careerLevels: CareerLevel[] = LEVELS.map(l => ({
    key: l.key,
    minXP: l.minXP,
    name: tLevels(`${l.key}.name` as never),
    desc: tLevels(`${l.key}.desc` as never),
  }));

  // ── Share invites ──────────────────────────────────────────────────────────
  const sbClient = await createClient();
  const { data: invites } = await sbClient
    .from("analytics_invites")
    .select("*")
    .eq("user_id", user.id)
    .is("revoked_at", null)
    .order("created_at", { ascending: false });

  void locale; // eslint: locale not directly used, but kept for future formatting

  return (
    <>
      <AnalyticsClient
        mySerialId={mySerialId}
        totalXP={totalXP}
        totalMessages={totalMessages ?? 0}
        currentStreak={currentStreak}
        bestStreak={bestStreak}
        activeSubjectsCount={activeSubjectsCount}
        globalRank={rankData?.rank ?? null}
        totalUsers={rankData?.total ?? null}
        weeklyDelta={null}
        activity14d={activity14d}
        subjectStats={subjectStats}
        recentMsgs={recentMsgs}
        badges={badges}
        careerLevels={careerLevels}
        currentLevelKey={getLevelKey(totalXP)}
      />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-20">
        <AnalyticsShareCard initialInvites={invites ?? []} />
      </div>
    </>
  );
}
