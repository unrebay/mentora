import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  const data = await req.json();
  const { hash, ...userData } = data;

  // Verify Telegram HMAC-SHA256 hash
  const botToken = process.env.TELEGRAM_BOT_TOKEN!;
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

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

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
}
