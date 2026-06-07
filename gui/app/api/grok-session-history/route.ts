import { NextRequest, NextResponse } from "next/server";
import { readFileSync } from "fs";
import { homedir } from "os";
import { join } from "path";

export const dynamic = "force-dynamic";

const SESSIONS_DIR = join(
  process.env.GROK_HOME || join(homedir(), ".grok"),
  "sessions"
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");
    const workspace = searchParams.get("workspace");

    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId parameter is required" },
        { status: 400 }
      );
    }

    // Decode the workspace path (e.g., %2Fhome%2Froman -> /home/roman)
    const workspacePath = workspace 
      ? decodeURIComponent(workspace) 
      : join(homedir());
    
    // URL-encode the workspace path for the directory name
    const encodedWorkspace = encodeURIComponent(workspacePath);
    
    // Safety: prevent path traversal
    const normalizedSessionId = sessionId.replace(/\.\./g, "").replace(/[\/\\]/g, "");
    if (!normalizedSessionId || normalizedSessionId !== sessionId) {
      return NextResponse.json(
        { error: "Invalid sessionId" },
        { status: 400 }
      );
    }

    // Construct path to session's chat_history.jsonl
    const sessionDir = join(SESSIONS_DIR, encodedWorkspace, normalizedSessionId);
    const chatHistoryPath = join(sessionDir, "chat_history.jsonl");

    // Verify the path is within SESSIONS_DIR
    if (!sessionDir.startsWith(SESSIONS_DIR)) {
      return NextResponse.json(
        { error: "Invalid session path" },
        { status: 400 }
      );
    }

    let chatHistoryContent: string;
    try {
      chatHistoryContent = readFileSync(chatHistoryPath, "utf-8");
    } catch (error) {
      return NextResponse.json(
        { error: "Chat history not found", message: (error as Error).message },
        { status: 404 }
      );
    }

    // Parse JSONL (one JSON object per line)
    const messages = chatHistoryContent
      .split("\n")
      .filter((line) => line.trim())
      .map((line) => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter((msg) => msg !== null)
      .filter((msg) => {
        // Filter out system messages and synthetic messages
        return msg.type === "user" || msg.type === "assistant";
      })
      .map((msg) => {
        // Extract message content
        if (msg.type === "user") {
          // User messages can be string or array of content blocks
          let content = "";
          if (typeof msg.content === "string") {
            content = msg.content;
          } else if (Array.isArray(msg.content)) {
            content = msg.content
              .map((c: any) => c.text || c.content || "")
              .join("\n");
          }
          
          // Extract the actual user query from <user_query> tags
          const userQueryMatch = content.match(/<user_query>([\s\S]*?)<\/user_query>/);
          if (userQueryMatch && userQueryMatch[1]) {
            content = userQueryMatch[1].trim();
          }
          
          return {
            role: "user",
            content: content,
            timestamp: msg.timestamp || null,
          };
        } else if (msg.type === "assistant") {
          // Assistant messages
          let content = "";
          if (typeof msg.content === "string") {
            content = msg.content;
          } else if (Array.isArray(msg.content)) {
            content = msg.content
              .map((c: any) => c.text || c.content || "")
              .join("\n");
          }
          
          return {
            role: "assistant",
            content: content,
            timestamp: msg.timestamp || null,
            toolCalls: msg.tool_calls || [],
          };
        }
        return null;
      })
      .filter((msg) => msg !== null && msg.content && msg.content.trim());

    return NextResponse.json({
      sessionId: normalizedSessionId,
      workspace: workspacePath,
      messageCount: messages.length,
      messages,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to read chat history", message: (error as Error).message },
      { status: 500 }
    );
  }
}
