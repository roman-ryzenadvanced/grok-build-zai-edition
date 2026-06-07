"use client";
import React, { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";

interface ResearchResult {
  topic: string;
  content: string;
  progress: string[];
  status: "idle" | "searching" | "done" | "error";
  timestamp: Date;
}

export default function ResearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ResearchResult[]>([]);
  const [currentResult, setCurrentResult] = useState<ResearchResult | null>(null);
  const [progressLines, setProgressLines] = useState<string[]>([]);
  const [dataLines, setDataLines] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (resultsEndRef.current) {
      resultsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [dataLines, progressLines]);

  const handleSearch = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const topic = query.trim();
    if (!topic) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const result: ResearchResult = {
      topic,
      content: "",
      progress: [],
      status: "searching",
      timestamp: new Date(),
    };

    setCurrentResult(result);
    setProgressLines([]);
    setDataLines([]);
    setQuery("");

    try {
      const res = await fetch("/api/last30days", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const err = await res.json();
        setCurrentResult((prev) => prev ? { ...prev, status: "error", content: err.error || "Request failed" } : prev);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() || "";

        for (const part of parts) {
          const eventMatch = part.match(/^event: (.+)/m);
          const dataMatch = part.match(/^data: (.+)/m);
          if (!eventMatch || !dataMatch) continue;

          const event = eventMatch[1];
          let data: string;
          try {
            data = JSON.parse(dataMatch[1]);
          } catch {
            data = dataMatch[1];
          }

          if (event === "data") {
            setDataLines((prev) => [...prev, data]);
          } else if (event === "progress") {
            setProgressLines((prev) => [...prev, data]);
          } else if (event === "status" && data === "Research complete") {
            setCurrentResult((prev) => prev ? { ...prev, status: "done" } : prev);
          } else if (event === "done") {
            setCurrentResult((prev) => {
              if (prev) {
                const final: ResearchResult = { ...prev, content: data, status: "done" };
                setResults((r) => [final, ...r]);
                return final;
              }
              return prev;
            });
          } else if (event === "error") {
            setCurrentResult((prev) => prev ? { ...prev, status: "error", content: data } : prev);
          }
        }
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setCurrentResult((prev) => prev ? { ...prev, status: "error", content: err.message } : prev);
      }
    }
  }, [query]);

  const handleStop = useCallback(() => {
    abortRef.current?.abort();
    setCurrentResult((prev) => prev ? { ...prev, status: "error", content: "Cancelled" } : prev);
  }, []);

  const isSearching = currentResult?.status === "searching";

  // Render markdown-like content
  const renderContent = (content: string) => {
    if (!content) return null;
    return content.split("\n").map((line, i) => {
      // Bold
      let processed = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      // Links [text](url)
      processed = processed.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" class="research-link">$1</a>');
      // Headers
      if (line.startsWith("### ")) return <h4 key={i} className="research-h4">{line.slice(4)}</h4>;
      if (line.startsWith("## ")) return <h3 key={i} className="research-h3">{line.slice(3)}</h3>;
      if (line.startsWith("# ")) return <h2 key={i} className="research-h2">{line.slice(2)}</h2>;
      // Horizontal rule
      if (line.trim() === "---") return <hr key={i} className="research-hr" />;
      // HTML comments - skip
      if (line.startsWith("<!--")) return null;
      // List items
      if (line.match(/^\d+\.\s/)) return <li key={i} className="research-oli" dangerouslySetInnerHTML={{ __html: processed.replace(/^\d+\.\s/, "") }} />;
      if (line.startsWith("- ")) return <li key={i} className="research-uli" dangerouslySetInnerHTML={{ __html: processed.slice(2) }} />;
      // Empty line
      if (!line.trim()) return <br key={i} />;
      // Regular paragraph
      return <p key={i} className="research-para" dangerouslySetInnerHTML={{ __html: processed }} />;
    });
  };

  return (
    <div className="research-page">
      {/* Header */}
      <header className="research-header">
        <div className="research-header-inner">
          <Link href="/" className="research-back-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Chat
          </Link>
          <h1 className="research-logo">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35"/>
            </svg>
            Research
          </h1>
          <span className="research-badge">/last30days</span>
        </div>
      </header>

      {/* Search */}
      <div className="research-search-section">
        <div className="research-search-container">
          <form onSubmit={handleSearch} className="research-search-form">
            <div className="research-input-wrap">
              <svg className="research-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="M21 21l-4.35-4.35"/>
              </svg>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Research any topic across Reddit, HN, Polymarket, GitHub..."
                className="research-input"
                disabled={isSearching}
              />
              {isSearching ? (
                <button type="button" onClick={handleStop} className="research-stop-btn">
                  Stop
                </button>
              ) : (
                <button type="submit" disabled={!query.trim()} className="research-go-btn">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </button>
              )}
            </div>
          </form>
          <div className="research-sources-bar">
            <span className="research-sources-label">Free sources:</span>
            <span className="research-source-tag">Reddit</span>
            <span className="research-source-tag">Hacker News</span>
            <span className="research-source-tag">Polymarket</span>
            <span className="research-source-tag">GitHub</span>
          </div>
        </div>
      </div>

      {/* Results Area */}
      <div className="research-results-area">
        {currentResult ? (
          <div className="research-active-result">
            {/* Status indicator */}
            {isSearching && (
              <div className="research-searching">
                <div className="research-spinner" />
                <span>Researching &ldquo;{currentResult.topic}&rdquo;...</span>
              </div>
            )}

            {/* Progress (stderr) */}
            {progressLines.length > 0 && (
              <div className="research-progress">
                {progressLines.slice(-8).map((line, i) => (
                  <div key={i} className="research-progress-line">{line}</div>
                ))}
              </div>
            )}

            {/* Streaming data lines */}
            {dataLines.length > 0 && (
              <div className="research-stream-content">
                {currentResult.status === "done" ? (
                  <div className="research-synthesis">
                    {renderContent(dataLines.join("\n"))}
                  </div>
                ) : (
                  <pre className="research-raw-stream">{dataLines.join("\n")}</pre>
                )}
              </div>
            )}

            {/* Final content */}
            {currentResult.status === "done" && currentResult.content && dataLines.length === 0 && (
              <div className="research-synthesis">
                {renderContent(currentResult.content)}
              </div>
            )}

            {/* Error */}
            {currentResult.status === "error" && (
              <div className="research-error">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 8v4M12 16h.01"/>
                </svg>
                {currentResult.content}
              </div>
            )}
            <div ref={resultsEndRef} />
          </div>
        ) : (
          <div className="research-empty">
            <div className="research-empty-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="11" cy="11" r="8"/>
                <path d="M21 21l-4.35-4.35"/>
              </svg>
            </div>
            <h2>Research what people are saying</h2>
            <p>Search across Reddit, Hacker News, Polymarket, and GitHub - scored by upvotes, engagement, and real money.</p>
            <div className="research-examples">
              <button onClick={() => { const t = "Claude Code skills"; setQuery(t); setTimeout(() => { const form = document.querySelector<HTMLFormElement>(".research-search-form"); if (form) form.requestSubmit(); }, 0); }} className="research-example-btn">Claude Code skills</button>
              <button onClick={() => { const t = "React Server Components"; setQuery(t); setTimeout(() => { const form = document.querySelector<HTMLFormElement>(".research-search-form"); if (form) form.requestSubmit(); }, 0); }} className="research-example-btn">React Server Components</button>
              <button onClick={() => { const t = "best AI coding tools 2026"; setQuery(t); setTimeout(() => { const form = document.querySelector<HTMLFormElement>(".research-search-form"); if (form) form.requestSubmit(); }, 0); }} className="research-example-btn">best AI coding tools 2026</button>
              <button onClick={() => { const t = "Rust vs Go performance"; setQuery(t); setTimeout(() => { const form = document.querySelector<HTMLFormElement>(".research-search-form"); if (form) form.requestSubmit(); }, 0); }} className="research-example-btn">Rust vs Go performance</button>
            </div>
          </div>
        )}

        {/* History */}
        {results.length > 0 && (
          <div className="research-history">
            <h3 className="research-history-title">Previous Research</h3>
            {results.map((r, i) => (
              <div key={i} className="research-history-item">
                <div className="research-history-topic">{r.topic}</div>
                <div className="research-history-meta">
                  {r.timestamp.toLocaleTimeString()}
                  {" "}&middot;{" "}
                  {r.status === "done" ? "Complete" : r.status}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
