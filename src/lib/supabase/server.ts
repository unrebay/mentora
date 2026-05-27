import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            // Respect the user's "remember me" preference.
            // mentora-persist=0 → session cookie (expires on browser close)
            // mentora-persist=1 or absent → persistent cookie (30 days)
            const persist = cookieStore.get("mentora-persist")?.value !== "0";
            const extraOpts = persist ? { maxAge: 60 * 60 * 24 * 30 } : {};
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, { ...options, ...extraOpts })
            );
          } catch {
            // Server Component — cookies set in middleware
          }
        },
      },
    }
  );
}
