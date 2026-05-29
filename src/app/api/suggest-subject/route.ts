import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { notifyAdmin, mskNow } from "@/lib/notifyAdmin";

const recentDedup = new Map<string, number>();
const DEDUP_MS = 10_000;
function isDuplicate(key: string): boolean {
  const last = recentDedup.get(key) ?? 0;
  if (Date.now() - last < DEDUP_MS) return true;
  recentDedup.set(key, Date.now());
  if (recentDedup.size > 500) {
    const cutoff = Date.now() - DEDUP_MS;
    for (const [k, v] of recentDedup) if (v < cutoff) recentDedup.delete(k);
  }
  return false;
}

export async function POST(req: NextRequest) {
  try {
    const { subject_name, comment, user_id } = await req.json();
    if (!subject_name || typeof subject_name !== "string") {
      return NextResponse.json({ ok: false, error: "missing subject_name" }, { status: 400 });
    }
    const name = subject_name.trim().slice(0, 80);
    const note = comment?.trim()?.slice(0, 500) || null;

    const dedupKey = `${user_id ?? "anon"}:${name.toLowerCase()}`;
    if (isDuplicate(dedupKey)) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return NextResponse.json({ ok: false, error: "no supabase config" }, { status: 500 });

    const sb = createClient(url, key);
    await sb.from("subject_suggestions").insert({
      subject_name: name,
      comment: note,
      user_id: user_id ?? null,
    });

    let msg = `📚 <b>Новое предложение предмета</b>\n\n`;
    msg += `<b>Предмет:</b> ${name}\n`;
    if (note) msg += `<b>Комментарий:</b> ${note}\n`;
    if (user_id) msg += `<b>User ID:</b> <code>${user_id}</code>\n`;
    msg += `\n<i>${mskNow()} МСК</i>`;

    notifyAdmin(msg);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
