import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const handleI18nRouting = createIntlMiddleware(routing);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Strip /en prefix for path matching (ru is default, no prefix)
  const localelessPath = pathname.replace(/^\/(en)(\/|$)/, "/").replace(/\/+/g, "/") || "/";

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

  // Locale-aware redirects
  const localePrefix = pathname.startsWith("/en") ? "/en" : "";
  if (!user && isProtected) {
    return NextResponse.redirect(new URL(`${localePrefix}/auth`, origin));
  }
  if (user && isAuthPage) {
    return NextResponse.redirect(new URL(`${localePrefix}/dashboard`, origin));
  }

  // Let next-intl handle locale routing (prefix, detection, rewrite)
  // next-intl v4 middleware is async — must await the result
  //
  // VPS-behind-nginx fix: when x-forwarded-proto: https is present, Next.js
  // reconstructs request.url as https://localhost:3000/... instead of http://localhost:3000/...
  // next-intl then builds its internal rewrite URLs with https://localhost:3000/ru which
  // causes Next.js standalone to fail with 500 (it runs on HTTP internally).
  // Fix: pass a request with http:// scheme so rewrite URLs use the correct protocol.
  let intlRequest = request;
  if (
    request.nextUrl.protocol === "https:" &&
    request.nextUrl.hostname === "localhost"
  ) {
    const httpUrl =
      "http://" +
      request.nextUrl.host +
      request.nextUrl.pathname +
      request.nextUrl.search;
    intlRequest = new NextRequest(httpUrl, { headers: request.headers });
  }

  const response = await handleI18nRouting(intlRequest);

  // Fix redirect Location headers: replace http://localhost:3000 with the real external origin
  // (so browser redirects like Accept-Language: en → /en go to mentora.su, not localhost)
  const location = response.headers.get("location");
  if (location?.startsWith("http://localhost:")) {
    response.headers.set("location", location.replace(/^http:\/\/localhost:\d+/, origin));
  }

  response.headers.set("x-pathname", pathname);
  return response;
}

export const config = {
  // Exclude: API, _next, static files, admin, auth/callback
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|admin|auth/callback|.*\\..*).*)"],
};
