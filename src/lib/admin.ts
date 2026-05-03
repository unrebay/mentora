import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const ADMIN_EMAIL = "unrebay@gmail.com";

export function createAdminSupabase() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
}

export async function getAuthUser() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cs) =>
          cs.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          ),
      },
    }
  );
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/** Returns forbidden Response if not admin, or null if OK */
export async function requireAdmin() {
  const user = await getAuthUser();
  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

export async function getEmbedding(content: string): Promise<number[]> {
  // Use Supabase Edge Function with gte-small (384-dim) — avoids OpenAI geo-blocking
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const resp = await fetch(`${supabaseUrl}/functions/v1/embed`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${serviceKey}`,
    },
    body: JSON.stringify({ input: content }),
  });
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Embedding failed: ${resp.status} ${err}`);
  }
  const data = await resp.json();
  return data.embedding as number[];
}

/**
 * Logs an admin action to the admin_audit_log table.
 * Fire-and-forget — never fails the calling endpoint if logging itself errors.
 *
 * Example:
 *   await logAudit("knowledge.create", `chunk:${id}`, { subject: row.subject, length: row.content.length });
 */
export async function logAudit(
  action: string,
  target?: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  try {
    const sb = createAdminSupabase();
    await sb.from("admin_audit_log").insert({
      admin_email: ADMIN_EMAIL,
      action,
      target,
      metadata,
    });
  } catch (e) {
    console.error("[logAudit] failed:", e instanceof Error ? e.message : String(e));
  }
}
