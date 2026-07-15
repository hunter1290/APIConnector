import { anthropicProvider } from "./anthropic";
import { openaiProvider } from "./openai";
import type { AiProvider } from "./types";

/** Provider name -> implementation. Names mirror the Java backend's AiProvider enum. */
const PROVIDERS: Record<string, AiProvider> = {
  ANTHROPIC: anthropicProvider,
  OPENAI: openaiProvider,
};

export function resolveProvider(name: string): AiProvider | undefined {
  return PROVIDERS[name.toUpperCase()];
}

export const SUPPORTED_PROVIDERS = Object.keys(PROVIDERS);
