import Link from "next/link";
import Logo from "@/components/Logo";

export const metadata = {
  title: "Условия использования",
  description: "Условия использования образовательной платформы Mentora",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* NAV */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Logo size="sm" fontSize="1.44rem" />
          <Link
            href="/auth"
            className="px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-700 transition-colors"
          >
            Попробовать бесплатно →
          </Link>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold mb-2">Условия использования</h1>
        <p className="text-gray-400 text-sm mb-12">Последнее обновление: 28 марта 2026 г.</p>

        <div className="prose prose-gray max-w-none space-y-10 text-gray-700 leading-relaxed">

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Общие положения</h2>
            <p>
              Настоящие Условия использования (далее — «Условия») регулируют отношения между
              ИП Андрей Унребай (далее — «Mentora», «мы») и пользователем (далее — «вы»)
              образовательной платформы Mentora, доступной по адресу{" "}
              <a href="https://mentora.su" className="text-blue-600 hover:underline">mentora.su</a>.
            </p>
            <p className="mt-3">
              Регистрируясь или используя платформу, вы подтверждаете, что прочитали,
              поняли и согласны с настоящими Условиями.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Описание услуги</h2>
            <p>
              Mentora — образовательная платформа на основе искусственного интеллекта,
              которая предоставляет персонализированное обучение по различным предметам
              через диалог с AI-ментором. Платформа работает в режиме 24/7 и доступна
              через веб-браузер.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Регистрация и аккаунт</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Для полного доступа к платформе необходима регистрация.</li>
              <li>Вы обязаны предоставить достоверные данные при регистрации.</li>
              <li>Вы несёте ответственность за сохранность данных для входа.</li>
              <li>Один человек — один аккаунт. Передача аккаунта третьим лицам запрещена.</li>
              <li>Минимальный возраст для регистрации — 14 лет.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Тарифы и оплата</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Бесплатный план (Free):</strong> ограниченный доступ к функциям платформы без оплаты.</li>
              <li><strong>Pro-план:</strong> расширенный доступ за 499 ₽/месяц или 3 990 ₽/год.</li>
              <li>Оплата производится заранее за выбранный период.</li>
              <li>Подписка автоматически продлевается, если не отменена до конца периода.</li>
              <li>Возврат средств осуществляется в течение 14 дней с момента оплаты при отсутствии значительного использования сервиса.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Правила использования</h2>
            <p>При использовании платформы запрещается:</p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>Использовать платформу для создания вредоносного, незаконного или оскорбительного контента.</li>
              <li>Пытаться обойти ограничения платформы или получить несанкционированный доступ к системам.</li>
              <li>Использовать автоматизированные инструменты для массовых запросов (боты, скрипты).</li>
              <li>Перепродавать доступ к платформе или делиться аккаунтом с третьими лицами.</li>
              <li>Нарушать авторские права и интеллектуальную собственность.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Контент и интеллектуальная собственность</h2>
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

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Ограничение ответственности</h2>
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

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Прекращение доступа</h2>
            <p>
              Мы оставляем за собой право приостановить или удалить аккаунт при нарушении
              настоящих Условий. При удалении платного аккаунта по нашей инициативе
              без нарушения условий с вашей стороны — возвращаем остаток оплаченного периода.
            </p>
            <p className="mt-3">
              Вы можете удалить свой аккаунт в любое время через настройки или обратившись
              по адресу <a href="mailto:hello@mentora.su" className="text-blue-600 hover:underline">hello@mentora.su</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Применимое право</h2>
            <p>
              Настоящие Условия регулируются законодательством Российской Федерации.
              Все споры решаются в досудебном порядке, а при невозможности — в суде
              по месту регистрации Mentora.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Контакты</h2>
            <p>По вопросам, связанным с настоящими Условиями:</p>
            <ul className="list-none mt-3 space-y-1">
              <li>Email: <a href="mailto:hello@mentora.su" className="text-blue-600 hover:underline">hello@mentora.su</a></li>
              <li>Сайт: <a href="https://mentora.su" className="text-blue-600 hover:underline">mentora.su</a></li>
            </ul>
          </section>

        </div>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-gray-100 py-8 mt-16">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-400">
          <span>© 2026 Mentora</span>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-gray-700 transition-colors">Конфиденциальность</Link>
            <Link href="/terms" className="text-gray-900 font-medium">Условия</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
