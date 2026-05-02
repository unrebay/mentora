import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { hash, ...userData } = data;

    // ── Verify Telegram HMAC-SHA256 hash ─────────────────────────────────
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      console.error("[telegram-auth] TELEGRAM_BOT_TOKEN env missing");
      return NextResponse.json({ error: "Bot token not configured" }, { status: 500 });
    }

    const botIdPrefix = botToken.split(":")[0]; // public part — safe to log
    const tokenLen = botToken.length;

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
      // Diagnostic logging — never reveal full token, only public bot id
      console.error("[telegram-auth] hash mismatch", {
        bot_id: botIdPrefix,
        token_len: tokenLen,
        check_string_keys: Object.keys(userData).sort().join(","),
        received_hash_tail: typeof hash === "string" ? hash.slice(-8) : "(none)",
        computed_hash_tail: expectedHash.slice(-8),
        user_id: userData.id,
        auth_date: userData.auth_date,
      });
      return NextResponse.json({
        error: "Invalid hash",
        // hint helps debugging in prod — mentora_su_bot id is 5xx-prefix; if logs show different prefix, env var has wrong bot
        hint: `bot_id=${botIdPrefix}`,
      }, { status: 401 });
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

// ── Diagnostic GET ─────────────────────────────────────────────────────────
// Returns the public bot id prefix from TELEGRAM_BOT_TOKEN and asks Telegram
// for the bot's actual username via getMe. Lets us verify that prod's token
// matches the @mentora_su_bot widget on /auth.
// Open: https://mentora.su/api/auth/telegram?diag=1
export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get("diag") !== "1") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    return NextResponse.json({ env: "TELEGRAM_BOT_TOKEN missing" }, { status: 500 });
  }
  const botIdPrefix = botToken.split(":")[0];
  try {
    const r = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
    const j = await r.json();
    return NextResponse.json({
      bot_id_from_token: botIdPrefix,
      token_length: botToken.length,
      getMe_ok: j.ok,
      bot_username: j.result?.username ?? null,
      bot_first_name: j.result?.first_name ?? null,
      expected_widget_bot: "mentora_su_bot",
    });
  } catch (e: unknown) {
    return NextResponse.json({
      bot_id_from_token: botIdPrefix,
      getMe_error: e instanceof Error ? e.message : String(e),
    }, { status: 500 });
  }
}
