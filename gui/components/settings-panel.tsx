"use client";
import React, { useState } from "react";
import { Settings } from "@/hooks/use-settings";

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  settings: Settings;
  onSettingsChange: (partial: Partial<Settings>) => void;
  onResetSettings: () => void;
  onExportJSON: () => void;
  onExportMarkdown: () => void;
  onClearChat: () => void;
}

export default function SettingsPanel({
  isOpen,
  onClose,
  settings,
  onSettingsChange,
  onResetSettings,
  onExportJSON,
  onExportMarkdown,
  onClearChat,
}: SettingsPanelProps) {
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  if (!isOpen) return null;

  return (
    <>
      <div className="settings-overlay" onClick={onClose} />
      <div className="settings-panel">
        <div className="settings-header">
          <h2>Settings</h2>
          <button className="settings-close-btn" onClick={onClose} title="Close settings">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div className="settings-body">
          <div className="settings-section">
            <h3>System Instructions</h3>
            <p className="settings-hint">
              Custom instructions sent to the AI with every message.
            </p>
            <textarea
              className="settings-textarea"
              rows={6}
              value={settings.systemPrompt}
              onChange={(e) => onSettingsChange({ systemPrompt: e.target.value })}
              placeholder="You are a helpful coding assistant..."
            />
          </div>

          <div className="settings-section">
            <h3>Export Chat</h3>
            <div className="settings-btn-group">
              <button className="settings-btn" onClick={onExportJSON}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                </svg>
                Export as JSON
              </button>
              <button className="settings-btn" onClick={onExportMarkdown}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                </svg>
                Export as Markdown
              </button>
            </div>
          </div>

          <div className="settings-section">
            <h3>Actions</h3>
            {showClearConfirm ? (
              <div className="settings-confirm">
                <p>Clear all messages?</p>
                <div className="settings-btn-group">
                  <button
                    className="settings-btn settings-btn-danger"
                    onClick={() => {
                      onClearChat();
                      setShowClearConfirm(false);
                    }}
                  >
                    Yes, Clear
                  </button>
                  <button
                    className="settings-btn"
                    onClick={() => setShowClearConfirm(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                className="settings-btn settings-btn-danger"
                onClick={() => setShowClearConfirm(true)}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                </svg>
                Clear Chat
              </button>
            )}
          </div>

          <div className="settings-section">
            <h3>Theme</h3>
            <div className="settings-theme-info">
              <span className="settings-theme-badge">grokday</span>
              <span className="settings-theme-desc">Dark theme inspired by Grok</span>
            </div>
          </div>
        </div>

        <div className="settings-footer">
          <button className="settings-reset-link" onClick={onResetSettings}>
            Reset to defaults
          </button>
        </div>
      </div>
    </>
  );
}
