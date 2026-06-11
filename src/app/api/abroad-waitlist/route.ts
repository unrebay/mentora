import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Lightweight in-memory throttle (per pm2 worker): max 5 submissions/min per IP.
const hits = new Map<string, { count: number; ts: number }>();
function throttled(ip: string): boolean {
  const now = Date.now();
  const h = hits.get(ip);
  if (!h || now - h.ts > 60_000) {
    hits.set(ip, { count: 1, ts: now });
    return false;
  }
  h.count += 1;
  if (hits.size > 5000) hits.clear(); // memory guard
  return h.count > 5;
}

export async function POST(req: Request) {
  try {
    const { email, locale, company } = await req.json();

    // Honeypot filled => bot. Pretend success.
    if (typeof company === "string" && company.length > 0) {
      return NextResponse.json({ ok: true });
    }

    if (typeof email !== "string" || !EMAIL_RE.test(email.trim().toLowerCase()) || email.length > 320) {
      return NextResponse.json({ error: "invalid_email" }, { status: 400 });
    }

    const ip = (req.headers.get("x-forwarded-for") ?? "unknown").split(",")[0].trim();
    if (throttled(ip)) {
      return NextResponse.json({ error: "rate_limited" }, { status: 429 });
    }

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const { error } = await supabase.from("abroad_waitlist").upsert(
      {
        email: email.trim().toLowerCase(),
        locale: locale === "en" ? "en" : "ru",
        source: "abroad_page",
      },
      { onConflict: "email", ignoreDuplicates: true },
    );
    if (error) {
      console.error("abroad-waitlist insert error:", error.message);
      return NextResponse.json({ error: "server" }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
}
