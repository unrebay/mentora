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
  const response = handleI18nRouting(request);
  response.headers.set("x-pathname", pathname);
  return response;
}

export const config = {
  // Exclude: API, _next, static files, admin, auth/callback
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|admin|auth/callback|.*\\..*).*)"],
};
