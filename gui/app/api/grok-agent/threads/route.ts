import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET /api/grok-agent/threads — Thread listing (stub) */
export async function GET(request: NextRequest) {
  return new Response(
    JSON.stringify({ threads: [] }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}
