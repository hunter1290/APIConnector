import { Router } from "express";
import { resolveProvider, SUPPORTED_PROVIDERS } from "../providers/registry";
import { ProviderError } from "../providers/types";

export const analyzeRouter = Router();

interface AnalyzeRequestBody {
  provider?: string;
  model?: string;
  data?: unknown;
}

analyzeRouter.post("/analyze", async (req, res) => {
  const body = req.body as AnalyzeRequestBody;

  if (!body.provider || body.data === undefined) {
    res.status(400).json({ error: "provider and data are required" });
    return;
  }

  const provider = resolveProvider(body.provider);
  if (!provider) {
    res.status(400).json({
      error: `Unsupported provider "${body.provider}". Supported: ${SUPPORTED_PROVIDERS.join(", ")}`,
    });
    return;
  }

  try {
    const insights = await provider.analyze({ model: body.model, data: body.data });
    res.json({ insights });
  } catch (err) {
    if (err instanceof ProviderError) {
      res.status(502).json({ error: err.message });
      return;
    }
    res.status(500).json({ error: "Unexpected error during analysis" });
  }
});
