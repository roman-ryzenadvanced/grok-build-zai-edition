/**
 * AG-UI Protocol Endpoint for Grok CLI.
 * Handles:
 *  - GET /api/grok-agent/info → runtime info for agent discovery
 *  - POST /api/grok-agent → RunAgentInput → AG-UI SSE stream
 */

import { NextRequest } from "next/server";
import { runGrok } from "@/lib/grok-runner";
import { transformGrokToAgUi } from "@/lib/ag-ui-events";
import { v4 as uuidv4 } from "uuid";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Runtime info endpoint — CopilotKit calls this on mount to discover agents */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  // CopilotKit fetches /api/grok-agent/info
  // Return info about available agents
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
      threads: [],
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}

function extractPrompt(body: any): string {
  const { messages } = body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return body.prompt || body.input || body.query || "";
  }

  const userRoles = ["user", "human", "User", "Human"];
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    const role = msg.role || msg.type || "";
    if (userRoles.includes(role)) {
      if (typeof msg.content === "string") return msg.content;
      if (Array.isArray(msg.content)) {
        const textPart = msg.content.find((c: any) => c.type === "text" || c.text);
        if (textPart) return textPart.text || textPart.content || "";
      }
      if (msg.text) return msg.text;
    }
  }

  // Fallback: last message
  const last = messages[messages.length - 1];
  if (typeof last.content === "string") return last.content;
  if (Array.isArray(last.content)) {
    const textPart = last.content.find((c: any) => c.type === "text" || c.text);
    if (textPart) return textPart.text || textPart.content || "";
  }
  return "";
}

function extractState(body: any): { model: string; cwd: string; instructions: string } {
  const state = body.state || {};
  const forwarded = body.forwardedProps?.state || body.forwardedProps || {};
  return {
    model: forwarded.model || state.model || "zai-glm-5-turbo",
    cwd: forwarded.cwd || state.cwd || process.env.HOME || "/home/roman",
    instructions: forwarded.instructions || state.instructions || "",
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Handle CopilotKit runtime info query
    if (body.method === "info") {
      return new Response(
        JSON.stringify({
          version: "1.0.0",
          agents: [
            { id: "default", name: "Grok Build", description: "Grok Build CLI powered by Z.ai GLM models" },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("[grok-agent] Body keys:", Object.keys(body));
    console.log("[grok-agent] Messages:", body.messages?.length || 0);

    const { threadId, runId } = body;
    const prompt = extractPrompt(body);
    const { model, cwd, instructions } = extractState(body);

    if (!prompt) {
      // Dump full body for debugging
      const bodyStr = JSON.stringify(body, null, 2);
      console.log("[grok-agent] FULL BODY (no prompt found):");
      console.log(bodyStr.substring(0, 3000));
      if (body.messages) {
        console.log("[grok-agent] Message roles:", body.messages.map((m: any) => ({ role: m.role, contentPreview: typeof m.content === 'string' ? m.content.substring(0,50) : JSON.stringify(m.content)?.substring(0,50) })));
      }
      return new Response(
        JSON.stringify({ error: "No user message found" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const effectiveThreadId = threadId || uuidv4();
    const effectiveRunId = runId || uuidv4();

    const fullPrompt = instructions ? `[${instructions}]

${prompt}` : prompt;

    console.log("[grok-agent] Prompt:", fullPrompt.substring(0, 100), "| Model:", model);

    const abortController = new AbortController();
    request.signal?.addEventListener("abort", () => abortController.abort());

    const grokEvents = runGrok(
      { prompt: fullPrompt, model, cwd, sessionId: effectiveThreadId, yolo: true },
      abortController.signal
    );

    const agUiStream = transformGrokToAgUi(grokEvents, effectiveThreadId, effectiveRunId);

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of agUiStream) {
            controller.enqueue(encoder.encode(chunk));
          }
          controller.close();
        } catch (err) {
          if ((err as Error).name !== "AbortError") {
            console.error("Stream error:", err);
            controller.close();
          }
        }
      },
      cancel() {
        abortController.abort();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    console.error("Grok agent error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", message: (error as Error).message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
