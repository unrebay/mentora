import { NextResponse } from "next/server";
import { requireAdmin, createAdminSupabase } from "@/lib/admin";

export const dynamic = "force-dynamic";

interface ServiceStatus {
  service: string;
  ok: boolean;
  latencyMs: number;
  detail?: string;
}

async function timed<T>(fn: () => Promise<T>): Promise<{ result?: T; error?: string; ms: number }> {
  const start = Date.now();
  try {
    const result = await Promise.race([
      fn(),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), 4000)),
    ]);
    return { result, ms: Date.now() - start };
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : String(e), ms: Date.now() - start };
  }
}

export async function GET() {
  const forbidden = await requireAdmin();
  if (forbidden) return forbidden;

  const checks: ServiceStatus[] = [];

  // 1) Supabase — try a tiny COUNT(*) query
  {
    const r = await timed(async () => {
      const sb = createAdminSupabase();
      const { error } = await sb.from("users").select("*", { count: "exact", head: true });
      if (error) throw error;
      return true;
    });
    checks.push({ service: "Supabase", ok: !r.error, latencyMs: r.ms, detail: r.error });
  }

  // 2) Anthropic — checks ENV present and pings models endpoint with HEAD-like call
  {
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) {
      checks.push({ service: "Anthropic AI", ok: false, latencyMs: 0, detail: "API key missing" });
    } else {
      const baseURL = process.env.ANTHROPIC_BASE_URL || "https://api.anthropic.com";
      const r = await timed(async () => {
        const res = await fetch(`${baseURL.replace(/\/$/, "")}/v1/models`, {
          headers: { "x-api-key": key, "anthropic-version": "2023-06-01" },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return true;
      });
      checks.push({ service: "Anthropic AI", ok: !r.error, latencyMs: r.ms, detail: r.error });
    }
  }

  // 3) YooKassa — auth ping
  {
    const shop = process.env.YOOKASSA_SHOP_ID;
    const secret = process.env.YOOKASSA_SECRET_KEY;
    if (!shop || !secret) {
      checks.push({ service: "YooKassa", ok: false, latencyMs: 0, detail: "creds missing" });
    } else {
      const auth = Buffer.from(`${shop}:${secret}`).toString("base64");
      const r = await timed(async () => {
        const res = await fetch("https://api.yookassa.ru/v3/me", {
          headers: { Authorization: `Basic ${auth}` },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return true;
      });
      checks.push({ service: "YooKassa", ok: !r.error, latencyMs: r.ms, detail: r.error });
    }
  }

  // 4) Telegram bot (auth + support — same token now)
  {
    const token = process.env.TELEGRAM_SUPPORT_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      checks.push({ service: "Telegram bot", ok: false, latencyMs: 0, detail: "token missing" });
    } else {
      const r = await timed(async () => {
        const res = await fetch(`https://api.telegram.org/bot${token}/getMe`);
        const json = await res.json();
        if (!json.ok) throw new Error(json.description || "getMe failed");
        return json.result.username;
      });
      checks.push({ service: "Telegram bot", ok: !r.error, latencyMs: r.ms, detail: r.error || (r.result as string) });
    }
  }

  // 5) Telegram poller — proxy via getWebhookInfo (poller deletes webhook on start)
  {
    const token = process.env.TELEGRAM_SUPPORT_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      checks.push({ service: "Telegram poller", ok: false, latencyMs: 0, detail: "no token" });
    } else {
      const r = await timed(async () => {
        const res = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`);
        const json = await res.json();
        if (!json.ok) throw new Error("getWebhookInfo failed");
        // Poller mode: webhook url should be empty (poller deletes it on start)
        const polling = !json.result.url;
        return polling ? "polling mode" : `webhook: ${json.result.url}`;
      });
      // Poller is "ok" if mode is polling. If webhook set, that means poller hasn't started.
      const poller_ok = !r.error && (r.result as string)?.includes("polling");
      checks.push({ service: "Telegram poller", ok: poller_ok, latencyMs: r.ms, detail: r.error || (r.result as string) });
    }
  }

  return NextResponse.json({ checks, generatedAt: new Date().toISOString() });
}
