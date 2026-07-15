/** Structured analysis result — mirrors the Java backend's AiInsightsResponse record. */
export interface Insights {
  anomalies: number;
  quality: "good" | "fair" | "poor";
  summary: string;
  recommendations: string[];
}

export interface AnalyzeParams {
  model?: string;
  data: unknown;
}

export interface AiProvider {
  readonly defaultModel: string;
  analyze(params: AnalyzeParams): Promise<Insights>;
}

/** Thrown by a provider on any failure (bad key, timeout, malformed response, provider outage). */
export class ProviderError extends Error {}

export function buildPrompt(data: unknown): string {
  return [
    "You are analyzing a JSON payload returned by a third-party API that a developer has",
    "connected through an API integration platform. Look for anomalies, data-quality issues,",
    "and anything a developer should know before relying on this data in production.",
    "",
    "Respond with ONLY a single JSON object (no markdown, no code fences, no commentary)",
    "matching exactly this shape:",
    '{"anomalies": <integer count of issues found>, "quality": "good" | "fair" | "poor",',
    ' "summary": "<one or two sentence summary>", "recommendations": ["<short actionable tip>", ...]}',
    "",
    "Payload to analyze:",
    JSON.stringify(data),
  ].join("\n");
}

export function parseInsights(rawText: string): Insights {
  const trimmed = rawText.trim();
  const jsonText = extractJsonObject(trimmed);
  try {
    const parsed = JSON.parse(jsonText);
    return {
      anomalies: typeof parsed.anomalies === "number" ? parsed.anomalies : 0,
      quality: parsed.quality === "good" || parsed.quality === "fair" || parsed.quality === "poor"
        ? parsed.quality
        : "fair",
      summary: typeof parsed.summary === "string" ? parsed.summary : trimmed.slice(0, 500),
      recommendations: Array.isArray(parsed.recommendations)
        ? parsed.recommendations.filter((r: unknown) => typeof r === "string")
        : [],
    };
  } catch {
    // Model didn't return clean JSON — degrade gracefully instead of failing the request.
    return { anomalies: 0, quality: "fair", summary: trimmed.slice(0, 500), recommendations: [] };
  }
}

function extractJsonObject(text: string): string {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  return start >= 0 && end > start ? text.slice(start, end + 1) : text;
}
