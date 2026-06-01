# Mentora UI Content Map
> Справочник всех наименований UI. Обновляй при переименовании.
> Сгенерировано 2026-05-29 из messages/ru.json + en.json (826 ключей)

---
## 1. Брендовые и системные наименования

Эти строки **хардкодированы** в компонентах (не в i18n). При изменении — грепать по кодовой базе.

| Наименование | Значение | Где встречается |
|---|---|---|
| `Mentora` | Название продукта | Logo.tsx, все email-шаблоны, meta-теги, page.tsx |
| `Me` | Часть логотипа (синяя «е») | Logo.tsx, MeLogo.tsx, SphereBlobScene |
| `mentora.su` | Домен | next.config.ts, email-шаблоны, sitemap |
| `FREE` | Наименование бесплатного тарифа в пиллах | DashboardStatsPills.tsx, FreeWindowPill.tsx, ChatInterface.tsx |
| `PRO` | Наименование Pro-тарифа в пиллах | DashboardStatsPills.tsx, ProBanners.tsx, pricing/page.tsx |
| `ULTRA` | Наименование Ultra-тарифа в пиллах | DashboardStatsPills.tsx, ProBanners.tsx, pricing/page.tsx |
| `ultima` | DB-значение плана Ultra (НЕ менять!) | Supabase: users.plan, все API routes |
| `Me [XP]` | Единица опыта (отображение XP) | DashboardStatsPills.tsx, leaderboard |
| `Стрик` | Streak — серия дней подряд | DashboardStatsPills.tsx, i18n: streakLabel |
| `Защита стрика` | Ultra-перк: авто-заморозка стрика при пропуске 1 дня | i18n: pricing.ultra.features; increment_xp(p_freeze_enabled); chat/route.ts |
| `Стрик-сейвер` | Вечерний email-нудж при риске потери стрика (+ апселл Ultra для Free/Pro) | api/cron/streak-saver, email.ts: streakSaverEmailHtml |
| `Менты` | Разговорное название XP | Только в коде/переменных — не в UI пока |
| `noreply@mentora.su` | Адрес отправителя писем | Supabase Auth SMTP, sendEmail.ts |
| `VERSION` | `6.0.0` — версия в футере | SiteFooter.tsx (const VERSION) |

---
## 2. Навигация

| Ключ i18n | RU | EN | Компонент |
|---|---|---|---|
| `nav.subjects` | Науки | Sciences | LandingNav, ConditionalNav |
| `nav.how` | Как работает | How it works | LandingNav, ConditionalNav |
| `nav.pricing` | Тарифы | Pricing | LandingNav, ConditionalNav |
| `nav.login` | Войти | Sign in | LandingNav, ConditionalNav |
| `nav.tryFree` | Попробовать бесплатно | Try for free | LandingNav, ConditionalNav |
| `nav.tryFreeShort` | Войти | Sign in | LandingNav, ConditionalNav |
| `nav.dashboard` | В кабинет | Dashboard | LandingNav, ConditionalNav |
| `nav.langSwitch` | EN | RU | LandingNav, ConditionalNav |
| `nav.closeMenu` | Закрыть меню | Close menu | LandingNav, ConditionalNav |
| `nav.openMenu` | Открыть меню | Open menu | LandingNav, ConditionalNav |
| `nav.repetitor` | Репетитор | Tutor | LandingNav, ConditionalNav |
| `nav.guide` | Гайд | Guide | LandingNav, ConditionalNav |

---
## 3. Тарифы и цены

| Ключ i18n | RU | EN |
|---|---|---|
| `buyPro.errorConnection` | Ошибка соединения. Попробуйте снова. | Connection error. Please try again. |
| `buyPro.errorGeneric` | Что-то пошло не так. Попробуйте снова. | Something went wrong. Please try again. |
| `buyPro.getAnnual` | Оформить годовой план | Get annual plan |
| `buyPro.getPro` | Попробовать Pro | Try Pro |
| `buyPro.getUltra` | Получить Ultra | Get Ultra |
| `buyPro.getUltraAnnual` | Оформить Ultra на год | Get Ultra annual |
| `buyPro.loading` | Переходим к оплате... | Redirecting to checkout... |
| `buyPro.proActive` | ✓ Подписка активна | ✓ Subscription active |
| `buyPro.ultraActive` | ✓ Ultra активна | ✓ Ultra is active |
| `pricing.activePro` | Pro активен | Pro active |
| `pricing.activeUltima` | Ultra активна | Ultra active |
| `pricing.badge` | Простые, честные тарифы | Simple, honest pricing |
| `pricing.currentPlan` | Текущий тариф | Current plan |
| `pricing.faqLabel` | Поддержка | Support |
| `pricing.faqTitle` | Часто спрашивают | Frequently asked |
| `pricing.footerCtaBtn` | Создать аккаунт бесплатно | Create free account |
| `pricing.footerCtaSub1` | Без привязки карты. | No card required. |
| `pricing.footerCtaSub2` | 10 сообщений / 8 часов — бесплатно навсегда. | 20 messages per day — free forever. |
| `pricing.footerCtaTagline` | Твой персональный AI-ментор | Your personal AI mentor |
| `pricing.footerCtaTitle1` | Начни там, где | Start where you |
| `pricing.footerCtaTitle2` | остановился. | left off. |
| `pricing.free.cta` | Начать бесплатно | Start for free |
| `pricing.free.desc` | Попробуй без привязки карты | Try without a card |
| `pricing.free.name` | Бесплатно | Free |
| `pricing.free.period` |  |  |
| `pricing.free.price` | 0 ₽ | 0 ₽ |
| `pricing.freeDesc` | Навсегда · без привязки карты | Forever · no card linking |
| `pricing.hero.subtitle` | Без скрытых платежей. Без договоров. Отмени в любой момент. | No hidden fees. No contracts. Cancel anytime. |
| `pricing.hero.title` | Начни бесплатно. | Start free. |
| `pricing.hero.titleGradient` | Расти вместе с нами. | Grow with us. |
| `pricing.pro.badge` | Популярный | Popular |
| `pricing.pro.cta` | Перейти на Pro | Upgrade to Pro |
| `pricing.pro.desc` | Для серьёзной учёбы | For serious learning |
| `pricing.pro.name` | Pro | Pro |
| `pricing.pro.period` | / месяц | / month |
| `pricing.pro.price` | 499 ₽ | 499 ₽ |
| `pricing.soon` | скоро | soon |
| `pricing.supportQuestion` | Остались вопросы? | Still have questions? |
| `pricing.ultra.badge` | Максимум | Maximum |
| `pricing.ultra.cta` | Перейти на Ultra | Upgrade to Ultra |
| `pricing.ultra.desc` | Для перфекционистов | For perfectionists |
| `pricing.ultra.name` | Ultra | Ultra |
| `pricing.ultra.period` | / месяц | / month |
| `pricing.ultra.price` | 799 ₽ | 799 ₽ |
| `probanners.expiresDayAfter` | послезавтра | the day after tomorrow |
| `probanners.expiresIn` | через {n} {days} | in {n} {days} |
| `probanners.expiresTomorrow` | завтра | tomorrow |
| `probanners.expiringDesc` | Продли подписку, чтобы не потерять безлимитный доступ. | Renew your subscription to keep unlimited access. |
| `probanners.expiringTitle` | Pro истекает {label} — {date} | Pro expires {label} — {date} |
| `probanners.proActivated` | Pro активирован! | Pro activated! |
| `probanners.proDesc` | Безлимитные сообщения активированы. Учись без ограничений! | Unlimited messages activated. Study without limits! |
| `probanners.renewBtn` | Продлить | Renew |
| `probanners.ultraActivated` | Ultra активирован! | Ultra activated! |
| `probanners.ultraDesc` | Безлимитные сообщения, фото задач и AI-иллюстрации — всё доступно прямо сейчас. | Unlimited messages, photo tasks and AI illustrations — all available right now. |

---
## 4. Дашборд

| Ключ i18n | RU | EN |
|---|---|---|
| `dashboard.chooseSubject` | Выбери науку | Choose a science |
| `dashboard.continueBtn` | Продолжить | Continue |
| `dashboard.continueLearning` | Продолжить обучение | Continue learning |
| `dashboard.continueSubject` | Продолжить | Continue |
| `dashboard.greeting` | Привет, {name} | Hello, {name} |
| `dashboard.level` | уровень | level |
| `dashboard.libraryTitle` | Библиотека знаний | Knowledge Library |
| `dashboard.logout` | Выйти | Sign out |
| `dashboard.messages` | Сообщений: | Messages: |
| `dashboard.nav.about` | О нас | About |
| `dashboard.nav.analytics` | Аналитика | Analytics |
| `dashboard.nav.galaxy` | Галактика | Galaxy |
| `dashboard.nav.galaxyFull` | Галактика знаний | Knowledge Galaxy |
| `dashboard.nav.home` | Главная | Home |
| `dashboard.nav.profile` | Профиль | Profile |
| `dashboard.nav.subjects` | Науки | Sciences |
| `dashboard.needHelp` | Нужна помощь? | Need help? |
| `dashboard.removeLimit` | Убрать лимит | Remove limit |
| `dashboard.streak` | дней подряд | day streak |
| `dashboard.streakBannerDesc` | Учись {n} {days} подряд и получи 3 дня Pro без привязки карты. | Learn {n} more days in a row and get 3 days Pro for free. |
| `dashboard.streakBannerProgress` | {current} из 7 дней → 3 дня Pro бесплатно | {current} of 7 days → 3 days of Pro for free |
| `dashboard.streakBannerStart` | Начни стрик — получи 3 дня Pro | Start a streak — get 3 days of Pro |
| `dashboard.streakDaysSuffix` | {n} день | {n} day |
| `dashboard.streakDaysSuffixPlural` | {n} дней | {n} days |
| `dashboard.streakLabel` | Стрик: | Streak: |
| `dashboard.subGreeting` | Продолжай учиться — прогресс накапливается каждый день | Keep learning — progress accumulates every day |
| `dashboard.support` | Поддержка | Support |
| `dashboard.totalXP` | опыта | total XP |
| `dashboard.trialActive` | Pro активен до {date} | Pro active until {date} |
| `dashboard.trialGenericMsg` | Пробный доступ активирован. Безлимитные сообщения работают. | Trial access activated. Unlimited messages are active. |
| `dashboard.trialStreakMsg` | Ты собрал 7-дневный стрик — и получил 3 дня Pro. Безлимитные сообщения уже работают. | You built a 7-day streak and got 3 days of Pro. Unlimited messages are now active. |
| `dashboard.trialUsedCta` | Оформи подписку | Subscribe |
| `dashboard.trialUsedDesc` | Понравилось? | Liked it? |
| `dashboard.trialUsedTitle` | Pro trial использован | Pro trial used |
| `dashboard.unlimitedMessages` | Безлимитные сообщения | Unlimited messages |
| `dashboard.welcome` | Добро пожаловать | Welcome |
| `dashboard.xpInRow` | дн. подряд | in a row |
| `dashboard.yourProgress` | Твой прогресс | Your progress |
| `stats.accuracy` | точность ответов AI | AI answer accuracy |
| `stats.availability` | доступен без VPN | available without VPN |
| `stats.free` | чтобы начать учиться | to start learning |
| `stats.subjects` | наук уже доступны | sciences available |
| `streakReward.cta` | Продолжить учёбу | Continue learning |
| `streakReward.days` | 7 дней подряд! | 7 days in a row! |
| `streakReward.desc` | Безлимитные сообщения разблокированы на 3 дня. Учись без ограничений — ты заслужил это. | Unlimited messages unlocked for 3 days. Study without limits — you earned it. |
| `streakReward.dismiss` | нажми куда угодно, чтобы закрыть | tap anywhere to close |
| `streakReward.free` | бесплатно — уже активировано | free — already activated |
| `streakReward.proDays` | 3 дня Pro | 3 days of Pro |

---
## 5. Чат

| Ключ i18n | RU | EN |
|---|---|---|
| `chat.aiMentor` | AI-ментор · Mentora | AI mentor · Mentora |
| `chat.cameraTitle` | Прикрепить фото задачи | Attach photo of a task |
| `chat.cancel` | Отмена | Cancel |
| `chat.closeAriaLabel` | Закрыть | Close |
| `chat.copied` | Скопировано | Copied |
| `chat.copy` | Копировать | Copy |
| `chat.disclaimer` | 10 сообщений / 8 часов · без привязки карты · бесплатно | 10 messages / 8 hours · no card linking · free |
| `chat.edit` | Изменить | Edit |
| `chat.errorGeneric` | Произошла ошибка. Попробуй ещё раз 🔄 | Something went wrong. Please try again 🔄 |
| `chat.errorNoInternet` | Нет связи с сервером. Проверь интернет и попробуй ещё раз 🔄 | No server connection. Check your internet and try again 🔄 |
| `chat.errorServer` | Сервер временно недоступен. Попробуй ещё раз 🔄 | Server temporarily unavailable. Please try again 🔄 |
| `chat.export` | Конспект | Notes |
| `chat.exportTitle` | Скачать конспект PDF | Download PDF notes |
| `chat.exporting` | Создаю... | Generating... |
| `chat.greeting` | Привет! Я твой ментор по теме «{subject}» | Hi! I'm your mentor for '{subject}' |
| `chat.help.fullGuide` | Подробный гайд | Full guide |
| `chat.help.tip1` | Задай любой вопрос — ментор объяснит простым языком | Ask any question — the mentor explains it simply |
| `chat.help.tip2` | Проси примеры, задачи или тесты — он адаптируется | Request examples, tasks or quizzes — it adapts |
| `chat.help.tip3` | Ctrl+Enter — отправить, Enter — перенос строки | Ctrl+Enter to send, Enter for a new line |
| `chat.help.title` | Как пользоваться | How to use |
| `chat.imageAlt` | Иллюстрация к ответу | AI-generated illustration |
| `chat.imageAttached` | Фото прикреплено — напиши вопрос или отправь сразу | Photo attached — add a question or send as is |
| `chat.imageCaption` | Иллюстрация сгенерирована AI | Illustration generated by AI |
| `chat.imagePhotoAlt` | Фото задачи | Task photo |
| `chat.levelUp.close` | Закрыть | Close |
| `chat.levelUp.label` | Новый уровень | New level |
| `chat.limit.proCta` | Pro — безлимитный доступ | Pro — unlimited access |
| `chat.limit.resetsAt` | Обновится в 00:00 UTC | Resets at 00:00 UTC |
| `chat.limit.support` | Есть вопросы? Поддержка | Questions? Support |
| `chat.limit.title` | Лимит на сегодня исчерпан | Daily limit reached |
| `chat.native.button` | Режим носителя | Native mode |
| `chat.native.buttonActive` | Native mode · выйти | Native mode · exit |
| `chat.native.hintDismiss` | Скрыть подсказку | Dismiss tip |
| `chat.native.hintText` | Нажми кнопку ниже — и Ментора перейдёт на живой английский как native speaker | Press the button below and Mentora will switch to natural English like a native speaker |
| `chat.native.hintTitle` | Подсказка: | Tip: |
| `chat.placeholder` | Задай вопрос... | Ask a question... |
| `chat.placeholderWithImage` | Задай вопрос к фото (или отправь без текста)... | Ask about the photo (or send without text)... |
| `chat.remainingFull` | осталось {n} из {limit} | {n} of {limit} left |
| `chat.remainingShort` | {n} | {n} |
| `chat.retry` | Повторить запрос | Retry |
| `chat.save` | Сохранить | Save |
| `chat.softBannerCta` | Зарегистрируйся — 10 / 8 ч бесплатно | Sign up — 10 per 8 hrs free |
| `chat.subjects.astronomy.hint` | Спроси про планеты, звёзды, галактики или историю космонавтики | Ask about planets, stars, galaxies, or the history of space exploration |
| `chat.subjects.astronomy.q1` | Расскажи о Солнечной системе | Tell me about the Solar System |
| `chat.subjects.astronomy.q2` | Что такое чёрная дыра? | What is a black hole? |
| `chat.subjects.astronomy.q3` | Жизненный цикл звезды | Life cycle of a star |
| `chat.subjects.biology.hint` | Спроси про живые организмы, эволюцию, генетику или экосистемы | Ask about living organisms, evolution, genetics or ecosystems |
| `chat.subjects.biology.q1` | Объясни строение клетки | Explain cell structure |
| `chat.subjects.biology.q2` | Как работает ДНК? | How does DNA work? |
| `chat.subjects.biology.q3` | Что такое естественный отбор? | What is natural selection? |
| `chat.subjects.chemistry.hint` | Спроси про химические реакции, элементы таблицы Менделеева или органическую химию | Ask about chemical reactions, the periodic table, or organic chemistry |
| `chat.subjects.chemistry.q1` | Объясни строение атома | Explain atomic structure |
| `chat.subjects.chemistry.q2` | Что такое ОВР? | What is a redox reaction? |
| `chat.subjects.chemistry.q3` | Как работает таблица Менделеева? | How does the periodic table work? |
| `chat.subjects.computer-science.hint` | Спроси про алгоритмы, программирование, сети или IT | Ask about algorithms, programming, networks, or IT |
| `chat.subjects.computer-science.q1` | Что такое алгоритм? | What is an algorithm? |
| `chat.subjects.computer-science.q2` | Как работает интернет? | How does the internet work? |
| `chat.subjects.computer-science.q3` | С чего начать программирование? | Where to start with programming? |
| `chat.subjects.default.hint` | Задай любой вопрос — я помогу разобраться | Ask me anything — I'll help you figure it out |
| `chat.subjects.default.q1` | С чего начать изучение? | Where should I start? |
| `chat.subjects.default.q2` | Объясни основные понятия | Explain the key concepts |
| `chat.subjects.default.q3` | Дай план изучения | Give me a study plan |
| `chat.subjects.discovery.hint` | Задай любой вопрос — наука, история, культура, природа. Или просто скажи «удиви меня» | Ask anything — science, history, culture, nature. Or just say 'surprise me' |
| `chat.subjects.discovery.q1` | Удиви меня интересным фактом | Surprise me with an interesting fact |
| `chat.subjects.discovery.q2` | Самое необычное в природе | The strangest things in nature |
| `chat.subjects.discovery.q3` | Загадочные цивилизации древности | Mysterious ancient civilizations |
| `chat.subjects.economics.hint` | Спроси про экономику, финансы, рынки или макроэкономику | Ask about economics, finance, markets, or macroeconomics |
| `chat.subjects.economics.q1` | Что такое ВВП? | What is GDP? |
| `chat.subjects.economics.q2` | Как работает инфляция? | How does inflation work? |
| `chat.subjects.economics.q3` | Что такое спрос и предложение? | What is supply and demand? |
| `chat.subjects.english.hint` | Let's practice English — grammar, vocabulary, speaking or writing | Let's practice English — grammar, vocabulary, speaking or writing |
| `chat.subjects.english.q1` | Explain Present Perfect vs Past Simple | Explain Present Perfect vs Past Simple |
| `chat.subjects.english.q2` | How to use articles? | How to use articles? |
| `chat.subjects.english.q3` | Help me write a letter in English | Help me write a letter in English |
| `chat.subjects.geography.hint` | Спроси про страны, климат, рельеф или природные зоны | Ask about countries, climate, terrain, or natural zones |
| `chat.subjects.geography.q1` | Климатические пояса Земли | Climate zones of the Earth |
| `chat.subjects.geography.q2` | Что такое тектоника плит? | What is plate tectonics? |
| `chat.subjects.geography.q3` | Природные ресурсы России | Natural resources of Russia |
| `chat.subjects.literature.hint` | Обсудим произведения русской и мировой литературы | Let's discuss works of Russian and world literature |
| `chat.subjects.literature.q1` | Расскажи о «Война и мир» | Tell me about 'War and Peace' |
| `chat.subjects.literature.q2` | Кто такой Достоевский? | Who was Dostoevsky? |
| `chat.subjects.literature.q3` | Помоги с анализом стихотворения | Help me analyze a poem |
| `chat.subjects.mathematics.hint` | Задай вопрос по алгебре, геометрии, анализу или теории вероятностей | Ask about algebra, geometry, calculus or probability theory |
| `chat.subjects.mathematics.q1` | Объясни теорему Пифагора | Explain the Pythagorean theorem |
| `chat.subjects.mathematics.q2` | Как решать квадратные уравнения? | How to solve quadratic equations? |
| `chat.subjects.mathematics.q3` | Что такое производная? | What is a derivative? |
| `chat.subjects.philosophy.hint` | Обсудим философские концепции, этику, логику или историю мысли | Let's discuss philosophical concepts, ethics, logic, or history of thought |
| `chat.subjects.philosophy.q1` | Что такое философия? | What is philosophy? |
| `chat.subjects.philosophy.q2` | Объясни идеи Платона | Explain Plato's ideas |
| `chat.subjects.philosophy.q3` | Что такое этика? | What is ethics? |
| `chat.subjects.physics.hint` | Спроси про законы физики, явления природы или реши задачу вместе со мной | Ask about physics laws, natural phenomena, or solve a problem together |
| `chat.subjects.physics.q1` | Объясни законы Ньютона | Explain Newton's laws |
| `chat.subjects.physics.q2` | Что такое электромагнитная индукция? | What is electromagnetic induction? |
| `chat.subjects.physics.q3` | Как работает ядерный реактор? | How does a nuclear reactor work? |
| `chat.subjects.psychology.hint` | Спроси про психологию личности, когнитивные процессы или поведение людей | Ask about personality psychology, cognitive processes, or human behavior |
| `chat.subjects.psychology.q1` | Что такое когнитивные искажения? | What are cognitive biases? |
| `chat.subjects.psychology.q2` | Как работает память? | How does memory work? |
| `chat.subjects.psychology.q3` | Объясни теорию Маслоу | Explain Maslow's hierarchy |
| `chat.subjects.russian-history.hint` | Спроси о любом периоде истории России — от древней Руси до современности | Ask about any period of Russian history — from ancient Rus to modern times |
| `chat.subjects.russian-history.q1` | Расскажи о Петре I и его реформах | Tell me about Peter the Great and his reforms |
| `chat.subjects.russian-history.q2` | Что такое Смутное время? | What was the Time of Troubles? |
| `chat.subjects.russian-history.q3` | Как началась Великая Отечественная война? | How did World War II begin for the USSR? |
| `chat.subjects.russian-language.hint` | Спроси про правила орфографии, пунктуации или грамматики | Ask about spelling, punctuation, or grammar rules |
| `chat.subjects.russian-language.q1` | НЕ с разными частями речи | Negation with НЕ for different parts of speech |
| `chat.subjects.russian-language.q2` | Как расставлять запятые? | How to place commas correctly? |
| `chat.subjects.russian-language.q3` | Что такое причастный оборот? | What is a participial phrase? |
| `chat.subjects.social-studies.hint` | Спроси про государство, право, экономику или социальные явления | Ask about government, law, economics, or social phenomena |
| `chat.subjects.social-studies.q1` | Что такое разделение властей? | What is separation of powers? |
| `chat.subjects.social-studies.q2` | Основы рыночной экономики | Basics of market economy |
| `chat.subjects.social-studies.q3` | Как устроена Конституция РФ? | How is the Constitution structured? |
| `chat.subjects.world-history.hint` | Спроси о любом историческом событии или эпохе мировой истории | Ask about any historical event or era in world history |
| `chat.subjects.world-history.q1` | Расскажи о Первой мировой войне | Tell me about World War I |
| `chat.subjects.world-history.q2` | Что такое эпоха Возрождения? | What was the Renaissance? |
| `chat.subjects.world-history.q3` | Как возникла Римская империя? | How did the Roman Empire rise? |
| `chat.topicPrefix` | Расскажи про:  | Tell me about:  |
| `chat.ui.defaultHint` | Задай любой вопрос — я помогу разобраться | Ask anything — I will help you understand |
| `chat.ui.defaultQ1` | С чего начать изучение? | Where to start studying? |
| `chat.ui.defaultQ2` | Объясни основные понятия | Explain the basic concepts |
| `chat.ui.defaultQ3` | Дай план изучения | Give me a study plan |
| `chat.ui.errorConnection` | Нет связи с сервером. Проверь интернет и попробуй ещё раз 🔄 | No connection to server. Check your internet and try again 🔄 |
| `chat.ui.errorGeneric` | Произошла ошибка. Попробуй ещё раз 🔄 | An error occurred. Please try again 🔄 |
| `chat.ui.errorServer` | Сервер временно недоступен. Попробуй ещё раз 🔄 | Server is temporarily unavailable. Please try again 🔄 |
| `chat.ui.limitReachedDesc` | Ты использовал все {n} бесплатных сообщений на сегодня. | You have used all {n} free messages for today. |
| `chat.ui.limitReachedTitle` | Лимит на сегодня исчерпан | Daily limit reached |
| `chat.ui.limitReset` | Лимит сбросится в полночь UTC. | Limit resets at midnight UTC. |
| `chat.ui.upgradeBtn` | Перейти на Pro | Upgrade to Pro |
| `chat.writingTipClose` | Понятно | Got it |
| `chat.writingTipLabel` | 💡 Совет | 💡 Tip |
| `chat.writingTipTitle` | Пиши целостно | Write whole thoughts |

---
## 6. Науки (предметы)

| Ключ i18n | RU | EN | Slug |
|---|---|---|---|
| `subjects.astronomy.title` | Астрономия | Astronomy | `astronomy` |
| `subjects.biology.title` | Биология | Biology | `biology` |
| `subjects.chemistry.title` | Химия | Chemistry | `chemistry` |
| `subjects.computer-science.title` | Информатика | Computer Science | `computer-science` |
| `subjects.discovery.title` | Кругозор | Discovery | `discovery` |
| `subjects.economics.title` | Экономика | Economics | `economics` |
| `subjects.english.title` | Английский язык | English | `english` |
| `subjects.geography.title` | География | Geography | `geography` |
| `subjects.literature.title` | Литература | Literature | `literature` |
| `subjects.mathematics.title` | Математика | Mathematics | `mathematics` |
| `subjects.philosophy.title` | Философия | Philosophy | `philosophy` |
| `subjects.physics.title` | Физика | Physics | `physics` |
| `subjects.psychology.title` | Психология | Psychology | `psychology` |
| `subjects.russian-history.title` | История России | Russian History | `russian-history` |
| `subjects.russian-language.title` | Русский язык | Russian Language | `russian-language` |
| `subjects.social-studies.title` | Обществознание | Social Studies | `social-studies` |
| `subjects.suggest.title` | Предложить тему | Suggest a subject | `suggest` |
| `subjects.world-history.title` | Всемирная история | World History | `world-history` |

---
## 7. Авторизация

| Ключ i18n | RU | EN |
|---|---|---|
| `auth.and` | и | and |
| `auth.checkEmail` | Проверь почту | Check your email |
| `auth.checkEmailActivate` | Перейди по ссылке, чтобы активировать аккаунт. | Click the link to activate your account. |
| `auth.checkEmailDesc` | Мы отправили ссылку для входа на | We sent a sign-in link to |
| `auth.checkEmailNoReceive` | Не получил письмо? Проверь «Спам» или | Didn't receive it? Check Spam or |
| `auth.checkingTelegram` | Проверяем Telegram... | Checking Telegram... |
| `auth.continueGoogle` | Продолжить через Google | Continue with Google |
| `auth.continueLearn` | Войди чтобы продолжить учёбу | Sign in to continue learning |
| `auth.createAccountBtn` | Создать аккаунт | Create account |
| `auth.createFreeAccount` | Создай аккаунт бесплатно | Create a free account |
| `auth.email` | Email | Email |
| `auth.emailPlaceholder` | your@email.com | your@email.com |
| `auth.errorCaptcha` | Не прошла проверка капчи. Попробуй снова. | Captcha verification failed. Please try again. |
| `auth.errorConnect` | Не удалось подключиться. Попробуй ещё раз. | Couldn't connect. Please try again. |
| `auth.errorCredentials` | Неверный email или пароль. | Incorrect email or password. |
| `auth.errorEmailExists` | Этот email уже зарегистрирован. Войди или восстанови пароль. | This email is already registered. Sign in or reset your password. |
| `auth.errorOAuth` | Ошибка входа через внешний сервис. Попробуй снова. | Sign-in error. Please try again. |
| `auth.errorRobot` | Пожалуйста, подтверди, что ты не робот. | Please confirm you're not a robot. |
| `auth.errorTelegramFailed` | Не удалось войти через Telegram. Попробуй ещё раз. | Couldn't sign in via Telegram. Try again. |
| `auth.errorTelegramLogin` | Ошибка входа через Telegram:  | Telegram sign-in error:  |
| `auth.errorTelegramUnavailable` | Telegram недоступен. Попробуй обновить страницу или использовать VPN. | Telegram unavailable. Try refreshing the page. |
| `auth.forgotPassword` | Забыл пароль? | Forgot password? |
| `auth.hasAccount` | Уже есть аккаунт? | Already have an account? |
| `auth.leftHeading1` | Задай вопрос, | Ask the question |
| `auth.leftHeading2` | который не решаешься | you can't bring yourself |
| `auth.leftHeading3` | произнести вслух. | to say out loud. |
| `auth.leftStats1` | 17 наук | 17 sciences |
| `auth.leftStats2` | Без VPN | No VPN |
| `auth.leftStats3` | Без привязки карты | No card linking |
| `auth.leftSubtitle` | Ментора не осуждает. Объясняет столько раз, сколько нужно — на твоём языке. | Mentora doesn't judge. It explains as many times as needed — in your own words. |
| `auth.leftTagline` | Персональный AI-ментор | Personal AI mentor |
| `auth.loading` | Загрузка... | Loading... |
| `auth.noAccount` | Нет аккаунта? | Don't have an account? |
| `auth.noCard` | Без привязки карты · Без обязательств | No card linking · No commitment |
| `auth.orEmail` | или через email | or with email |
| `auth.password` | Пароль | Password |
| `auth.passwordPlaceholder` | Минимум 6 символов | At least 6 characters |
| `auth.passwordPlaceholderSignIn` | •••••••• | •••••••• |
| `auth.privacyLink` | политикой конфиденциальности | privacy policy |
| `auth.sending` | Отправляем... | Sending... |
| `auth.signIn` | Войти | Sign in |
| `auth.signInBtn` | Войти | Sign in |
| `auth.signInTelegram` | Войти через Telegram | Sign in with Telegram |
| `auth.signUp` | Зарегистрироваться | Create account |
| `auth.signUpFreeLink` | Зарегистрироваться бесплатно | Sign up for free |
| `auth.signUpTab` | Регистрация | Register |
| `auth.signingIn` | Входим... | Signing in... |
| `auth.signingInTelegram` | Входим через Telegram... | Signing in via Telegram... |
| `auth.switchToSignIn` | Уже есть аккаунт? Войти | Already have an account? Sign in |
| `auth.switchToSignUp` | Нет аккаунта? Зарегистрироваться | No account? Sign up |
| `auth.telegramUnavailable` | Telegram недоступен без VPN | Telegram unavailable without VPN |
| `auth.terms` | Регистрируясь, ты соглашаешься с | By signing up, you agree to our |
| `auth.termsLink` | условиями | terms |
| `auth.tryAgain` | попробуй снова | try again |
| `auth.welcomeBack` | С возвращением | Welcome back |

---
## 8. Общие элементы (common)

| Ключ i18n | RU | EN |
|---|---|---|
| `common.back` | Назад | Back |
| `common.close` | Закрыть | Close |
| `common.error` | Что-то пошло не так | Something went wrong |
| `common.free` | бесплатно | free |
| `common.learnMore` | Узнать больше | Learn more |
| `common.loading` | Загрузка... | Loading... |
| `common.new` | новое | new |
| `common.perMonth` | / мес | / mo |
| `common.soon` | скоро | soon |
| `common.switchLang` | Переключить на русский | Switch to English |
| `common.tryAgain` | Попробовать снова | Try again |
| `common.unlimited` | безлимит | unlimited |

---
## 9. Email-шаблоны

Управляются через **Supabase Dashboard → Authentication → Email Templates**. Не в кодовой базе.

| Шаблон | Заголовок | Переменные |
|---|---|---|
| Confirm sign up | Подтверди email | `{{ .ConfirmationURL }}` |
| Invite user | Тебя пригласили | `{{ .ConfirmationURL }}` |
| Magic link or OTP | Войти в Mentora | `{{ .ConfirmationURL }}` |
| Reset password | Восстановление пароля | `{{ .ConfirmationURL }}` |
| Change email address | Подтверди новый email | `{{ .ConfirmationURL }}` |
| Reauthentication | Код подтверждения | `{{ .Token }}` |

---
## 10. Чеклист переименования

### Если меняешь название тарифа (например «Ultra» → «Max»)
- [ ] `messages/ru.json` + `messages/en.json` — все ключи с `ultra`/`Ultra`
- [ ] `DashboardStatsPills.tsx` — хардкод `ULTRA`
- [ ] `ProBanners.tsx` — хардкод
- [ ] `pricing/page.tsx` — хардкод
- [ ] `ChatInterface.tsx` — хардкод
- [ ] Supabase DB: **НЕ менять** `users.plan = 'ultima'` — обратная совместимость
- [ ] Email-шаблоны в Supabase Dashboard

### Если меняешь название науки (slug)
- [ ] `messages/ru.json` + `messages/en.json` — ключ `subjects.<slug>.*`
- [ ] Supabase DB: `subjects.id` — придётся мигрировать
- [ ] `src/lib/subjects.ts` или аналог — массив предметов
- [ ] URL-роуты — автоматически из slug

### Если меняешь «Менты» / «XP» на другое название
- [ ] `messages/ru.json` — ключ `stats.xp`, `dashboard.xpLabel`
- [ ] `DashboardStatsPills.tsx` — popup текст
- [ ] `leaderboard` компоненты — заголовки
- [ ] `MeLogo.tsx` — если меняется буква «M» в иконке
