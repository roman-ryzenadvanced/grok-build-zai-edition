"use client";
import React, { useState } from "react";

interface ThoughtPanelProps {
  thoughts: string[];
}

export default function ThoughtPanel({ thoughts }: ThoughtPanelProps) {
  const [collapsed, setCollapsed] = useState(true);

  if (thoughts.length === 0) return null;

  return (
    <div className="thought-panel">
      <button
        className="thought-toggle"
        onClick={() => setCollapsed(!collapsed)}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d={collapsed ? "M9 18l6-6-6-6" : "M6 9l6 6 6-6"} />
        </svg>
        <span>Thinking ({thoughts.length})</span>
      </button>
      {!collapsed && (
        <div className="thought-content">
          {thoughts.map((t, i) => (
            <p key={i} className="thought-text">{t}</p>
          ))}
        </div>
      )}
    </div>
  );
}
