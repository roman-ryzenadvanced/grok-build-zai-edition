"use client";
import React, { useState, useCallback } from "react";
import { AssistantMessage as DefaultAssistantMessage } from "@copilotkit/react-ui";

interface AssistantMessageProps {
  message?: any;
  messages?: any[];
  isCurrentMessage?: boolean;
  isLoading: boolean;
  isGenerating: boolean;
  onRegenerate?: () => void;
  onCopy?: (message: string) => void;
  onThumbsUp?: any;
  onThumbsDown?: any;
  feedback?: any;
  rawData: any;
  children?: React.ReactNode;
  [key: string]: any;
}

export default function CustomAssistantMessage(props: AssistantMessageProps) {
  const [copied, setCopied] = useState(false);
  const { children, ...restProps } = props;

  const getTextContent = useCallback((): string => {
    const msg = props.message;
    if (!msg) return "";
    if (typeof msg.content === "string") return msg.content;
    if (Array.isArray(msg.content)) {
      return msg.content
        .filter((c: any) => c.type === "text" || c.text)
        .map((c: any) => c.text || c.content || "")
        .join("");
    }
    return "";
  }, [props.message]);

  const handleCopy = useCallback(() => {
    const text = getTextContent();
    if (props.onCopy) {
      props.onCopy(text);
    } else {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [getTextContent, props.onCopy]);

  const showActions = !props.isGenerating || !props.isCurrentMessage;

  return (
    <div className="message-wrapper">
      <div className="assistant-message-content">
        <DefaultAssistantMessage {...restProps} />
      </div>
      {showActions && (
        <div className="message-actions">
          <button
            className="message-action-btn"
            onClick={handleCopy}
            title="Copy message"
          >
            {copied ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2"/>
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
              </svg>
            )}
            <span className="message-action-label">{copied ? "Copied!" : "Copy"}</span>
          </button>
          {props.onRegenerate && (
            <button
              className="message-action-btn"
              onClick={props.onRegenerate}
              title="Regenerate response"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 4v6h6M23 20v-6h-6"/>
                <path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15"/>
              </svg>
              <span className="message-action-label">Retry</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
