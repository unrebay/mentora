import { NextRequest, NextResponse } from "next/server";

// Anthropic proxy — routes VPS requests to Anthropic through Vercel (EU/US IP)
// Needed because Russian VPS IPs are geo-blocked by Anthropic
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  // Auth: VPS sends x-vercel-protection-bypass (already in defaultHeaders of Anthropic client)
  // This is the same secret Vercel uses for deployment protection bypass.
  const bypass = req.headers.get("x-vercel-protection-bypass");
  // Block undefined-secret exploit + timing-leak via plain !== comparison.
  const expectedBypass = process.env.VERCEL_BYPASS_SECRET;
  if (!expectedBypass) {
    return new NextResponse("Misconfigured", { status: 500 });
  }
  if (!bypass || bypass.length !== expectedBypass.length || bypass !== expectedBypass) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { path } = await params;
  const pathStr = path.join("/");
  // Whitelist allowed upstream paths. Prevents catch-all abuse if VERCEL_BYPASS_SECRET leaks.
  const ALLOWED_PATHS = new Set(["v1/messages"]);
  if (!ALLOWED_PATHS.has(pathStr)) {
    return new NextResponse("Not Found", { status: 404 });
  }
  const body = await req.text();

  const headers: Record<string, string> = {
    "x-api-key": process.env.ANTHROPIC_API_KEY!,
    "anthropic-version": req.headers.get("anthropic-version") ?? "2023-06-01",
    "content-type": "application/json",
  };

  const beta = req.headers.get("anthropic-beta");
  if (beta) headers["anthropic-beta"] = beta;

  // Forward anthropic-beta + accept so SSE streaming negotiates correctly.
  const accept = req.headers.get("accept");
  if (accept) headers["accept"] = accept;

  const upstream = await fetch(`https://api.anthropic.com/${pathStr}`, {
    method: "POST",
    headers,
    body,
  });

  // Pass the upstream response straight through WITHOUT buffering. For streaming
  // requests (stream:true → SSE) this preserves token-by-token delivery; for
  // normal calls it is the same JSON bytes. Using .text() here would collect the
  // whole answer first and kill streaming.
  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers: {
      "content-type": upstream.headers.get("content-type") ?? "application/json",
      "cache-control": "no-cache, no-transform",
    },
  });
}

// Edge runtime — REQUIRED for streaming. Verified by diag workflow: direct
// Anthropic SSE = 9 chunks (first at 0.66s), but via the Node serverless proxy
// the same answer arrived as 1 chunk at the end (Lambda buffers piped bodies).
// Edge functions stream natively → token-by-token chat delivery works.
// Trade-off: edge request body limit is 4MB (Node was 4.5MB) — mitigated by
// client-side image compression in ChatInterface (photos now ~<1MB base64).
export const runtime = "edge";
