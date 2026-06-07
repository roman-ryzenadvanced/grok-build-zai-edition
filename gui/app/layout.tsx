"use client";
import React from "react";
import { CopilotKit } from "@copilotkit/react-core";
import "@copilotkit/react-ui/styles.css";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body>
        <CopilotKit runtimeUrl="/api/grok-agent">
          {children}
        </CopilotKit>
      </body>
    </html>
  );
}
