import { MetadataRoute } from "next";

/**
 * SEO-оптимизированный sitemap.
 *
 * Правила:
 * - lastModified = статические даты (не new Date()), иначе краулер считает
 *   все страницы "только что изменёнными" и теряет сигналы свежести.
 * - /knowledge исключена: robots: noindex (приложение-карта, не SEO-страница).
 * - /dashboard, /learn, /profile — приватные, уже закрыты в robots.ts.
 * - При добавлении ЕГЭ-режима (5.0) добавить /ege и /oge сюда.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://mentora.su";

  return [
    {
      url: base,
      lastModified: new Date("2026-04-14"),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${base}/pricing`,
      lastModified: new Date("2026-04-14"),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${base}/privacy`,
      lastModified: new Date("2026-01-01"),
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${base}/terms`,
      lastModified: new Date("2026-01-01"),
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];
}
