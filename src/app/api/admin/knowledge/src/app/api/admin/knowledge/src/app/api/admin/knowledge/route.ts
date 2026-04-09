import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import OpenAI from "openai";

const ADMIN_EMAIL = "unrebay@gmail.com";

function createAdminSupabase() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
}

async function getAuthUser() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "20");
  const subject = searchParams.get("subject") ?? "";
  const search = searchParams.get("search") ?? "";
  const offset = (page - 1) * limit;
  const admin = createAdminSupabase();
  let query = admin
    .from("knowledge_chunks")
    .select("id, subject, topic, content, source, language, created_at", { count: "exact" });
  if (subject) query = query.eq("subject", subject);
  if (search) query = query.ilike("content", `%${search}%`);
  const { data, count, error } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data, count, page, limit });
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json();
  const { subject, topic, content, source, language = "ru" } = body;
  if (!subject || !content) {
    return NextResponse.json({ error: "subject and content are required" }, { status: 400 });
  }
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const embeddingResp = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: content,
  });
  const embedding = embeddingResp.data[0].embedding;
  const admin = createAdminSupabase();
  const { data, error } = await admin
    .from("knowledge_chunks")
    .insert({ subject, topic, content, source, language, embedding })
    .select("id, subject, topic, content, source, language, created_at")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const user = await getAuthUser();
  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json();
  const { ids } = body;
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "ids array is required" }, { status: 400 });
  }
  const admin = createAdminSupabase();
  const { error } = await admin.from("knowledge_chunks").delete().in("id", ids);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ deleted: ids.length });
}
