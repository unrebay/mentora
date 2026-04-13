import { NextRequest, NextResponse } from "next/server";

// Anthropic proxy — routes VPS requests to Anthropic through Vercel (EU/US IP)
// Needed because Russian VPS IPs are geo-blocked by Anthropic
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const pathStr = path.join("/");
  const body = await req.text();

  const headers: Record<string, string> = {
    "x-api-key": process.env.ANTHROPIC_API_KEY!,
    "anthropic-version": req.headers.get("anthropic-version") ?? "2023-06-01",
    "content-type": "application/json",
  };

  const beta = req.headers.get("anthropic-beta");
  if (beta) headers["anthropic-beta"] = beta;

  const upstream = await fetch(`https://api.anthropic.com/${pathStr}`, {
    method: "POST",
    headers,
    body,
  });

  const responseBody = await upstream.text();
  return new NextResponse(responseBody, {
    status: upstream.status,
    headers: { "content-type": upstream.headers.get("content-type") ?? "application/json" },
  });
}
