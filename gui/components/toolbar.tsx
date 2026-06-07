"use client";
import React from "react";
import Link from "next/link";
import { ModelInfo } from "@/hooks/use-models";

interface ToolbarProps {
  models: ModelInfo[];
  selectedModel: string;
  onModelChange: (model: string) => void;
  cwd: string;
  onCwdChange: (cwd: string) => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onNewSession: () => void;
  onToggleHistory: () => void;
  onToggleSettings: () => void;
  historyOpen: boolean;
  settingsOpen: boolean;
}

export default function Toolbar({
  models,
  selectedModel,
  onModelChange,
  cwd,
  onCwdChange,
  isFullscreen,
  onToggleFullscreen,
  onNewSession,
  onToggleHistory,
  onToggleSettings,
  historyOpen,
  settingsOpen,
}: ToolbarProps) {
  return (
    <div className="toolbar">
      <div className="toolbar-left">
        <button
          className={`toolbar-btn toolbar-btn-icon ${historyOpen ? "toolbar-btn-active" : ""}`}
          onClick={onToggleHistory}
          title="Session history"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </button>

        <div className="toolbar-logo">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#58a6ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="toolbar-title">Grok Build</span>
          <span className="toolbar-badge">Z.ai</span>
        </div>

        <select
          className="toolbar-select"
          value={selectedModel}
          onChange={(e) => onModelChange(e.target.value)}
          title="Select model"
        >
          {models.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>

      <div className="toolbar-center">
        <input
          className="toolbar-input"
          value={cwd}
          onChange={(e) => onCwdChange(e.target.value)}
          placeholder="Working directory..."
          title="Working directory"
        />
      </div>

      <div className="toolbar-right">
        <Link href="/research" className="toolbar-btn" title="Research mode (/last30days)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="M21 21l-4.35-4.35"/>
          </svg>
          <span className="toolbar-btn-label">Research</span>
        </Link>
        <button className="toolbar-btn" onClick={onNewSession} title="New session (Ctrl+N)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          <span className="toolbar-btn-label">New</span>
        </button>
        <button
          className={`toolbar-btn toolbar-btn-icon ${settingsOpen ? "toolbar-btn-active" : ""}`}
          onClick={onToggleSettings}
          title="Settings"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12.22 2h-.44a2 2 0 00-2 2v.18a2 2 0 01-1 1.73l-.43.25a2 2 0 01-2 0l-.15-.08a2 2 0 00-2.73.73l-.22.38a2 2 0 00.73 2.73l.15.1a2 2 0 011 1.72v.51a2 2 0 01-1 1.74l-.15.09a2 2 0 00-.73 2.73l.22.38a2 2 0 002.73.73l.15-.08a2 2 0 012 0l.43.25a2 2 0 011 1.73V20a2 2 0 002 2h.44a2 2 0 002-2v-.18a2 2 0 011-1.73l.43-.25a2 2 0 012 0l.15.08a2 2 0 002.73-.73l.22-.39a2 2 0 00-.73-2.73l-.15-.08a2 2 0 01-1-1.74v-.5a2 2 0 011-1.74l.15-.09a2 2 0 00.73-2.73l-.22-.38a2 2 0 00-2.73-.73l-.15.08a2 2 0 01-2 0l-.43-.25a2 2 0 01-1-1.73V4a2 2 0 00-2-2z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        </button>
        <button
          className="toolbar-btn toolbar-btn-icon"
          onClick={onToggleFullscreen}
          title={isFullscreen ? "Exit fullscreen (Ctrl+Shift+F)" : "Fullscreen (Ctrl+Shift+F)"}
        >
          {isFullscreen ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M8 3v3a2 2 0 01-2 2H3m18 0h-3a2 2 0 01-2-2V3m0 18v-3a2 2 0 012-2h3M3 16h3a2 2 0 012 2v3"/>
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3"/>
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
