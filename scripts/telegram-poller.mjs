#!/usr/bin/env node
// ============================================================================
// Telegram support bot poller — outbound-only worker.
//
// Why: Russian VPS firewall blocks INBOUND Telegram webhook delivery
// ("Connection timed out"), but OUTBOUND requests work. So instead of
// Telegram pushing updates to our /api/telegram/webhook, we long-poll
// getUpdates from this side and forward each update to our own local
// webhook handler (http://localhost:3000/api/telegram/webhook).
//
// Run via pm2 alongside the Next.js server: `pm2 start scripts/telegram-poller.mjs`
// ============================================================================

import fs from "fs";
import path from "path";

// Load .env.local manually (same as Next.js does at build, but at runtime here)
const envPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

const BOT_TOKEN =
  process.env.TELEGRAM_SUPPORT_BOT_TOKEN ||
  process.env.TELEGRAM_BOT_TOKEN ||
  "";
const LOCAL_WEBHOOK = process.env.LOCAL_WEBHOOK_URL || "http://localhost:3000/api/telegram/webhook";
const POLL_TIMEOUT = 25; // seconds

if (!BOT_TOKEN) {
  console.error("[poller] TELEGRAM_BOT_TOKEN missing — exiting");
  process.exit(1);
}

console.log(`[poller] Starting. Bot id: ${BOT_TOKEN.split(":")[0]}, forwarding to: ${LOCAL_WEBHOOK}`);

// Drop any active webhook so getUpdates is allowed
async function ensureWebhookDeleted() {
  try {
    const r = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/deleteWebhook?drop_pending_updates=false`, { method: "POST" });
    const j = await r.json();
    console.log("[poller] deleteWebhook:", j.description || j.ok);
  } catch (e) {
    console.error("[poller] deleteWebhook error:", e.message);
  }
}

let offset = 0;
let consecutiveErrors = 0;

async function pollOnce() {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?timeout=${POLL_TIMEOUT}${offset ? `&offset=${offset}` : ""}`;
  const res = await fetch(url, { signal: AbortSignal.timeout((POLL_TIMEOUT + 5) * 1000) });
  const json = await res.json();

  if (!json.ok) {
    throw new Error(`getUpdates failed: ${json.description || JSON.stringify(json)}`);
  }

  const updates = json.result || [];
  if (updates.length > 0) {
    console.log(`[poller] Received ${updates.length} update(s)`);
  }

  for (const update of updates) {
    offset = update.update_id + 1;
    // Forward to local webhook handler — fire and forget, don't block polling.
    fetch(LOCAL_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(update),
    }).catch((e) => console.error("[poller] forward error:", e.message));
  }

  consecutiveErrors = 0;
}

async function loop() {
  await ensureWebhookDeleted();
  while (true) {
    try {
      await pollOnce();
    } catch (e) {
      consecutiveErrors++;
      const backoff = Math.min(60_000, 1000 * Math.pow(2, consecutiveErrors));
      console.error(`[poller] error ${consecutiveErrors}: ${e.message} — sleeping ${backoff}ms`);
      await new Promise((r) => setTimeout(r, backoff));
    }
  }
}

process.on("SIGTERM", () => { console.log("[poller] SIGTERM — shutting down"); process.exit(0); });
process.on("SIGINT", () => { console.log("[poller] SIGINT — shutting down"); process.exit(0); });

loop().catch((e) => { console.error("[poller] fatal:", e); process.exit(1); });
