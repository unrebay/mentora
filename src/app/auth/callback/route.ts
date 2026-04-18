import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = searchParams.get("next") ?? "/dashboard";
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
    } catch {
      // fall through to error redirect below
    }
    return NextResponse.redirect(`${origin}/auth?error=telegram_callback`);
  }

  // OAuth / email code flow (Google auth uses this)
  // Wrapped in try/catch: exchangeCodeForSession can throw (e.g. network error,
  // PKCE verifier cookie missing) causing an unhandled 500 — now redirects gracefully.
  if (code) {
    try {
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      if (!exchangeError) {
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
      }
    } catch {
      // fall through to error redirect below
    }
  }

  return NextResponse.redirect(`${origin}/auth?error=oauth_callback`);
}
