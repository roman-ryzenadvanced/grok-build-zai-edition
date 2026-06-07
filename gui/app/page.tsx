"use client";
import React, { useState, useCallback, useEffect } from "react";
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

export default function Home() {
  const { models, selectedModel, setSelectedModel, loading } = useModels();
  const { isFullscreen, toggleFullscreen } = useFullscreen();
  const { cwd, setCwd } = useCwd();
  const [sessionKey, setSessionKey] = useState(() => uuidv4());
  const [historyOpen, setHistoryOpen] = useState(false);
  const [viewingSession, setViewingSession] = useState<{ id: string; workspace: string } | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

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
  }, []);

  const handleResumeSession = useCallback((sessionId: string) => {
    // Set the session key to the resumed session ID so the CLI uses -s <sessionId>
    setSessionKey(sessionId);
    setViewingSession(null);
    setHistoryOpen(false);
  }, []);

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
