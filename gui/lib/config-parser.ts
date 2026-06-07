/**
 * Config Parser - Reads ~/.grok/config.toml and extracts model definitions.
 */

import { readFileSync } from "fs";
import { homedir } from "os";
import { join } from "path";

export interface ModelConfig {
  id: string;         // e.g. "zai-glm-5.1"
  name: string;       // e.g. "z.ai GLM-5.1"
  model: string;      // e.g. "glm-5.1"
  base_url: string;   // e.g. "https://api.z.ai/api/coding/paas/v4"
  description?: string;
  temperature?: number;
  top_p?: number;
  max_completion_tokens?: number;
  context_window?: number;
}

const GROK_HOME = process.env.GROK_HOME || join(homedir(), ".grok");
const CONFIG_PATH = join(GROK_HOME, "config.toml");

/**
 * Parse model definitions from config.toml.
 * Uses regex-based parsing since we don't need a full TOML parser.
 */
export function parseModels(): ModelConfig[] {
  let content: string;
  try {
    content = readFileSync(CONFIG_PATH, "utf-8");
  } catch {
    console.warn(`Config not found at ${CONFIG_PATH}`);
    return [];
  }

  const models: ModelConfig[] = [];
  const modelSectionRegex = /\[model\.([^\]]+)\]/g;

  // Find all [model.*] sections
  const sections: { id: string; start: number }[] = [];
  let match: RegExpExecArray | null;

  while ((match = modelSectionRegex.exec(content)) !== null) {
    sections.push({ id: match[1], start: match.index });
  }

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    const nextStart = i + 1 < sections.length ? sections[i + 1].start : content.length;
    const sectionText = content.substring(section.start, nextStart);

    const getField = (key: string): string | undefined => {
      const re = new RegExp(`${key}\\s*=\\s*"([^"]*)"`, "m");
      const m = sectionText.match(re);
      return m?.[1];
    };

    const getNumField = (key: string): number | undefined => {
      const re = new RegExp(`${key}\\s*=\\s*(\\d+)`, "m");
      const m = sectionText.match(re);
      return m ? parseInt(m[1], 10) : undefined;
    };

    const floatField = (key: string): number | undefined => {
      const re = new RegExp(`${key}\\s*=\\s*([\\d.]+)`, "m");
      const m = sectionText.match(re);
      return m ? parseFloat(m[1]) : undefined;
    };

    const model: ModelConfig = {
      id: section.id,
      name: getField("name") || section.id,
      model: getField("model") || section.id,
      base_url: getField("base_url") || "",
      description: getField("description"),
      temperature: floatField("temperature"),
      top_p: floatField("top_p"),
      max_completion_tokens: getNumField("max_completion_tokens"),
      context_window: getNumField("context_window"),
    };

    models.push(model);
  }

  return models;
}

/**
 * Get the default model ID from config.
 */
export function getDefaultModel(): string {
  try {
    const content = readFileSync(CONFIG_PATH, "utf-8");
    const match = content.match(/default\s*=\s*"([^"]*)"/m);
    return match?.[1] || "zai-glm-5.1";
  } catch {
    return "zai-glm-5.1";
  }
}
