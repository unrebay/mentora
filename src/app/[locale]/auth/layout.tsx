import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const isEn = locale === "en";
  const url = isEn ? "https://mentora.su/en/auth" : "https://mentora.su/ru/auth";
  return {
    title: isEn ? "Sign in — Mentora" : "Войти — Mentora",
    description: isEn
      ? "Sign in or create a Mentora account — your personal AI tutor across 17 sciences. Free. No card required."
      : "Войдите или создайте аккаунт Mentora — персональный AI-репетитор по 17 наукам. Бесплатно. Без карты.",
    robots: { index: false, follow: false },
    alternates: {
      canonical: url,
      languages: { ru: "https://mentora.su/ru/auth", en: "https://mentora.su/en/auth", "x-default": "https://mentora.su/ru/auth" },
    },
    openGraph: {
      title: isEn ? "Sign in to Mentora" : "Войти в Mentora",
      description: isEn ? "Personal AI tutor. 17 sciences. Free." : "Персональный AI-репетитор. 17 наук. Бесплатно.",
      url,
      images: [{ url: "/opengraph-image.png", width: 1200, height: 630 }],
    },
  };
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children;
}
