import type { Metadata } from "next";
import { Golos_Text, Playfair_Display } from "next/font/google";
import "./globals.css";
import { PostHogProvider } from "@/components/PostHogProvider";
import { SplashScreen } from "@/components/SplashScreen";
import { ThemeProvider } from "@/components/ThemeProvider";
import TiltProvider from "@/components/TiltProvider";

const golos = Golos_Text({
  subsets: ["latin", "cyrillic"],
  variable: "--font-golos",
  weight: ["400", "500", "600", "700"],
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  weight: ["700"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://mentora.su"),
  title: {
    default: "Mentora — ИИ-ментор и нейросеть для учёбы",
    template: "%s | Mentora",
  },
  description:
    "Стань лучшей версией себя — учись с ИИ-ментором Mentora. Нейросеть объясняет 17 наук в живом диалоге: психология, математика, химия, история и др. Бесплатно.",
  keywords: [
    "нейросеть для учёбы",
    "нейросеть для учебы бесплатно",
    "ИИ репетитор",
    "ИИ ментор",
    "AI ментор",
    "AI репетитор",
    "репетитор онлайн",
    "репетитор по математике онлайн",
    "репетитор английского онлайн",
    "подготовка к ЕГЭ онлайн",
    "подготовка к ОГЭ онлайн",
    "нейросеть для школьников",
    "ИИ помощник для учёбы",
    "учить онлайн бесплатно",
    "образование для взрослых",
    "lifelong learning",
    "mentora",
    "mentora.su",
  ],
  authors: [{ name: "Mentora" }],
  creator: "Mentora",
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: "https://mentora.su",
    siteName: "Mentora",
    title: "Mentora — новый вид образования — 17 наук с AI-ментором",
    description:
      "Живой диалог вместо учебника. 17 наук — история, математика, физика, химия, психология, философия и др. Для любого возраста. Бесплатно.",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "Mentora — новый вид образования — 17 наук с AI-ментором",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mentora — новый вид образования — 17 наук с AI-ментором",
    description:
      "Живой диалог вместо учебника. 17 наук — история, математика, физика, химия, психология и др. Для любого возраста. Бесплатно.",
    images: ["/opengraph-image.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico",         sizes: "any" },
      { url: "/favicon-16x16.png",   sizes: "16x16",  type: "image/png" },
      { url: "/favicon-32x32.png",   sizes: "32x32",  type: "image/png" },
      { url: "/favicon-48x48.png",   sizes: "48x48",  type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      { rel: "mask-icon", url: "/logo.svg", color: "#4561E8" },
    ],
  },
  manifest: "/site.webmanifest",
  verification: {
    yandex: "673fbfbebc45f7aa",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  alternates: {
    canonical: "https://mentora.su",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        {/* Prevent flash of wrong theme */}
        <script dangerouslySetInnerHTML={{ __html: `
          try {
            var t = localStorage.getItem('mentora-theme');
            if (!t) t = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            if (t === 'dark') document.documentElement.classList.add('dark');
          } catch(e){}
        ` }} />
        {/* KaTeX for math rendering in chat */}
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css" crossOrigin="anonymous" />
        <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js" crossOrigin="anonymous" />
        <meta name="yandex-verification" content="673fbfbebc45f7aa" />
        <meta name="theme-color" content="#4561E8" />
        <meta name="msapplication-TileColor" content="#4561E8" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        {/* PWA */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Mentora" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="Mentora" />
        {/* JSON-LD structured data — Organization + EducationalOrganization + WebSite (sitelinks searchbox).
            Single @graph keeps payload small; SERP rich snippets и Knowledge Panel читают эти типы. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": ["Organization", "EducationalOrganization"],
                  "@id": "https://mentora.su/#org",
                  name: "Mentora",
                  alternateName: ["Ментора", "mentora.su"],
                  url: "https://mentora.su",
                  logo: "https://mentora.su/logo.svg",
                  image: "https://mentora.su/og-image.png",
                  description:
                    "Mentora — персональный AI-ментор. 17 наук: история, математика, физика, химия, биология, психология, философия, экономика. Подготовка к ЕГЭ и ОГЭ. Бесплатно.",
                  foundingDate: "2026",
                  founder: { "@type": "Person", name: "Andrey" },
                  sameAs: [
                    "https://t.me/mentora_support_bot",
                    "https://github.com/unrebay/mentora",
                  ],
                  contactPoint: {
                    "@type": "ContactPoint",
                    contactType: "customer support",
                    email: "hello@mentora.su",
                    availableLanguage: ["Russian", "English"],
                  },
                  areaServed: { "@type": "Country", name: "RU" },
                  inLanguage: ["ru-RU", "en"],
                },
                {
                  "@type": "WebSite",
                  "@id": "https://mentora.su/#website",
                  url: "https://mentora.su",
                  name: "Mentora",
                  publisher: { "@id": "https://mentora.su/#org" },
                  inLanguage: ["ru-RU", "en"],
                  potentialAction: {
                    "@type": "SearchAction",
                    target: {
                      "@type": "EntryPoint",
                      urlTemplate:
                        "https://mentora.su/knowledge?q={search_term_string}",
                    },
                    "query-input": "required name=search_term_string",
                  },
                },
              ],
            }),
          }}
        />
      </head>
      <body className={`${golos.variable} ${playfair.variable} font-sans`}>
        <ThemeProvider>
          <PostHogProvider>
            <SplashScreen />
            <TiltProvider />
            {children}
          </PostHogProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
