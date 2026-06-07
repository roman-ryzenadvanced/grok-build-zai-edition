import { NextRequest, NextResponse } from "next/server";
import { readdirSync, statSync, readFileSync, rmSync, existsSync } from "fs";
import { homedir } from "os";
import { join } from "path";

export const dynamic = "force-dynamic";

const SESSIONS_DIR = join(
  process.env.GROK_HOME || join(homedir(), ".grok"),
  "sessions"
);

interface SessionInfo {
  id: string;
  workspace: string;
  modified: string;
  size: number;
  messageCount: number;
  lastMessage: string;
  title: string;
}

function getWorkspaceFromDirName(dirName: string): string {
  try {
    return decodeURIComponent(dirName);
  } catch {
    return dirName;
  }
}

function parseChatHistory(sessionDir: string): { messageCount: number; lastMessage: string; title: string } {
  const chatPath = join(sessionDir, "chat_history.jsonl");
  if (!existsSync(chatPath)) {
    return { messageCount: 0, lastMessage: "", title: "Empty session" };
  }
  
  try {
    const content = readFileSync(chatPath, "utf-8");
    const lines = content.split("\n").filter((l) => l.trim());
    
    let messageCount = 0;
    let lastMessage = "";
    let title = "";
    
    for (const line of lines) {
      try {
        const msg = JSON.parse(line);
        if (msg.type === "user") {
          messageCount++;
          let userText = "";
          if (typeof msg.content === "string") {
            userText = msg.content;
          } else if (Array.isArray(msg.content)) {
            userText = msg.content.map((c: any) => c.text || c.content || "").join("");
          }
          // Extract from <user_query> tag
          const match = userText.match(/<user_query>([\s\S]*?)<\/user_query>/);
          if (match && match[1]) {
            userText = match[1].trim();
          }
          // Strip user_info tags from text
          userText = userText.replace(/<user_info>[\s\S]*?<\/user_info>/g, "").trim();
          // Strip system-reminder tags
          userText = userText.replace(/<system-reminder>[\s\S]*?<\/system-reminder>/g, "").trim();
          // Strip XML tags for clean title
          userText = userText.replace(/<[^>]+>/g, "").trim();
          if (userText && !title) {
            title = userText.substring(0, 60);
          }
          if (userText) {
            lastMessage = userText.substring(0, 100);
          }
        } else if (msg.type === "assistant") {
          messageCount++;
          let assistantText = "";
          if (typeof msg.content === "string") {
            assistantText = msg.content;
          }
          if (assistantText) {
            lastMessage = assistantText.substring(0, 100);
          }
        }
      } catch {}
    }
    
    return { messageCount, lastMessage, title: title || "New session" };
  } catch {
    return { messageCount: 0, lastMessage: "", title: "Unreadable session" };
  }
}

export async function GET() {
  try {
    const sessions: SessionInfo[] = [];

    try {
      const workspaceDirs = readdirSync(SESSIONS_DIR);
      for (const wsDir of workspaceDirs) {
        const wsPath = join(SESSIONS_DIR, wsDir);
        try {
          const wsStat = statSync(wsPath);
          if (!wsStat.isDirectory()) continue;
          
          const workspace = getWorkspaceFromDirName(wsDir);
          const sessionDirs = readdirSync(wsPath);
          
          for (const sessionDir of sessionDirs) {
            const sessionPath = join(wsPath, sessionDir);
            try {
              const sessionStat = statSync(sessionPath);
              if (!sessionStat.isDirectory()) continue;
              
              const { messageCount, lastMessage, title } = parseChatHistory(sessionPath);
              
              sessions.push({
                id: sessionDir,
                workspace,
                modified: sessionStat.mtime.toISOString(),
                size: sessionStat.size,
                messageCount,
                lastMessage,
                title,
              });
            } catch {}
          }
        } catch {}
      }
    } catch {}

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

    const normalized = sessionId.replace(/\.\./g, "").replace(/[\/\\]/g, "");
    if (!normalized) {
      return NextResponse.json(
        { error: "Invalid sessionId" },
        { status: 400 }
      );
    }

    // Search all workspace dirs for the session
    const workspaceDirs = readdirSync(SESSIONS_DIR);
    for (const wsDir of workspaceDirs) {
      const targetPath = join(SESSIONS_DIR, wsDir, normalized);
      if (!targetPath.startsWith(SESSIONS_DIR)) continue;
      
      try {
        const stat = statSync(targetPath);
        if (stat.isDirectory()) {
          rmSync(targetPath, { recursive: true, force: true });
          return NextResponse.json({ success: true, deleted: normalized });
        }
      } catch {}
    }

    return NextResponse.json(
      { error: "Session not found" },
      { status: 404 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete session", message: (error as Error).message },
      { status: 500 }
    );
  }
}
