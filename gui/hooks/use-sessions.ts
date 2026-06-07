"use client";
import { useState, useEffect, useCallback, useRef } from "react";

export interface Session {
  id: string;
  workspace: string;
  modified: string;
  size: number;
  messageCount: number;
  lastMessage: string;
  title: string;
}

interface UseSessionsReturn {
  sessions: Session[];
  loading: boolean;
  refresh: () => void;
  deleteSession: (id: string) => Promise<void>;
}

export function useSessions(): UseSessionsReturn {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/grok-sessions");
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteSession = useCallback(async (id: string) => {
    try {
      const res = await fetch("/api/grok-sessions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: id }),
      });
      if (res.ok) {
        setSessions((prev) => prev.filter((s) => s.id !== id));
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Auto-refresh every 5 seconds to sync with Grok CLI
  useEffect(() => {
    intervalRef.current = setInterval(refresh, 5000);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [refresh]);

  return { sessions, loading, refresh, deleteSession };
}
