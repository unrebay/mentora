import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const protectedPaths = ["/dashboard", "/learn", "/onboarding", "/profile"];
  const isProtected = protectedPaths.some((p) =>
    request.nextUrl.pathname.startsWith(p)
  );

  // Build canonical origin — same pattern as auth/callback/route.ts.
  // request.url contains localhost:3000 when nginx doesn't forward
  // x-forwarded-host, so we prefer NEXT_PUBLIC_BASE_URL first.
  const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL ?? "").replace(/\/$/, "");
  const forwardedHost = request.headers.get("x-forwarded-host");
  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  const origin = baseUrl || (forwardedHost ? `${proto}://${forwardedHost}` : new URL(request.url).origin);

  // Redirect unauthenticated users to auth
  if (!user && isProtected) {
    return NextResponse.redirect(new URL("/auth", origin));
  }

  // Redirect logged-in users away from auth page
  if (user && request.nextUrl.pathname === "/auth") {
    return NextResponse.redirect(new URL("/dashboard", origin));
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api|auth/callback).*)"],
};
