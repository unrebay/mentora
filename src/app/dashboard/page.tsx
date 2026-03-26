import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SUBJECTS } from "@/lib/types";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  // Get user progress for all subjects
  const { data: progressData } = await supabase
    .from("user_progress")
    .select("*")
    .eq("user_id", user.id);

  const progressMap = new Map(progressData?.map((p) => [p.subject, p]) ?? []);

  async function handleLogout() {
    "use server";
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/");
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <span className="text-xl font-bold text-brand-600">Mentora</span>
          <form action={handleLogout}>
            <button type="submit" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
              Выйти
            </button>
          </form>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Выбери предмет</h1>
        <p className="text-gray-500 mb-10">Начни учиться в диалоге с AI-ментором</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {SUBJECTS.map((subject) => {
            const progress = progressMap.get(subject.id);
            return (
              <div
                key={subject.id}
                className={`relative rounded-2xl p-8 border transition-all ${
                  subject.available
                    ? "bg-white border-gray-100 hover:border-brand-200 hover:shadow-md cursor-pointer"
                    : "bg-gray-50 border-gray-100 opacity-60"
                }`}
              >
                {!subject.available && (
                  <span className="absolute top-4 right-4 text-xs bg-gray-200 text-gray-500 px-2 py-1 rounded-full">
                    Скоро
                  </span>
                )}

                <div className="text-4xl mb-4">{subject.emoji}</div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">{subject.title}</h2>
                <p className="text-gray-500 text-sm mb-6">{subject.description}</p>

                {progress && (
                  <div className="flex items-center gap-4 mb-6 text-sm">
                    <span className="text-brand-600 font-medium">⚡ {progress.xp_total} XP</span>
                    <span className="text-orange-500 font-medium">🔥 {progress.streak_days} дней</span>
                    <span className="text-gray-500">Уровень {progress.level}</span>
                  </div>
                )}

                {subject.available && (
                  <Link
                    href={`/learn/${subject.id}`}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700 transition-colors text-sm"
                  >
                    {progress ? "Продолжить" : "Начать"} →
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
