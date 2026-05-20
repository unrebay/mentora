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

const SECTION_CLS = "rounded-2xl border p-6";
const SECTION_STYLE = { borderColor: "var(--border-light)", background: "var(--bg-card)" };
const BULLET_BLUE = "#4561E8";
const BULLET_RED = "#ef4444";

function Bullet({ children, color = BULLET_BLUE }: { children: React.ReactNode; color?: string }) {
  return (
    <li className="flex gap-3">
      <span className="w-1.5 h-1.5 rounded-full mt-2 shrink-0" style={{ background: color }} />
      <span>{children}</span>
    </li>
  );
}

function RuBody() {
  return (
    <div className="space-y-6 leading-relaxed text-sm" style={{ color: "var(--text-secondary)" }}>

      <section className={SECTION_CLS} style={SECTION_STYLE}>
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

      <section className={SECTION_CLS} style={SECTION_STYLE}>
        <SectionHeading n="02" title="Описание услуги" />
        <p>
          Mentora — образовательная платформа на основе искусственного интеллекта,
          которая предоставляет персонализированное обучение по различным предметам
          через диалог с AI-ментором. Платформа работает в режиме 24/7 и доступна
          через веб-браузер.
        </p>
      </section>

      <section className={SECTION_CLS} style={SECTION_STYLE}>
        <SectionHeading n="03" title="Регистрация и аккаунт" />
        <ul className="space-y-2.5">
          {[
            "Для полного доступа к платформе необходима регистрация.",
            "Вы обязаны предоставить достоверные данные при регистрации.",
            "Вы несёте ответственность за сохранность данных для входа.",
            "Один человек — один аккаунт. Передача аккаунта третьим лицам запрещена.",
            "Минимальный возраст для регистрации — 14 лет.",
          ].map(text => <Bullet key={text}>{text}</Bullet>)}
        </ul>
      </section>

      <section className={SECTION_CLS} style={SECTION_STYLE}>
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
            <Bullet key={i}>{item.label ? <><strong style={{ color: "var(--text)", fontWeight: 600 }}>{item.label}:</strong> {item.text}</> : item.text}</Bullet>
          ))}
        </ul>
      </section>

      <section id="auto-renewal" className={`${SECTION_CLS} scroll-mt-20`} style={SECTION_STYLE}>
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
          ].map((text, i) => <Bullet key={i}>{text}</Bullet>)}
        </ul>
        <p className="mt-4 text-xs" style={{ color: "var(--text-muted)" }}>
          Платёжный сервис — ООО НКО «ЮMoney», лицензия Банка России №3510-К.
          Все операции защищены протоколом 3-D Secure.
        </p>
      </section>

      <section className={SECTION_CLS} style={SECTION_STYLE}>
        <SectionHeading n="05" title="Правила использования" />
        <p className="mb-3">При использовании платформы запрещается:</p>
        <ul className="space-y-2.5">
          {[
            "Использовать платформу для создания вредоносного, незаконного или оскорбительного контента.",
            "Пытаться обойти ограничения платформы или получить несанкционированный доступ к системам.",
            "Использовать автоматизированные инструменты для массовых запросов (боты, скрипты).",
            "Перепродавать доступ к платформе или делиться аккаунтом с третьими лицами.",
            "Нарушать авторские права и интеллектуальную собственность.",
          ].map(text => <Bullet key={text} color={BULLET_RED}>{text}</Bullet>)}
        </ul>
      </section>

      <section className={SECTION_CLS} style={SECTION_STYLE}>
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

      <section className={SECTION_CLS} style={SECTION_STYLE}>
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

      <section className={SECTION_CLS} style={SECTION_STYLE}>
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

      <section className={SECTION_CLS} style={SECTION_STYLE}>
        <SectionHeading n="09" title="Применимое право" />
        <p>
          Настоящие Условия регулируются законодательством Российской Федерации.
          Все споры решаются в досудебном порядке, а при невозможности — в суде
          по месту регистрации Mentora.
        </p>
      </section>

      <section className={SECTION_CLS} style={SECTION_STYLE}>
        <SectionHeading n="10" title="Контакты" />
        <p className="mb-3">По вопросам, связанным с настоящими Условиями:</p>
        <ul className="space-y-1.5">
          <li>Email: <a href="mailto:hello@mentora.su" style={{ color: "#4561E8" }} className="hover:underline font-medium">hello@mentora.su</a></li>
          <li>Сайт: <a href="https://mentora.su" style={{ color: "#4561E8" }} className="hover:underline">mentora.su</a></li>
        </ul>
      </section>

    </div>
  );
}

function EnBody() {
  return (
    <div className="space-y-6 leading-relaxed text-sm" style={{ color: "var(--text-secondary)" }}>

      <section className={SECTION_CLS} style={SECTION_STYLE}>
        <SectionHeading n="01" title="General provisions" />
        <p>
          These Terms of Service (the &quot;Terms&quot;) govern the relationship between
          IE Andrey Unrebay (&quot;Mentora&quot;, &quot;we&quot;) and the user (&quot;you&quot;) of the Mentora
          educational platform, available at{" "}
          <a href="https://mentora.su" style={{ color: "#4561E8" }} className="hover:underline">mentora.su</a>.
        </p>
        <p className="mt-3">
          By registering or using the platform, you confirm that you have read, understood,
          and agreed to these Terms.
        </p>
      </section>

      <section className={SECTION_CLS} style={SECTION_STYLE}>
        <SectionHeading n="02" title="Service description" />
        <p>
          Mentora is an AI-powered educational platform that provides personalized learning
          across multiple subjects through dialogue with an AI mentor. The platform is
          available 24/7 via web browser.
        </p>
      </section>

      <section className={SECTION_CLS} style={SECTION_STYLE}>
        <SectionHeading n="03" title="Account registration" />
        <ul className="space-y-2.5">
          {[
            "Full access to the platform requires registration.",
            "You agree to provide accurate information during registration.",
            "You are responsible for keeping your login credentials secure.",
            "One person — one account. Sharing an account with third parties is prohibited.",
            "Minimum age for registration is 14.",
          ].map(text => <Bullet key={text}>{text}</Bullet>)}
        </ul>
      </section>

      <section className={SECTION_CLS} style={SECTION_STYLE}>
        <SectionHeading n="04" title="Plans and payment" />
        <ul className="space-y-2.5">
          {[
            { label: "Free plan", text: "limited access to platform features at no cost." },
            { label: "Pro plan", text: "extended access at ₽499/month or ₽2,990/year." },
            { label: null, text: "Payment is collected in advance for the selected period." },
            { label: null, text: "The subscription renews automatically unless cancelled before the end of the period." },
            { label: null, text: "Refunds are issued within 14 days of payment when the service has not been substantially used." },
            { label: "Telegram Stars (donations)", text: "Mentora accepts voluntary donations via @mentora_su_bot in the form of Telegram Stars. A donation is project support, not a purchase or subscription; no additional features are unlocked. Stars refunds are possible on request within 21 days of payment — send /paysupport to the bot or reply to the thank-you message." },
          ].map((item, i) => (
            <Bullet key={i}>{item.label ? <><strong style={{ color: "var(--text)", fontWeight: 600 }}>{item.label}:</strong> {item.text}</> : item.text}</Bullet>
          ))}
        </ul>
      </section>

      <section id="auto-renewal" className={`${SECTION_CLS} scroll-mt-20`} style={SECTION_STYLE}>
        <SectionHeading n="04a" title="Automatic subscription renewal" />
        <p className="mb-3">
          When subscribing to Pro or Ultima you can opt in to automatic renewal. By enabling it
          you consent to storing your payment method with YooKassa and to subsequent charges
          without further confirmation on your side.
        </p>
        <ul className="space-y-2.5">
          {[
            "The charged amount matches the selected plan: ₽499/month or ₽2,990/year for Pro; ₽799/month or ₽5,990/year for Ultima. The amount does not change without your consent — we will give at least 14 days' notice of any price change.",
            "Charge frequency: once per selected period (monthly or yearly). The charge happens on the day the current paid period ends, or within 24 hours before it.",
            "Auto-renewal becomes available starting at level 2 (100 mentor points). This lets you evaluate the product before recurring charges begin.",
            "Your payment method is stored in encrypted form by YooKassa. Mentora only stores the token identifier and the last 4 digits of the card for display in your account.",
            "You can turn off auto-renewal at any time in your account on the /pricing page (the \"Auto-renew\" toggle) or by emailing hello@mentora.su. After disabling, the current paid period stays active until its end; no further charges occur.",
            "If a charge fails (insufficient funds, expired card, declined by the bank), we retry after 24 and 48 hours. After three failed attempts auto-renewal is disabled and the account is moved to Free at the end of the paid period.",
            "Every charge is confirmed by an electronic receipt (54-FZ) sent to the email on your profile.",
          ].map((text, i) => <Bullet key={i}>{text}</Bullet>)}
        </ul>
        <p className="mt-4 text-xs" style={{ color: "var(--text-muted)" }}>
          Payment service — YuMoney NBCO LLC, Bank of Russia licence №3510-K.
          All transactions are protected by 3-D Secure.
        </p>
      </section>

      <section className={SECTION_CLS} style={SECTION_STYLE}>
        <SectionHeading n="05" title="Acceptable use" />
        <p className="mb-3">When using the platform you may not:</p>
        <ul className="space-y-2.5">
          {[
            "Use the platform to create malicious, illegal, or abusive content.",
            "Attempt to bypass platform limits or gain unauthorised access to systems.",
            "Use automated tools for mass requests (bots, scripts).",
            "Resell platform access or share your account with third parties.",
            "Infringe copyright or other intellectual property rights.",
          ].map(text => <Bullet key={text} color={BULLET_RED}>{text}</Bullet>)}
        </ul>
      </section>

      <section className={SECTION_CLS} style={SECTION_STYLE}>
        <SectionHeading n="06" title="Content and intellectual property" />
        <p>
          All platform content (text, logos, interface, educational materials) is the
          intellectual property of Mentora and is protected by Russian Federation copyright law.
        </p>
        <p className="mt-3">
          The content you create in dialogues with the AI mentor belongs to you.
          You grant Mentora a non-exclusive licence to use this content to improve the service.
        </p>
      </section>

      <section className={SECTION_CLS} style={SECTION_STYLE}>
        <SectionHeading n="07" title="Limitation of liability" />
        <p>
          The AI mentor provides educational information for learning purposes.
          AI responses may contain inaccuracies — always verify important information
          against official sources. Mentora is not liable for decisions made on the basis
          of information provided by the AI mentor.
        </p>
        <p className="mt-3">
          The platform is provided &quot;as is&quot;. We strive for 24/7 availability but do not
          guarantee uninterrupted service.
        </p>
      </section>

      <section className={SECTION_CLS} style={SECTION_STYLE}>
        <SectionHeading n="08" title="Account termination" />
        <p>
          We reserve the right to suspend or delete accounts that violate these Terms.
          If we delete a paid account on our own initiative without a violation on your side,
          we refund the remaining portion of the paid period.
        </p>
        <p className="mt-3">
          You can delete your account at any time via settings or by contacting{" "}
          <a href="mailto:hello@mentora.su" style={{ color: "#4561E8" }} className="hover:underline">hello@mentora.su</a>.
        </p>
      </section>

      <section className={SECTION_CLS} style={SECTION_STYLE}>
        <SectionHeading n="09" title="Governing law" />
        <p>
          These Terms are governed by the laws of the Russian Federation. Disputes are
          resolved through pre-trial negotiation; if not possible, in the court at Mentora&apos;s
          place of registration.
        </p>
      </section>

      <section className={SECTION_CLS} style={SECTION_STYLE}>
        <SectionHeading n="10" title="Contact" />
        <p className="mb-3">For questions about these Terms:</p>
        <ul className="space-y-1.5">
          <li>Email: <a href="mailto:hello@mentora.su" style={{ color: "#4561E8" }} className="hover:underline font-medium">hello@mentora.su</a></li>
          <li>Website: <a href="https://mentora.su" style={{ color: "#4561E8" }} className="hover:underline">mentora.su</a></li>
        </ul>
      </section>

    </div>
  );
}

function CompanyDetails({ isEn }: { isEn: boolean }) {
  return (
    <section className="rounded-2xl border p-6 mt-6"
      style={{ borderColor: "rgba(69,97,232,0.25)", background: "rgba(69,97,232,0.04)" }}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: "rgba(69,97,232,0.12)" }}>
          <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="#4561E8" strokeWidth="1.5" strokeLinecap="round">
            <rect x="2" y="3" width="12" height="10" rx="1.5" />
            <path d="M5 7h6M5 9.5h4" />
          </svg>
        </div>
        <h2 className="font-semibold text-base" style={{ color: "var(--text)" }}>{isEn ? "Company details" : "Реквизиты"}</h2>
      </div>
      <div className="space-y-1.5 text-sm" style={{ color: "var(--text-secondary)" }}>
        <p>{isEn ? "Provider" : "Исполнитель"}: <span style={{ color: "var(--text)" }}>Belashov Andrey Vladimirovich</span></p>
        <p>{isEn ? "Tax ID (INN)" : "ИНН"}: <span style={{ color: "var(--text)" }}>325005748248</span></p>
        <p>{isEn ? "Status" : "Статус"}: <span style={{ color: "var(--text)" }}>{isEn ? "Self-employed (NPD, RF)" : "Самозанятый (НПД)"}</span></p>
        <p>Email: <a href="mailto:hello@mentora.su" style={{ color: "#4561E8" }} className="hover:underline">hello@mentora.su</a></p>
        <p>{isEn ? "Website" : "Сайт"}: <a href="https://mentora.su" style={{ color: "#4561E8" }} className="hover:underline">mentora.su</a></p>
      </div>
    </section>
  );
}

export default async function TermsPage() {
  const locale = await getLocale();
  const isEn = locale === "en";
  return (
    <div className="min-h-screen" style={{ background: "var(--bg)", color: "var(--text)" }}>

      <LandingNav alwaysLight />

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

        <div className="mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-3" style={{ color: "var(--text)" }}>
            {isEn ? "Terms of " : "Условия "}
            <span style={{
              background: "linear-gradient(120deg, #6B8FFF 0%, #4561E8 50%, #9F7AFF 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              {isEn ? "service" : "использования"}
            </span>
          </h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            {isEn ? "Last updated: March 28, 2026" : "Последнее обновление: 28 марта 2026 г."}
          </p>
        </div>

        {isEn ? <EnBody /> : <RuBody />}
        <CompanyDetails isEn={isEn} />

      </main>

      <PublicFooter />
    </div>
  );
}
