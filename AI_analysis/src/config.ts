import dotenv from "dotenv";

dotenv.config();

/**
 * Environment configuration. No database — this service is fully stateless.
 * APIConnector (not the end user) supplies the AI provider credentials, so they live only
 * here — never in a request body, never in the Java backend's database.
 */

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const config = {
  port: Number(process.env.PORT ?? 4000),
  // Must match app.ai.analysis.shared-secret on the Java backend. No public-facing
  // default — this service is meant to sit behind an internal network, and a shared
  // secret is the minimum bar so it isn't callable by anyone who can reach the port.
  internalSharedSecret: required("INTERNAL_SHARED_SECRET", "dev-only-shared-secret-change-me"),
  requestTimeoutMs: Number(process.env.REQUEST_TIMEOUT_MS ?? 20_000),
  // Provider credentials — one per provider, set in AI_analysis/.env (see .env.example).
  // Optional at startup: a provider whose key is missing just fails that one /analyze call
  // with a clear error, rather than crashing the whole service.
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  openaiApiKey: process.env.OPENAI_API_KEY,
};
