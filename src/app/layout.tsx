import type { Metadata } from "next";
import { Golos_Text, Playfair_Display } from "next/font/google";
import "./globals.css";
import { PostHogProvider } from "@/components/PostHogProvider";
import { SplashScreen } from "@/components/SplashScreen";
import { ThemeProvider } from "@/components/ThemeProvider";

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
      </head>
      <body className={`${golos.variable} ${playfair.variable} font-sans`}>
        <ThemeProvider>
          <PostHogProvider>
            <SplashScreen />
            {children}
          </PostHogProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
