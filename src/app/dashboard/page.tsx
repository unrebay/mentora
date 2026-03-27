import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SUBJECTS } from "@/lib/types";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  // Redirect to onboarding if not completed
  const { data: profile } = await supabase
    .from("users")
    .select("onboarding_completed")
    .eq("id", user.id)
    .single();

  if (!profile?.onboarding_completed) redirect("/onboarding");

  const { data: progressData } = await supabase
    .from("user_progress")
    .select("*")
    .eq("user_id", user.id);

  const progressMap = new Map(progressData?.map((p) => [p.subject, p]) ?? []);

  const totalXP = progressData?.reduce((sum, p) => sum + (p.xp_total ?? 0), 0) ?? 0;
  const maxStreak = progressData?.reduce((max, p) => Math.max(max, p.streak_days ?? 0), 0) ?? 0;

  async function handleLogout() {
    "use server";
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/");
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Nav */}
      <nav className="bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <span className="text-xl font-bold tracking-tight">
            M<span className="font-normal">entora</span>
          </span>
          <div className="flex items-center gap-6">
            {totalXP > 0 && (
              <div className="flex items-center gap-4 text-sm">
                <span className="text-brand-600 font-semibold">⚡ {totalXP} XP</span>
                {maxStreak > 0 && <span className="text-orange-500 font-semibold">🔥 {maxStreak} дней</span>}
              </div>
            )}
            <form action={handleLogout}>
              <button type="submit" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
                Выйти
              </button>
            </form>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-3 text-xs font-semibold text-gray-400 tracking-widest uppercase">Библиотека знаний</div>
        <h1 className="text-4xl font-bold mb-2 leading-tight">
          Выбери, что хочешь<br />
          изучить <span className="text-brand-600 italic">сегодня</span>
        </h1>
        <p className="text-gray-400 mb-10">Начни учиться в диалоге с AI-ментором</p>

        {/* Subject grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {SUBJECTS.map((subject) => {
            const progress = progressMap.get(subject.id);
            return (
              <div
                key={subject.id}
                className={`relative rounded-2xl border transition-all overflow-hidden ${
                  subject.available
                    ? "bg-white border-gray-200 hover:border-brand-300 hover:shadow-md cursor-pointer"
                    : "bg-gray-50 border-gray-100 opacity-60"
                }`}
              >
                {subject.available ? (
                  <Link href={`/learn/${subject.id}`} className="block p-5">
                    <span className="absolute top-3 right-3 text-[10px] font-bold bg-green-100 text-green-700 px-1.5 py-0.5 rounded-md">LIVE</span>
                    <div className="text-3xl mb-3">{subject.emoji}</div>
                    <div className="font-semibold text-sm text-gray-900 mb-0.5">{subject.title}</div>
                    <div className="text-xs text-gray-400">{subject.description}</div>
                    {progress && (
                      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2 text-xs">
                        <span className="text-brand-600 font-medium">⚡ {progress.xp_total} XP</span>
                        {progress.streak_days > 0 && (
                          <span className="text-orange-500">🔥 {progress.streak_days}д</span>
                        )}
                      </div>
                    )}
                    {!progress && (
                      <div className="mt-3">
                        <span className="text-xs font-medium text-brand-600">Начать →</span>
                      </div>
                    )}
                  </Link>
                ) : (
                  <div className="block p-5">
                    <span className="absolute top-3 right-3 text-[10px] font-medium bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded-md">СКОРО</span>
                    <div className="text-3xl mb-3">{subject.emoji}</div>
                    <div className="font-semibold text-sm text-gray-500 mb-0.5">{subject.title}</div>
                    <div className="text-xs text-gray-400">{subject.description}</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
