import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const isEn = locale === "en";
  const url = isEn ? "https://mentora.su/en/auth" : "https://mentora.su/ru/auth";
  return {
    title: isEn ? "Sign in to Mentora — AI learning" : "Войти в Mentora — нейросеть для учёбы",
    description: isEn
      ? "Sign in via Google, Telegram or email — passwordless. 17 sciences with an AI mentor. Free forever."
      : "Войди через Google, Telegram или email — без пароля. 17 наук с ИИ-ментором, нейросеть для учёбы. Бесплатно навсегда.",
    robots: { index: false, follow: false },
    alternates: {
      canonical: url,
      languages: { ru: "https://mentora.su/ru/auth", en: "https://mentora.su/en/auth", "x-default": "https://mentora.su/ru/auth" },
    },
    openGraph: {
      title: isEn ? "Sign in to Mentora" : "Войти в Mentora",
      description: isEn ? "Personal AI tutor. 17 sciences. Free." : "Персональный AI-репетитор. 17 наук. Бесплатно.",
      url,
      images: [{ url: "/icon-512.png", width: 512, height: 512 }],
    },
  };
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children;
}
