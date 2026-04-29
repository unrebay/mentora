import Link from "next/link";
import Logo from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";

export const metadata = {
  title: "Условия использования | Mentora",
  description: "Условия использования образовательной платформы Mentora",
};

function SectionHeading({ n, title }: { n: string; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <span className="text-[10px] font-bold tracking-[0.15em] shrink-0" style={{ color: "#4561E8" }}>{n}</span>
      <h2 className="text-lg font-semibold leading-snug" style={{ color: "var(--text)" }}>{title}</h2>
    </div>
  );
}

export default function TermsPage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--bg)", color: "var(--text)" }}>

      {/* NAV */}
      <nav className="sticky top-0 z-50 border-b backdrop-blur-md"
        style={{ background: "var(--bg-nav)", borderColor: "var(--border-light)" }}>
        <div className="max-w-4xl mx-auto flex items-center justify-between px-6 py-4">
          <Link href="/"><Logo size="sm" fontSize="1.44rem" /></Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/auth" className="btn-glow px-4 py-2 text-sm font-semibold rounded-xl text-white">
              Попробовать бесплатно <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline", verticalAlign: "middle" }}><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-16">

        {/* Hero */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5 text-xs font-bold tracking-widest uppercase"
            style={{
              background: "rgba(69,97,232,0.08)",
              color: "var(--brand)",
              border: "1px solid rgba(69,97,232,0.18)",
            }}>
            <svg className="w-3 h-3" viewBox="0 0 12 12" fill="currentColor">
              <circle cx="6" cy="6" r="2.5" />
              <circle cx="6" cy="6" r="5" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.5" />
            </svg>
            Правовой документ
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3" style={{ color: "var(--text)" }}>
            Условия{" "}
            <span style={{
              background: "linear-gradient(120deg, #6B8FFF 0%, #4561E8 50%, #9F7AFF 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              использования
            </span>
          </h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Последнее обновление: 28 марта 2026 г.</p>
        </div>

        {/* Sections */}
        <div className="space-y-6 leading-relaxed text-sm" style={{ color: "var(--text-secondary)" }}>

          <section className="rounded-2xl border p-6"
            style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}>
            <SectionHeading n="01" title="Общие положения" />
            <p>
              Настоящие Условия использования (далее — «Условия») регулируют отношения между
              ИП Андрей Унребай (далее — «Mentora», «мы») и пользователем (далее — «вы»)
              образовательной платформы Mentora, доступной по адресу{" "}
              <a href="https://mentora.su" style={{ color: "#4561E8" }} className="hover:underline">mentora.su</a>.
            </p>
            <p className="mt-3">
              Регистрируясь или используя платформу, вы подтверждаете, что прочитали,
              поняли и согласны с настоящими Условиями.
            </p>
          </section>

          <section className="rounded-2xl border p-6"
            style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}>
            <SectionHeading n="02" title="Описание услуги" />
            <p>
              Mentora — образовательная платформа на основе искусственного интеллекта,
              которая предоставляет персонализированное обучение по различным предметам
              через диалог с AI-ментором. Платформа работает в режиме 24/7 и доступна
              через веб-браузер.
            </p>
          </section>

          <section className="rounded-2xl border p-6"
            style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}>
            <SectionHeading n="03" title="Регистрация и аккаунт" />
            <ul className="space-y-2.5">
              {[
                "Для полного доступа к платформе необходима регистрация.",
                "Вы обязаны предоставить достоверные данные при регистрации.",
                "Вы несёте ответственность за сохранность данных для входа.",
                "Один человек — один аккаунт. Передача аккаунта третьим лицам запрещена.",
                "Минимальный возраст для регистрации — 14 лет.",
              ].map(text => (
                <li key={text} className="flex gap-3">
                  <span className="w-1.5 h-1.5 rounded-full mt-2 shrink-0" style={{ background: "#4561E8" }} />
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border p-6"
            style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}>
            <SectionHeading n="04" title="Тарифы и оплата" />
            <ul className="space-y-2.5">
              {[
                { label: "Бесплатный план (Free)", text: "ограниченный доступ к функциям платформы без оплаты." },
                { label: "Pro-план", text: "расширенный доступ за 499 ₽/месяц или 2 990 ₽/год." },
                { label: null, text: "Оплата производится заранее за выбранный период." },
                { label: null, text: "Подписка автоматически продлевается, если не отменена до конца периода." },
                { label: null, text: "Возврат средств осуществляется в течение 14 дней с момента оплаты при отсутствии значительного использования сервиса." },
              ].map((item, i) => (
                <li key={i} className="flex gap-3">
                  <span className="w-1.5 h-1.5 rounded-full mt-2 shrink-0" style={{ background: "#4561E8" }} />
                  <span>{item.label ? <><strong style={{ color: "var(--text)", fontWeight: 600 }}>{item.label}:</strong> {item.text}</> : item.text}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border p-6"
            style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}>
            <SectionHeading n="05" title="Правила использования" />
            <p className="mb-3">При использовании платформы запрещается:</p>
            <ul className="space-y-2.5">
              {[
                "Использовать платформу для создания вредоносного, незаконного или оскорбительного контента.",
                "Пытаться обойти ограничения платформы или получить несанкционированный доступ к системам.",
                "Использовать автоматизированные инструменты для массовых запросов (боты, скрипты).",
                "Перепродавать доступ к платформе или делиться аккаунтом с третьими лицами.",
                "Нарушать авторские права и интеллектуальную собственность.",
              ].map(text => (
                <li key={text} className="flex gap-3">
                  <span className="w-1.5 h-1.5 rounded-full mt-2 shrink-0" style={{ background: "#ef4444" }} />
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border p-6"
            style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}>
            <SectionHeading n="06" title="Контент и интеллектуальная собственность" />
            <p>
              Весь контент платформы (тексты, логотипы, интерфейс, учебные материалы) является
              интеллектуальной собственностью Mentora и защищён законодательством РФ об авторских правах.
            </p>
            <p className="mt-3">
              Контент, создаваемый вами в диалогах с AI-ментором, принадлежит вам.
              Вы предоставляете Mentora неисключительную лицензию на использование этого контента
              для улучшения качества сервиса.
            </p>
          </section>

          <section className="rounded-2xl border p-6"
            style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}>
            <SectionHeading n="07" title="Ограничение ответственности" />
            <p>
              AI-ментор предоставляет образовательную информацию в учебных целях.
              Ответы AI могут содержать неточности — всегда проверяйте важную информацию
              по официальным источникам. Mentora не несёт ответственности за решения,
              принятые на основе информации от AI-ментора.
            </p>
            <p className="mt-3">
              Платформа предоставляется «как есть». Мы стремимся обеспечить работу 24/7,
              но не гарантируем бесперебойную доступность сервиса.
            </p>
          </section>

          <section className="rounded-2xl border p-6"
            style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}>
            <SectionHeading n="08" title="Прекращение доступа" />
            <p>
              Мы оставляем за собой право приостановить или удалить аккаунт при нарушении
              настоящих Условий. При удалении платного аккаунта по нашей инициативе
              без нарушения условий с вашей стороны — возвращаем остаток оплаченного периода.
            </p>
            <p className="mt-3">
              Вы можете удалить свой аккаунт в любое время через настройки или обратившись
              по адресу <a href="mailto:hello@mentora.su" style={{ color: "#4561E8" }} className="hover:underline">hello@mentora.su</a>.
            </p>
          </section>

          <section className="rounded-2xl border p-6"
            style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}>
            <SectionHeading n="09" title="Применимое право" />
            <p>
              Настоящие Условия регулируются законодательством Российской Федерации.
              Все споры решаются в досудебном порядке, а при невозможности — в суде
              по месту регистрации Mentora.
            </p>
          </section>

          <section className="rounded-2xl border p-6"
            style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}>
            <SectionHeading n="10" title="Контакты" />
            <p className="mb-3">По вопросам, связанным с настоящими Условиями:</p>
            <ul className="space-y-1.5">
              <li>Email: <a href="mailto:hello@mentora.su" style={{ color: "#4561E8" }} className="hover:underline font-medium">hello@mentora.su</a></li>
              <li>Сайт: <a href="https://mentora.su" style={{ color: "#4561E8" }} className="hover:underline">mentora.su</a></li>
            </ul>
          </section>

          {/* Реквизиты */}
          <section className="rounded-2xl border p-6"
            style={{ borderColor: "rgba(69,97,232,0.25)", background: "rgba(69,97,232,0.04)" }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: "rgba(69,97,232,0.12)" }}>
                <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="#4561E8" strokeWidth="1.5" strokeLinecap="round">
                  <rect x="2" y="3" width="12" height="10" rx="1.5" />
                  <path d="M5 7h6M5 9.5h4" />
                </svg>
              </div>
              <h2 className="font-semibold text-base" style={{ color: "var(--text)" }}>Реквизиты</h2>
            </div>
            <div className="space-y-1.5 text-sm" style={{ color: "var(--text-secondary)" }}>
              <p>Исполнитель: <span style={{ color: "var(--text)" }}>Белашов Андрей Владимирович</span></p>
              <p>ИНН: <span style={{ color: "var(--text)" }}>325005748248</span></p>
              <p>Статус: <span style={{ color: "var(--text)" }}>Самозанятый (НПД)</span></p>
              <p>Email: <a href="mailto:hi@mentora.su" style={{ color: "#4561E8" }} className="hover:underline">hi@mentora.su</a></p>
              <p>Сайт: <a href="https://mentora.su" style={{ color: "#4561E8" }} className="hover:underline">mentora.su</a></p>
            </div>
          </section>

        </div>
      </main>

      {/* FOOTER */}
      <footer className="border-t py-8 mt-8" style={{ borderColor: "var(--border)", background: "var(--bg)" }}>
        <div className="max-w-4xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm" style={{ color: "var(--text-muted)" }}>
          <span>© 2026 Mentora</span>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:opacity-70 transition-opacity">Конфиденциальность</Link>
            <Link href="/terms" className="font-semibold" style={{ color: "var(--text)" }}>Условия</Link>
            <Link href="/pricing" className="hover:opacity-70 transition-opacity">Тарифы</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
