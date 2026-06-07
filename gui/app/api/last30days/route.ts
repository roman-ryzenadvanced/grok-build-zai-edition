/**
 * Last30Days Research API Endpoint.
 * Spawns the last30days.py research engine and streams results via SSE.
 * Uses only free/API-less sources by default (Reddit, HN, Polymarket, GitHub).
 */

import { NextRequest } from "next/server";
import { spawn } from "child_process";
import { homedir } from "os";
import { join } from "path";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SKILL_DIR = process.env.LAST30DAYS_SKILL_DIR || "/tmp/last30days-skill/skills/last30days";
const PYTHON = process.env.LAST30DAYS_PYTHON || "python3";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { topic, subreddits, xHandle, xRelated, githubUser, githubRepo, depth } = body;

  if (!topic || !topic.trim()) {
    return new Response(JSON.stringify({ error: "Topic is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const args: string[] = [
    join(SKILL_DIR, "scripts/last30days.py"),
    topic.trim(),
    "--emit=compact",
  ];

  // Use free/API-less sources only
  args.push("--search=reddit,hackernews,polymarket,github");

  if (subreddits) args.push(`--subreddits=${subreddits}`);
  if (xHandle) args.push(`--x-handle=${xHandle}`);
  if (xRelated) args.push(`--x-related=${xRelated}`);
  if (githubUser) args.push(`--github-user=${githubUser}`);
  if (githubRepo) args.push(`--github-repo=${githubRepo}`);
  if (depth === "quick") args.push("--quick");
  if (depth === "deep") args.push("--deep");

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const send = (event: string, data: string) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      send("status", "Starting research engine...");

      const proc = spawn(PYTHON, args, {
        cwd: SKILL_DIR,
        env: {
          ...process.env,
          HOME: homedir(),
          LAST30DAYS_MEMORY_DIR: join(homedir(), ".grok", "last30days"),
        },
        stdio: ["pipe", "pipe", "pipe"],
      });

      let stdoutBuffer = "";

      proc.stdout.on("data", (chunk: Buffer) => {
        const text = chunk.toString();
        stdoutBuffer += text;
        const lines = text.split("\n");
        for (const line of lines) {
          if (line.trim()) {
            send("data", line);
          }
        }
      });

      proc.stderr.on("data", (chunk: Buffer) => {
        const text = chunk.toString();
        const lines = text.split("\n");
        for (const line of lines) {
          if (line.trim()) {
            send("progress", line);
          }
        }
      });

      proc.on("close", (code) => {
        if (code === 0) {
          send("status", "Research complete");
          send("done", stdoutBuffer);
        } else {
          send("error", `Process exited with code ${code}`);
        }
        controller.close();
      });

      proc.on("error", (err) => {
        send("error", `Failed to start research engine: ${err.message}`);
        controller.close();
      });

      request.signal.addEventListener("abort", () => {
        proc.kill("SIGTERM");
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
