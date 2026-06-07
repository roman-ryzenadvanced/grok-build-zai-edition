import { NextRequest, NextResponse } from "next/server";
import { readdirSync, statSync, rmSync } from "fs";
import { homedir } from "os";
import { join } from "path";

export const dynamic = "force-dynamic";

const SESSIONS_DIR = join(
  process.env.GROK_HOME || join(homedir(), ".grok"),
  "sessions"
);

interface SessionInfo {
  id: string;
  path: string;
  modified: string;
  size: number;
}

export async function GET() {
  try {
    const sessions: SessionInfo[] = [];

    try {
      const entries = readdirSync(SESSIONS_DIR);
      for (const entry of entries) {
        const fullPath = join(SESSIONS_DIR, entry);
        try {
          const stat = statSync(fullPath);
          if (stat.isDirectory()) {
            sessions.push({
              id: entry,
              path: fullPath,
              modified: stat.mtime.toISOString(),
              size: stat.size,
            });
          }
        } catch {
          // Skip unreadable entries
        }
      }
    } catch {
      // Sessions dir may not exist yet
    }

    // Sort by most recently modified
    sessions.sort((a, b) =>
      new Date(b.modified).getTime() - new Date(a.modified).getTime()
    );

    return NextResponse.json({ sessions, count: sessions.length });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to list sessions", message: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action, sessionId } = body;

  if (action === "new") {
    return NextResponse.json({
      sessionId: sessionId || `session-${Date.now()}`,
      status: "created",
    });
  }

  if (action === "resume" && sessionId) {
    return NextResponse.json({
      sessionId,
      status: "resumed",
    });
  }

  return NextResponse.json(
    { error: "Invalid action. Use 'new' or 'resume'" },
    { status: 400 }
  );
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId } = body;

    if (!sessionId || typeof sessionId !== "string") {
      return NextResponse.json(
        { error: "sessionId is required" },
        { status: 400 }
      );
    }

    // Safety: only delete within SESSIONS_DIR, no path traversal
    const normalized = sessionId.replace(/\.\./g, "").replace(/[/\\]/g, "");
    if (!normalized) {
      return NextResponse.json(
        { error: "Invalid sessionId" },
        { status: 400 }
      );
    }

    const targetPath = join(SESSIONS_DIR, normalized);

    // Verify the target is within SESSIONS_DIR
    if (!targetPath.startsWith(SESSIONS_DIR)) {
      return NextResponse.json(
        { error: "Invalid sessionId" },
        { status: 400 }
      );
    }

    try {
      const stat = statSync(targetPath);
      if (!stat.isDirectory()) {
        return NextResponse.json(
          { error: "Session not found" },
          { status: 404 }
        );
      }
    } catch {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    rmSync(targetPath, { recursive: true, force: true });

    return NextResponse.json({ success: true, deleted: normalized });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete session", message: (error as Error).message },
      { status: 500 }
    );
  }
}
