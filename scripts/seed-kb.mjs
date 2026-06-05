// Universal KB seeder: node scripts/seed-kb.mjs <subject>
// Reads scripts/data/<subject>-chunks.json; idempotent by (subject, topic).
import { readFileSync } from "fs";

const subject = process.argv[2];
if (!subject) { console.error("usage: node scripts/seed-kb.mjs <subject>"); process.exit(1); }
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !KEY) { console.error("Missing SUPABASE env"); process.exit(1); }

const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };
const chunks = JSON.parse(readFileSync(new globalThis.URL(`./data/${subject}-chunks.json`, import.meta.url), "utf8"));
console.log(`Loaded ${chunks.length} chunks for '${subject}'`);

const exRes = await fetch(`${URL}/rest/v1/knowledge_chunks?subject=eq.${subject}&select=topic`, { headers: H });
const existing = exRes.ok ? await exRes.json() : [];
const have = new Set(existing.map((r) => r.topic));
console.log(`Already in DB: ${have.size} topics`);

let inserted = 0, skipped = 0, errors = 0;
for (const c of chunks) {
  if (have.has(c.topic)) { skipped++; continue; }
  try {
    const er = await fetch(`${URL}/functions/v1/embed`, { method: "POST", headers: H, body: JSON.stringify({ input: c.content }) });
    if (!er.ok) { console.error(`embed ${er.status}: ${c.topic}`); errors++; continue; }
    const { embedding } = await er.json();
    const ins = await fetch(`${URL}/rest/v1/knowledge_chunks`, {
      method: "POST", headers: { ...H, Prefer: "return=minimal" },
      body: JSON.stringify({ subject, topic: c.topic, content: c.content, source: c.source, embedding, language: "ru" }),
    });
    if (!ins.ok) { console.error(`insert ${ins.status}: ${c.topic}: ${(await ins.text()).slice(0,120)}`); errors++; }
    else { inserted++; have.add(c.topic); if (inserted % 15 === 0) console.log(`...${inserted}`); }
  } catch (e) { console.error(`${c.topic}: ${e.message}`); errors++; }
}
console.log(`DONE: inserted=${inserted} skipped=${skipped} errors=${errors} total=${chunks.length}`);
if (errors > 0) process.exit(1);
