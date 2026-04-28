import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const handleI18nRouting = createIntlMiddleware(routing);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Detect internally-rewritten Russian locale paths.
  // next-intl rewrites "/" → "/ru", "/pricing" → "/ru/pricing", etc.
  // Next.js runs middleware AGAIN for these rewritten paths; we must pass through
  // without calling handleI18nRouting to avoid a redirect loop (/ru → / → /ru → ...).
  const isRuLocalePath = pathname === "/ru" || pathname.startsWith("/ru/");

  // Strip locale prefix for consistent path matching
  let localelessPath: string;
  if (isRuLocalePath) {
    // "/ru/dashboard" → "/dashboard", "/ru" → "/"
    localelessPath = pathname.slice(3) || "/";
  } else {
    // Strip /en prefix for English paths; Russian paths have no prefix at the browser level
    localelessPath = pathname.replace(/^\/(en)(\/|$)/, "/").replace(/\/+/g, "/") || "/";
  }

  const protectedPaths = ["/dashboard", "/learn", "/onboarding", "/profile"];
  const isProtected = protectedPaths.some((p) => localelessPath.startsWith(p));
  const isAuthPage = localelessPath === "/auth" || localelessPath.startsWith("/auth/");

  // Build canonical origin
  const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL ?? "").replace(/\/$/, "");
  const forwardedHost = request.headers.get("x-forwarded-host");
  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  const origin = baseUrl || (forwardedHost ? `${proto}://${forwardedHost}` : new URL(request.url).origin);

  // Supabase auth check (read-only — no cookie refresh here to keep middleware simple)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => request.cookies.getAll(), setAll: () => {} } }
  );
  const { data: { user } } = await supabase.auth.getUser();

  // Locale-aware redirects (use /en prefix for English paths; no prefix for Russian)
  const localePrefix = pathname.startsWith("/en") ? "/en" : "";
  if (!user && isProtected) {
    return NextResponse.redirect(new URL(`${localePrefix}/auth`, origin));
  }
  if (user && isAuthPage) {
    return NextResponse.redirect(new URL(`${localePrefix}/dashboard`, origin));
  }

  // For internally-rewritten /ru/* paths: pass through without calling handleI18nRouting.
  // The locale context (x-next-intl-locale: ru) was already set by the FIRST middleware run
  // (for the canonical "/" or "/pricing" etc. path) and is forwarded in the request headers.
  if (isRuLocalePath) {
    const response = NextResponse.next();
    response.headers.set("x-pathname", pathname);
    return response;
  }

  // Let next-intl handle locale routing (prefix, detection, rewrite)
  // next-intl v4 middleware is async — must await the result
  const response = await handleI18nRouting(request);

  // VPS-behind-nginx fix: nginx sends x-forwarded-proto:https but no x-forwarded-host,
  // so Next.js reconstructs request.url as https://localhost:3000/...
  // next-intl then sets x-middleware-rewrite: https://localhost:3000/ru which causes
  // Next.js standalone (HTTP-only) to 500 or create redirect loops.
  // Fix: patch the rewrite URL to use http:// so the internal request goes to the local server.
  const rewrite = response.headers.get("x-middleware-rewrite");
  if (rewrite?.match(/^https:\/\/localhost:/)) {
    response.headers.set(
      "x-middleware-rewrite",
      rewrite.replace(/^https:\/\/localhost:/, "http://localhost:")
    );
  }

  // Fix redirect Location headers: replace any localhost origin with the real external origin
  // (so browser redirects like Accept-Language: en → /en go to mentora.su, not localhost)
  const location = response.headers.get("location");
  if (location?.match(/^https?:\/\/localhost:/)) {
    response.headers.set(
      "location",
      location.replace(/^https?:\/\/localhost:\d+/, origin)
    );
  }

  response.headers.set("x-pathname", pathname);
  return response;
}

export const config = {
  // Exclude: API, _next, static files, admin, auth/callback
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|admin|auth/callback|.*\\..*).*)"],
};
