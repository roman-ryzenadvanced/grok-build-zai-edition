/**
 * Grok CLI Runner - Spawns Grok CLI subprocess and parses streaming-json output.
 *
 * Grok headless mode with --output-format streaming-json produces NDJSON on stdout:
 *   {"type":"text","data":"chunk of text"}
 *   {"type":"thought","data":"reasoning tokens"}
 *   {"type":"end","stopReason":"EndTurn","sessionId":"abc","requestId":"xyz"}
 */

import { spawn, ChildProcess } from "child_process";
import { createInterface, Interface as ReadlineInterface } from "readline";

export type GrokEventType = "text" | "thought" | "end" | "error";

export interface GrokTextEvent {
  type: "text";
  data: string;
}

export interface GrokThoughtEvent {
  type: "thought";
  data: string;
}

export interface GrokEndEvent {
  type: "end";
  stopReason: string;
  sessionId?: string;
  requestId?: string;
}

export interface GrokErrorEvent {
  type: "error";
  data: string;
}

export type GrokEvent =
  | GrokTextEvent
  | GrokThoughtEvent
  | GrokEndEvent
  | GrokErrorEvent;

export interface GrokRunOptions {
  prompt: string;
  model?: string;
  cwd?: string;
  sessionId?: string;
  yolo?: boolean;
  maxTurns?: number;
  effort?: "low" | "medium" | "high";
  grokPath?: string;
}

const DEFAULT_GROK_PATH = "grok";

/**
 * Run Grok CLI and yield parsed streaming events.
 * Supports abort via AbortController signal.
 */
export async function* runGrok(
  options: GrokRunOptions,
  signal?: AbortSignal
): AsyncGenerator<GrokEvent> {
  const grokPath = options.grokPath || process.env.GROK_PATH || DEFAULT_GROK_PATH;

  const args: string[] = [
    "-p",
    options.prompt,
    "--output-format",
    "streaming-json",
  ];

  if (options.model) {
    args.push("--model", options.model);
  }
  if (options.cwd) {
    args.push("--cwd", options.cwd);
  }
  if (options.sessionId) {
    args.push("-s", options.sessionId);
  }
  if (options.yolo !== false) {
    args.push("--yolo");
  }
  if (options.maxTurns) {
    args.push("--max-turns", String(options.maxTurns));
  }
  if (options.effort) {
    args.push("--effort", options.effort);
  }

  const child: ChildProcess = spawn(grokPath, args, {
    stdio: ["pipe", "pipe", "pipe"],
    env: { ...process.env },
  });

  const onAbort = () => {
    if (!child.killed) {
      child.kill("SIGTERM");
    }
  };
  if (signal) {
    signal.addEventListener("abort", onAbort, { once: true });
  }

  try {
    const rl: ReadlineInterface = createInterface({
      input: child.stdout!,
      crlfDelay: Infinity,
    });

    const lines: string[] = [];
    let resolveLine: (() => void) | null = null;
    let done = false;

    rl.on("line", (line: string) => {
      lines.push(line);
      if (resolveLine) {
        resolveLine();
        resolveLine = null;
      }
    });

    rl.on("close", () => {
      done = true;
      if (resolveLine) {
        resolveLine();
        resolveLine = null;
      }
    });

    let stderr = "";
    child.stderr?.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    while (true) {
      if (lines.length === 0) {
        if (done) break;
        await new Promise<void>((resolve) => {
          resolveLine = resolve;
        });
        continue;
      }

      const line = lines.shift()!;
      if (!line.trim()) continue;

      try {
        const parsed = JSON.parse(line);

        if (parsed.type === "text" && typeof parsed.data === "string") {
          yield { type: "text", data: parsed.data };
        } else if (parsed.type === "thought" && typeof parsed.data === "string") {
          yield { type: "thought", data: parsed.data };
        } else if (parsed.type === "end") {
          yield {
            type: "end",
            stopReason: parsed.stopReason || "unknown",
            sessionId: parsed.sessionId,
            requestId: parsed.requestId,
          };
          break;
        }
      } catch {
        continue;
      }
    }

    await new Promise<void>((resolve) => {
      if (child.exitCode !== null || child.killed) {
        resolve();
      } else {
        child.on("exit", () => resolve());
      }
    });

    if (child.exitCode && child.exitCode !== 0 && !signal?.aborted) {
      yield {
        type: "error",
        data: stderr || `Grok exited with code ${child.exitCode}`,
      };
    }
  } finally {
    if (signal) {
      signal.removeEventListener("abort", onAbort);
    }
    if (!child.killed && child.exitCode === null) {
      child.kill("SIGTERM");
    }
  }
}
