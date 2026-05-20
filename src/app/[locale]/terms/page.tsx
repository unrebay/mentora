import { Link } from "@/i18n/navigation";
import LandingNav from "@/components/LandingNav";
import { PublicFooter } from "@/components/SiteFooter";
import { getLocale } from "next-intl/server";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const isEn = locale === "en";
  const url = isEn ? "https://mentora.su/en/terms" : "https://mentora.su/ru/terms";
  return {
    title: isEn ? "Terms of service — Mentora" : "Условия использования — Mentora",
    description: isEn
      ? "Mentora rules: subscriptions, payments, limits, refunds, cancel in 1 click. Plain language, no legalese."
      : "Правила Mentora: подписки, оплата, лимиты, возврат, отмена в 1 клик. Кратко и по-человечески, без юридического жаргона.",
    alternates: {
      canonical: url,
      languages: { ru: "https://mentora.su/ru/terms", en: "https://mentora.su/en/terms", "x-default": "https://mentora.su/ru/terms" },
    },
  };
}

function SectionHeading({ n, title }: { n: string; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <span className="text-[10px] font-bold tracking-[0.15em] shrink-0" style={{ color: "#4561E8" }}>{n}</span>
      <h2 className="text-lg font-semibold leading-snug" style={{ color: "var(--text)" }}>{title}</h2>
    </div>
  );
}

export default async function TermsPage() {
  const locale = await getLocale();
  const isEn = locale === "en";
  return (
    <div className="min-h-screen" style={{ background: "var(--bg)", color: "var(--text)" }}>

      {/* Единый лендинг-навбар */}
      <LandingNav alwaysLight />

      {/* Кнопка «Назад» — отдельный chip, светлый малозаметный */}
      <div className="max-w-3xl mx-auto px-6 pt-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium rounded-full px-3.5 py-1.5 transition-colors"
          style={{
            color: "var(--text-muted)",
            background: "var(--bg-card)",
            border: "1px solid var(--border-light)",
          }}
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          {isEn ? "Back" : "Назад"}
        </Link>
      </div>

      <main className="max-w-3xl mx-auto px-6 py-16">

        {/* Hero */}
        <div className="mb-12">
          {/* AI-style pill removed */}
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
            style={{ borderColor: "var(--border-light)", background: "var(--bg-card)" }}>
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
            style={{ borderColor: "var(--border-light)", background: "var(--bg-card)" }}>
            <SectionHeading n="02" title="Описание услуги" />
            <p>
              Mentora — образовательная платформа на основе искусственного интеллекта,
              которая предоставляет персонализированное обучение по различным предметам
              через диалог с AI-ментором. Платформа работает в режиме 24/7 и доступна
              через веб-браузер.
            </p>
          </section>

          <section className="rounded-2xl border p-6"
            style={{ borderColor: "var(--border-light)", background: "var(--bg-card)" }}>
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
            style={{ borderColor: "var(--border-light)", background: "var(--bg-card)" }}>
            <SectionHeading n="04" title="Тарифы и оплата" />
            <ul className="space-y-2.5">
              {[
                { label: "Бесплатный план (Free)", text: "ограниченный доступ к функциям платформы без оплаты." },
                { label: "Pro-план", text: "расширенный доступ за 499 ₽/месяц или 2 990 ₽/год." },
                { label: null, text: "Оплата производится заранее за выбранный период." },
                { label: null, text: "Подписка автоматически продлевается, если не отменена до конца периода." },
                { label: null, text: "Возврат средств осуществляется в течение 14 дней с момента оплаты при отсутствии значительного использования сервиса." },
                { label: "Telegram Stars (донаты)", text: "Mentora принимает добровольные донаты через @mentora_su_bot в виде Telegram Stars. Донат — это поддержка проекта, не услуга и не подписка; никакой дополнительный функционал не открывается. Возврат Stars возможен по запросу в течение 21 дня с момента оплаты — напиши команду /paysupport боту или ответь на сообщение «спасибо за донат»." },
              ].map((item, i) => (
                <li key={i} className="flex gap-3">
                  <span className="w-1.5 h-1.5 rounded-full mt-2 shrink-0" style={{ background: "#4561E8" }} />
                  <span>{item.label ? <><strong style={{ color: "var(--text)", fontWeight: 600 }}>{item.label}:</strong> {item.text}</> : item.text}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Оферта про автопродление — требование ЮKassa для подключения рекуррентных платежей.
              Магазин 1319286, прямая ссылка mentora.su/terms#auto-renewal. */}
          <section id="auto-renewal" className="rounded-2xl border p-6 scroll-mt-20"
            style={{ borderColor: "var(--border-light)", background: "var(--bg-card)" }}>
            <SectionHeading n="04а" title="Автоматическое продление подписки" />
            <p className="mb-3">
              При оформлении подписки Pro или Ultima вы можете подключить автоматическое
              продление. При его включении вы даёте согласие на сохранение платёжного
              средства в системе ЮKassa и последующее списание оплаты без дополнительного
              подтверждения с вашей стороны.
            </p>
            <ul className="space-y-2.5">
              {[
                "Сумма списания совпадает с выбранным тарифом: 499 ₽/месяц или 2 990 ₽/год для Pro; 799 ₽/месяц или 5 990 ₽/год для Ultima. Сумма не меняется без вашего согласия — об изменении цены мы предупредим минимум за 14 дней.",
                "Регулярность списаний: 1 раз в выбранный период (месяц или год). Списание происходит в день окончания текущего оплаченного периода или в течение 24 часов до него.",
                "Подключение автопродления возможно начиная со 2 уровня (100 ментов) — это позволяет оценить продукт перед регулярными списаниями.",
                "Платёжное средство сохраняется в зашифрованном виде на стороне ЮKassa — Mentora хранит только идентификатор и последние 4 цифры карты для отображения в личном кабинете.",
                "Отключить автопродление можно в любой момент в личном кабинете на странице /pricing (тогл «Автопродление») или письмом на hello@mentora.su. После отключения текущий оплаченный период сохраняется до конца, повторных списаний не будет.",
                "Если списание не удалось (недостаточно средств, истёк срок карты, банк отклонил) — мы повторим попытку через 24 и 48 часов. После трёх неудачных попыток автопродление отключается, аккаунт переводится на Free после окончания оплаченного периода.",
                "Все списания подтверждаются электронным чеком (54-ФЗ), который высылается на email из вашего профиля.",
              ].map((text, i) => (
                <li key={i} className="flex gap-3">
                  <span className="w-1.5 h-1.5 rounded-full mt-2 shrink-0" style={{ background: "#4561E8" }} />
                  <span>{text}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs" style={{ color: "var(--text-muted)" }}>
              Платёжный сервис — ООО НКО «ЮMoney», лицензия Банка России №3510-К.
              Все операции защищены протоколом 3-D Secure.
            </p>
          </section>

          <section className="rounded-2xl border p-6"
            style={{ borderColor: "var(--border-light)", background: "var(--bg-card)" }}>
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
            style={{ borderColor: "var(--border-light)", background: "var(--bg-card)" }}>
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
            style={{ borderColor: "var(--border-light)", background: "var(--bg-card)" }}>
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
            style={{ borderColor: "var(--border-light)", background: "var(--bg-card)" }}>
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
            style={{ borderColor: "var(--border-light)", background: "var(--bg-card)" }}>
            <SectionHeading n="09" title="Применимое право" />
            <p>
              Настоящие Условия регулируются законодательством Российской Федерации.
              Все споры решаются в досудебном порядке, а при невозможности — в суде
              по месту регистрации Mentora.
            </p>
          </section>

          <section className="rounded-2xl border p-6"
            style={{ borderColor: "var(--border-light)", background: "var(--bg-card)" }}>
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
              <p>Email: <a href="mailto:hello@mentora.su" style={{ color: "#4561E8" }} className="hover:underline">hello@mentora.su</a></p>
              <p>Сайт: <a href="https://mentora.su" style={{ color: "#4561E8" }} className="hover:underline">mentora.su</a></p>
            </div>
          </section>

        </div>
      </main>

      {/* FOOTER */}
      <PublicFooter />
    </div>
  );
}
