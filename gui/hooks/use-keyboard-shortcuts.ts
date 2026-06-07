"use client";
import { useEffect } from "react";

interface ShortcutCallbacks {
  onNewSession: () => void;
  onToggleFullscreen: () => void;
  onClose: () => void;
}

export function useKeyboardShortcuts({
  onNewSession,
  onToggleFullscreen,
  onClose,
}: ShortcutCallbacks) {
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const mod = e.ctrlKey || e.metaKey;

      // Ctrl+N — New session
      if (mod && !e.shiftKey && e.key === "n") {
        e.preventDefault();
        onNewSession();
        return;
      }

      // Ctrl+Shift+F — Toggle fullscreen
      if (mod && e.shiftKey && e.key === "F") {
        e.preventDefault();
        onToggleFullscreen();
        return;
      }

      // Escape — Close panels / stop generation
      if (e.key === "Escape") {
        onClose();
        return;
      }
    }

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onNewSession, onToggleFullscreen, onClose]);
}
