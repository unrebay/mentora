import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, createAdminSupabase, getEmbedding } from "@/lib/admin";

const CHUNK_SELECT = "id, subject, topic, content, source, language, created_at";

// PUT /api/admin/knowledge/[id] — update chunk + regenerate embedding
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const forbidden = await requireAdmin();
  if (forbidden) return forbidden;

  const { subject, topic, content, source, language } = await req.json();
  if (!content)
    return NextResponse.json({ error: "content is required" }, { status: 400 });

  const embedding = await getEmbedding(content);

  const admin = createAdminSupabase();
  const { data, error } = await admin
    .from("knowledge_chunks")
    .update({ subject, topic, content, source, language, embedding })
    .eq("id", params.id)
    .select(CHUNK_SELECT)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

// DELETE /api/admin/knowledge/[id] — delete single chunk
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const forbidden = await requireAdmin();
  if (forbidden) return forbidden;

  const admin = createAdminSupabase();
  const { error } = await admin
    .from("knowledge_chunks")
    .delete()
    .eq("id", params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ deleted: 1 });
}
