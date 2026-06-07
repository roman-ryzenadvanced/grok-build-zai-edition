/**
 * AG-UI Protocol Endpoint for Grok CLI.
 * Accepts CopilotKit POST requests, spawns Grok CLI, streams AG-UI SSE events.
 */

import { NextRequest } from "next/server";
import { runGrok } from "@/lib/grok-runner";
import { transformGrokToAgUi } from "@/lib/ag-ui-events";
import { v4 as uuidv4 } from "uuid";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { threadId, runId, messages, state } = body;

    // Extract the last user message
    const lastMessage = messages?.filter(
      (m: { role: string }) => m.role === "user"
    ).pop();

    if (!lastMessage) {
      return new Response(
        JSON.stringify({ error: "No user message found" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const prompt = typeof lastMessage.content === "string"
      ? lastMessage.content
      : lastMessage.content?.[0]?.text || "";

    const model = state?.model || "zai-glm-5.1";
    const cwd = state?.cwd || process.env.HOME || "/home/roman";

    const effectiveThreadId = threadId || uuidv4();
    const effectiveRunId = runId || uuidv4();

    // Create abort controller for cancellation support
    const abortController = new AbortController();
    request.signal?.addEventListener("abort", () => abortController.abort());

    // Run Grok CLI and transform to AG-UI events
    const grokEvents = runGrok(
      {
        prompt,
        model,
        cwd,
        sessionId: effectiveThreadId,
        yolo: true,
      },
      abortController.signal
    );

    const agUiStream = transformGrokToAgUi(
      grokEvents,
      effectiveThreadId,
      effectiveRunId
    );

    // Convert async generator to ReadableStream
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
      JSON.stringify({
        error: "Internal server error",
        message: (error as Error).message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
