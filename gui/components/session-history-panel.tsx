"use client";
import React, { useState, useMemo } from "react";
import { Session } from "@/hooks/use-sessions";

interface SessionHistoryPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  sessions: Session[];
  loading: boolean;
  currentSessionId: string;
  onResumeSession: (sessionId: string) => void;
  onDeleteSession: (id: string) => void;
  onRefresh: () => void;
}

function relativeTime(isoDate: string): string {
  const now = Date.now();
  const then = new Date(isoDate).getTime();
  const diff = Math.max(0, now - then);
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(isoDate).toLocaleDateString();
}

export default function SessionHistoryPanel({
  isOpen,
  onToggle,
  sessions,
  loading,
  currentSessionId,
  onResumeSession,
  onDeleteSession,
  onRefresh,
}: SessionHistoryPanelProps) {
  const [search, setSearch] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return sessions;
    const q = search.toLowerCase();
    return sessions.filter(
      (s) =>
        s.id.toLowerCase().includes(q) ||
        s.path.toLowerCase().includes(q)
    );
  }, [sessions, search]);

  if (!isOpen) return null;

  return (
    <div className="session-history-panel">
      <div className="session-history-header">
        <div className="session-history-title-row">
          <h3>History</h3>
          <div className="session-history-actions">
            <button className="session-history-icon-btn" onClick={onRefresh} title="Refresh">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 4v6h6M23 20v-6h-6"/>
                <path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15"/>
              </svg>
            </button>
            <button className="session-history-icon-btn" onClick={onToggle} title="Close">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>
        <input
          className="session-search"
          type="text"
          placeholder="Search sessions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="session-history-list">
        {loading && sessions.length === 0 ? (
          <div className="session-empty">Loading sessions...</div>
        ) : filtered.length === 0 ? (
          <div className="session-empty">
            {sessions.length === 0 ? "No sessions yet" : "No matching sessions"}
          </div>
        ) : (
          filtered.map((session) => (
            <div
              key={session.id}
              className={`session-card ${
                currentSessionId === session.id ? "session-card-active" : ""
              }`}
              onClick={() => onResumeSession(session.id)}
            >
              <div className="session-card-content">
                <div className="session-card-title">
                  {session.id.length > 24
                    ? session.id.substring(0, 24) + "..."
                    : session.id}
                </div>
                <div className="session-card-meta">
                  <span>{relativeTime(session.modified)}</span>
                </div>
              </div>
              <div className="session-card-actions">
                {deleteConfirm === session.id ? (
                  <div className="session-delete-confirm">
                    <button
                      className="session-delete-yes"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSession(session.id);
                        setDeleteConfirm(null);
                      }}
                    >
                      Delete
                    </button>
                    <button
                      className="session-delete-no"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirm(null);
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    className="session-card-delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConfirm(session.id);
                    }}
                    title="Delete session"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="session-history-footer">
        <span className="session-count">{sessions.length} sessions</span>
      </div>
    </div>
  );
}
