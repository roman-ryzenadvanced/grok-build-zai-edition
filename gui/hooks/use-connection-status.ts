"use client";
import { useState, useEffect, useRef, useCallback } from "react";

export type ConnectionStatus = "connected" | "disconnected" | "connecting";

interface UseConnectionStatusReturn {
  status: ConnectionStatus;
  latency: number | null;
  checkNow: () => void;
}

export function useConnectionStatus(): UseConnectionStatusReturn {
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [latency, setLatency] = useState<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const check = useCallback(async () => {
    setStatus("connecting");
    const start = Date.now();
    try {
      const res = await fetch("/api/grok-models", { method: "GET" });
      const elapsed = Date.now() - start;
      if (res.ok) {
        setStatus("connected");
        setLatency(elapsed);
      } else {
        setStatus("disconnected");
        setLatency(null);
      }
    } catch {
      setStatus("disconnected");
      setLatency(null);
    }
  }, []);

  useEffect(() => {
    check();
    intervalRef.current = setInterval(check, 30000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [check]);

  return { status, latency, checkNow: check };
}
