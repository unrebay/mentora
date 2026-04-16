import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/pricing", "/privacy", "/terms"],
        disallow: ["/profile", "/admin", "/api", "/dashboard", "/learn"],
      },
    ],
    sitemap: "https://mentora.su/sitemap.xml",
  };
}
