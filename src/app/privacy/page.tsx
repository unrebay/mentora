import Link from "next/link";
import Logo from "@/components/Logo";

export const metadata = {
  title: "Политика конфиденциальности",
  description: "Политика конфиденциальности образовательной платформы Mentora",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen s-page t-primary">
      {/* NAV */}
      <nav className="sticky top-0 z-50 s-page/90 backdrop-blur border-b b-subtle px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Logo size="sm" fontSize="1.44rem" />
          <Link
            href="/auth"
            className="px-5 py-2.5 bg-gray-900 dark:bg-[var(--bg-secondary)] dark:bg-[var(--bg)] text-white text-sm font-medium rounded-xl hover:bg-gray-700 dark:bg-[var(--border)] transition-colors"
          >
            Попробовать бесплатно →
          </Link>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold mb-2">Политика конфиденциальности</h1>
        <p className="t-muted text-sm mb-12">Последнее обновление: 28 марта 2026 г.</p>

        <div className="prose prose-gray max-w-none space-y-10 t-secondary leading-relaxed">

          <section>
            <h2 className="text-xl font-semibold t-primary mb-3">1. Общие положения</h2>
            <p>
              Настоящая Политика конфиденциальности (далее — «Политика») описывает, как ИП Андрей Унребай
              (далее — «Mentora», «мы», «нас») собирает, использует и защищает персональные данные
              пользователей образовательной платформы Mentora, доступной по адресу{" "}
              <a href="https://mentora.su" className="text-blue-600 hover:underline">mentora.su</a>.
            </p>
            <p className="mt-3">
              Используя платформу, вы соглашаетесь с условиями настоящей Политики. Если вы не согласны
              с какими-либо положениями, пожалуйста, прекратите использование платформы.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold t-primary mb-3">2. Какие данные мы собираем</h2>
            <p>При использовании платформы мы можем собирать следующие данные:</p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li><strong>Данные аккаунта:</strong> адрес электронной почты, имя (при указании), фотография профиля (при входе через Google).</li>
              <li><strong>Данные об обучении:</strong> выбранные предметы и темы, история диалогов с AI-ментором, прогресс, уровень XP, стрик.</li>
              <li><strong>Технические данные:</strong> IP-адрес, тип браузера, операционная система, страницы, которые вы посещаете, время и продолжительность сессий.</li>
              <li><strong>Платёжные данные:</strong> при оформлении подписки — обрабатываются платёжным провайдером, мы не храним данные карт.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold t-primary mb-3">3. Как мы используем данные</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Предоставление и улучшение образовательных услуг платформы.</li>
              <li>Персонализация обучения: адаптация стиля и подачи материала под вас.</li>
              <li>Отправка уведомлений об обучении, новых функциях и акциях (с вашего согласия).</li>
              <li>Обеспечение безопасности и предотвращение мошенничества.</li>
              <li>Выполнение требований законодательства Российской Федерации.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold t-primary mb-3">4. Передача данных третьим лицам</h2>
            <p>Мы не продаём ваши персональные данные. Мы можем передавать данные только:</p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li><strong>Supabase</strong> — хранение базы данных и аутентификация (серверы в ЕС).</li>
              <li><strong>Anthropic</strong> — обработка диалогов с AI-ментором (данные не используются для обучения моделей без согласия).</li>
              <li><strong>Resend</strong> — отправка транзакционных email-сообщений.</li>
              <li><strong>Vercel</strong> — хостинг платформы.</li>
              <li>Государственным органам — по требованию законодательства РФ.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold t-primary mb-3">5. Хранение и защита данных</h2>
            <p>
              Ваши данные хранятся на защищённых серверах. Мы используем шифрование HTTPS,
              ограниченный доступ к данным и регулярный аудит безопасности. Данные хранятся
              в течение всего срока действия вашего аккаунта и 90 дней после его удаления.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold t-primary mb-3">6. Ваши права</h2>
            <p>В соответствии с Федеральным законом № 152-ФЗ «О персональных данных» вы вправе:</p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>Получить информацию о том, какие данные мы храним о вас.</li>
              <li>Исправить неточные данные.</li>
              <li>Удалить свой аккаунт и все связанные данные.</li>
              <li>Отозвать согласие на обработку данных.</li>
              <li>Получить копию ваших данных в машиночитаемом формате.</li>
            </ul>
            <p className="mt-3">
              Для реализации прав обратитесь по адресу:{" "}
              <a href="mailto:hello@mentora.su" className="text-blue-600 hover:underline">hello@mentora.su</a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold t-primary mb-3">7. Cookies</h2>
            <p>
              Мы используем cookies для обеспечения работы платформы (авторизация, сессии)
              и аналитики (анонимизированная статистика посещений). Вы можете отключить cookies
              в настройках браузера, однако это может повлиять на работу платформы.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold t-primary mb-3">8. Дети</h2>
            <p>
              Платформа предназначена для пользователей от 14 лет. Мы не собираем намеренно
              данные детей младше 14 лет. Если вам стало известно о таком случае,
              свяжитесь с нами по адресу{" "}
              <a href="mailto:hello@mentora.su" className="text-blue-600 hover:underline">hello@mentora.su</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold t-primary mb-3">9. Изменения Политики</h2>
            <p>
              Мы можем обновлять настоящую Политику. О существенных изменениях уведомим
              по email или через уведомление на платформе. Продолжение использования платформы
              после уведомления означает согласие с обновлённой Политикой.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold t-primary mb-3">10. Контакты</h2>
            <p>По вопросам конфиденциальности обращайтесь:</p>
            <ul className="list-none mt-3 space-y-1">
              <li>Email: <a href="mailto:hello@mentora.su" className="text-blue-600 hover:underline">hello@mentora.su</a></li>
              <li>Сайт: <a href="https://mentora.su" className="text-blue-600 hover:underline">mentora.su</a></li>
            </ul>
          </section>

        </div>
      </main>

      {/* FOOTER */}
      <footer className="border-t b-subtle py-8 mt-16">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm t-muted">
          <span>© 2026 Mentora</span>
          <div className="flex gap-6">
            <Link href="/privacy" className="t-primary font-medium">Конфиденциальность</Link>
            <Link href="/terms" className="hover:t-secondary transition-colors">Условия</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
