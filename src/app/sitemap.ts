import { MetadataRoute } from "next";
import { SUBJECT_LANDINGS } from "@/lib/repetitor-subjects";

/**
 * SEO-оптимизированный sitemap.
 *
 * Правила:
 * - lastModified — статические даты, иначе краулер думает что всё обновилось.
 * - Для каждой публичной страницы — ru-вариант (корень) и /en/ вариант
 *   с hreflang alternates. Локали: ru, en, x-default.
 * - /knowledge приватная (noindex), не включаем.
 * - /dashboard, /learn, /profile, /admin — приватные, закрыты в robots.ts.
 * - /repetitor + /repetitor/[subject] x17 + /podgotovka-k-ege — piggyback
 *   landing-pages под высокочастотные SEO-ключи.
 */
const BASE = "https://mentora.su";

type StaticPage = {
  path: string;
  lastModified: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
};

const STATIC_PAGES: StaticPage[] = [
  { path: "",                  lastModified: "2026-05-14", changeFrequency: "weekly",  priority: 1.0 },
  { path: "/repetitor",        lastModified: "2026-05-14", changeFrequency: "weekly",  priority: 0.95 },
  { path: "/podgotovka-k-ege", lastModified: "2026-05-14", changeFrequency: "weekly",  priority: 0.9 },
  { path: "/about",            lastModified: "2026-05-12", changeFrequency: "monthly", priority: 0.9 },
  { path: "/pricing",          lastModified: "2026-05-14", changeFrequency: "monthly", priority: 0.9 },
  { path: "/guide",            lastModified: "2026-05-14", changeFrequency: "monthly", priority: 0.7 },
  { path: "/privacy",          lastModified: "2026-05-14", changeFrequency: "yearly",  priority: 0.2 },
  { path: "/terms",            lastModified: "2026-05-14", changeFrequency: "yearly",  priority: 0.2 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const subjectPages: StaticPage[] = SUBJECT_LANDINGS.map((s) => ({
    path: `/repetitor/${s.url}`,
    lastModified: "2026-05-14",
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  const allPages = [...STATIC_PAGES, ...subjectPages];

  return allPages.flatMap((p) => {
    const ru = `${BASE}${p.path}`;
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
        priority: Math.max(0.1, p.priority - 0.1),
        alternates,
      },
    ];
  });
}
