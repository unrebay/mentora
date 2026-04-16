import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import DemoChat from "@/components/DemoChat";
import Logo from "@/components/Logo";
import { createClient } from "@/lib/supabase/server";
import ParticleHero from "@/components/ParticleHero";
import SplineScene from "@/components/SplineScene";
import ThemeToggle from "@/components/ThemeToggle";
import SubjectGrid from "@/components/SubjectGrid";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mentora â AI-ÑÐµÐ¿ÐµÑÐ¸ÑÐ¾Ñ | ÐÑÑÐ¾ÑÐ¸Ñ, ÐÐ°ÑÐµÐ¼Ð°ÑÐ¸ÐºÐ°, Ð¤Ð¸Ð·Ð¸ÐºÐ° Ð¸ ÐµÑÑ 10 Ð¿ÑÐµÐ´Ð¼ÐµÑÐ¾Ð²",
  description:
    "ÐÐµÑÑÐ¾Ð½Ð°Ð»ÑÐ½ÑÐ¹ ÐÐ-ÑÐµÐ¿ÐµÑÐ¸ÑÐ¾Ñ Ð´Ð»Ñ ÑÐºÐ¾Ð»ÑÐ½Ð¸ÐºÐ¾Ð² Ð¸ ÑÑÑÐ´ÐµÐ½ÑÐ¾Ðv. 13 Ð¿ÑÐµÐ´Ð¼ÐµÑÐ¾Ð²: Ð¸ÑÑÐ¾ÑÐ¸Ñ, Ð¼Ð°ÑÐµÐ¼Ð°ÑÐ¸ÐºÐ°, ÑÐ¸Ð·Ð¸ÐºÐ°, ÑÐ¸Ð¼Ð¸Ñ, Ð±Ð¸Ð¾Ð»Ð¾Ð³Ð¸Ñ, ÑÑÑÑÐºÐ¸Ð¹ ÑÐ·ÑÐº, þÐ»Ð¸ÑÐµÑÐ°ÑÑÑÐ°, Ð°Ð½Ð³Ð»Ð¸Ð¹ÑÐºÐ¸Ð¹ Ð¸ Ð´Ñ. ÐÐ¾Ð´Ð³Ð¾ÑÐ¾Ð²ÐºÐ° Ðº ÐÐÐ­/ÐÐÐ­ Ð² Ð¶Ð¸Ð²Ð¾Ð¼ Ð´Ð¸Ð°Ð»Ð¾Ð³Ðµ. ÐÐ°ÑÐ½Ð¸ Ð±ÐµÑÐ¿Ð»Ð°ÑÐ½Ð¾ â ÓÐµÐ· ÐºÐ°ÑÑÑÐ».",
  keywords: [
    "AI ÑÐµÐ¿ÐµÑÐ¸ÑÐ¾Ñ", "ÐÐ ÑÐµÐ¿ÐµÑÐ¸ÑÐ¾Ñ", "Ð¿ÐµÑÑÐ¾Ð½Ð°Ð»ÑÐ½ÑÐ¹ Ð¼ÐµÐ½ÑÐ¾Ñ", "ÑÐºÐ¾Ð»ÑÐ½ÑÐ¹ ÑÐµÐ¿ÐµÑÐ¸ÑÐ¾Ñ Ð¾Ð½Ð»Ð°Ð¹Ð½",
    "Ð¿Ð¾Ð´Ð³Ð¾ÑÐ¾Ð²ÐºÐ° Ðº ÐÐÐ­", "Ð¿Ð¾Ð´Ð³Ð¾ÑÐ¾Ð²ÐºÐ° Ðº ÐÐÐ­", "ÐÐÐ­ Ð¸ÑÑÐ¾ÑÐ¸Ñ", "ÐÐÐ­ Ð¼Ð°ÑÐµÐ¼Ð°ÑÐ¸ÐºÐ°",
    "ÑÑÐ¸ÑÑ Ð¸ÑÑÐ¾ÑÐ¸Ñ Ñ ÐÐ", "Ð¸ÑÑÐ¾ÑÐ¸Ñ Ð Ð¾ÑÑÐ¸Ð¸ ÐÐÐ­", "Ð¼Ð°ÑÐµÐ¼Ð°ÑÐ¸ÐºÐ° Ð¾Ð½Ð»Ð°Ð¹Ð½ ÑÐµÐ¿ÐµÑÐ¸ÑÐ¾Ñ",
    "ÑÐ¸Ð·Ð¸ÐºÐ° Ð¾Ð½Ð»Ð°Ð¹Ð½", "ÑÐ¸Ð¼Ð¸Ñ ÑÐµÐ¿ÐµÑÐ¸ÑÐ¾Ñ", "Ð±Ð¸Ð¾Ð»Ð¾Ð³Ð¸Ñ Ð¾Ð½Ð»Ð°Ð¹Ð½", "Ð°Ð½Ð³Ð»Ð¸Ð¹ÑÐºÐ¸Ð¹ Ð¸ AI",
    "Ð¾Ð±ÑÐµÑÑÐ²Ð¾Ð·Ð½Ð°Ð½Ð¸Ðµ ÐÐÐ­", "mentora", "mentora.su",
  ],
  alternates: { canonical: "https://mentora.su" },
  openGraph: {
    type: "website",
    url: "https://mentora.su",
    title: "Mentora â AI-ÑÐµÐ¿ÐµÑÐ¸ÑÐ¾Ñ Ð¿Ð¾ 13 ÑÐºÐ¾Ð»ÑÐ½ÑÐ¼ Ð¿ÑÐµÐ´Ð¼ÐµÑÐ°Ð¼",
    description:
      "ÐÑÑÐ¾ÑÐ¸Ñ, Ð¼Ð°ÑÐµÐ¼Ð°ÑÐ¸ÐºÐ°, ÑÐ¸Ð·Ð¸ÐºÐ°, ÑÐ¸Ð¼Ð¸Ñ, Ð±Ð¸Ð¾Ð»Ð¾Ð³Ð¸Ñ Ð¸ ÐµÑÑ 8 Ð¿ÑÐµÐ´Ð¼ÐµÑÐ¾Ð¾. ÐÐ¸Ð°Ð»Ð¾Ð³ Ñ AI-Ð¼ÐµÐ½ÑÐ¾ÑÐ¾Ð¼ â ÑÐ¶Ð¸Ð²Ð¾Ð²-Ð·Ð´ÐµÑÑ, Ð¿ÐµÑÑÐ¾Ð½Ð°Ð»ÑÐ½Ð¾, Ð±ÐµÑÐ¿Ð»Ð°ÑÐ½Ð¾.",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Mentora AI-ÑÐµÐ¿ÐµÑÐ¸ÑÐ¾Ñ" }],
  },
};

const SUBJECTS = [
  { id: "russian-history", emoji: "ð°", title: "ÐÑÑÐ¾ÑÐ¸Ñ Ð Ð¾ÑÑÐ¸Ð¸", desc: "51 ÑÐµÐ¼Ð° Â· 5 ÑÑÐ¾Ð²Ð½ÐµÐ¹", live: true },
  { id: "world-history", emoji: "ð", title: "ÐÑÐµÐ¼Ð¸ÑÐ½Ð°Ñ Ð¸ÑÑÐ¾ÑÐ¸Ñ", desc: "60 ÑÐµÐ¼ Â· 5 ÑÑÐ¾Ð²Ð½ÐµÐ¹", live: true },
  { id: "mathematics", emoji: "ð", title: "ÐÐ°ÑÐµÐ¼Ð°ÑÐ¸ÐºÐ°", desc: "ÐÐ»Ð³ÐµÐ±ÑÐ°, Ð³ÐµÐ¾Ð¼ÐµÑÑÐ¸Ñ, Ð°Ð½Ð°Ð»Ð¸Ð·", live: true },
  { id: "physics", emoji: "â¡", title: "Ð¤Ð¸Ð·Ð¸ÐºÐ°", desc: "ÐÐµÑÐ°Ð½Ð¸ÐºÐ° Ð´Ð¾ ÐºÐ²Ð°Ð½ÑÐ¾Ð²Ð¾Ð³Ð¾ Ð¼Ð¸ÑÐ°", live: true },
  { id: "chemistry", emoji: "ð§ª", title: "Ð¥Ð¸Ð¼Ð¸Ñ", desc: "ÐÐµÑÐµÑÑÐ²Ð°, ÑÐµÐ°ÐºÑÐ¸Ð¸, Ð·Ð°ÐºÐ¾Ð½Ñ", live: true },
  { id: "biology", emoji: "ð§¬", title: "ÐÐ¸Ð¾Ð»Ð¾Ð³Ð¸Ñ", desc: "ÐÐ»ÐµÑÐºÐ° Ð´Ð¾ ÑÐºÐ¾ÑÐ¸ÑÑÐµÐ¼", live: true },
  { id: "russian-language", emoji: "ð", title: "Ð ÑÑÑÐºÐ¸Ð¹ ÑÐ·ÑÐº", desc: "ÐÑÐ°Ð¼Ð¼Ð°ÑÐ¸ÐºÐ° Ð¸ Ð¾ÑÑÐ¾Ð³ÑÐ°ÑÐ¸Ñ", live: true },
  { id: "literature", emoji: "ð", title: "ÐÐ¸ÑÐµÑÐ°ÑÑÑÐ°", desc: "ÐÐ»Ð°ÑÑÐ¸ÐºÐ° Ð¸ ÑÐ¾Ð²ÑÐµÐ¼ÐµÐ½Ð½Ð°Ñ Ð¿ÑÐ¾Ð·Ð°", live: true },
  { id: "english", emoji: "ð¬ð§", title: "ÐÐ½Ð³Ð»Ð¸Ð¹ÑÐºÐ¸Ð¹ ÑÐ·ÑÐº", desc: "A1 â C2, ÑÐ°Ð·Ð³Ð¾Ð²Ð¾ÑÐ½ÑÐ¹", live: true },
  { id: "social-studies", emoji: "ðï¸", title: "ÐÐ±ÑÐµÑÑÐ²Ð¾Ð·Ð½Ð°Ð½Ð¸Ðµ", desc: "ÐÑÐ°Ð²Ð¾, ÑÐºÐ¾Ð½Ð¾Ð¼Ð¸ÐºÐ°, ÑÐ¾ÑÐ¸Ð¾Ð»Ð¾Ð³Ð¸Ñ", live: true },
  { id: "geography", emoji: "ðºï¸", title: "ÐÐµÐ¾Ð³ÑÐ°ÑÐ¸Ñ", desc: "ÐÑÐ¸ÑÐ¾Ð´Ð°, ÑÑÑÐ°Ð½Ñ, ÐºÐ»Ð¸Ð¼Ð°Ñ", live: true },
  { id: "computer-science", emoji: "ð»", title: "ÐÐ½ÑÐ¾ÑÐ¼Ð°ÑÐ¸ÐºÐ°", desc: "ÐÐ»Ð³Ð¾ÑÐ¸ÑÐ¼Ñ, Ð¿ÑÐ¾Ð³ÑÐ°Ð¼Ð¼Ð¸ÑÐ¾Ð²Ð°Ð½Ð¸Ðµ", live: true },
  { id: "astronomy", emoji: "ð­", title: "ÐÑÑÑÐ¾Ð½Ð¾Ð¼Ð¸Ñ", desc: "ÐÐ²ÑÐ·Ð´Ñ, Ð¿Ð»Ð°Ð½ÐµÑÑ, Ð²ÑÐµÐ»ÐµÐ½Ð½Ð°Ñ", live: true },
  { id: "discovery", emoji: "ð", title: "ÐÑÑÐ³Ð¾Ð·Ð¾Ñ", desc: "Ð¤Ð°ÐºÑÑ, Ð¾ÑÐºÑÑÑÐ¸Ñ, ÑÐµÐ½Ð¾Ð¼ÐµÐ½Ñ", live: true },
  { id: "suggest", emoji: "+", title: "ÐÑÐµÐ´Ð»Ð¾Ð¶Ð¸ÑÑ ÑÐµÐ¼Ñ", desc: "ÐÐ¾Ð»Ð¾ÑÑÐ¹ Ð·Ð° Ð¿ÑÐµÐ´Ð¼ÐµÑ", suggest: true },
];

const STEPS = [
  { n: "01", title: "ÐÐµÐ½Ð´Ð¸Ð½Ð³", desc: "ÐÐ½Ð¸Ð¼Ð¸ÑÐ¾Ð²Ð°Ð½Ð½ÑÐ¹ Ð´ÐµÐ¼Ð¾.Ð´Ð¸Ð°Ð»Ð¾Ð³ Ð¿ÑÑÐ¼Ð¾ Ð½Ð° Ð³Ð»Ð°Ð²Ð½Ð¾Ð¹. ÐÐµÐ· ÑÐµÐ³Ð¸ÑÑÑÐ°ÑÐ¸Ð¸ â Ð¿Ð¾Ð¿ÑÐ¾Ð±ÑÐ¹ ÑÐµÐ¹ÑÐ°Ñ." },
  { n: "02", title: "ÐÑÐ±Ð¾Ñ Ð¿ÑÐµÐ´Ð¼ÐµÑÐ°", desc: "ÐÐ¸Ð·ÑÐ°Ð»ÑÐ½ÑÐµ ÐºÐ°ÑÑÐ¾ÑÐºÐ¸ Ñ Ð°Ð½Ð¸Ð¼Ð°ÑÐ¸ÐµÐ¹. ÐÐµ ÑÐ¿Ð¸ÑÐ¾Ðº â Ð³Ð°Ð»ÐµÑÐµÑ." },
  { n: "03", title: "ÐÐ°ÑÑÑÐ¾Ð¹ÐºÐ° Ð¼ÐµÐ½ÑÐ¾ÑÐ°", desc: "3 Ð²Ð¾Ð¿ÑÐ¾ÑÐ°: ÑÑÐ¸Ð»Ñ Ð¾Ð±ÑÐµÐ½Ð¸Ñ, ÑÑÐ¾Ð²ÐµÐ½Ñ, ÑÐµÐ»Ñ. ÐÐµÐ½ÑÐ¾Ñ ÑÑÐ°Ð·Ñ Ð¾ÑÐ²ÐµÑÐ°ÐµÑ Ð² Ð²ÑÐ±ÑÐ°Ð½Ð½Ð¾Ð¼ ÑÐ¾Ð½Ðµ.", badge: true },
  { n: "04", title: "ÐÐµÑÐ²ÑÐ¹ ÑÑÐ¾Ðº", desc: "ÐÐ°ÑÐ¸Ð½Ð°ÐµÑÑÑ Ð¼Ð³Ð½Ð¾Ð²ÐµÐ½Ð½Ð¾. Ð ÐµÐ³Ð¸ÑÑÑÐ°ÑÐ¸Ñ Ð¿ÑÐµÐ´Ð»Ð°Ð³Ð°ÐµÑÑÑ ÑÑÐ¾Ð±Ñ ÑÐ¾ÑÑÐ°Ð½Ð¸ÑÑ Ð¿ÑÐ¾Ð³ÑÐµÑÑ." },
  { n: "05", title: "ÐÑÐ¾ÑÐ¸Ð»Ñ", desc: "ÐÐµÐ½ÑÑ, ÐºÐ°ÑÑÐ° Ð¿ÑÐ¾Ð³ÑÐµÑÑÐ°, ÑÑÑÐ¸Ðº. ÐÐ¾Ð»ÑÐ·Ð¾Ð²Ð°ÑÐµÐ»Ñ Ð²Ð¸Ð´Ð¸Ñ ÑÐµÐ±Ñ Ð²Ð½ÑÑÑÐ¸ ÑÐ¸ÑÑÐµÐ¼Ñ." },
];

const STATS = [
  { value: "8+", label: "Ð¿ÑÐµÐ´Ð¼ÐµÑÐ¾Ð² Ð² ÑÐ°Ð·ÑÐ°Ð±Ð¾ÑÐºÐµ" },
  { value: "90%", label: "ÑÐ¾ÑÐ½Ð¾ÑÑÑ Ð¾ÑÐ²ÐµÑÐ¾Ð² AI" },
  { value: "24/7", label: "Ð´Ð¾ÑÑÑÐ¿ÐµÐ½ Ð±ÐµÐ· VPN" },
  { value: "â", label: "ÑÐµÑÐ¿ÐµÐ½Ð¸Ñ Ñ Ð¼ÐµÐ½ÑÐ¾ÑÐ°" },
];

const TESTIMONIALS = [
  {
    name: "ÐÐ»Ð¸Ð½Ð° Ð¡Ð¾ÐºÐ¾Ð»Ð¾Ð²Ð°",
    role: "Ð¨ÐºÐ¾Ð»ÑÐ½Ð¸ÑÐ°, 10 ÐºÐ»Ð°ÑÑ",
    avatar: "Ð",
    avatarBg: "bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400",
    text: "ÐÐ¾ÑÐ¾Ð²Ð»ÑÑÑ Ðº ÐÐÐ­ Ð¿Ð¾ Ð¸ÑÑÐ¾ÑÐ¸Ð¸ â Mentora Ð¾Ð±ÑÑÑÐ½ÑÐµÑ Ð»ÑÑÑÐµ Ð»ÑÐ±Ð¾Ð³Ð¾ ÑÐµÐ¿ÐµÑÐ¸ÑÐ¾ÑÐ°. ÐÑÐ¾Ð±ÐµÐ½Ð½Ð¾ Ð½ÑÐ°Ð²Ð¸ÑÑÑ, ÑÑÐ¾ Ð¾Ð½Ð° Ð¿Ð¾Ð¼Ð½Ð¸Ñ, ÑÑÐ¾ Ñ ÑÐ¶Ðµ Ð¿ÑÐ¾ÑÐ»Ð°, Ð¸ Ð½Ðµ Ð¿Ð¾Ð²ÑÐ¾ÑÑÐµÑÑÑ.",
    stars: 5,
    xp: "â¡ 340 Ð¼ÐµÐ½ÑÐ¾Ð² Â· ð¥ 12 Ð´Ð½ÐµÐ¹ Ð¿Ð¾Ð´ÑÑÐ´",
  },
  {
    name: "ÐÐ¼Ð¸ÑÑÐ¸Ð¹ ÐÐ»Ð°ÑÐ¾Ð²",
    role: "Ð¡ÑÑÐ´ÐµÐ½Ñ, 2-Ð¹ ÐºÑÑÑ",
    avatar: "Ð",
    avatarBg: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
    text: "ÐÑÐ¼Ð°Ð», ÑÑÐ¾ Ð¸ÑÑÐ¾ÑÐ¸Ñ â ÑÑÐ¾ Ð·ÑÐ±ÑÑÐ¶ÐºÐ°. ÐÐºÐ°Ð·Ð°Ð»Ð¾ÑÑ, Ð¼Ð¾Ð¶Ð½Ð¾ Ð¿ÑÐ¾ÑÑÐ¾ ÑÐ°Ð·Ð³Ð¾Ð²Ð°ÑÐ¸Ð²Ð°ÑÑ Ð¸ Ð²ÑÑ Ð·Ð°Ð¿Ð¾Ð¼Ð¸Ð½Ð°ÐµÑÑÑ ÑÐ°Ð¼Ð¾. ÐÑÐ¾ÑÑÐ» ÑÐµÐ¼Ñ Ð¡Ð¼ÑÑÐ½Ð¾Ð³Ð¾ Ð²ÑÐµÐ¼ÐµÐ½Ð¸ Ð·Ð° Ð¾Ð´Ð¸Ð½ Ð²ÐµÑÐµÑ.",
    stars: 5,
    xp: "â¡ 780 Ð¼ÐµÐ½ÑÐ¾Ð² Â· ð¥ 21 Ð´ÐµÐ½Ñ Ð¿Ð¾Ð´ÑÑÐ´",
  },
  {
    name: "ÐÐ°ÑÐ¸Ð½Ð° ÐÐ°ÑÐ°ÑÐ¾Ð²Ð°",
    role: "ÐÐ·ÑÐ¾ÑÐ»ÑÐ¹, ÑÑÑÑÑ Ð´Ð»Ñ ÑÐµÐ±Ñ",
    avatar: "Ð",
    avatarBg: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
    text: "ÐÑÑ Ð¶Ð¸Ð·Ð½Ñ ÑÐ¾ÑÐµÐ»Ð° ÑÐ°Ð·Ð¾Ð±ÑÐ°ÑÑÑÑ Ð² Ð¸ÑÑÐ¾ÑÐ¸Ð¸ Ð Ð¾ÑÑÐ¸Ð¸ â ÑÐ¸ÑÐ°Ð»Ð° ÐºÐ½Ð¸Ð³Ð¸, Ð½Ð¾ Ð·Ð°ÑÑÐ¿Ð°Ð»Ð°. ÐÐ´ÐµÑÑ Ð·Ð° 20 Ð¼Ð¸Ð½ÑÑ Ð² Ð´Ð¸Ð°Ð»Ð¾Ð³Ðµ ÑÐ·Ð½Ð°Ñ Ð±Ð¾Ð»ÑÑÐµ, ÑÐµÐ¼ Ð·Ð° ÑÐ°Ñ Ñ ÑÑÐµÐ±Ð½Ð¸ÐºÐ¾Ð¼.",
    stars: 5,
    xp: "â¡ 520 Ð¼ÐµÐ½ÑÐ¾Ð² Â· ð¥ 8 Ð´Ð½ÐµÐ¹ Ð¿Ð¾Ð´ÑÑÐ´",
  },
];

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">

      {/* NAV */}
      <nav className="sticky top-0 z-50 border-b border-[var(--border)]"
        style={{ background: "var(--bg-nav)", backdropFilter: "blur(12px)" }}>
        <div className="max-w-6xl mx-auto grid grid-cols-[auto_1fr_auto] items-center gap-4 px-6 py-4">
          <Logo size="sm" fontSize="1.44rem" />
          <div className="hidden md:flex items-center justify-center gap-8 text-sm text-[var(--text-secondary)]">
            <a href="#subjects" className="hover:text-[var(--text)] transition-colors">ÐÑÐµÐ´Ð¼ÐµÑÑ</a>
            <a href="#how" className="hover:text-[var(--text)] transition-colors">ÐÐ°Ðº ÑÐ°Ð±Ð¾ÑÐ°ÐµÑ</a>
            <Link href="/pricing" className="hover:text-[var(--text)] transition-colors">Ð¢Ð°ÑÐ¸ÑÑ</Link>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <>
              <Link href="/auth"
                className="hidden sm:inline px-4 py-2 text-sm text-[var(--text-secondary)] font-medium hover:text-[var(--text)] transition-colors">
                ÐÐ¾Ð¹ÑÐ¸
              </Link>
              <Link href="/auth"
                className="inline-flex px-5 py-2.5 bg-brand-600 dark:bg-brand-600 text-white text-sm font-medium rounded-xl hover:bg-brand-700 transition-colors">
                ÐÐ¾Ð¿ÑÐ¾Ð±Ð¾Ð²Ð°ÑÑ Ð±ÐµÑÐ¿Ð»Ð°ÑÐ½Ð¾ â
              </Link>
            </>
          </div>
        </div>
      </nav>

      {/* HERO â with particle background */}
      <section className="relative overflow-hidden max-w-6xl mx-auto px-6 pt-16 pb-12">
        {/* 3D + Particle background */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <div className="absolute inset-0 hidden md:block">
            <SplineScene style={{ opacity: 0.55 }} />
          </div>
          <div className="absolute inset-0 hidden md:block mix-blend-screen">
            <ParticleHero />
          </div>
        </div>

        <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs font-medium rounded-full mb-6">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
              Ð£Ð¶Ðµ Ð´Ð¾ÑÑÑÐ¿Ð½Ð¾ Â· ÐÑÑÐ¾ÑÐ¸Ñ Ð Ð¾ÑÑÐ¸Ð¸ Ð¸ Ð¼Ð¸ÑÐ°
            </div>
            <h1 className="text-5xl font-bold leading-tight mb-6 tracking-tight">
              ÐÐ°Ð±ÑÐ´Ñ Ð¿ÑÐ¾{" "}
              <span className="line-through text-[var(--text-muted)]">ÑÐºÑÑÐ½ÑÐµ</span>{" "}
              ÑÑÐµÐ±Ð½Ð¸ÐºÐ¸.<br />
              Ð£ÑÐ¸ÑÑ Ð²{" "}
              <span className="text-brand-600 dark:text-brand-500 italic">Ð´Ð¸Ð°Ð»Ð¾Ð³Ðµ.</span>
            </h1>
            <p className="text-lg text-[var(--text-secondary)] leading-relaxed mb-6">
              AI-Ð¼ÐµÐ½ÑÐ¾Ñ, ÐºÐ¾ÑÐ¾ÑÑÐ¹ Ð·Ð½Ð°ÐµÑ ÑÐ²Ð¾Ð¹ ÑÑÐ¾Ð²ÐµÐ½Ñ, Ð¿Ð¾Ð¼Ð½Ð¸Ñ ÑÐµÐ±Ñ Ð¸ Ð¾Ð±ÑÑÑÐ½ÑÐµÑ ÑÐ°Ðº, ÐºÐ°Ðº ÑÐµÐ±Ðµ ÑÐ´Ð¾Ð±Ð½Ð¾. ÐÐ¾ Ð¸ÑÑÐ¾ÑÐ¸Ð¸, Ð¼Ð°ÑÐµÐ¼Ð°ÑÐ¸ÐºÐµ, Ð±Ð¸Ð¾Ð»Ð¾Ð³Ð¸Ð¸ Ð¸ Ð¼Ð½Ð¾Ð³Ð¾Ð¼Ñ Ð´ÑÑÐ³Ð¾Ð¼Ñ.
            </p>
            <div className="flex justify-end mb-8 mt-1">
              <p className="text-sm text-[var(--text-muted)] italic text-right leading-relaxed max-w-[260px]">
                ÐÐ°Ð´Ð°Ð¹ Ð²Ð¾Ð¿ÑÐ¾Ñ, ÐºÐ¾ÑÐ¾ÑÑÐ¹ ÑÑ<br />
                Ð½Ðµ ÑÐµÑÐ°ÐµÑÑÑÑ{" "}
                <span className="text-brand-600 dark:text-brand-500 not-italic font-medium">Ð¿ÑÐ¾Ð¸Ð·Ð½ÐµÑÑÐ¸ Ð²ÑÐ»ÑÑ</span>
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/auth"
                className="px-6 py-3.5 bg-brand-600 text-white font-medium rounded-xl hover:bg-brand-700 transition-colors">
                ÐÐ°ÑÐ°ÑÑ ÑÑÐ¸ÑÑÑÑ â
              </Link>
              <a href="#demo"
                className="px-6 py-3.5 border border-[var(--border)] text-[var(--text-secondary)] font-medium rounded-xl hover:border-brand-300 transition-colors">
                ÐÐ¾ÑÐ¼Ð¾ÑÑÐµÑÑ Ð´ÐµÐ¼Ð¾
              </a>
            </div>
          </div>
          <div id="demo">
            <DemoChat />
          </div>
        </div>

        {/* Floating questions */}
        <div className="relative z-10 mt-20 max-w-4xl mx-auto px-4">
          <p className="text-[11px] font-semibold text-[var(--text-muted)] tracking-[0.2em] uppercase mb-16 text-center">ÐÐ°Ð¿ÑÐ¸Ð¼ÐµÑ, Ð²Ð¾Ñ ÑÐ°Ðº</p>
          <div className="mb-24 space-y-10">
            <p className="text-2xl font-semibold text-[var(--text)] w-fit">ÐÐ¾Ð´Ð¾Ð¶Ð´Ð¸, Ð° Ð¿Ð¾ÑÐµÐ¼Ñ Ð¸Ð¼ÐµÐ½Ð½Ð¾ 1941-Ð¹?</p>
            <p className="text-lg font-medium text-[var(--text-secondary)] w-fit ml-auto mr-[8%]">Ð­ÑÐ¾ Ð²Ð¾Ð¾Ð±ÑÐµ Ð±Ð°Ð·Ð¾Ð²Ð¾ Ð·Ð½Ð°ÑÑ Ð¸Ð»Ð¸ Ð½ÐµÑ?</p>
            <p className="text-3xl font-bold text-[var(--text)] w-fit ml-[14%]">ÐÐ±ÑÑÑÐ½Ð¸ ÐµÑÑ r/ Ð´ÑÑÐ³Ð¸Ð¼Ð¸ ÑÐ»Ð¾Ð²Ð°Ð¼Ð¸.</p>
            <p className="text-xl font-medium text-[var(--text-muted)] w-fit ml-[52%]">Ð Ð·Ð° ÑÐµÐ½ ÑÑÐ¾ Ð²Ð¾Ð¾Ð±ÑÐµ ÑÑÐ¸ÑÑ?</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-semibold text-[var(--text)] mb-1">ÐÑÐµÐ¿Ð¾Ð´Ð°Ð²Ð°ÑÐµÐ»Ñ Ð¾Ð±ÑÑÑÐ½ÑÐµÑ Ð²ÑÐµÐ¼.</p>
            <p className="text-2xl font-semibold text-brand-600 dark:text-brand-500 mb-12">Mentora â ÑÐ¾Ð»ÑÐºÐ¾ ÑÐµÐ±Ðµ.</p>
            <Link href="/auth"
              className="inline-flex px-7 py-3.5 bg-brand-600 text-white font-medium rounded-xl hover:bg-brand-700 transition-colors">
              ÐÐ°ÑÐ°ÑÑ Ð±ÐµÑÐ¿Ð»Ð°ÑÐ½Ð¾ â
            </Link>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="bg-gray-900 dark:bg-[#0a0a18] text-white py-14 px-6 border-y border-white/5">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {STATS.map((s) => (
            <div key={s.value}>
              <div className="text-4xl font-bold mb-1">{s.value}</div>
              <div className="text-sm text-gray-400">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* SUBJECTS */}
      <section id="subjects" className="max-w-6xl mx-auto px-6 py-20">
        <div className="mb-3 text-xs font-semibold text-[var(--text-muted)] tracking-widest uppercase">ÐÐ¸Ð±Ð»Ð¸Ð¾ÑÐµÐºÐ° Ð·Ð½Ð°Ð½Ð¸Ð¹</div>
        <h2 className="text-4xl font-bold mb-10 leading-tight">
          ÐÑÐ±ÐµÑÐ¸, ÑÑÐ¾ ÑÐ¾ÑÐµÑÑ<br />
          Ð¸Ð·ÑÑÐ¸ÑÑ <span className="text-brand-600 dark:text-brand-500 italic">ÑÐµÐ³Ð¾Ð´Ð½Ñ</span>
        </h2>
        <SubjectGrid subjects={SUBJECTS} />
      </section>

            {/* ÐÐÐ­/ÐÐÐ­ COMING SOON */}
      <section className="px-6 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl bg-gray-900 dark:bg-[#0a0a18] text-white p-8 md:p-12">
            <div className="absolute inset-0 pointer-events-none" aria-hidden>
              <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 80% 50%, #4561E820 0%, transparent 60%)" }} />
            </div>
            <div className="relative z-10 grid md:grid-cols-2 gap-8 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand-600/20 text-brand-400 text-xs font-bold rounded-full mb-5 tracking-widest uppercase">
                  ð¯ Ð¡ÐºÐ¾ÑÐ¾ â Ð¸ÑÐ½Ñ 2026
                </div>
                <h2 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">
                  Ð ÐµÐ¶Ð¸Ð¼ Ð¿Ð¾Ð´Ð³Ð¾ÑÐ¾Ð²ÐºÐ¸<br />
                  <span className="text-brand-400 italic">Ðº ÐÐÐ­ Ð¸ ÐÐÐ­</span>
                </h2>
                <p className="text-gray-400 leading-relaxed mb-6">
                  Ð¡Ð¿ÐµÑÐ¸Ð°Ð»ÑÐ½ÑÐ¹ ÑÐµÐ¶Ð¸Ð¼ Ñ ÑÐµÐ°Ð»ÑÐ½ÑÐ¼Ð¸ Ð·Ð°Ð´Ð°Ð½Ð¸ÑÐ¼Ð¸, ÑÑÐµÐºÐµÑÐ¾Ð¼ Ð³Ð¾ÑÐ¾Ð²Ð½Ð¾ÑÑÐ¸ Ð¸ Ð¿ÑÐ¾Ð³Ð½Ð¾Ð·Ð¾Ð¼ ÑÐµÐ·ÑÐ»ÑÑÐ°ÑÐ°. ÐÐ´ÐµÐ°Ð»ÑÐ½Ð¾ Ðº ÑÐµÐ·Ð¾Ð½Ñ ÑÐºÐ·Ð°Ð¼ÐµÐ½Ð¾Ð².
                </p>
                <div className="grid grid-cols-2 gap-2 text-sm text-gray-300">
                  <span className="flex items-center gap-2"><span className="text-brand-400">â</span> Ð ÐµÐ°Ð»ÑÐ½ÑÐ¹ Ð·Ð°Ð´Ð°Ð½Ð¸Ñ ÐÐÐ­/ÐÐÐ­</span>
                  <span className="flex items-center gap-2"><span className="text-brand-400">â</span> Ð¢ÑÐµÐºÐµÑ: Ð¾ÑÑÐ°Ð»Ð¾ÑÑ N Ð´Ð½ÐµÐ¹</span>
                  <span className="flex items-center gap-2"><span className="text-brand-400">â</span> ÐÑÐ¾Ð³Ð½Ð¾Ð· ÑÐµÐ·ÑÐ»ÑÑÐ°ÑÐ°</span>
                  <span className="flex items-center gap-2"><span className="text-brand-400">â</span> ÐÑÐµ 13 Ð¿ÑÐµÐ´Ð¼ÐµÑÐ¾Ð²</span>
                </div>
              </div>
              <div className="flex flex-col gap-4">
                <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
                  <div className="text-xs text-gray-400 mb-1">ÐÑÐ¸Ð¼ÐµÑ: ÑÑÐµÐºÐµÑ Ð³Ð¾ÑÐ¾Ð²Ð½Ð¾ÑÑÐ¸</div>
                  <div className="text-xl font-bold mb-3">60% Ð¿ÑÐ¾Ð³ÑÐ°Ð¼Ð¼Ñ Ð¿ÑÐ¾Ð¸Ð´ÐµÐ½Ð¾</div>
                  <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full rounded-full bg-brand-500" style={{ width: "60%" }} />
                  </div>
                  <div className="text-xs text-gray-500 mt-2">ÐÐ¾ ÑÐºÐ·Ð°Ð¼ÐµÐ½Ð°: 40 Ð´Ð½ÐµÐ¹ Â· ÐÑÑÐ¾ÑÐ¸Ñ Ð Ð¾ÑÑÐ¸Ð¸ Â· ÐÐÐ­ 2026</div>
                </div>
                <Link href="/auth" className="block text-center py-3 px-6 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 transition-colors text-sm">
                  ÐÐ°ÑÐ°ÑÑ Ð³Ð¾ÑÐ¾Ð²Ð¸ÑÑÑÑ ÑÐ¶Ðµ ÑÐµÐ¹ÑÐ°Ñ â
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* HOW IT WORKS */}
      <section id="how" className="px-6 py-20" style={{ background: "var(--bg-secondary)" }}>
        <div className="max-w-6xl mx-auto">
          <div className="mb-3 text-xs font-semibold text-[var(--text-muted)] tracking-widest uppercase">ÐÐ°Ðº ÑÑÐ¾ ÑÐ°Ð±Ð¾ÑÐ°ÐµÑ</div>
          <h2 className="text-4xl font-bold mb-12 leading-tight">
            ÐÑ Ð¿ÐµÑÐ²Ð¾Ð³Ð¾ ÐºÐ»Ð¸ÐºÐ°<br />
            Ð´Ð¾ <span className="text-brand-600 dark:text-brand-500 italic">ÑÐµÐ°Ð»ÑÐ½Ð¾Ð³Ð¾ Ð·Ð½Ð°Ð½Ð¸Ñ</span>
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {STEPS.map((s) => (
              <div key={s.n} className="bg-[var(--bg-card)] rounded-2xl p-5 border border-[var(--border)] relative">
                {s.badge && (
                  <span className="absolute top-3 right-3 text-[9px] font-bold bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 px-1.5 py-0.5 rounded">ÐÐÐ£</span>
                )}
                <div className="text-xs font-bold text-[var(--text-muted)] mb-3">{s.n}</div>
                <div className="font-semibold text-sm mb-1 text-[var(--text)]">{s.title}</div>
                <div className="text-xs text-[var(--text-secondary)] leading-relaxed">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="mb-3 text-xs font-semibold text-[var(--text-muted)] tracking-widest uppercase">ÐÑÐ·ÑÐ²Ñ</div>
        <h2 className="text-4xl font-bold mb-3 leading-tight">Ð£Ð¶Ðµ ÑÑÐ°ÑÑÑ Ñ Mentora</h2>
        <p className="text-[var(--text-secondary)] mb-10 text-lg">Ð ÐµÐ°Ð»ÑÐ½ÑÐµ ÑÐµÐ·ÑÐ»ÑÑÐ°ÑÑ ÑÐµÐ°Ð»ÑÐ½ÑÑ ÑÑÐµÐ½Ð¸ÐºÐ¾Ð²</p>
        <div className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 shadow-sm flex flex-col gap-4">
              <div className="flex gap-0.5">
                {Array.from({ length: t.stars }).map((_, i) => (
                  <span key={i} className="text-amber-400 text-sm">â</span>
                ))}
              </div>
              <p className="text-[var(--text-secondary)] text-sm leading-relaxed flex-1">&ldquo;{t.text}&rdquo;</p>
              <div className="text-xs font-medium text-[var(--text-muted)]">{t.xp}</div>
              <div className="flex items-center gap-3 pt-2 border-t border-[var(--border-light)]">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${t.avatarBg}`}>
                  {t.avatar}
                </div>
                <div>
                  <div className="text-sm font-semibold text-[var(--text)]">{t.name}</div>
                  <div className="text-xs text-[var(--text-muted)]">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-wrap justify-center gap-8 text-center">
          {[
            { v: "4.9 / 5", l: "ÑÑÐµÐ´Ð½ÑÑ Ð¾ÑÐµÐ½ÐºÐ°" },
            { v: "51", l: "ÑÐµÐ¼Ð° Ð¿Ð¾ Ð¸ÑÑÐ¾ÑÐ¸Ð¸ Ð Ð¾ÑÑÐ¸Ð¸" },
            { v: "0 â½", l: "ÑÑÐ¾Ð±Ñ Ð½Ð°ÑÐ°ÑÑ" },
            { v: "ð¥", l: "ÑÑÑÐ¸Ðº Ñ Ð¿ÐµÑÐ²Ð¾Ð³Ð¾ Ð´Ð½Ñ" },
          ].map(({ v, l }) => (
            <div key={l}>
              <div className="text-3xl font-bold text-[var(--text)]">{v}</div>
              <div className="text-sm text-[var(--text-secondary)] mt-1">{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW TO LEARN */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-8 md:p-10">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="mb-3 text-xs font-semibold text-[var(--text-muted)] tracking-widest uppercase">ÐÐ°Ðº ÑÑÐ¸ÑÑÑÑ</div>
              <h2 className="text-3xl font-bold mb-4 leading-tight">
                3 Ð¿ÑÐ¸ÑÐ¼Ð°, ÐºÐ¾ÑÐ¾ÑÑÐµ Ð´ÐµÐ»Ð°ÑÑ<br />
                <span className="text-brand-600 dark:text-brand-500 italic">ÑÑÑÐ±Ñ ÑÑÑÐµÐºÑÐ¸Ð²Ð½Ð¾Ð¹</span>
              </h2>
              <Link href="/guide" className="inline-flex items-center gap-2 text-brand-600 dark:text-brand-500 text-sm font-medium hover:underline">
                ÐÐ¾Ð»Ð½ÑÐ¹ Ð³Ð°Ð¹Ð´ â
              </Link>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <span className="w-8 h-8 flex-shrink-0 bg-brand-50 dark:bg-brand-900/20 rounded-lg flex items-center justify-center text-sm">ð</span>
                <div>
                  <div className="font-semibold text-sm text-[var(--text)] mb-0.5">ÐÐµ Ð¿Ð¾Ð½ÑÐ» â Ð¿Ð¾Ð¿ÑÐ¾ÑÐ¸ Ð¾Ð±ÑÑÑÐ½Ð¸ÑÑ Ð¸Ð½Ð°ÑÐµ</div>
                  <div className="text-xs text-[var(--text-secondary)]">Â«ÐÐ±ÑÑÑÐ½Ð¸ ÐºÐ°Ðº Ð±ÑÐ´ÑÐ¾ Ñ ÑÐºÐ¾Ð»ÑÐ½Ð¸ÐºÂ» â ÐÐµÐ½ÑÐ¾ÑÐ° Ð¿ÐµÑÐµÑÑÑÐ¾Ð¸Ñ Ð¾ÑÐ²ÐµÑ</div>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <span className="w-8 h-8 flex-shrink-0 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-center text-sm">ð</span>
                <div>
                  <div className="font-semibold text-sm text-[var(--text)] mb-0.5">ÐÐ°Ð¿Ð¸ÑÐ¸ Â«ÐºÐ²Ð¸Ð·Â» â Ð¿Ð¾Ð»ÑÑÐ¸ 5 Ð²Ð¾Ð¿ÑÐ¾ÑÐ¾Ð²"</div>
                  <div className="text-xs text-[var(--text-secondary)]">ÐÐµÐ½ÑÐ¾ÑÐ° Ð¿ÑÐ¾Ð²ÐµÑÐ¸Ñ!, ÑÑÐ¾ ÑÑ Ð·Ð½Ð°ÐµÑÑ, Ð° ÑÑÐ¾ Ð½ÐµÑ!</div>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <span className="w-8 h-8 flex-shrink-0 bg-amber-50 dark:bg-amber-900/20 rounded-lg flex items-center justify-center text-sm">â¡</span>
                <div>
                  <div className="font-semibold text-sm text-[var(--text)] mb-0.5">Ð ÐºÐ¾Ð½ÑÐµ â Ð¿Ð¾Ð¿ÑÐ¾ÑÐ¸ Â«ÑÑÐ¾ Ñ ÑÐ·Ð½Ð°Ð»Â»</div>
                  <div className="text-xs text-[var(--text-secondary)]">ÐÐµÐ½ÑÐ¾ÑÐ° Ð´Ð°ÑÑ Ð¸ÑÐ¾Ð³ ÑÐµÑÑÐ¸Ð¸ Ð² 3â5 ÑÐµÐ·Ð¸ÑÐ°ÑÜ/div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* CTA */}
      <section className="bg-gray-900 dark:bg-[#04040c] text-white px-6 py-24 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-30" aria-hidden>
          <div className="absolute inset-0"
            style={{ background: "radial-gradient(ellipse at 50% 120%, #4561E840 0%, transparent 70%)" }} />
        </div>
        <div className="relative z-10">
          <p className="text-gray-500 text-xs font-semibold tracking-[0.2em] uppercase mb-8">Ð¢Ð²Ð¾Ð¹ Ð¿ÐµÑÑÐ¾Ð½Ð°Ð»ÑÐ½ÑÐ¹ AI-Ð¼ÐµÐ½ÑÐ¾Ñ</p>
          <h2 className="text-5xl font-bold mb-5 leading-tight">
            Ð£ÑÐ¸ÑÑ ÑÐ°Ðº,<br />
            ÐºÐ°Ðº ÑÐµÐ±Ðµ{" "}
            <span className="text-brand-400 italic">ÑÐ´Ð¾Ð±Ð½Ð¾.</span>
          </h2>
          <p className="text-gray-400 text-lg mb-12 max-w-md mx-auto leading-relaxed">
            Ð ÑÐ²Ð¾ÑÐ¼ ÑÐµÐ¼Ð¿Ðµ. ÐÐ°Ð´Ð°Ð²Ð°Ð¹ Ð»ÑÐ±ÑÐµ Ð²Ð¾Ð¿ÑÐ¾ÑÑ.<br />
            Ð¢Ð²Ð¾Ð¸ Ð²Ð¾Ð¿ÑÐ¾ÑÑ Ð²Ð¸Ð´Ð¸ÑÑ ÑÐ¾Ð»ÑÐºÐ¾ ÑÑ.
          </p>
          <Link href="/auth"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-gray-900 font-semibold rounded-xl hover:bg-gray-100 transition-colors text-sm">
            ÐÐ°ÑÐ°ÑÑ Ð±ÐµÑÐ¿Ð»Ð°ÑÐ½Ð¾ â
          </Link>
          <p className="text-gray-600 text-xs mt-5">ÐÐµÐ· ÐºÐ°ÑÑÑ. ÐÐµÐ· Ð¾Ð±ÑÐ·Ð°ÑÐµÐ»ÑÑÑÐ².</p>
        </div>
      </section>

      <footer className="py-8 border-t border-[var(--border)]" style={{ background: "var(--bg)" }}>
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[var(--text-muted)]">
          <span>Â© 2026 Mentora</span>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-[var(--text)] transition-colors">ÐÐ¾Ð½ÑÐ¸Ð´ÐµÐ½ÑÐ¸Ð°Ð»ÑÐ½Ð¾ÑÑÑ</Link>
            <Link href="/terms" className="hover:text-[var(--text)] transition-colors">Ð£ÑÐ»Ð¾Ð²Ð¸Ñ Ð¸ÑÐ¿Ð¾Ð»ÑÐ·Ð¾Ð²Ð°Ð½Ð¸Ñ</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
