import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const handleI18nRouting = createIntlMiddleware(routing);

/**
 * Build a per-request Content-Security-Policy with a nonce.
 *
 * Why nonce instead of static 'unsafe-inline':
 *   - 'unsafe-inline' lets ANY inline script run — securityheaders.com penalty (B grade max).
 *   - nonce-based + 'strict-dynamic' restricts inline scripts to ones explicitly marked
 *     with the per-request nonce attribute. → A+ on securityheaders.com.
 *   - 'strict-dynamic' lets nonced scripts load further scripts they need, so we don't
 *     have to maintain a whitelist of CDN hosts.
 *
 * 'unsafe-eval' stays in script-src for now: Spline 3D and some Three.js shader paths
 *  rely on it. Removing would break /knowledge galaxy and landing hero. Acceptable
 *  trade-off — securityheaders.com still gives A+ if nonce + strict-dynamic + no
 *  'unsafe-inline' are present.
 *
 * style-src keeps 'unsafe-inline' because Tailwind/styled-jsx generate inline styles
 * that are computationally expensive to nonce per-render. Inline styles are far lower
 * risk than inline scripts and don't block A+ rating.
 */
function buildCsp(nonce: string): string {
  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    "script-src": [
      "'self'",
      `'nonce-${nonce}'`,
      "'strict-dynamic'",
      "'unsafe-eval'",
      "https:",
    ],
    "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
    "font-src": ["'self'", "data:", "https://fonts.gstatic.com", "https://cdn.jsdelivr.net"],
    "img-src": ["'self'", "data:", "blob:", "https:"],
    "connect-src": [
      "'self'",
      "https://*.supabase.co", "wss://*.supabase.co",
      "https://api.anthropic.com", "https://api.telegram.org",
      "https://*.posthog.com", "https://us.i.posthog.com", "https://us-assets.i.posthog.com",
      "https://www.google-analytics.com",
    ],
    "frame-src": ["'self'", "https://oauth.telegram.org", "https://telegram.org"],
    "worker-src": ["'self'", "blob:"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
  };
  const parts = Object.entries(directives).map(([k, v]) => `${k} ${v.join(" ")}`);
  parts.push("upgrade-insecure-requests");
  return parts.join("; ");
}

function generateNonce(): string {
  // crypto.randomUUID is available in Edge runtime (Next 14)
  return btoa(crypto.randomUUID()).replace(/=+$/, "");
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Per-request nonce — passed to layout via x-nonce request header.
  // Layout reads via headers().get('x-nonce') and applies to inline <script> tags.
  const nonce = generateNonce();
  const csp = buildCsp(nonce);

  // Mutate request headers so server components see x-nonce (and the new CSP if they need it).
  // Every NextResponse.next() that wants the layout to see the nonce must pass these forward.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);

  // Pass through public analytics share-link pages: skip i18n routing entirely.
  if (pathname.startsWith("/analytics/invite/")) {
    const r = NextResponse.next({ request: { headers: requestHeaders } });
    r.headers.set("Content-Security-Policy", csp);
    return r;
  }

  // /admin paths: do session refresh but skip i18n routing entirely.
  const isAdminPath = pathname === "/admin" || pathname.startsWith("/admin/");
  if (isAdminPath) {
    // Create a mutable response so Supabase can write refreshed tokens to cookies
    let response = NextResponse.next({ request: { headers: requestHeaders } });
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: (cs) => {
            cs.forEach(({ name, value }) => request.cookies.set(name, value));
            response = NextResponse.next({ request: { headers: requestHeaders } });
            cs.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
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
    response.headers.set("Content-Security-Policy", csp);
    return response;
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
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  // Exclude: API, _next, static files, auth/callback
  // Note: /admin is NOT excluded — middleware runs for it to refresh Supabase sessions,
  // but the admin branch at the top of middleware() handles it and returns early (skipping i18n).
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|auth/callback|.*\\..*).*)"],
};
