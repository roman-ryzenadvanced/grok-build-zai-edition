import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET /api/grok-agent/info — Runtime info for CopilotKit agent discovery */
export async function GET(request: NextRequest) {
  return new Response(
    JSON.stringify({
      version: "1.0.0",
      agents: [
        {
          id: "default",
          name: "Grok Build",
          description: "Grok Build CLI powered by Z.ai GLM models",
        },
      ],
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}

/** POST /api/grok-agent/info — Some clients POST to info */
export async function POST(request: NextRequest) {
  return new Response(
    JSON.stringify({
      version: "1.0.0",
      agents: [
        {
          id: "default",
          name: "Grok Build",
          description: "Grok Build CLI powered by Z.ai GLM models",
        },
      ],
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}
