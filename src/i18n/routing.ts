import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["ru", "en"],
  defaultLocale: "ru",
  localePrefix: "as-needed", // /ru/* becomes /*, /en/* stays as /en/*
  // Never auto-redirect by Accept-Language. Default to RU for everyone — let
  // users opt into /en explicitly via the LanguageSwitcher (which writes a
  // NEXT_LOCALE cookie that next-intl respects for subsequent visits).
  localeDetection: false,
});
