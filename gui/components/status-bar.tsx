"use client";
import React from "react";
import { ConnectionStatus } from "@/hooks/use-connection-status";

interface StatusBarProps {
  model: string;
  cwd: string;
  status: ConnectionStatus;
  latency: number | null;
}

export default function StatusBar({ model, cwd, status, latency }: StatusBarProps) {
  const dotClass =
    status === "connected"
      ? "status-dot connected"
      : status === "connecting"
      ? "status-dot connecting"
      : "status-dot disconnected";

  const statusText =
    status === "connected"
      ? "Connected"
      : status === "connecting"
      ? "Connecting..."
      : "Disconnected";

  return (
    <div className="status-bar">
      <div className="status-left">
        <span className={dotClass} />
        <span className="status-text">{statusText}</span>
        {status === "connected" && latency !== null && (
          <span className="status-latency">{latency}ms</span>
        )}
      </div>
      <div className="status-center">
        <span className="status-model">{model}</span>
      </div>
      <div className="status-right">
        <span className="status-cwd" title={cwd}>{cwd}</span>
      </div>
    </div>
  );
}
