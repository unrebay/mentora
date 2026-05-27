/**
 * Mentora stress test — k6
 *
 * Usage:
 *   k6 run scripts/stress-test.js
 *   k6 run --vus 100 --duration 60s scripts/stress-test.js
 *
 * Install k6: brew install k6
 *
 * Scenarios:
 *   1. Anonymous load — лендинг + /pricing (нет авторизации, max трафик)
 *   2. API health — /api/admin/health (требует ADMIN_SECRET в env)
 *   3. Auth page — /ru/auth (тяжёлая страница, много JS)
 *
 * Thresholds (критерии успеха):
 *   - 95% запросов < 800ms
 *   - error rate < 1%
 */

import http from "k6/http";
import { sleep, check } from "k6";
import { Rate, Trend } from "k6/metrics";

const errorRate = new Rate("errors");
const dashboardTrend = new Trend("dashboard_duration");

// Читаем из env: k6 run -e BASE_URL=https://mentora.su ...
const BASE_URL = __ENV.BASE_URL || "https://mentora.su";
const ADMIN_SECRET = __ENV.ADMIN_SECRET || "";

export const options = {
  scenarios: {
    // Сценарий 1: постепенный рост до 100 VU за 30s, держим 60s, спуск 15s
    ramp_up: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "30s", target: 50 },
        { duration: "60s", target: 100 },
        { duration: "30s", target: 150 },
        { duration: "30s", target: 0 },
      ],
    },
  },
  thresholds: {
    http_req_duration: ["p(95)<800", "p(99)<2000"],
    http_req_failed: ["rate<0.01"],
    errors: ["rate<0.01"],
  },
};

const PAGES = [
  { path: "/ru",          name: "landing"  },
  { path: "/ru/pricing",  name: "pricing"  },
  { path: "/ru/auth",     name: "auth"     },
  { path: "/ru/about",    name: "about"    },
];

export default function () {
  // Выбираем случайную страницу
  const page = PAGES[Math.floor(Math.random() * PAGES.length)];
  const res = http.get(`${BASE_URL}${page.path}`, {
    headers: { "Accept-Encoding": "gzip" },
    tags: { page: page.name },
  });

  const ok = check(res, {
    "status 200": (r) => r.status === 200,
    "no error body": (r) => !r.body.includes("Internal Server Error"),
    "response < 2s": (r) => r.timings.duration < 2000,
  });

  errorRate.add(!ok);
  if (page.name === "dashboard") dashboardTrend.add(res.timings.duration);

  sleep(Math.random() * 2 + 0.5); // 0.5–2.5s между запросами
}

/**
 * После прогона смотреть на:
 *   - http_req_duration p(95) — должен быть < 800ms
 *   - http_req_failed    rate  — должен быть < 1%
 *   - VPS CPU/RAM в pm2 monit или htop во время теста
 *
 * Если p(95) > 1500ms при 100 VU → рассмотреть upgrade VPS или оптимизацию DB.
 */
