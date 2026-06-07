"use client";
import React from "react";
import { CopilotKit } from "@copilotkit/react-core";
import { HttpAgent } from "@ag-ui/client";
import "@copilotkit/react-ui/styles.css";
import "./globals.css";

const grokAgent = new HttpAgent({
  agentId: "default",
  url: "/api/grok-agent",
  // Bind fetch to window to avoid "Illegal invocation" error
  fetch: (...args: Parameters<typeof fetch>) => window.fetch(...args),
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body>
        <CopilotKit
          runtimeUrl="/api/grok-agent"
          agents__unsafe_dev_only={{ default: grokAgent as any }}
        >
          {children}
        </CopilotKit>
      </body>
    </html>
  );
}
