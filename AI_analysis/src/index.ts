import express from "express";
import { config } from "./config";
import { internalAuth } from "./middleware/internalAuth";
import { analyzeRouter } from "./routes/analyze";
import { healthRouter } from "./routes/health";

const app = express();
app.use(express.json({ limit: "2mb" }));

// Public — used for liveness checks, no secret required.
app.use(healthRouter);

// Internal-only — every route here requires X-Internal-Secret matching the Java backend's
// app.ai.analysis.shared-secret. This service should never be reachable from the public
// internet; the shared secret is a minimum bar on top of that.
app.use(internalAuth, analyzeRouter);

app.listen(config.port, () => {
  // eslint-disable-next-line no-console
  console.log(`AI_analysis listening on port ${config.port}`);
});
