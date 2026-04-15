import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, createAdminSupabase } from "@/lib/admin";

export const maxDuration = 300; // 5 minutes

export async function POST(req: NextRequest) {
  try {
    const forbidden = await requireAdmin();
    if (forbidden) return forbidden;

    const { chunks } = await req.json();
    if (!Array.isArray(chunks)) {
      return NextResponse.json({ error: "chunks array required" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const admin = createAdminSupabase();

    let inserted = 0;
    let errors = 0;

    for (const chunk of chunks) {
      try {
        // Get embedding via Supabase edge function
        const embedResp = await fetch(`${supabaseUrl}/functions/v1/embed`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${serviceKey}`,
          },
          body: JSON.stringify({ input: chunk.content }),
        });

        if (!embedResp.ok) {
          errors++;
          continue;
        }

        const { embedding } = await embedResp.json();

        const { error } = await admin.from("knowledge_chunks").insert({
          subject: chunk.subject,
          topic: chunk.topic,
          content: chunk.content,
          source: chunk.source,
          embedding,
          language: "ru",
        });

        if (error) { errors++; console.error("insert:", error.message); }
        else inserted++;
      } catch (e) {
        errors++;
      }
    }

    return NextResponse.json({ inserted, errors, total: chunks.length });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
