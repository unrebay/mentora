// Fact-check knowledge chunks with Sonnet (judge). Flags likely factual errors.
// Reads scripts/data/<file>.json (default psychology); prints a report, exits 1 if any FAIL.
import Anthropic from "@anthropic-ai/sdk";
import { readFileSync } from "fs";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  ...(process.env.ANTHROPIC_BASE_URL ? { baseURL: process.env.ANTHROPIC_BASE_URL } : {}),
  ...(process.env.VERCEL_BYPASS_SECRET ? { defaultHeaders: { "x-vercel-protection-bypass": process.env.VERCEL_BYPASS_SECRET } } : {}),
});

const file = process.argv[2] || "scripts/data/psychology-chunks.json";
const chunks = JSON.parse(readFileSync(file, "utf8"));
console.log(`Fact-checking ${chunks.length} chunks from ${file}\n`);

async function call(params, tries = 4) {
  for (let i = 0; i < tries; i++) {
    try { return await client.messages.create(params); }
    catch (e) { const s = e?.status; if ((s===429||s===529||s>=500) && i<tries-1) { await new Promise(r=>setTimeout(r, 2000*(i+1))); continue; } throw e; }
  }
}

let fails = 0, warns = 0;
const report = [];
for (let i = 0; i < chunks.length; i++) {
  const c = chunks[i];
  const r = await call({
    model: "claude-sonnet-4-6",
    max_tokens: 400,
    system: "Ты строгий научный рецензент по психологии. Проверь учебную карточку на ФАКТИЧЕСКИЕ ошибки (неверные даты, имена, цифры, приписанные не тем авторам открытия, устаревшие как факт утверждения). НЕ придирайся к стилю, упрощениям и краткости — это учебный формат. Отвечай СТРОГО JSON: {\"verdict\":\"OK|WARN|FAIL\",\"issues\":\"кратко что не так или пусто\"}. OK — фактически верно. WARN — мелкая неточность/спорная формулировка. FAIL — явная фактическая ошибка.",
    messages: [{ role: "user", content: `ТЕМА: ${c.topic}\nИСТОЧНИК: ${c.source}\n\nТЕКСТ:\n${c.content}` }],
  });
  let txt = r.content[0].type === "text" ? r.content[0].text.trim() : "{}";
  const a = txt.indexOf("{"), b = txt.lastIndexOf("}");
  let v = { verdict: "WARN", issues: "parse error" };
  try { v = JSON.parse(txt.slice(a, b + 1)); } catch {}
  if (v.verdict === "FAIL") { fails++; report.push(`❌ FAIL [${c.topic}] — ${v.issues}`); }
  else if (v.verdict === "WARN") { warns++; report.push(`⚠️  WARN [${c.topic}] — ${v.issues}`); }
  if ((i + 1) % 20 === 0) console.log(`...${i + 1}/${chunks.length}`);
}

console.log("\n===== FACT-CHECK REPORT =====");
console.log(report.length ? report.join("\n") : "Все карточки OK");
console.log(`\nИТОГО: OK=${chunks.length - fails - warns}  WARN=${warns}  FAIL=${fails}  (всего ${chunks.length})`);
if (fails > 0) process.exit(1);
