import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { sendEmail, reengagementEmailHtml } from "@/lib/email";

// Vercel cron calls this every day at 10:00 UTC
// Protected by CRON_SECRET env var
export async function GET(req: NextRequest) {
  const secret = req.headers.get("authorization");
  if (secret !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Use service role to read all users (bypasses RLS)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const threeDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // Find users who:
  // 1. Have been active (sent at least 1 message — last_active_at is set)
  // 2. Last active 3–7 days ago (inactive window)
  // 3. Haven't been sent reengagement recently
  const { data: users, error } = await supabase
    .from("users")
    .select("id, email, last_active_at, reengagement_sent_at")
    .not("last_active_at", "is", null)
    .lt("last_active_at", threeDaysAgo)
    .gt("last_active_at", sevenDaysAgo)
    .or(`reengagement_sent_at.is.null,reengagement_sent_at.lt.${sevenDaysAgo}`);

  if (error) {
    console.error("Reengagement cron error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let sent = 0;
  let failed = 0;

  for (const user of users ?? []) {
    if (!user.email) continue;

    const ok = await sendEmail({
      to: user.email,
      subject: "Ментор скучает 👋 — вернись к урокам",
      html: reengagementEmailHtml(),
    });

    if (ok) {
      await supabase
        .from("users")
        .update({ reengagement_sent_at: new Date().toISOString() })
        .eq("id", user.id);
      sent++;
    } else {
      failed++;
    }
  }

  console.log(`Reengagement cron: ${sent} sent, ${failed} failed, ${users?.length ?? 0} candidates`);
  return NextResponse.json({ ok: true, sent, failed, total: users?.length ?? 0 });
}
