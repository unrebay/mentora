import { NextResponse } from "next/server";

/**
 * GET /api/health
 * Lightweight healthcheck — no DB, no auth.
 * Used by the VPS uptime monitor to detect outages and send Telegram alerts.
 */
export async function GET() {
  return NextResponse.json({ ok: true, ts: Date.now() });
}
