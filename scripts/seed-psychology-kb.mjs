// Seed the psychology knowledge base from scripts/data/psychology-chunks.json.
// Idempotent: skips chunks whose (subject, topic) already exists.
// Run via .github/workflows/seed-kb.yml (needs SUPABASE service key + URL).
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !KEY) { console.error("Missing SUPABASE env"); process.exit(1); }

const sb = createClient(URL, KEY);
const chunks = JSON.parse(readFileSync(new globalThis.URL("./data/psychology-chunks.json", import.meta.url), "utf8"));
console.log(`Loaded ${chunks.length} chunks`);

const { data: existing } = await sb.from("knowledge_chunks").select("topic").eq("subject", "psychology");
const have = new Set((existing ?? []).map((r) => r.topic));

let inserted = 0, skipped = 0, errors = 0;
for (const c of chunks) {
  if (have.has(c.topic)) { skipped++; continue; }
  try {
    const er = await fetch(`${URL}/functions/v1/embed`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${KEY}` },
      body: JSON.stringify({ input: c.content }),
    });
    if (!er.ok) { console.error(`embed ${er.status} for: ${c.topic}`); errors++; continue; }
    const { embedding } = await er.json();
    const { error } = await sb.from("knowledge_chunks").insert({
      subject: "psychology", topic: c.topic, content: c.content,
      source: c.source, embedding, language: "ru",
    });
    if (error) { console.error(`insert: ${c.topic}: ${error.message}`); errors++; }
    else { inserted++; if (inserted % 10 === 0) console.log(`...${inserted} inserted`); }
  } catch (e) { console.error(`${c.topic}: ${e.message}`); errors++; }
}
console.log(`DONE: inserted=${inserted} skipped=${skipped} errors=${errors} total=${chunks.length}`);
if (errors > chunks.length / 10) process.exit(1);
