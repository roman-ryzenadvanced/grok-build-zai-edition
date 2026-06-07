"use client";
import React, { useState, useCallback, useEffect, useRef } from "react";
import { CopilotSidebar } from "@copilotkit/react-ui";
import { CopilotChat } from "@copilotkit/react-ui";
import { useCoAgent } from "@copilotkit/react-core";
import { v4 as uuidv4 } from "uuid";
import Toolbar from "@/components/toolbar";
import StatusBar from "@/components/status-bar";
import SessionHistoryPanel from "@/components/session-history-panel";
import SettingsPanel from "@/components/settings-panel";
import CustomAssistantMessage from "@/components/custom-assistant-message";
import { useModels } from "@/hooks/use-models";
import { useFullscreen } from "@/hooks/use-fullscreen";
import { useCwd } from "@/hooks/use-cwd";
import { useConnectionStatus } from "@/hooks/use-connection-status";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { useSettings } from "@/hooks/use-settings";
import { useSessions } from "@/hooks/use-sessions";
import ChatHistoryViewer from "@/components/chat-history-viewer";

interface ResumedHistoryMessage {
  role: "user" | "assistant";
  content: string;
  timestamp?: string | null;
}

interface ResumedSession {
  sessionId: string;
  workspace: string;
  messages: ResumedHistoryMessage[];
}

function downloadBlob(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Renders the resumed session history as a scrollable block */
function ResumedHistoryBlock({
  messages,
  onDismiss,
  scrollRef,
  compact,
}: {
  messages: ResumedHistoryMessage[];
  onDismiss: () => void;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  compact?: boolean;
}) {
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, scrollRef]);

  return (
    <div className={`resumed-history-container${compact ? " fullscreen-history" : ""}`} ref={scrollRef}>
      <div className="resumed-history-header">
        <span className="resumed-history-label">
          Session resumed &middot; {messages.length} messages
        </span>
        <button className="resumed-history-dismiss" onClick={onDismiss} title="Hide history">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>
      <div className="resumed-history-messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={`resumed-history-msg resumed-history-msg-${msg.role}`}>
            <div className="resumed-history-msg-avatar">
              {msg.role === "user" ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              )}
            </div>
            <div className="resumed-history-msg-body">
              <div className="resumed-history-msg-role">
                {msg.role === "user" ? "You" : "Grok Build"}
              </div>
              <div className="resumed-history-msg-content">{msg.content}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="resumed-history-divider">
        <span>Continue conversation below</span>
      </div>
    </div>
  );
}

export default function Home() {
  const { models, selectedModel, setSelectedModel, loading } = useModels();
  const { isFullscreen, toggleFullscreen } = useFullscreen();
  const { cwd, setCwd } = useCwd();
  const [sessionKey, setSessionKey] = useState(() => uuidv4());
  const [historyOpen, setHistoryOpen] = useState(false);
  const [viewingSession, setViewingSession] = useState<{ id: string; workspace: string } | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [resumedSession, setResumedSession] = useState<ResumedSession | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const historyScrollRef = useRef<HTMLDivElement>(null);

  const { status: connectionStatus, latency } = useConnectionStatus();
  const { settings, updateSettings, resetSettings } = useSettings();
  const { sessions, loading: sessionsLoading, refresh: refreshSessions, deleteSession } = useSessions();

  const coAgent = useCoAgent({ name: "default" });

  // Sync model/cwd/instructions to agent state
  useEffect(() => {
    coAgent.setState({
      model: selectedModel,
      cwd,
      instructions: settings.systemPrompt,
    });
  }, [selectedModel, cwd, settings.systemPrompt]);

  const handleNewSession = useCallback(() => {
    setSessionKey(uuidv4());
    setResumedSession(null);
  }, []);

  const handleResumeSession = useCallback(async (sessionId: string) => {
    const session = sessions.find((s) => s.id === sessionId);
    const workspace = session?.workspace || cwd;

    setLoadingHistory(true);
    setHistoryOpen(false);
    setViewingSession(null);

    try {
      const params = new URLSearchParams({ sessionId, workspace });
      const res = await fetch(`/api/grok-session-history?${params}`);
      if (res.ok) {
        const data = await res.json();
        setResumedSession({
          sessionId,
          workspace,
          messages: data.messages || [],
        });
      } else {
        console.warn("Failed to load session history, resuming anyway");
        setResumedSession(null);
      }
    } catch (err) {
      console.warn("Error loading session history:", err);
      setResumedSession(null);
    } finally {
      setLoadingHistory(false);
      // Set session key last so the Grok CLI gets the right session ID for continuation
      setSessionKey(sessionId);
    }
  }, [sessions, cwd]);

  const handleViewSession = useCallback((sessionId: string, workspace: string) => {
    setViewingSession({ id: sessionId, workspace });
  }, []);

  const handleCloseAll = useCallback(() => {
    if (settingsOpen) {
      setSettingsOpen(false);
      return;
    }
    if (historyOpen) {
      setHistoryOpen(false);
      return;
    }
  }, [settingsOpen, historyOpen]);

  useKeyboardShortcuts({
    onNewSession: handleNewSession,
    onToggleFullscreen: toggleFullscreen,
    onClose: handleCloseAll,
  });

  // Chat export
  const handleExportJSON = useCallback(() => {
    try {
      const chatHistory = (window as any).__grokChatMessages || [];
      const data = {
        exportedAt: new Date().toISOString(),
        model: selectedModel,
        cwd,
        messages: chatHistory.map((m: any) => ({
          role: m.role || m.sender || "unknown",
          content: typeof m.content === "string"
            ? m.content
            : Array.isArray(m.content)
            ? m.content.map((c: any) => c.text || c.content || "").join("")
            : "",
        })),
      };
      downloadBlob(JSON.stringify(data, null, 2), "chat-export.json", "application/json");
    } catch {}
  }, [selectedModel, cwd]);

  const handleExportMarkdown = useCallback(() => {
    try {
      const chatHistory = (window as any).__grokChatMessages || [];
      const lines = chatHistory.map((m: any) => {
        const role = m.role === "user" || m.sender === "user" ? "You" : "Grok";
        const content = typeof m.content === "string"
          ? m.content
          : Array.isArray(m.content)
          ? m.content.map((c: any) => c.text || c.content || "").join("")
          : "";
        return `## ${role}\n\n${content}\n`;
      });
      const md = `# Chat Export\n\nExported: ${new Date().toISOString()}\nModel: ${selectedModel}\n\n---\n\n${lines.join("\n---\n\n")}`;
      downloadBlob(md, "chat-export.md", "text/markdown");
    } catch {}
  }, [selectedModel, cwd]);

  const chatLabels = {
    title: "Grok Build - Z.ai Edition",
    initial: "Hi! I'm Grok Build powered by Z.ai. How can I help?",
  };

  return (
    <div className="app-container">
      <Toolbar
        models={models}
        selectedModel={selectedModel}
        onModelChange={setSelectedModel}
        cwd={cwd}
        onCwdChange={setCwd}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
        onNewSession={handleNewSession}
        onToggleHistory={() => setHistoryOpen(!historyOpen)}
        onToggleSettings={() => setSettingsOpen(!settingsOpen)}
        historyOpen={historyOpen}
        settingsOpen={settingsOpen}
      />

      <div className="app-main">
        {!isFullscreen && (
          <>
            <SessionHistoryPanel
              isOpen={historyOpen}
              onToggle={() => setHistoryOpen(false)}
              sessions={sessions}
              loading={sessionsLoading}
              currentSessionId={sessionKey}
              onResumeSession={handleResumeSession}
              onViewSession={handleViewSession}
              onDeleteSession={deleteSession}
              onRefresh={refreshSessions}
            />
            {viewingSession ? (
              <div className="sidebar-container">
                <ChatHistoryViewer
                  sessionId={viewingSession.id}
                  workspace={viewingSession.workspace}
                  onClose={() => setViewingSession(null)}
                  onContinue={() => handleResumeSession(viewingSession.id)}
                />
              </div>
            ) : (
              <div className="sidebar-container">
                {/* Resumed session history - shown above the active chat */}
                {resumedSession && resumedSession.messages.length > 0 && (
                  <ResumedHistoryBlock
                    messages={resumedSession.messages}
                    onDismiss={() => setResumedSession(null)}
                    scrollRef={historyScrollRef}
                  />
                )}
                {loadingHistory && (
                  <div className="resumed-history-loading">
                    <div className="resumed-history-spinner">Loading session history...</div>
                  </div>
                )}
                <CopilotSidebar
                  key={`sidebar-${sessionKey}`}
                  labels={chatLabels}
                  defaultOpen={true}
                  AssistantMessage={CustomAssistantMessage}
                  instructions={settings.systemPrompt || undefined}
                />
              </div>
            )}
          </>
        )}

        <div className={`main-content ${isFullscreen ? "fullscreen" : ""}`}>
          {isFullscreen ? (
            <div className="fullscreen-chat">
              {/* Resumed history for fullscreen mode */}
              {resumedSession && resumedSession.messages.length > 0 && (
                <ResumedHistoryBlock
                  messages={resumedSession.messages}
                  onDismiss={() => setResumedSession(null)}
                  scrollRef={historyScrollRef}
                  compact
                />
              )}
              {loadingHistory && (
                <div className="resumed-history-loading">
                  <div className="resumed-history-spinner">Loading session history...</div>
                </div>
              )}
              <CopilotChat
                key={`chat-${sessionKey}`}
                labels={chatLabels}
                instructions={settings.systemPrompt || undefined}
              />
            </div>
          ) : (
            <div className="workspace-view">
              <div className="workspace-hero">
                <h1>Grok Build <span className="text-accent">Z.ai Edition</span></h1>
                <p className="workspace-subtitle">
                  AI-powered coding assistant running on Z.ai GLM models
                </p>
                <div className="workspace-info">
                  <div className="info-card">
                    <div className="info-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#58a6ff" strokeWidth="2">
                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                      </svg>
                    </div>
                    <h3>{models.length} Models</h3>
                    <p>GLM-5, GLM-5 Turbo, GLM-5V Turbo, and more</p>
                  </div>
                  <div className="info-card">
                    <div className="info-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#58a6ff" strokeWidth="2">
                        <rect x="2" y="3" width="20" height="14" rx="2"/>
                        <path d="M8 21h8M12 17v4"/>
                      </svg>
                    </div>
                    <h3>Local GUI</h3>
                    <p>Chat with Grok CLI from your browser</p>
                  </div>
                  <div className="info-card">
                    <div className="info-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#58a6ff" strokeWidth="2">
                        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                      </svg>
                    </div>
                    <h3>Streaming</h3>
                    <p>Real-time responses via AG-UI protocol</p>
                  </div>
                </div>
                <div className="workspace-tip">
                  <p>Use the sidebar to chat with Grok, or click the fullscreen button to expand.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <SettingsPanel
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onSettingsChange={updateSettings}
        onResetSettings={resetSettings}
        onExportJSON={handleExportJSON}
        onExportMarkdown={handleExportMarkdown}
        onClearChat={handleNewSession}
      />

      <StatusBar
        model={selectedModel}
        cwd={cwd}
        status={connectionStatus}
        latency={latency}
      />
    </div>
  );
}
