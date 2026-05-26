import { createServerClient } from "@supabase/ssr";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { sendEmail, welcomeEmailHtml } from "@/lib/email";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) return NextResponse.json({ ok: false }, { status: 401 });

    // Check if already sent
    const { data: profile } = await supabase
      .from("users")
      .select("welcome_sent")
      .eq("id", user.id)
      .single();

    if (profile?.welcome_sent) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const sent = await sendEmail({
      to: user.email,
      subject: "Добро пожаловать в Mentora! 🎉",
      html: welcomeEmailHtml(user.email),
    });

    if (sent) {
      // welcome_sent is a protected column — must use service-role client
      const admin = createAdmin(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      const { error: flagErr } = await admin
        .from("users")
        .update({ welcome_sent: true })
        .eq("id", user.id);
      if (flagErr) console.error("welcome_sent flag error:", flagErr.message);
    }

    return NextResponse.json({ ok: true, sent });
  } catch (err) {
    console.error("Welcome email error:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
