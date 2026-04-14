import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://mentora.su";
  const now = new Date();

  return [
    { url: base,                     lastModified: now, changeFrequency: "weekly",  priority: 1.0 },
    { url: `${base}/pricing`,        lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/knowledge`,      lastModified: now, changeFrequency: "weekly",  priority: 0.7 },
    { url: `${base}/privacy`,        lastModified: now, changeFrequency: "yearly",  priority: 0.3 },
    { url: `${base}/terms`,          lastModified: now, changeFrequency: "yearly",  priority: 0.3 },
  ];
}
