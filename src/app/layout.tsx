import type { Metadata } from "next";
import { Golos_Text } from "next/font/google";
import "./globals.css";

const golos = Golos_Text({
  subsets: ["latin", "cyrillic"],
  variable: "--font-golos",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Mentora — AI-ментор по истории",
  description: "Учи историю в диалоге с AI. Персонально. Глубоко. Интересно.",
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
