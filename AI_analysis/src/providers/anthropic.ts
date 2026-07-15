import { config } from "../config";
import { AiProvider, AnalyzeParams, Insights, ProviderError, buildPrompt, parseInsights } from "./types";

/** Calls the real Anthropic Messages API — matches APIConnector's "Claude-powered analysis" claim. */
export const anthropicProvider: AiProvider = {
  defaultModel: "claude-3-5-haiku-latest",

  async analyze({ model, data }: AnalyzeParams): Promise<Insights> {
    if (!config.anthropicApiKey) {
      throw new ProviderError(
        "ANTHROPIC_API_KEY is not configured on the server. Add it to AI_analysis/.env.",
      );
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.requestTimeoutMs);
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": config.anthropicApiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: model || anthropicProvider.defaultModel,
          max_tokens: 1024,
          messages: [{ role: "user", content: buildPrompt(data) }],
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const body = await response.text().catch(() => "");
        throw new ProviderError(`Anthropic API returned ${response.status}: ${body.slice(0, 300)}`);
      }

      const json = (await response.json()) as { content?: { type: string; text?: string }[] };
      const text = json.content?.find((c) => c.type === "text")?.text;
      if (!text) {
        throw new ProviderError("Anthropic API returned no text content");
      }
      return parseInsights(text);
    } catch (err) {
      if (err instanceof ProviderError) throw err;
      if (err instanceof Error && err.name === "AbortError") {
        throw new ProviderError("Anthropic API call timed out");
      }
      throw new ProviderError(`Anthropic API call failed: ${(err as Error).message}`);
    } finally {
      clearTimeout(timeout);
    }
  },
};
