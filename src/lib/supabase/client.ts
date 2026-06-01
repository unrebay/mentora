import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      // Opt-in to experimental passkey (WebAuthn) APIs:
      //   auth.signInWithPasskey() / auth.registerPasskey()
      // Existing email/password + OAuth flows are unaffected.
      auth: { experimental: { passkey: true } },
    }
  );
}
