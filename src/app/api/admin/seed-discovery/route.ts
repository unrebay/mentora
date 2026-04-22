import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const ADMIN_TOKEN = process.env.ADMIN_SECRET ?? "mentora-seed-2026";

export async function POST(req: NextRequest) {
  const auth = req.headers.get("x-admin-token");
  if (auth !== ADMIN_TOKEN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const subject = searchParams.get("subject") ?? "discovery";

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Get chunks without embeddings (process 8 at a time to avoid timeout)
  const { data: chunks, error } = await supabase
    .from("knowledge_chunks")
    .select("id, content")
    .eq("subject", subject)
    .is("embedding", null)
    .limit(8);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!chunks?.length) {
    return NextResponse.json({ message: "All discovery chunks already embedded!", processed: 0, remaining: 0 });
  }

  let processed = 0;
  const errors: string[] = [];

  for (const chunk of chunks) {
    try {
      const embedResp = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/embed`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          },
          body: JSON.stringify({ input: chunk.content }),
          signal: AbortSignal.timeout(8000),
        }
      );
      const embedData = await embedResp.json();
      if (embedData.embedding) {
        await supabase
          .from("knowledge_chunks")
          .update({ embedding: embedData.embedding })
          .eq("id", chunk.id);
        processed++;
      }
    } catch (e) {
      errors.push(String(e));
      console.error("Embed error for chunk", chunk.id, e);
    }
  }

  const { count: remaining } = await supabase
    .from("knowledge_chunks")
    .select("*", { count: "exact", head: true })
    .eq("subject", subject)
    .is("embedding", null);

  return NextResponse.json({
    processed,
    remaining: remaining ?? 0,
    errors,
    message: `Processed ${processed}/${chunks.length}. Remaining without embedding: ${remaining ?? 0}`,
  });
}
