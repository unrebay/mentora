import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { hash, ...userData } = data;

    // ── 1. Verify Telegram HMAC-SHA256 hash ──────────────────────────────
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      console.error("[telegram-auth] TELEGRAM_BOT_TOKEN env missing");
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
      console.error("[telegram-auth] hash mismatch", {
        bot_id: botToken.split(":")[0],
        check_string_keys: Object.keys(userData).sort().join(","),
        received_hash_tail: typeof hash === "string" ? hash.slice(-8) : "(none)",
        computed_hash_tail: expectedHash.slice(-8),
      });
      return NextResponse.json({ error: "Invalid hash" }, { status: 401 });
    }

    // Auth data must be < 24 hours old
    if (Date.now() / 1000 - parseInt(userData.auth_date) > 86400) {
      return NextResponse.json({ error: "Auth data expired" }, { status: 401 });
    }

    // ── 2. Ensure Supabase env ───────────────────────────────────────────
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !serviceRoleKey || !anonKey) {
      console.error("[telegram-auth] Supabase env missing");
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
    const telegramEmail = `tg_${userData.id}@mentora.su`;

    // ── 3. Ensure user exists (create if first time, ignore "already" error) ─
    const { error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email: telegramEmail,
      email_confirm: true,
      user_metadata: {
        telegram_id: userData.id,
        full_name: [userData.first_name, userData.last_name].filter(Boolean).join(" "),
        username: userData.username,
        avatar_url: userData.photo_url,
        provider: "telegram",
      },
    });

    if (createErr && !createErr.message.toLowerCase().includes("already")) {
      console.error("[telegram-auth] createUser failed", createErr.message);
      return NextResponse.json({ error: createErr.message }, { status: 500 });
    }

    // ── 4. Generate magic-link → extract hashed_token ────────────────────
    const { data: linkData, error: linkErr } =
      await supabaseAdmin.auth.admin.generateLink({
        type: "magiclink",
        email: telegramEmail,
      });

    if (linkErr || !linkData?.properties?.hashed_token) {
      console.error("[telegram-auth] generateLink failed", linkErr?.message);
      return NextResponse.json(
        { error: linkErr?.message ?? "Failed to generate link" },
        { status: 500 }
      );
    }

    // ── 5. Server-side verifyOtp → sets session cookies on the response ──
    // No browser roundtrip to Supabase redirectTo — bypass URL allowlist headache.
    const cookieStore = await cookies();
    const supabaseSSR = createServerClient(supabaseUrl, anonKey, {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (list: { name: string; value: string; options: CookieOptions }[]) =>
          list.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          ),
      },
    });

    const { error: verifyError } = await supabaseSSR.auth.verifyOtp({
      token_hash: linkData.properties.hashed_token,
      type: "magiclink",
    });

    if (verifyError) {
      console.error("[telegram-auth] verifyOtp failed", {
        name: verifyError.name,
        message: verifyError.message,
        status: verifyError.status,
        code: verifyError.code,
      });
      return NextResponse.json(
        { error: `verify_failed: ${verifyError.message}` },
        { status: 500 }
      );
    }

    // ── 6. Decide where to send user (onboarding if not completed) ───────
    const { data: { user } } = await supabaseSSR.auth.getUser();
    let next = "/dashboard";
    if (user) {
      const { data: profile } = await supabaseSSR
        .from("users")
        .select("onboarding_completed")
        .eq("id", user.id)
        .single();
      if (!profile?.onboarding_completed) next = "/onboarding";
    }

    // Cookies were set on cookieStore — Next will include them in the response.
    return NextResponse.json({ ok: true, next });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("[telegram auth]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
