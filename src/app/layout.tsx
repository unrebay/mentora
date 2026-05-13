import type { Metadata, Viewport } from "next";
import { Golos_Text, Playfair_Display } from "next/font/google";
import "./globals.css";
import { PostHogProvider } from "@/components/PostHogProvider";
import { Suspense } from "react";
import NavigationProgress from "@/components/NavigationProgress";
import { SplashScreen } from "@/components/SplashScreen";
import { ThemeProvider } from "@/components/ThemeProvider";
import TiltProvider from "@/components/TiltProvider";

const golos = Golos_Text({
  subsets: ["latin", "cyrillic"],
  variable: "--font-golos",
  weight: ["400", "500", "600", "700"],
  display: "swap",
  preload: true,
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  weight: ["700"],
  style: ["normal", "italic"],
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  metadataBase: new URL("https://mentora.su"),
  title: {
    default: "Mentora — AI-репетитор | 17 наук с AI-ментором",
    template: "%s | Mentora",
  },
  description:
    "Mentora — персональный AI-ментор для всех возрастов. 17 наук: история, математика, физика, химия, биология, психология, философия, экономика и другие. Подготовка к ЕГЭ и ОГЭ. Бесплатно.",
  keywords: [
    "AI репетитор",
    "ИИ репетитор онлайн",
    "персональный ментор",
    "подготовка к ЕГЭ",
    "подготовка к ОГЭ",
    "AI ментор история",
    "учить историю с ИИ",
    "история России онлайн",
    "подготовка к ЕГЭ история",
    "ОГЭ история онлайн",
    "учить математику с ИИ",
    "репетитор по физике онлайн",
    "учить химию онлайн",
    "биология онлайн",
    "английский с AI",
    "AI учитель",
    "школьный репетитор онлайн",
    "mentora",
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
        url: "/og-image.png",
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
    images: ["/og-image.png"],
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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  // Theme-color resolves to user's selected theme via media-query meta tags
  // in <head>. This here is the default for clients that ignore the media variants.
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        {/* Prevent flash of wrong theme + sync iOS Safari chrome (status bar +
            bottom toolbar) to the active theme so there's no opaque dark band
            on light pages or vice-versa. */}
        <script dangerouslySetInnerHTML={{ __html: `
          try {
            var m = localStorage.getItem('mentora-theme');
            var sysDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            var effective = (m === 'light' || m === 'dark') ? m : (sysDark ? 'dark' : 'light');
            if (effective === 'dark') document.documentElement.classList.add('dark');
            // Sync iOS theme-color meta to active theme so Safari chrome matches
            // the page bg (instead of always painting the dark accent).
            var tc = effective === 'dark' ? '#050a14' : '#ffffff';
            var meta = document.querySelector('meta[name="theme-color"]:not([media])');
            if (meta) meta.setAttribute('content', tc);
          } catch(e){}
        ` }} />
        <meta name="yandex-verification" content="673fbfbebc45f7aa" />
        {/* Two media-variant metas — iOS picks the matching one. Plus a third
            no-media meta that the inline script above overrides to the active
            user theme (covers light-mode-system-but-user-picked-dark case). */}
        <meta name="theme-color" media="(prefers-color-scheme: light)" content="#ffffff" />
        <meta name="theme-color" media="(prefers-color-scheme: dark)"  content="#050a14" />
        <meta name="theme-color" content="#ffffff" />
        <meta name="msapplication-TileColor" content="#4561E8" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        {/* PWA */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Mentora" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="Mentora" />
      </head>
      <body className={`${golos.variable} ${playfair.variable} font-sans`}>
        <ThemeProvider>
          <PostHogProvider>
            <SplashScreen />
            <Suspense fallback={null}><NavigationProgress /></Suspense>
            <TiltProvider />
            {children}
          </PostHogProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
