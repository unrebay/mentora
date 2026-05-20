import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

// Best-effort admin notification on auth failures — fire-and-forget
function notifyAdmin(text: string) {
  const BOT_TOKEN = process.env.TELEGRAM_SUPPORT_BOT_TOKEN;
  const ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID;
  if (!BOT_TOKEN || !ADMIN_CHAT_ID) return;
  fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: ADMIN_CHAT_ID, text, parse_mode: "HTML" }),
  }).catch(() => {});
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const rawNext = searchParams.get("next") ?? "/dashboard";
  // Open-redirect guard: must be same-origin path, never protocol-relative or
  // backslash-prefixed (some browsers normalize `\evil.com` to `//evil.com`).
  const next = (rawNext.startsWith("/") && !rawNext.startsWith("//") && !rawNext.startsWith("/\\")) ? rawNext : "/dashboard";
  const error = searchParams.get("error");

  // Always use canonical production URL first — prevents localhost redirect bug when
  // nginx doesn't forward x-forwarded-host to the Next.js standalone server.
  const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL ?? "").replace(/\/$/, "");
  const forwardedHost = request.headers.get("x-forwarded-host");
  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  const origin = baseUrl || (forwardedHost ? `${proto}://${forwardedHost}` : new URL(request.url).origin);

  if (error) {
    return NextResponse.redirect(`${origin}/auth?error=${encodeURIComponent(error)}`);
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (list: { name: string; value: string; options: CookieOptions }[]) =>
          list.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          ),
      },
    }
  );

  // Magic link flow (Telegram auth uses this)
  if (token_hash && type) {
    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        token_hash,
        type: type as "magiclink" | "email",
      });
      if (!verifyError) {
        return NextResponse.redirect(`${origin}${next}`);
      }
      console.error("[auth-callback] verifyOtp failed", {
        code: verifyError.code, name: verifyError.name, message: verifyError.message, status: verifyError.status,
      });
      notifyAdmin(`🚨 <b>/auth/callback</b> verifyOtp failed (telegram path)\nerr: ${verifyError.message}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("[auth-callback] verifyOtp threw", msg);
      notifyAdmin(`🚨 <b>/auth/callback</b> verifyOtp threw\nerr: ${msg}`);
    }
    return NextResponse.redirect(`${origin}/auth?error=telegram_callback`);
  }

  // OAuth / email code flow (Google auth uses this)
  // Wrapped in try/catch: exchangeCodeForSession can throw (e.g. network error,
  // PKCE verifier cookie missing) causing an unhandled 500 — now redirects gracefully.
  if (code) {
    try {
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      if (exchangeError) {
        console.error("[auth-callback] exchangeCodeForSession error", {
          name: exchangeError.name, message: exchangeError.message, status: exchangeError.status,
        });
        notifyAdmin(`🚨 <b>/auth/callback</b> OAuth exchange failed\nerr: ${exchangeError.message}`);
        // Surface the actual error to the URL so we can debug what's broken
        // without server-log access. Truncate to keep URL short.
        // Diagnostic: which cookie NAMES did the server actually receive?
        // (Names only — never values — for privacy.) The PKCE verifier cookie
        // should be named like `sb-<ref>-auth-token-code-verifier`. If it
        // isn't in this list, the cookie never made it back from the browser.
        const cookieNames = cookieStore.getAll().map((c) => c.name);
        const hasVerifier = cookieNames.some((n) => n.endsWith("-code-verifier"));
        const reason = (exchangeError.message || exchangeError.name || "unknown").slice(0, 80);
        return NextResponse.redirect(
          `${origin}/auth?error=oauth_callback&reason=${encodeURIComponent(reason)}&stage=exchange&hasVerifier=${hasVerifier}&cookieCount=${cookieNames.length}`
        );
      }
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("users")
          .select("onboarding_completed")
          .eq("id", user.id)
          .single();
        if (!profile?.onboarding_completed) {
          return NextResponse.redirect(`${origin}/onboarding`);
        }
      }
      return NextResponse.redirect(`${origin}${next}`);
    } catch (e) {
      const msg = (e instanceof Error ? e.message : String(e)).slice(0, 100);
      console.error("[auth-callback] exchangeCodeForSession threw", msg);
      notifyAdmin(`🚨 <b>/auth/callback</b> OAuth threw\nerr: ${msg}`);
      return NextResponse.redirect(
        `${origin}/auth?error=oauth_callback&reason=${encodeURIComponent(msg)}&stage=throw`
      );
    }
  }

  // No code AND no token_hash — likely a cookie/cache-related landing without proper params.
  return NextResponse.redirect(`${origin}/auth?error=oauth_callback&stage=no_code`);
}
