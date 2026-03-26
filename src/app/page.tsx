import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-5xl mx-auto">
        <span className="text-xl font-bold text-brand-600">Mentora</span>
        <Link
          href="/auth"
          className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
        >
          Начать учиться
        </Link>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-20 pb-16 text-center">
        <h1 className="text-5xl font-bold text-gray-900 leading-tight mb-6">
          Учи историю в диалоге<br />
          <span className="text-brand-600">с персональным AI-ментором</span>
        </h1>
        <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto">
          Не читай учебники — разговаривай. Mentora объясняет сложное просто,
          задаёт вопросы и запоминает, что ты уже знаешь.
        </p>
        <Link
          href="/auth"
          className="inline-flex items-center gap-2 px-8 py-4 bg-brand-600 text-white rounded-xl text-lg font-semibold hover:bg-brand-700 transition-colors"
        >
          Попробовать бесплатно →
        </Link>
        <p className="mt-4 text-sm text-gray-400">Бесплатно · Без карты · 20 сообщений в день</p>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              emoji: "🧠",
              title: "Адаптируется под тебя",
              desc: "Ментор помнит твой уровень, цели и слабые темы. Каждый ответ — персонально для тебя.",
            },
            {
              emoji: "📚",
              title: "Только проверенные знания",
              desc: "Ответы строятся на кураторской базе знаний, а не на «галлюцинациях» AI.",
            },
            {
              emoji: "🎯",
              title: "Сократовский метод",
              desc: "После каждого объяснения — вопрос. Так знания не забываются.",
            },
          ].map((f) => (
            <div key={f.title} className="p-6 rounded-2xl bg-gray-50">
              <div className="text-3xl mb-3">{f.emoji}</div>
              <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-gray-500 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-5xl mx-auto px-6 py-16 text-center">
        <div className="bg-brand-50 rounded-3xl p-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Начни с Истории России
          </h2>
          <p className="text-gray-500 mb-8">От Рюрика до наших дней. В диалоге, а не в зубрёжке.</p>
          <Link
            href="/auth"
            className="inline-flex items-center gap-2 px-8 py-4 bg-brand-600 text-white rounded-xl text-lg font-semibold hover:bg-brand-700 transition-colors"
          >
            Начать бесплатно →
          </Link>
        </div>
      </section>

      <footer className="text-center py-8 text-sm text-gray-400">
        © 2026 Mentora
      </footer>
    </main>
  );
}
