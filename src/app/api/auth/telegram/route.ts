import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { hash, ...userData } = data;

    // Verify Telegram HMAC-SHA256 hash
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      return NextResponse.json({ error: "Bot token not configured" }, { status: 500 });
    }

    const secret = crypto.createHash("sha256").update(botToken).digest();
    const checkString = Object.keys(userData)
      .sort()
      .map((k) => `${k}=${userData[k]}`)
      .join("\n");
    const expectedHash = crypto
      .createHmac("sha256", secret)
      .update(checkString)
      .digest("hex");

    if (expectedHash !== hash) {
      return NextResponse.json({ error: "Invalid hash" }, { status: 401 });
    }

    // Auth data must be < 24 hours old
    if (Date.now() / 1000 - parseInt(userData.auth_date) > 86400) {
      return NextResponse.json({ error: "Auth data expired" }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const telegramEmail = `tg_${userData.id}@mentora.su`;

    // Ensure user exists — try to create, ignore "already registered" error
    const { error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email: telegramEmail,
      email_confirm: true,
      user_metadata: {
        telegram_id: userData.id,
        full_name: [userData.first_name, userData.last_name]
          .filter(Boolean)
          .join(" "),
        username: userData.username,
        avatar_url: userData.photo_url,
        provider: "telegram",
      },
    });

    if (createErr && !createErr.message.toLowerCase().includes("already")) {
      return NextResponse.json({ error: createErr.message }, { status: 500 });
    }

    // Generate magic link — redirects through PKCE callback handler
    const { data: linkData, error: linkErr } =
      await supabaseAdmin.auth.admin.generateLink({
        type: "magiclink",
        email: telegramEmail,
        options: {
          redirectTo: "https://mentora.su/auth/callback",
        },
      });

    if (linkErr) {
      return NextResponse.json({ error: linkErr.message }, { status: 500 });
    }

    return NextResponse.json({
      action_link: linkData.properties.action_link,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("[telegram auth]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
