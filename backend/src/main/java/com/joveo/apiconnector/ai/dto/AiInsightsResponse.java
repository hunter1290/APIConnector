package com.joveo.apiconnector.ai.dto;

import java.util.List;

/** Structured analysis result returned by the AI_analysis microservice. */
public record AiInsightsResponse(
        int anomalies,
        String quality,
        String summary,
        List<String> recommendations) {
}
