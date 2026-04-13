import { NextResponse } from "next/server";
import { requireAdmin, createAdminSupabase } from "@/lib/admin";

export const dynamic = "force-dynamic";

async function checkAnthropic() {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return { ok: false, latencyMs: 0, error: "ANTHROPIC_API_KEY не задан" };
  const start = Date.now();
  try {
    // Use proxy if available (VPS is geo-blocked by Anthropic)
    const baseURL = process.env.ANTHROPIC_BASE_URL ?? "https://api.anthropic.com";
    const headers: Record<string, string> = {
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    };
    const bypassSecret = process.env.VERCEL_BYPASS_SECRET;
    if (bypassSecret) headers["x-vercel-protection-bypass"] = bypassSecret;
    const res = await fetch(`${baseURL}/v1/models`, {
      headers,
      signal: AbortSignal.timeout(8000),
    });
    const latencyMs = Date.now() - start;
    if (res.status === 401) return { ok: false, latencyMs, error: "Неверный ключ (401)" };
    if (res.status === 403) return { ok: false, latencyMs, error: "Нет доступа (403)" };
    if (!res.ok) return { ok: false, latencyMs, error: `HTTP ${res.status}` };
    return { ok: true, latencyMs };
  } catch (e: unknown) {
    return { ok: false, latencyMs: Date.now() - start, error: e instanceof Error ? e.message : "Timeout" };
  }
}

async function checkOpenAI() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return { ok: false, latencyMs: 0, error: "OPENAI_API_KEY не задан" };
  const start = Date.now();
  try {
    const res = await fetch("https://api.openai.com/v1/models", {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(5000),
    });
    const latencyMs = Date.now() - start;
    if (res.status === 401) return { ok: false, latencyMs, error: "Неверный ключ (401)" };
    if (res.status === 403) return { ok: true, latencyMs, error: "Гео-блок (ОК — работает через прокси)" };
    if (!res.ok) return { ok: false, latencyMs, error: `HTTP ${res.status}` };
    return { ok: true, latencyMs };
  } catch (e: unknown) {
    return { ok: false, latencyMs: Date.now() - start, error: e instanceof Error ? e.message : "Timeout" };
  }
}

async function checkSupabase() {
  const start = Date.now();
  try {
    const sb = createAdminSupabase();
    const { error } = await sb.from("users").select("id").limit(1);
    const latencyMs = Date.now() - start;
    if (error) return { ok: false, latencyMs, error: error.message };
    return { ok: true, latencyMs };
  } catch (e: unknown) {
    return { ok: false, latencyMs: Date.now() - start, error: e instanceof Error ? e.message : "Unknown" };
  }
}

export async function GET() {
  const forbidden = await requireAdmin();
  if (forbidden) return forbidden;

  const [anthropic, openai, supabase] = await Promise.all([checkAnthropic(), checkOpenAI(), checkSupabase()]);

  const envVars = [
    "ANTHROPIC_API_KEY","OPENAI_API_KEY","NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY","SUPABASE_SERVICE_ROLE_KEY",
    "NEXT_PUBLIC_POSTHOG_KEY","YOOKASSA_SECRET_KEY","YOOKASSA_SHOP_ID","RESEND_API_KEY",
    "ANTHROPIC_BASE_URL","VERCEL_BYPASS_SECRET",
  ].map(name => ({
    name,
    present: !!process.env[name],
    preview: process.env[name] ? process.env[name]!.slice(0, 6) + "…" : null,
  }));

  return NextResponse.json({
    status: anthropic.ok && supabase.ok ? "healthy" : "degraded",
    services: { anthropic, openai, supabase },
    envVars,
    checkedAt: new Date().toISOString(),
  });
}
