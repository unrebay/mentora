import type { Metadata } from "next";
import { Golos_Text } from "next/font/google";
import "./globals.css";

const golos = Golos_Text({
  subsets: ["latin", "cyrillic"],
  variable: "--font-golos",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://mentora.su"),
  title: {
    default: "Mentora — AI-ментор по истории",
    template: "%s | Mentora",
  },
  description:
    "AI-ментор по истории России и мира. Учись в диалоге — живо, персонально, без скучных учебников. Бесплатно.",
  keywords: [
    "AI ментор история",
    "учить историю с ИИ",
    "история России онлайн",
    "подготовка к ЕГЭ история",
    "ОГЭ история онлайн",
    "AI учитель история",
    "история мира онлайн",
    "mentora",
  ],
  authors: [{ name: "Mentora" }],
  creator: "Mentora",
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: "https://mentora.su",
    siteName: "Mentora",
    title: "Mentora — AI-ментор по истории",
    description:
      "Учи историю в диалоге с AI-ментором. Персонально. Живо. Интересно.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Mentora — AI-ментор по истории",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mentora — AI-ментор по истории",
    description:
      "Учи историю в диалоге с AI-ментором. Персонально. Живо. Интересно.",
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  alternates: {
    canonical: "https://mentora.su",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className={`${golos.variable} font-sans`}>{children}</body>
    </html>
  );
}
