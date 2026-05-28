/**
 * Mentora uptime monitor
 * Runs every 2 minutes via pm2 cron.
 * On 2 consecutive failures → Telegram alert (once, no spam).
 * On recovery → Telegram "restored" message.
 *
 * State is persisted in /tmp/mentora-monitor-state.json
 */
import https from 'node:https';
import fs from 'node:fs';
import { URL } from 'node:url';

const HEALTH_URL   = 'https://mentora.su/api/health';
const TG_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TG_CHAT_ID   = process.env.TELEGRAM_ADMIN_CHAT_ID;
const STATE_FILE   = '/tmp/mentora-monitor-state.json';
const TIMEOUT_MS   = 8000;

function loadState() {
  try { return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')); }
  catch { return { failures: 0, alertSent: false, downSince: null }; }
}
function saveState(s) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(s));
}

function httpGet(url) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = https.request({ hostname: u.hostname, path: u.pathname, method: 'GET', timeout: TIMEOUT_MS }, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => resolve({ status: res.statusCode, body }));
    });
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    req.on('error', reject);
    req.end();
  });
}

function sendTelegram(text) {
  if (!TG_BOT_TOKEN || !TG_CHAT_ID) { console.warn('[monitor] TG creds missing'); return Promise.resolve(); }
  const body = JSON.stringify({ chat_id: TG_CHAT_ID, text, parse_mode: 'HTML' });
  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'api.telegram.org',
      path: `/bot${TG_BOT_TOKEN}/sendMessage`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    }, (res) => { res.resume(); res.on('end', resolve); });
    req.on('error', (e) => { console.error('[monitor] TG error:', e.message); resolve(); });
    req.write(body);
    req.end();
  });
}

function now() {
  return new Date().toISOString().slice(0, 16).replace('T', ' ') + ' UTC';
}

async function main() {
  const state = loadState();
  let ok = false;
  let statusCode = '?';

  try {
    const res = await httpGet(HEALTH_URL);
    statusCode = String(res.status);
    ok = res.status === 200;
  } catch (e) {
    statusCode = e.message === 'timeout' ? 'timeout' : 'error';
  }

  if (!ok) {
    state.failures = (state.failures || 0) + 1;
    if (!state.downSince) state.downSince = now();

    // Alert on 2nd consecutive failure (avoid fluke single-check noise)
    if (state.failures === 2 && !state.alertSent) {
      await sendTelegram(`🔴 <b>Mentora недоступен</b>\n${state.downSince}\n/api/health → ${statusCode}`);
      state.alertSent = true;
    }
    console.log(`[monitor] FAIL #${state.failures} — ${statusCode}`);
  } else {
    if (state.alertSent) {
      // Recovery notification
      const downMin = state.downSince
        ? Math.round((Date.now() - new Date(state.downSince.replace(' UTC','Z')).getTime()) / 60000)
        : '?';
      await sendTelegram(`🟢 <b>Mentora восстановлен</b>\nБыл недоступен ~${downMin} мин`);
    }
    state.failures = 0;
    state.alertSent = false;
    state.downSince = null;
    console.log(`[monitor] OK`);
  }

  saveState(state);
}

main().catch(e => console.error('[monitor] crash:', e));
