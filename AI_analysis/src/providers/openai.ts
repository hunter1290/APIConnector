import { config } from "../config";
import { AiProvider, AnalyzeParams, Insights, ProviderError, buildPrompt, parseInsights } from "./types";

/** Calls the real OpenAI Chat Completions API. */
export const openaiProvider: AiProvider = {
  defaultModel: "gpt-4o-mini",

  async analyze({ model, data }: AnalyzeParams): Promise<Insights> {
    if (!config.openaiApiKey) {
      throw new ProviderError(
        "OPENAI_API_KEY is not configured on the server. Add it to AI_analysis/.env.",
      );
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.requestTimeoutMs);
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${config.openaiApiKey}`,
        },
        body: JSON.stringify({
          model: model || openaiProvider.defaultModel,
          messages: [{ role: "user", content: buildPrompt(data) }],
          response_format: { type: "json_object" },
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const body = await response.text().catch(() => "");
        throw new ProviderError(`OpenAI API returned ${response.status}: ${body.slice(0, 300)}`);
      }

      const json = (await response.json()) as { choices?: { message?: { content?: string } }[] };
      const text = json.choices?.[0]?.message?.content;
      if (!text) {
        throw new ProviderError("OpenAI API returned no message content");
      }
      return parseInsights(text);
    } catch (err) {
      if (err instanceof ProviderError) throw err;
      if (err instanceof Error && err.name === "AbortError") {
        throw new ProviderError("OpenAI API call timed out");
      }
      throw new ProviderError(`OpenAI API call failed: ${(err as Error).message}`);
    } finally {
      clearTimeout(timeout);
    }
  },
};
