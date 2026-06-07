"use client";
import React from "react";

interface StatusBarProps {
  model: string;
  cwd: string;
  connected: boolean;
}

export default function StatusBar({ model, cwd, connected }: StatusBarProps) {
  return (
    <div className="status-bar">
      <div className="status-left">
        <span className={`status-dot ${connected ? "connected" : "disconnected"}`} />
        <span className="status-text">
          {connected ? "Connected" : "Disconnected"}
        </span>
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
