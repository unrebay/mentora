import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, createAdminSupabase, getEmbedding } from "@/lib/admin";

export const maxDuration = 30; // Extend timeout for OpenAI embedding calls

const CHUNK_SELECT = "id, subject, topic, content, source, language, created_at";

// GET /api/admin/knowledge — list chunks (paginated)
export async function GET(req: NextRequest) {
  const forbidden = await requireAdmin();
  if (forbidden) return forbidden;

  const { searchParams } = new URL(req.url);
  const stats   = searchParams.get("stats") === "1";
  const page    = parseInt(searchParams.get("page")  ?? "1");
  const limit   = parseInt(searchParams.get("limit") ?? "20");
  const subject = searchParams.get("subject") ?? "";
  const search  = searchParams.get("search")  ?? "";
  const offset  = (page - 1) * limit;

  const admin = createAdminSupabase();

  // Stats endpoint — returns chunk counts per subject (for KnowledgeTab visual blocks)
  if (stats) {
    const { data, error } = await admin
      .from("knowledge_chunks")
      .select("subject");
    if (error) return NextResponse.json({ bySubject: [], total: 0, error: error.message });
    const counts: Record<string, number> = {};
    for (const row of (data ?? [])) {
      const s = (row as { subject?: string }).subject ?? "";
      if (!s) continue;
      counts[s] = (counts[s] ?? 0) + 1;
    }
    const bySubject = Object.entries(counts).map(([subject, count]) => ({ subject, count }));
    return NextResponse.json({ bySubject, total: data?.length ?? 0 });
  }
  let query = admin
    .from("knowledge_chunks")
    .select(CHUNK_SELECT, { count: "exact" });

  if (subject) query = query.eq("subject", subject);
  if (search)  query = query.ilike("content", `%${search}%`);

  const { data, count, error } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data, count, page, limit });
}

// POST /api/admin/knowledge — create chunk + generate embedding
export async function POST(req: NextRequest) {
  try {
    const forbidden = await requireAdmin();
    if (forbidden) return forbidden;

    const body = await req.json();
    const { subject, topic, source, language = "ru" } = body;
    const content = body.content;
    if (!subject || !content)
      return NextResponse.json({ error: "subject and content are required" }, { status: 400 });

    const embedding = await getEmbedding(content);

    const admin = createAdminSupabase();
    const { data, error } = await admin
      .from("knowledge_chunks")
      .insert({ subject, topic, content, source, language, embedding })
      .select(CHUNK_SELECT)
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await logAudit("knowledge.create", `chunk:${data.id}`, {
      subject, topic: topic ?? null, length: content.length,
    });
    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("admin knowledge POST error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// DELETE /api/admin/knowledge — bulk delete by IDs array
export async function DELETE(req: NextRequest) {
  const forbidden = await requireAdmin();
  if (forbidden) return forbidden;

  const { ids } = await req.json();
  if (!Array.isArray(ids) || ids.length === 0)
    return NextResponse.json({ error: "ids array is required" }, { status: 400 });

  const admin = createAdminSupabase();
  const { error } = await admin.from("knowledge_chunks").delete().in("id", ids);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await logAudit("knowledge.delete", `chunks:${ids.length}`, { count: ids.length, ids });
  return NextResponse.json({ deleted: ids.length });
}
