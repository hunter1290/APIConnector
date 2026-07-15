package com.joveo.apiconnector.ai.dto;

/**
 * One entry in the platform's fixed AI-provider catalog. There is no per-user configuration —
 * credentials live in AI_analysis's own environment (see flow/ai-analysis-flow.md).
 */
public record AiProviderCatalogEntry(String provider, String label) {
}
