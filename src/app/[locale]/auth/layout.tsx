import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Войти — Mentora",
  description: "Войдите или создайте аккаунт Mentora — персональный AI-репетитор по 17 наукам. Бесплатно. Без карты.",
  robots: { index: false, follow: false },
  openGraph: {
    title: "Войти в Mentora",
    description: "Персональный AI-репетитор. 17 наук. Бесплатно.",
    url: "https://mentora.su/ru/auth",
    images: [{ url: "/opengraph-image.png", width: 1200, height: 630 }],
  },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children;
}
