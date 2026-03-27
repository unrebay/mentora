import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard", "/learn", "/onboarding", "/auth"],
      },
    ],
    sitemap: "https://mentora.su/sitemap.xml",
  };
}
