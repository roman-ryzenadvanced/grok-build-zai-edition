/**
 * AG-UI Protocol Event Types and SSE Encoder.
 * Maps Grok CLI streaming events to AG-UI protocol events for CopilotKit.
 */

import { v4 as uuidv4 } from "uuid";
import type { GrokEvent } from "./grok-runner";

// AG-UI Event Types
export const AGUI_EVENTS = {
  RUN_STARTED: "RUN_STARTED",
  RUN_FINISHED: "RUN_FINISHED",
  RUN_ERROR: "RUN_ERROR",
  TEXT_MESSAGE_START: "TEXT_MESSAGE_START",
  TEXT_MESSAGE_CONTENT: "TEXT_MESSAGE_CONTENT",
  TEXT_MESSAGE_END: "TEXT_MESSAGE_END",
  CUSTOM: "CUSTOM",
} as const;

export interface AgUiBaseEvent {
  type: string;
  threadId: string;
  runId: string;
}

export interface RunStartedEvent extends AgUiBaseEvent {
  type: "RUN_STARTED";
}

export interface TextMessageStartEvent extends AgUiBaseEvent {
  type: "TEXT_MESSAGE_START";
  messageId: string;
  role: "assistant";
}

export interface TextMessageContentEvent extends AgUiBaseEvent {
  type: "TEXT_MESSAGE_CONTENT";
  messageId: string;
  delta: string;
}

export interface TextMessageEndEvent extends AgUiBaseEvent {
  type: "TEXT_MESSAGE_END";
  messageId: string;
}

export interface RunFinishedEvent extends AgUiBaseEvent {
  type: "RUN_FINISHED";
}

export interface RunErrorEvent extends AgUiBaseEvent {
  type: "RUN_ERROR";
  message: string;
}

export interface CustomEvent extends AgUiBaseEvent {
  type: "CUSTOM";
  name: string;
  value: unknown;
}

export type AgUiEvent =
  | RunStartedEvent
  | TextMessageStartEvent
  | TextMessageContentEvent
  | TextMessageEndEvent
  | RunFinishedEvent
  | RunErrorEvent
  | CustomEvent;

/**
 * Encode an AG-UI event as an SSE data line.
 */
export function encodeSSE(event: AgUiEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

/**
 * Creates an AG-UI event stream transformer from Grok events.
 * Yields AG-UI SSE-encoded strings from Grok CLI events.
 */
export async function* transformGrokToAgUi(
  grokEvents: AsyncGenerator<GrokEvent>,
  threadId: string,
  runId: string
): AsyncGenerator<string> {
  const messageId = uuidv4();
  let messageStarted = false;
  let hasText = false;

  // Emit RUN_STARTED
  yield encodeSSE({
    type: AGUI_EVENTS.RUN_STARTED,
    threadId,
    runId,
  } as RunStartedEvent);

  for await (const event of grokEvents) {
    switch (event.type) {
      case "text":
        // Start message on first text chunk
        if (!messageStarted) {
          yield encodeSSE({
            type: AGUI_EVENTS.TEXT_MESSAGE_START,
            threadId,
            runId,
            messageId,
            role: "assistant",
          } as TextMessageStartEvent);
          messageStarted = true;
        }
        hasText = true;
        yield encodeSSE({
          type: AGUI_EVENTS.TEXT_MESSAGE_CONTENT,
          threadId,
          runId,
          messageId,
          delta: event.data,
        } as TextMessageContentEvent);
        break;

      case "thought":
        // Emit thoughts as custom events for the thought panel
        yield encodeSSE({
          type: AGUI_EVENTS.CUSTOM,
          threadId,
          runId,
          name: "grok_thought",
          value: { content: event.data },
        } as CustomEvent);
        break;

      case "end":
        // End message if it was started
        if (messageStarted) {
          yield encodeSSE({
            type: AGUI_EVENTS.TEXT_MESSAGE_END,
            threadId,
            runId,
            messageId,
          } as TextMessageEndEvent);
        }
        // Emit RUN_FINISHED
        yield encodeSSE({
          type: AGUI_EVENTS.RUN_FINISHED,
          threadId,
          runId,
        } as RunFinishedEvent);
        return;

      case "error":
        // Emit error
        yield encodeSSE({
          type: AGUI_EVENTS.RUN_ERROR,
          threadId,
          runId,
          message: event.data,
        } as RunErrorEvent);
        return;
    }
  }

  // If we got here without an end event, close things up
  if (messageStarted) {
    yield encodeSSE({
      type: AGUI_EVENTS.TEXT_MESSAGE_END,
      threadId,
      runId,
      messageId,
    } as TextMessageEndEvent);
  }
  if (!hasText) {
    // No response was generated - send a helpful message
    const fallbackId = uuidv4();
    yield encodeSSE({
      type: AGUI_EVENTS.TEXT_MESSAGE_START,
      threadId,
      runId,
      messageId: fallbackId,
      role: "assistant",
    } as TextMessageStartEvent);
    yield encodeSSE({
      type: AGUI_EVENTS.TEXT_MESSAGE_CONTENT,
      threadId,
      runId,
      messageId: fallbackId,
      delta: "No response received from Grok CLI. Please check that Grok is installed and configured.",
    } as TextMessageContentEvent);
    yield encodeSSE({
      type: AGUI_EVENTS.TEXT_MESSAGE_END,
      threadId,
      runId,
      messageId: fallbackId,
    } as TextMessageEndEvent);
  }
  yield encodeSSE({
    type: AGUI_EVENTS.RUN_FINISHED,
    threadId,
    runId,
  } as RunFinishedEvent);
}
