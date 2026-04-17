export interface Topic {
  id: string;
  title: string;
  emoji?: string;
}

export interface TopicPeriod {
  id: string;
  title: string;
  years: string;
  emoji: string;
  color: string; // tailwind bg color for badge
  topics: Topic[];
}

export const RUSSIAN_HISTORY_TOPICS: TopicPeriod[] = [
  {
    id: "ancient-rus",
    title: "Древняя Русь",
    years: "IX–XIII вв.",
    emoji: "⚔️",
    color: "bg-amber-100 text-amber-700",
    topics: [
      { id: "varangians",    title: "Призвание варягов и образование Руси" },
      { id: "oleg-igor",     title: "Первые князья: Олег, Игорь, Ольга" },
      { id: "svyatoslav",    title: "Походы Святослава" },
      { id: "baptism",       title: "Крещение Руси при Владимире I" },
      { id: "yaroslav",      title: "Ярослав Мудрый и Русская Правда" },
      { id: "fragmentation", title: "Феодальная раздробленность" },
      { id: "novgorod",      title: "Новгородская республика" },
    ],
  },
  {
    id: "mongol-era",
    title: "Монголы и собирание земель",
    years: "XIII–XV вв.",
    emoji: "🏇",
    color: "bg-red-100 text-red-700",
    topics: [
      { id: "mongol-invasion",  title: "Монгольское нашествие 1237–1241" },
      { id: "golden-horde",     title: "Золотая Орда и иго" },
      { id: "nevsky",           title: "Александр Невский: Невская битва и Ледовое побоище" },
      { id: "moscow-rise",      title: "Возвышение Московского княжества" },
      { id: "kulikovo",         title: "Куликовская битва 1380" },
      { id: "ivan3",            title: "Иван III и объединение русских земель" },
      { id: "end-of-horde",     title: "Стояние на Угре и конец ига (1480)" },
    ],
  },
  {
    id: "muscovy",
    title: "Московское царство",
    years: "XVI–XVII вв.",
    emoji: "👑",
    color: "bg-[#EEF1FD] text-[#4561E8]",
    topics: [
      { id: "ivan4",          title: "Иван Грозный: реформы и опричнина" },
      { id: "kazan",          title: "Взятие Казани и расширение государства" },
      { id: "livonian-war",   title: "Ливонская война" },
      { id: "smuta",          title: "Смутное время (1598–1613)" },
      { id: "minin-pozharsky",title: "Минин и Пожарский. Земский собор 1613" },
      { id: "romanov-early",  title: "Первые Романовы: Михаил и Алексей" },
      { id: "sobornoye",      title: "Соборное уложение 1649 и крепостное право" },
      { id: "razin",          title: "Восстание Степана Разина" },
    ],
  },
  {
    id: "empire-18",
    title: "Российская империя: XVIII в.",
    years: "1682–1801",
    emoji: "⚓",
    color: "bg-blue-100 text-blue-700",
    topics: [
      { id: "peter1-reforms", title: "Реформы Петра I" },
      { id: "northern-war",   title: "Северная война и выход к Балтике" },
      { id: "st-pete",        title: "Основание Санкт-Петербурга" },
      { id: "palace-coups",   title: "Эпоха дворцовых переворотов" },
      { id: "elizabeth",      title: "Елизавета Петровна и Семилетняя война" },
      { id: "catherine2",     title: "Екатерина II: «Просвещённый абсолютизм»" },
      { id: "pugachev",       title: "Восстание Пугачёва" },
      { id: "paul1",          title: "Павел I" },
    ],
  },
  {
    id: "empire-19",
    title: "Российская империя: XIX в.",
    years: "1801–1894",
    emoji: "🏛️",
    color: "bg-green-100 text-green-700",
    topics: [
      { id: "alexander1",     title: "Александр I и реформы Сперанского" },
      { id: "war-1812",       title: "Отечественная война 1812 года" },
      { id: "decembrists",    title: "Декабристы и восстание 1825 года" },
      { id: "nicholas1",      title: "Николай I: «Жандарм Европы»" },
      { id: "crimean-war",    title: "Крымская война 1853–1856" },
      { id: "alexander2",     title: "Реформы Александра II. Отмена крепостного права" },
      { id: "populists",      title: "Народничество и «Народная воля»" },
      { id: "alexander3",     title: "Александр III: контрреформы" },
    ],
  },
  {
    id: "empire-20",
    title: "Конец империи и революция",
    years: "1894–1922",
    emoji: "🔥",
    color: "bg-orange-100 text-orange-700",
    topics: [
      { id: "nicholas2",      title: "Николай II и начало XX века" },
      { id: "revolution-1905",title: "Революция 1905–1907. Манифест 17 октября" },
      { id: "stolypin",       title: "Столыпинские реформы" },
      { id: "ww1-russia",     title: "Россия в Первой мировой войне" },
      { id: "feb-1917",       title: "Февральская революция 1917" },
      { id: "oct-1917",       title: "Октябрьская революция 1917" },
      { id: "civil-war",      title: "Гражданская война 1917–1922" },
    ],
  },
  {
    id: "ussr",
    title: "СССР",
    years: "1922–1991",
    emoji: "☭",
    color: "bg-rose-100 text-rose-700",
    topics: [
      { id: "nep",            title: "НЭП и образование СССР" },
      { id: "stalin-rise",    title: "Сталин: коллективизация и индустриализация" },
      { id: "repressions",    title: "Большой террор и репрессии 1930-х" },
      { id: "ww2",            title: "Великая Отечественная война 1941–1945" },
      { id: "cold-war-start", title: "Холодная война и послевоенный мир" },
      { id: "khrushchev",     title: "Хрущёв: оттепель и XX съезд КПСС" },
      { id: "space",          title: "Космическая гонка. Гагарин 1961" },
      { id: "brezhnev",       title: "Брежнев: застой и разрядка" },
      { id: "perestroika",    title: "Горбачёв: перестройка и гласность" },
      { id: "ussr-collapse",  title: "Распад СССР 1991" },
    ],
  },
  {
    id: "modern-russia",
    title: "Россия после 1991",
    years: "1991 – наст. вр.",
    emoji: "🇷🇺",
    color: "bg-sky-100 text-sky-700",
    topics: [
      { id: "yeltsin",        title: "Ельцин и 1990-е: реформы и кризис" },
      { id: "constitution",   title: "Конституция 1993 и система власти" },
      { id: "chechnya",       title: "Чеченские войны" },
      { id: "putin-era",      title: "Путин: стабилизация и вертикаль власти" },
    ],
  },
];

export const TOTAL_TOPICS = RUSSIAN_HISTORY_TOPICS.reduce(
  (sum, p) => sum + p.topics.length,
  0
);
