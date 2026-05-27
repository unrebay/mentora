import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * POST /api/auth/check-provider
 * Body: { email: string }
 *
 * Returns which auth provider(s) this email is registered with.
 * Called after a failed signInWithPassword to give a meaningful error
 * instead of the generic "invalid credentials".
 *
 * Security: returns {providers:[]} for unknown emails (no user enumeration).
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const email = (body?.email ?? "").toString().trim().toLowerCase();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ providers: [] });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) {
      return NextResponse.json({ providers: [] });
    }

    const admin = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: users } = await admin.auth.admin.listUsers({ perPage: 1000 });
    const user = users?.users?.find(
      (u) => u.email?.toLowerCase() === email,
    );

    if (!user) {
      return NextResponse.json({ providers: [] });
    }

    const providers = (user.identities ?? []).map((i) => i.provider);
    const raw = user as unknown as { encrypted_password?: string };
    const hasPassword =
      typeof raw.encrypted_password === "string" &&
      raw.encrypted_password.length > 0;

    return NextResponse.json({ providers, hasPassword });
  } catch {
    return NextResponse.json({ providers: [] });
  }
}
