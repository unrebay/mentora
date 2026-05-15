import { MetadataRoute } from "next";

/**
 * SEO-оптимизированный sitemap.
 *
 * Правила:
 * - lastModified = статические даты (не new Date()), иначе краулер считает
 *   все страницы "только что изменёнными" и теряет сигналы свежести.
 * - Для каждой публичной страницы выпускаем две записи (ru и /en/...) +
 *   общий alternates-блок (hreflang), чтобы Google и Яндекс понимали
 *   кросс-языковые версии.
 * - /knowledge исключена: robots: noindex (приложение-карта, не SEO-страница).
 * - /dashboard, /learn, /profile, /admin — приватные, закрыты в robots.ts.
 * - При добавлении ЕГЭ-режима (5.0) добавить /ege и /oge сюда.
 */
const BASE = "https://mentora.su";

type Page = {
  path: "" | "/about" | "/repetitor" | "/pricing" | "/guide" | "/privacy" | "/terms";
  lastModified: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
};

const PAGES: Page[] = [
  { path: "",         lastModified: "2026-05-14", changeFrequency: "weekly",  priority: 1.0 },
  { path: "/about",   lastModified: "2026-05-12", changeFrequency: "monthly", priority: 0.9 },
  { path: "/repetitor", lastModified: "2026-05-14", changeFrequency: "weekly",  priority: 0.95 },
  { path: "/pricing", lastModified: "2026-05-13", changeFrequency: "monthly", priority: 0.9 },
  { path: "/guide",   lastModified: "2026-05-13", changeFrequency: "monthly", priority: 0.7 },
  { path: "/privacy", lastModified: "2026-05-03", changeFrequency: "yearly",  priority: 0.2 },
  { path: "/terms",   lastModified: "2026-05-12", changeFrequency: "yearly",  priority: 0.2 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return PAGES.flatMap((p) => {
    const ru = `${BASE}${p.path}`;            // localePrefix=as-needed → ru — корень без префикса
    const en = `${BASE}/en${p.path}`;
    const alternates = {
      languages: {
        ru,
        en,
        "x-default": ru,
      },
    };
    return [
      {
        url: ru,
        lastModified: new Date(p.lastModified),
        changeFrequency: p.changeFrequency,
        priority: p.priority,
        alternates,
      },
      {
        url: en,
        lastModified: new Date(p.lastModified),
        changeFrequency: p.changeFrequency,
        // EN-версии чуть ниже приоритетом — основной рынок RU
        priority: Math.max(0.1, p.priority - 0.1),
        alternates,
      },
    ];
  });
}
