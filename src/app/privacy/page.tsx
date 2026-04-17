import Link from "next/link";
import Logo from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";

export const metadata = {
  title: "Политика конфиденциальности | Mentora",
  description: "Политика конфиденциальности образовательной платформы Mentora",
};

function SectionHeading({ n, title }: { n: string; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <span className="text-[10px] font-bold tracking-[0.15em] shrink-0" style={{ color: "#4561E8" }}>{n}</span>
      <h2 className="text-lg font-semibold leading-snug" style={{ color: "var(--text)" }}>{title}</h2>
    </div>
  );
}

export default function PrivacyPage() {
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
              Попробовать бесплатно →
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
            Политика{" "}
            <span style={{
              background: "linear-gradient(120deg, #6B8FFF 0%, #4561E8 50%, #9F7AFF 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              конфиденциальности
            </span>
          </h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Последнее обновление: 28 марта 2026 г.</p>
        </div>

        {/* Sections */}
        <div className="space-y-10 leading-relaxed text-sm" style={{ color: "var(--text-secondary)" }}>

          <section className="rounded-2xl border p-6"
            style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}>
            <SectionHeading n="01" title="Общие положения" />
            <p>
              Настоящая Политика конфиденциальности (далее — «Политика») описывает, как ИП Андрей Унребай
              (далее — «Mentora», «мы», «нас») собирает, использует и защищает персональные данные
              пользователей образовательной платформы Mentora, доступной по адресу{" "}
              <a href="https://mentora.su" style={{ color: "#4561E8" }} className="hover:underline">mentora.su</a>.
            </p>
            <p className="mt-3">
              Используя платформу, вы соглашаетесь с условиями настоящей Политики. Если вы не согласны
              с какими-либо положениями, пожалуйста, прекратите использование платформы.
            </p>
          </section>

          <section className="rounded-2xl border p-6"
            style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}>
            <SectionHeading n="02" title="Какие данные мы собираем" />
            <p className="mb-3">При использовании платформы мы можем собирать следующие данные:</p>
            <ul className="space-y-2.5">
              {[
                { label: "Данные аккаунта", text: "адрес электронной почты, имя (при указании), фотография профиля (при входе через Google)." },
                { label: "Данные об обучении", text: "выбранные предметы и темы, история диалогов с AI-ментором, прогресс, уровень XP, стрик." },
                { label: "Технические данные", text: "IP-адрес, тип браузера, операционная система, страницы, которые вы посещаете, время и продолжительность сессий." },
                { label: "Платёжные данные", text: "при оформлении подписки — обрабатываются платёжным провайдером, мы не храним данные карт." },
              ].map(item => (
                <li key={item.label} className="flex gap-3">
                  <span className="w-1.5 h-1.5 rounded-full mt-2 shrink-0" style={{ background: "#4561E8" }} />
                  <span><strong style={{ color: "var(--text)", fontWeight: 600 }}>{item.label}:</strong> {item.text}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border p-6"
            style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}>
            <SectionHeading n="03" title="Как мы используем данные" />
            <ul className="space-y-2.5">
              {[
                "Предоставление и улучшение образовательных услуг платформы.",
                "Персонализация обучения: адаптация стиля и подачи материала под вас.",
                "Отправка уведомлений об обучении, новых функциях и акциях (с вашего согласия).",
                "Обеспечение безопасности и предотвращение мошенничества.",
                "Выполнение требований законодательства Российской Федерации.",
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
            <SectionHeading n="04" title="Передача данных третьим лицам" />
            <p className="mb-3">Мы не продаём ваши персональные данные. Мы можем передавать данные только:</p>
            <ul className="space-y-2.5">
              {[
                { name: "Supabase", desc: "хранение базы данных и аутентификация (серверы в ЕС)." },
                { name: "Anthropic", desc: "обработка диалогов с AI-ментором (данные не используются для обучения моделей без согласия)." },
                { name: "Resend", desc: "отправка транзакционных email-сообщений." },
                { name: "Vercel", desc: "хостинг платформы." },
              ].map(item => (
                <li key={item.name} className="flex gap-3">
                  <span className="w-1.5 h-1.5 rounded-full mt-2 shrink-0" style={{ background: "#4561E8" }} />
                  <span><strong style={{ color: "var(--text)", fontWeight: 600 }}>{item.name}</strong> — {item.desc}</span>
                </li>
              ))}
              <li className="flex gap-3">
                <span className="w-1.5 h-1.5 rounded-full mt-2 shrink-0" style={{ background: "#4561E8" }} />
                <span>Государственным органам — по требованию законодательства РФ.</span>
              </li>
            </ul>
          </section>

          <section className="rounded-2xl border p-6"
            style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}>
            <SectionHeading n="05" title="Хранение и защита данных" />
            <p>
              Ваши данные хранятся на защищённых серверах. Мы используем шифрование HTTPS,
              ограниченный доступ к данным и регулярный аудит безопасности. Данные хранятся
              в течение всего срока действия вашего аккаунта и 90 дней после его удаления.
            </p>
          </section>

          <section className="rounded-2xl border p-6"
            style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}>
            <SectionHeading n="06" title="Ваши права" />
            <p className="mb-3">В соответствии с Федеральным законом № 152-ФЗ «О персональных данных» вы вправе:</p>
            <ul className="space-y-2.5 mb-4">
              {[
                "Получить информацию о том, какие данные мы храним о вас.",
                "Исправить неточные данные.",
                "Удалить свой аккаунт и все связанные данные.",
                "Отозвать согласие на обработку данных.",
                "Получить копию ваших данных в машиночитаемом формате.",
              ].map(text => (
                <li key={text} className="flex gap-3">
                  <span className="w-1.5 h-1.5 rounded-full mt-2 shrink-0" style={{ background: "#4561E8" }} />
                  <span>{text}</span>
                </li>
              ))}
            </ul>
            <p>
              Для реализации прав обратитесь по адресу:{" "}
              <a href="mailto:hello@mentora.su" style={{ color: "#4561E8" }} className="hover:underline font-medium">hello@mentora.su</a>
            </p>
          </section>

          <section className="rounded-2xl border p-6"
            style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}>
            <SectionHeading n="07" title="Cookies" />
            <p>
              Мы используем cookies для обеспечения работы платформы (авторизация, сессии)
              и аналитики (анонимизированная статистика посещений). Вы можете отключить cookies
              в настройках браузера, однако это может повлиять на работу платформы.
            </p>
          </section>

          <section className="rounded-2xl border p-6"
            style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}>
            <SectionHeading n="08" title="Дети" />
            <p>
              Платформа предназначена для пользователей от 14 лет. Мы не собираем намеренно
              данные детей младше 14 лет. Если вам стало известно о таком случае,
              свяжитесь с нами по адресу{" "}
              <a href="mailto:hello@mentora.su" style={{ color: "#4561E8" }} className="hover:underline">hello@mentora.su</a>.
            </p>
          </section>

          <section className="rounded-2xl border p-6"
            style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}>
            <SectionHeading n="09" title="Изменения Политики" />
            <p>
              Мы можем обновлять настоящую Политику. О существенных изменениях уведомим
              по email или через уведомление на платформе. Продолжение использования платформы
              после уведомления означает согласие с обновлённой Политикой.
            </p>
          </section>

          <section className="rounded-2xl border p-6"
            style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}>
            <SectionHeading n="10" title="Контакты" />
            <p className="mb-3">По вопросам конфиденциальности обращайтесь:</p>
            <ul className="space-y-1.5">
              <li>Email: <a href="mailto:hello@mentora.su" style={{ color: "#4561E8" }} className="hover:underline font-medium">hello@mentora.su</a></li>
              <li>Сайт: <a href="https://mentora.su" style={{ color: "#4561E8" }} className="hover:underline">mentora.su</a></li>
            </ul>
          </section>

        </div>
      </main>

      {/* FOOTER */}
      <footer className="border-t py-8 mt-8" style={{ borderColor: "var(--border)", background: "var(--bg)" }}>
        <div className="max-w-4xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm" style={{ color: "var(--text-muted)" }}>
          <span>© 2026 Mentora</span>
          <div className="flex gap-6">
            <Link href="/privacy" className="font-semibold" style={{ color: "var(--text)" }}>Конфиденциальность</Link>
            <Link href="/terms" className="hover:opacity-70 transition-opacity">Условия</Link>
            <Link href="/pricing" className="hover:opacity-70 transition-opacity">Тарифы</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
