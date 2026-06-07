"use client";
import React from "react";
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
}: ToolbarProps) {
  return (
    <div className="toolbar">
      <div className="toolbar-left">
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
        <button className="toolbar-btn" onClick={onNewSession} title="New session">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          New
        </button>
        <button
          className="toolbar-btn"
          onClick={onToggleFullscreen}
          title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
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
