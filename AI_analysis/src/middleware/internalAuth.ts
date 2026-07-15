import type { NextFunction, Request, Response } from "express";
import { config } from "../config";

/**
 * This service is only meant to be called by the APIConnector Java backend, never
 * directly by a browser. Every request must carry the shared secret both sides are
 * configured with (app.ai.analysis.shared-secret on the Java side).
 */
export function internalAuth(req: Request, res: Response, next: NextFunction): void {
  const provided = req.header("X-Internal-Secret");
  if (!provided || provided !== config.internalSharedSecret) {
    res.status(401).json({ error: "Missing or invalid X-Internal-Secret header" });
    return;
  }
  next();
}
