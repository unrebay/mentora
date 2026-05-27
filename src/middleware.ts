import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const handleI18nRouting = createIntlMiddleware(routing);

/**
 * Build a per-request Content-Security-Policy using a nonce.
 *
 * Why nonce + 'strict-dynamic':
 *  - 'strict-dynamic' = any script trusted via nonce can load further scripts.
 *    Modern browsers therefore IGNORE the host allow-list (spline.design, posthog,
 *    GA, GTM) as long as their entry-point script is nonce-trusted (Next.js
 *    auto-nonces its hydration bundle when middleware sets `x-nonce` on the
 *    request headers). Legacy browsers fall back to the host list (https:).
 *  - This lets us drop 'unsafe-inline' on script-src → A+ rating.
 *
 * Style-src keeps 'unsafe-inline' because:
 *  - We rely on inline styles for theme tokens (CSS-in-JS via style attribute)
 *  - Removing it would require ~hundreds of inline-style refactors and likely
 *    break the dark/light theme system. Style-src 'unsafe-inline' alone does
 *    NOT block A+; only script-src 'unsafe-inline' does.
 */
function buildCsp(nonce: string): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-eval' https:`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "img-src 'self' data: blob: https:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.anthropic.com https://api.telegram.org https://*.posthog.com https://us.i.posthog.com https://us-assets.i.posthog.com https://eu.i.posthog.com https://eu-assets.i.posthog.com https://www.google-analytics.com",
    "frame-src 'self' https://oauth.telegram.org https://*.spline.design",
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; ");
}

function applyCsp(
  response: NextResponse,
  nonce: string
): NextResponse {
  response.headers.set("Content-Security-Policy", buildCsp(nonce));
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Per-request nonce (base64 of a random UUID — Edge-runtime safe via globalThis.crypto)
  const nonce = btoa(crypto.randomUUID());
  // Forward nonce on request headers so Next.js App Router can inject it
  // into its own inline scripts (hydration, flight payload). Without this,
  // those inline scripts would be blocked by `'strict-dynamic'` policy.
  request.headers.set("x-nonce", nonce);

  // Pass through public analytics share-link pages and their API: skip i18n routing entirely.
  // /analytics/invite/[token] is a static (locale-less) page; if next-intl runs, it 404s.
  if (pathname.startsWith("/analytics/invite/")) {
    return NextResponse.next();
  }

  // /admin paths: do session refresh but skip i18n routing entirely.
  // Admin is a static route (app/admin/) — no locale context needed.
  const isAdminPath = pathname === "/admin" || pathname.startsWith("/admin/");
  if (isAdminPath) {
    // Create a mutable response so Supabase can write refreshed tokens to cookies
    let response = NextResponse.next({ request: { headers: request.headers } });
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: (cs: { name: string; value: string; options: CookieOptions }[]) => {
            const persist = request.cookies.get("mentora-persist")?.value !== "0";
            const extraOpts = persist ? { maxAge: 60 * 60 * 24 * 30 } : {};
            cs.forEach(({ name, value }) => request.cookies.set(name, value));
            response = NextResponse.next({ request: { headers: request.headers } });
            cs.forEach(({ name, value, options }) => response.cookies.set(name, value, { ...options, ...extraOpts }));
          },
        },
      }
    );
    // getUser() will refresh the session if the access token has expired
    const { data: { user: adminUser } } = await supabase.auth.getUser();

    // Hard guard: only the admin email may reach /admin/*. Everyone else → /dashboard.
    const ADMIN_EMAIL = "unrebay@gmail.com";
    if (!adminUser || adminUser.email !== ADMIN_EMAIL) {
      const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL ?? "").replace(/\/$/, "");
      const forwardedHost = request.headers.get("x-forwarded-host");
      const proto = request.headers.get("x-forwarded-proto") ?? "https";
      const origin = baseUrl || (forwardedHost ? `${proto}://${forwardedHost}` : new URL(request.url).origin);
      return NextResponse.redirect(new URL("/dashboard", origin));
    }

    response.headers.set("x-pathname", pathname);
    return applyCsp(response, nonce);
  }

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

  // Locale-aware redirects (/en prefix for English, /ru for explicit Russian paths, "" for default Russian)
  const localePrefix = pathname.startsWith("/en") ? "/en" : (isRuLocalePath ? "/ru" : "");
  if (!user && isProtected) {
    return applyCsp(NextResponse.redirect(new URL(`${localePrefix}/auth`, origin)), nonce);
  }
  if (user && isAuthPage) {
    return applyCsp(NextResponse.redirect(new URL(`${localePrefix}/dashboard`, origin)), nonce);
  }

  // For internally-rewritten /ru/* paths: pass through without calling handleI18nRouting.
  // The locale context (x-next-intl-locale: ru) was already set by the FIRST middleware run
  // (for the canonical "/" or "/pricing" etc. path) and is forwarded in the request headers.
  if (isRuLocalePath) {
    const response = NextResponse.next({ request: { headers: request.headers } });
    response.headers.set("x-pathname", pathname);
    return applyCsp(response, nonce);
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
  return applyCsp(response, nonce);
}

export const config = {
  // Exclude: API, _next, static files, auth/callback
  // Note: /admin is NOT excluded — middleware runs for it to refresh Supabase sessions,
  // but the admin branch at the top of middleware() handles it and returns early (skipping i18n).
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|auth/callback|.*\\..*).*)"],
};
