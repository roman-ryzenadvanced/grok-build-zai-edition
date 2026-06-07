"use client";
import React, { useState, useCallback, useRef } from "react";
import { CopilotSidebar } from "@copilotkit/react-ui";
import { CopilotChat } from "@copilotkit/react-ui";
import { v4 as uuidv4 } from "uuid";
import Toolbar from "@/components/toolbar";
import StatusBar from "@/components/status-bar";
import { useModels } from "@/hooks/use-models";
import { useFullscreen } from "@/hooks/use-fullscreen";
import { useCwd } from "@/hooks/use-cwd";

export default function Home() {
  const { models, selectedModel, setSelectedModel, loading } = useModels();
  const { isFullscreen, toggleFullscreen } = useFullscreen();
  const { cwd, setCwd } = useCwd();
  const [sessionKey, setSessionKey] = useState(() => uuidv4());
  const [connected, setConnected] = useState(true);

  const handleNewSession = useCallback(() => {
    setSessionKey(uuidv4());
  }, []);

  // Pass model and cwd as state to the CopilotKit agent via forwardedProps
  const forwardedProps = {
    state: {
      model: selectedModel,
      cwd: cwd,
    },
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
      />

      <div className="app-main">
        {!isFullscreen && (
          <div className="sidebar-container">
            <CopilotSidebar
              key={`sidebar-${sessionKey}`}
              labels={{
                title: "Grok Build - Z.ai Edition",
                initial: "Hi! I'm Grok Build powered by Z.ai. How can I help?",
              }}
              defaultOpen={true}
              {...forwardedProps}
            />
          </div>
        )}

        <div className={`main-content ${isFullscreen ? "fullscreen" : ""}`}>
          {isFullscreen ? (
            <div className="fullscreen-chat">
              <CopilotChat
                key={`chat-${sessionKey}`}
                labels={{
                  title: "Grok Build - Z.ai Edition",
                  initial: "Hi! I'm Grok Build powered by Z.ai. How can I help?",
                }}
                {...forwardedProps}
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
                    <p>GLM-5.1, GLM-5, GLM-5 Turbo, GLM-5V Turbo, and more</p>
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

      <StatusBar
        model={selectedModel}
        cwd={cwd}
        connected={connected}
      />
    </div>
  );
}
