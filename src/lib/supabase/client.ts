import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  // Browser talks to Supabase via the RU-reachable reverse-proxy when
  // NEXT_PUBLIC_SUPABASE_BROWSER_URL is set (e.g. https://sb.mentora.su).
  // `*.supabase.co` is fronted by Cloudflare, which RKN throttles in Russia,
  // so direct browser→supabase.co calls (auth, token refresh) hang for RU users.
  // Falls back to the direct URL when the proxy var is unset (no behaviour change).
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_BROWSER_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      // Opt-in to experimental passkey (WebAuthn) APIs:
      //   auth.signInWithPasskey() / auth.registerPasskey()
      // Existing email/password + OAuth flows are unaffected.
      auth: { experimental: { passkey: true } },
    }
  );
}
