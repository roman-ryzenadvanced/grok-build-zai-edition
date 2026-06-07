"use client";
import React, { useEffect, useState, useRef } from "react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp?: string | null;
  toolCalls?: any[];
}

interface ChatHistoryViewerProps {
  sessionId: string;
  workspace: string;
  onClose: () => void;
  onContinue: () => void;
}

export default function ChatHistoryViewer({
  sessionId,
  workspace,
  onClose,
  onContinue,
}: ChatHistoryViewerProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadHistory() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          sessionId,
          workspace,
        });
        const res = await fetch(`/api/grok-session-history?${params}`);
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Failed to load history (${res.status})`);
        }
        const data = await res.json();
        setMessages(data.messages || []);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }

    loadHistory();
  }, [sessionId, workspace]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="chat-history-viewer">
      <div className="chat-history-header">
        <div className="chat-history-header-left">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <div>
            <div className="chat-history-session-title">Session History</div>
            <div className="chat-history-session-meta">
              {workspace} &middot; {messages.length} messages
            </div>
          </div>
        </div>
        <div className="chat-history-header-actions">
          <button className="chat-history-btn chat-history-btn-primary" onClick={onContinue}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
            Continue
          </button>
          <button className="chat-history-btn" onClick={onClose}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>

      <div className="chat-history-messages" ref={scrollRef}>
        {loading ? (
          <div className="chat-history-empty">
            <div className="chat-history-spinner">Loading chat history...</div>
          </div>
        ) : error ? (
          <div className="chat-history-empty">
            <div className="chat-history-error">{error}</div>
          </div>
        ) : messages.length === 0 ? (
          <div className="chat-history-empty">No messages in this session</div>
        ) : (
          messages.map((msg, idx) => (
            <div key={idx} className={`chat-history-msg chat-history-msg-${msg.role}`}>
              <div className="chat-history-msg-avatar">
                {msg.role === "user" ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                  </svg>
                )}
              </div>
              <div className="chat-history-msg-body">
                <div className="chat-history-msg-role">
                  {msg.role === "user" ? "You" : "Grok Build"}
                </div>
                <div className="chat-history-msg-content">{msg.content}</div>
                {msg.toolCalls && msg.toolCalls.length > 0 && (
                  <div className="chat-history-msg-tools">
                    {msg.toolCalls.length} tool call{msg.toolCalls.length !== 1 ? "s" : ""}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
