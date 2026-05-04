import Link from "next/link";
import Logo from "@/components/Logo";

export const metadata = {
  title: "Политика конфиденциальности | Mentora",
  description: "Политика конфиденциальности образовательной платформы Mentora",
};

function SectionHeading({ n, title }: { n: string; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <span className="text-[10px] font-bold tracking-[0.15em] shrink-0" style={{ color: "#4561E8" }}>{n}</span>
      <h2 className="text-lg font-semibold leading-snug" style={{ color: "rgba(255,255,255,0.92)" }}>{title}</h2>
    </div>
  );
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen" style={{ background: "#04060f", color: "#fff" }}>

      {/* NAV */}
      <nav className="sticky top-0 z-50 border-b backdrop-blur-md"
        style={{ background: "rgba(4,6,15,0.85)", borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="max-w-4xl mx-auto flex items-center justify-between px-6 py-4">
          <Link href="/"><Logo size="sm" fontSize="1.44rem" /></Link>
          <div className="flex items-center gap-3">
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
              color: "#6B8FFF",
              border: "1px solid rgba(69,97,232,0.18)",
            }}>
            <svg className="w-3 h-3" viewBox="0 0 12 12" fill="currentColor">
              <circle cx="6" cy="6" r="2.5" />
              <circle cx="6" cy="6" r="5" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.5" />
            </svg>
            Правовой документ
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3" style={{ color: "rgba(255,255,255,0.92)" }}>
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
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>Последнее обновление: 3 мая 2026 г.</p>
        </div>

        {/* Sections */}
        <div className="space-y-10 leading-relaxed text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>

          <section className="rounded-2xl border p-6"
            style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)" }}>
            <SectionHeading n="01" title="Общие положения" />
            <p>
              Настоящая Политика конфиденциальности (далее — «Политика») описывает, как самозанятый
              Белашов Андрей Владимирович (ИНН 325005748248, далее — «Mentora», «мы», «нас») собирает,
              использует и защищает персональные данные пользователей образовательной платформы Mentora,
              доступной по адресу{" "}
              <a href="https://mentora.su" style={{ color: "#4561E8" }} className="hover:underline">mentora.su</a>.
            </p>
            <p className="mt-3">
              Mentora зарегистрирована в реестре операторов, осуществляющих обработку персональных данных,
              ведущемся Роскомнадзором, под номером{" "}
              <a
                href="https://pd.rkn.gov.ru/operators-registry/operators-list/?id=100271782"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#4561E8" }}
                className="hover:underline font-medium"
              >№100271782</a>{" "}
              (ключ&nbsp;12770851). Обработка персональных данных осуществляется в соответствии с Федеральным
              законом № 152-ФЗ «О персональных данных».
            </p>
            <p className="mt-3">
              Используя платформу, вы соглашаетесь с условиями настоящей Политики. Если вы не согласны
              с какими-либо положениями, пожалуйста, прекратите использование платформы.
            </p>
          </section>

          <section className="rounded-2xl border p-6"
            style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)" }}>
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
                  <span><strong style={{ color: "rgba(255,255,255,0.92)", fontWeight: 600 }}>{item.label}:</strong> {item.text}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border p-6"
            style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)" }}>
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
            style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)" }}>
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
                  <span><strong style={{ color: "rgba(255,255,255,0.92)", fontWeight: 600 }}>{item.name}</strong> — {item.desc}</span>
                </li>
              ))}
              <li className="flex gap-3">
                <span className="w-1.5 h-1.5 rounded-full mt-2 shrink-0" style={{ background: "#4561E8" }} />
                <span>Государственным органам — по требованию законодательства РФ.</span>
              </li>
            </ul>
          </section>

          <section className="rounded-2xl border p-6"
            style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)" }}>
            <SectionHeading n="05" title="Хранение и защита данных" />
            <p>
              Ваши данные хранятся на защищённых серверах. Мы используем шифрование TLS&nbsp;1.3
              для всех соединений, BCrypt для паролей, ограниченный доступ к данным и регулярный
              аудит безопасности. Данные хранятся в течение всего срока действия вашего аккаунта
              и 90 дней после его удаления.
            </p>
            <a
              href="https://securityheaders.com/?q=mentora.su"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors hover:bg-white/[0.03]"
              style={{ borderColor: "rgba(34, 197, 94, 0.30)", background: "rgba(34, 197, 94, 0.06)" }}
            >
              <span className="flex items-center justify-center w-9 h-9 rounded-lg font-black text-base"
                style={{ background: "linear-gradient(135deg, #22c55e, #15803d)", color: "white", boxShadow: "0 4px 14px rgba(34, 197, 94, 0.40)" }}>
                A+
              </span>
              <span className="flex-1">
                <span className="block text-sm font-bold" style={{ color: "rgba(255,255,255,0.92)" }}>Безопасность уровня A+</span>
                <span className="block text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.55)" }}>
                  Все рекомендованные HTTPS-заголовки: HSTS, CSP, X-Frame-Options. Проверь на securityheaders.com →
                </span>
              </span>
            </a>
          </section>

          <section className="rounded-2xl border p-6"
            style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)" }}>
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
            style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)" }}>
            <SectionHeading n="07" title="Cookies" />
            <p>
              Мы используем cookies для обеспечения работы платформы (авторизация, сессии)
              и аналитики (анонимизированная статистика посещений). Вы можете отключить cookies
              в настройках браузера, однако это может повлиять на работу платформы.
            </p>
          </section>

          <section className="rounded-2xl border p-6"
            style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)" }}>
            <SectionHeading n="08" title="Дети" />
            <p>
              Платформа предназначена для пользователей от 14 лет. Мы не собираем намеренно
              данные детей младше 14 лет. Если вам стало известно о таком случае,
              свяжитесь с нами по адресу{" "}
              <a href="mailto:hello@mentora.su" style={{ color: "#4561E8" }} className="hover:underline">hello@mentora.su</a>.
            </p>
          </section>

          <section className="rounded-2xl border p-6"
            style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)" }}>
            <SectionHeading n="09" title="Изменения Политики" />
            <p>
              Мы можем обновлять настоящую Политику. О существенных изменениях уведомим
              по email или через уведомление на платформе. Продолжение использования платформы
              после уведомления означает согласие с обновлённой Политикой.
            </p>
          </section>

          <section className="rounded-2xl border p-6"
            style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)" }}>
            <SectionHeading n="10" title="Контакты и реквизиты оператора" />
            <p className="mb-3">По вопросам конфиденциальности обращайтесь:</p>
            <ul className="space-y-1.5">
              <li>Email: <a href="mailto:hello@mentora.su" style={{ color: "#4561E8" }} className="hover:underline font-medium">hello@mentora.su</a></li>
              <li>Сайт: <a href="https://mentora.su" style={{ color: "#4561E8" }} className="hover:underline">mentora.su</a></li>
            </ul>
            <div className="mt-5 pt-5 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              <p className="text-xs uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>Реквизиты оператора</p>
              <ul className="space-y-1.5 text-sm">
                <li>Самозанятый: Белашов Андрей Владимирович</li>
                <li>ИНН: 325005748248</li>
                <li>Реестр Роскомнадзора: <a
                  href="https://pd.rkn.gov.ru/operators-registry/operators-list/?id=100271782"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#4561E8" }}
                  className="hover:underline font-medium"
                >№100271782</a></li>
              </ul>
            </div>
          </section>

        </div>
      </main>

      {/* FOOTER */}
      <footer className="border-t py-8 mt-8" style={{ borderColor: "rgba(255,255,255,0.08)", background: "#04060f" }}>
        <div className="max-w-4xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>
          <span>© 2026 Mentora</span>
          <div className="flex gap-6">
            <Link href="/privacy" className="font-semibold" style={{ color: "rgba(255,255,255,0.92)" }}>Конфиденциальность</Link>
            <Link href="/terms" className="hover:opacity-70 transition-opacity">Условия</Link>
            <Link href="/pricing" className="hover:opacity-70 transition-opacity">Тарифы</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
