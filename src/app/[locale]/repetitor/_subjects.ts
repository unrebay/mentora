/**
 * SEO-данные для /repetitor/[subject] dynamic route.
 * Заточено под Wordstat-ключи: «репетитор по {предмету}», «учить {предмет} онлайн».
 *
 * id          — соответствует SUBJECTS[i].id из src/lib/types.ts
 * url         — slug в URL (часто кириллица для лучшего CTR в RU SERP)
 * ru.title    — H1 на странице и в title (без бренда)
 * ru.kw       — ключевой запрос для description («репетитор по X», «учить X онлайн»)
 * ru.topics   — 3-4 темы для description
 * ru.exQ/exA  — пример диалога с ИИ-ментором
 */
export type SubjectLanding = {
  id: string;
  url: string;
  ru: { title: string; kw: string; topics: string; exQ: string; exA: string };
  en: { title: string; kw: string; topics: string; exQ: string; exA: string };
};

export const SUBJECT_LANDINGS: SubjectLanding[] = [
  {
    id: "russian-history",
    url: "istoriya-rossii",
    ru: {
      title: "Истории России",
      kw: "репетитор по истории России",
      topics: "Древняя Русь, Смутное время, империя, СССР, современность",
      exQ: "Объясни Смутное время как историю, не учебником.",
      exA: "1598 год, Москва. Умирает последний Рюрикович — Фёдор Иоаннович. Без наследника. Дальше — Борис Годунов, Лжедмитрий, Семибоярщина, поляки в Кремле. Хочешь чтобы я рассказал по годам или по личностям?",
    },
    en: {
      title: "Russian History",
      kw: "Russian history tutor",
      topics: "Kievan Rus, the Time of Troubles, the Empire, USSR, modern era",
      exQ: "Tell me about the Time of Troubles like a story, not a textbook.",
      exA: "1598, Moscow. The last Rurikid tsar dies without an heir. What follows is Boris Godunov, a fake Dmitry, the Seven Boyars, Polish troops in the Kremlin. Want it year-by-year or person-by-person?",
    },
  },
  {
    id: "world-history",
    url: "vsemirnaya-istoriya",
    ru: {
      title: "Всемирной истории",
      kw: "репетитор по всемирной истории",
      topics: "древние цивилизации, Средневековье, революции, мировые войны",
      exQ: "Почему Римская империя рухнула?",
      exA: "Если коротко — не от одной причины, а от 5 одновременно: внутренний кризис, инфляция, варварские миграции, разделение на Запад и Восток, и слабые армии. Раскрутить какую-то из них?",
    },
    en: {
      title: "World History",
      kw: "world history tutor",
      topics: "ancient civilizations, the Middle Ages, revolutions, world wars",
      exQ: "Why did the Roman Empire fall?",
      exA: "Short version — not one reason but five at once: internal political crisis, runaway inflation, barbarian migrations, the East-West split, and weakening armies. Want me to unpack any of those?",
    },
  },
  {
    id: "mathematics",
    url: "matematike",
    ru: {
      title: "Математике",
      kw: "репетитор по математике",
      topics: "алгебра, геометрия, тригонометрия, начала анализа, подготовка к ЕГЭ",
      exQ: "Объясни производную как 12-летнему.",
      exA: "Окей. Производная — это «как быстро меняется» что-то. Если ты идёшь и пройдёшь 6 км за час — твоя «скорость» (производная пройденного пути) = 6 км/ч. Если ускоришься — производная вырастет. Формула, конечно, посложнее, но смысл один. Покажу на f(x) = x²?",
    },
    en: {
      title: "Mathematics",
      kw: "math tutor",
      topics: "algebra, geometry, trigonometry, calculus basics, SAT/AP prep",
      exQ: "Explain derivatives like I'm 12.",
      exA: "Sure. A derivative is «how fast something is changing». If you walk 6 km in an hour, your «speed» (the derivative of distance) is 6 km/h. Speed up — derivative goes up. Want me to show it on f(x) = x²?",
    },
  },
  {
    id: "physics",
    url: "fizike",
    ru: {
      title: "Физике",
      kw: "репетитор по физике",
      topics: "механика, термодинамика, электричество, оптика, квантовая",
      exQ: "Что такое второй закон Ньютона?",
      exA: "F = ma. По-русски: чем сильнее толкаешь массу — тем сильнее она ускоряется. Тележку толкнул слабо — катится медленно. Толкнул сильно — быстро. А ту же тележку с кирпичом — даже сильный толчок сдвигает её медленнее. Покажу на задаче?",
    },
    en: {
      title: "Physics",
      kw: "physics tutor",
      topics: "mechanics, thermodynamics, electricity, optics, quantum basics",
      exQ: "What is Newton's second law?",
      exA: "F = ma. In plain terms: the harder you push something, the faster it accelerates. A push on a cart with a feather sends it flying. A push on a cart with a brick barely moves it. Want a worked example?",
    },
  },
  {
    id: "chemistry",
    url: "himii",
    ru: {
      title: "Химии",
      kw: "репетитор по химии",
      topics: "органика, неорганика, периодический закон, растворы, реакции",
      exQ: "Объясни мне валентность простыми словами.",
      exA: "Валентность — это сколько «рук» у атома для связи с другими. Водород — одна рука (H–H). Кислород — две (H–O–H, вода). Углерод — четыре, поэтому может строить длинные цепочки (вся органика). Хочешь пример с метаном CH₄?",
    },
    en: {
      title: "Chemistry",
      kw: "chemistry tutor",
      topics: "organic, inorganic, periodic table, solutions, reactions",
      exQ: "Explain valence in simple words.",
      exA: "Valence is how many «hands» an atom has to bond with others. Hydrogen has one (H–H). Oxygen has two (H–O–H, water). Carbon has four — that's why it builds long chains (all of organic chemistry). Want a methane CH₄ example?",
    },
  },
  {
    id: "biology",
    url: "biologii",
    ru: {
      title: "Биологии",
      kw: "репетитор по биологии",
      topics: "клетка, генетика, экология, анатомия, эволюция",
      exQ: "Как работает ДНК?",
      exA: "ДНК — это инструкция «как собрать тебя» в виде последовательности из 4 «букв» (A, T, G, C). Двойная спираль — как лестница. Чтобы клетка сделала белок, она «переписывает» нужный кусок инструкции и относит в рибосому. Хочешь подробнее про репликацию?",
    },
    en: {
      title: "Biology",
      kw: "biology tutor",
      topics: "cells, genetics, ecology, anatomy, evolution",
      exQ: "How does DNA work?",
      exA: "DNA is the «recipe to build you», written in 4 letters (A, T, G, C). The double helix is the ladder. When a cell needs a protein, it copies the relevant section and ships it to a ribosome. Want to go deeper on replication?",
    },
  },
  {
    id: "russian-language",
    url: "russkomu-yazyku",
    ru: {
      title: "Русскому языку",
      kw: "репетитор по русскому языку",
      topics: "орфография, пунктуация, синтаксис, сочинение, ЕГЭ-15",
      exQ: "«Не» с глаголами — слитно или раздельно?",
      exA: "Раздельно — это правило. «Не знаю», «не умею», «не хочу». Исключения — глаголы, которые без «не» не используются: «ненавидеть», «недоумевать», «нездоровится». Если глагол отдельно существует — пишем раздельно. Прогоним на 5 примерах?",
    },
    en: {
      title: "Russian Language",
      kw: "Russian language tutor",
      topics: "spelling, punctuation, syntax, essay writing",
      exQ: "Is «не» with verbs spelled separately or together?",
      exA: "Separately — that's the rule. «Не знаю», «не умею». Exceptions are verbs that don't exist without «не»: «ненавидеть», «недоумевать». If the verb works alone, write it separately. Want to drill 5 examples?",
    },
  },
  {
    id: "literature",
    url: "literature",
    ru: {
      title: "Литературе",
      kw: "репетитор по литературе",
      topics: "русская классика, серебряный век, советская проза, мировая",
      exQ: "О чём «Преступление и наказание» если в одном предложении?",
      exA: "О том, что можно убедить себя в любой идее, пока ты её не сделал — а после расплачиваешься совестью гораздо больше, чем боялся. Хочешь разбор Раскольникова или общий?",
    },
    en: {
      title: "Literature",
      kw: "literature tutor",
      topics: "Russian classics, Silver Age, Soviet prose, world literature",
      exQ: "What's «Crime and Punishment» in one sentence?",
      exA: "About how you can talk yourself into any idea — until you act on it, and then conscience charges you far more than you feared. Want a Raskolnikov breakdown or the bigger picture?",
    },
  },
  {
    id: "english",
    url: "anglijskomu",
    ru: {
      title: "Английскому языку",
      kw: "репетитор по английскому",
      topics: "грамматика, времена, разговорная речь, IELTS, ЕГЭ-английский",
      exQ: "В чём разница между Present Perfect и Past Simple?",
      exA: "Past Simple — событие закончилось, и точка во времени важна. «I saw him yesterday». Present Perfect — событие в прошлом, но результат связан с настоящим. «I have seen him» = я с ним знаком. Дай пример из твоего разговора?",
    },
    en: {
      title: "English",
      kw: "English language tutor",
      topics: "grammar, tenses, conversation, IELTS, TOEFL prep",
      exQ: "What's the difference between Present Perfect and Past Simple?",
      exA: "Past Simple — the event is finished and the time matters. «I saw him yesterday». Present Perfect — past event, but the result still matters now. «I have seen him» = I know him. Drop me a sentence from your day and I'll classify it.",
    },
  },
  {
    id: "social-studies",
    url: "obschestvoznaniyu",
    ru: {
      title: "Обществознанию",
      kw: "репетитор по обществознанию",
      topics: "право, экономика, политика, социология, философия — ЕГЭ-формат",
      exQ: "Что такое правовое государство простыми словами?",
      exA: "Это когда государство не имеет права делать то, что не разрешено законом — а человек имеет право делать всё, что не запрещено. Закон выше любого начальника. Звучит просто, в реальности — сложно. Хочешь признаки правового государства списком?",
    },
    en: {
      title: "Social Studies",
      kw: "social studies tutor",
      topics: "law, economics, politics, sociology, philosophy",
      exQ: "What's a «rule of law» state in plain words?",
      exA: "It's a state that's not allowed to do things the law doesn't permit — while a person is allowed to do anything the law doesn't forbid. Law sits above any official. Sounds simple, is hard in practice. Want a checklist?",
    },
  },
  {
    id: "geography",
    url: "geografii",
    ru: {
      title: "Географии",
      kw: "репетитор по географии",
      topics: "физическая, экономическая, материки, климат, страны мира",
      exQ: "Почему в Сахаре пустыня?",
      exA: "Из-за глобальной циркуляции воздуха. На широте 20-30° (туда попадает Сахара) воздух опускается вниз, нагревается и забирает влагу. Поэтому в этих поясах — почти все главные пустыни мира (Сахара, Аравийская, Калахари, Атакама). Покажу на схеме?",
    },
    en: {
      title: "Geography",
      kw: "geography tutor",
      topics: "physical, economic, continents, climate, countries",
      exQ: "Why is the Sahara a desert?",
      exA: "Because of global air circulation. At 20-30° latitude air sinks, warms, and pulls moisture out. That's why most major deserts (Sahara, Arabian, Kalahari, Atacama) sit in that latitude band. Want a diagram?",
    },
  },
  {
    id: "computer-science",
    url: "informatike",
    ru: {
      title: "Информатике",
      kw: "репетитор по информатике",
      topics: "программирование, алгоритмы, базы данных, сети, ЕГЭ",
      exQ: "Что такое рекурсия простыми словами?",
      exA: "Рекурсия — это когда функция вызывает саму себя. Представь матрёшку: открыл одну — внутри ещё одна того же вида, и ещё, пока не найдёшь самую маленькую (это «база рекурсии»). Покажу на факториале n! ?",
    },
    en: {
      title: "Computer Science",
      kw: "computer science tutor",
      topics: "programming, algorithms, databases, networks",
      exQ: "What is recursion in plain words?",
      exA: "Recursion is when a function calls itself. Picture a matryoshka — open one, find another inside, keep going until you hit the smallest one (that's the «base case»). Want me to show it on n! ?",
    },
  },
  {
    id: "astronomy",
    url: "astronomii",
    ru: {
      title: "Астрономии",
      kw: "репетитор по астрономии",
      topics: "Солнечная система, звёзды, галактики, чёрные дыры, космология",
      exQ: "Откуда мы знаем, что Вселенная расширяется?",
      exA: "Спектры далёких галактик сдвинуты в красную сторону — это «красное смещение». Чем галактика дальше, тем сильнее смещение. Это значит, что они от нас удаляются, причём чем дальше — тем быстрее. Открыл это Хаббл в 1929-м. Хочешь подробнее про закон Хаббла?",
    },
    en: {
      title: "Astronomy",
      kw: "astronomy tutor",
      topics: "Solar System, stars, galaxies, black holes, cosmology",
      exQ: "How do we know the universe is expanding?",
      exA: "Distant galaxies' spectra are red-shifted. The farther a galaxy, the bigger the shift — meaning they're moving away from us, faster the farther they are. Hubble figured this out in 1929. Want Hubble's law in detail?",
    },
  },
  {
    id: "discovery",
    url: "otkrytiyam",
    ru: {
      title: "Открытиям",
      kw: "репетитор по новым научным открытиям",
      topics: "недавние научные прорывы, технологии, междисциплинарные темы",
      exQ: "Что такое CRISPR и почему это важно?",
      exA: "CRISPR — это «ножницы» для ДНК. Учёные нашли механизм, которым бактерии режут вирусную ДНК, и научились направлять эти «ножницы» куда угодно — точечно править гены. Это меняет медицину (генетические болезни) и сельхоз. Хочешь подробнее как именно работают «ножницы»?",
    },
    en: {
      title: "Modern Discoveries",
      kw: "modern science discoveries tutor",
      topics: "recent breakthroughs, tech, cross-disciplinary topics",
      exQ: "What is CRISPR and why does it matter?",
      exA: "CRISPR is «scissors for DNA». Scientists found the mechanism bacteria use to cut viral DNA and learned to aim those scissors anywhere — edit specific genes. Changes medicine (genetic disease) and agriculture. Want the mechanism in detail?",
    },
  },
  {
    id: "psychology",
    url: "psihologii",
    ru: {
      title: "Психологии",
      kw: "репетитор по психологии",
      topics: "когнитивная, социальная, развитие, эмоции, нейронаука",
      exQ: "Почему мы откладываем дела?",
      exA: "Прокрастинация — это не лень. Это эмоциональная регуляция: мозг откладывает задачу, которая вызывает тревогу или скуку. Самый рабочий приём — разбить задачу на самый маленький первый шаг (на 2 минуты), и сделать только его. Хочешь больше техник?",
    },
    en: {
      title: "Psychology",
      kw: "psychology tutor",
      topics: "cognitive, social, developmental, emotions, neuroscience",
      exQ: "Why do we procrastinate?",
      exA: "Procrastination isn't laziness — it's emotion regulation. Your brain delays tasks that cause anxiety or boredom. The trick that works: chunk the task down to a 2-minute first step and only do that. Want more techniques?",
    },
  },
  {
    id: "economics",
    url: "ekonomike",
    ru: {
      title: "Экономике",
      kw: "репетитор по экономике",
      topics: "микро, макро, финансы, рынок труда, поведенческая",
      exQ: "Что такое инфляция простыми словами?",
      exA: "Инфляция — это когда деньги «худеют». Тысяча сегодня покупает меньше, чем тысяча год назад. Бывает от роста денежной массы, от шоков предложения, от ожиданий. ЦБ обычно борется ставкой. Хочешь разобрать на примере России 2022?",
    },
    en: {
      title: "Economics",
      kw: "economics tutor",
      topics: "micro, macro, finance, labor market, behavioral",
      exQ: "What is inflation in plain words?",
      exA: "Inflation is money getting «thinner». A thousand today buys less than a thousand a year ago. Causes: money supply growth, supply shocks, expectations. Central banks usually fight it with rates. Want a real example?",
    },
  },
  {
    id: "philosophy",
    url: "filosofii",
    ru: {
      title: "Философии",
      kw: "репетитор по философии",
      topics: "античность, новое время, экзистенциализм, этика, логика",
      exQ: "Что такое категорический императив Канта?",
      exA: "Кант: «поступай так, чтобы правило твоего поступка можно было сделать всеобщим законом». Грубо: если хочешь обмануть — представь, что все обманывают. Если результат — катастрофа, значит, обманывать нельзя. Хочешь примеров?",
    },
    en: {
      title: "Philosophy",
      kw: "philosophy tutor",
      topics: "ancient, modern, existentialism, ethics, logic",
      exQ: "What's Kant's categorical imperative?",
      exA: "Kant: «act only by a rule you'd be okay making a universal law». Roughly: thinking of lying? Imagine if everyone lied. If that's catastrophic, you can't lie. Want examples?",
    },
  },
];

export function findSubject(slug: string): SubjectLanding | undefined {
  return SUBJECT_LANDINGS.find((s) => s.url === slug);
}
