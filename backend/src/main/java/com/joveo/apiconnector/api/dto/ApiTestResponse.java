package com.joveo.apiconnector.api.dto;

import com.joveo.apiconnector.ai.dto.AiInsightsResponse;

/**
 * Result of a live upstream test call. {@code success} means a real HTTP response was
 * received (any status code, including 4xx/5xx) — it does NOT mean the upstream returned
 * 2xx. Only connection-level failures (DNS, timeout, refused, blocked host) are
 * {@code success = false}. {@code insights} is populated only when an AI provider was
 * supplied and analysis succeeded; a missing/unreachable AI service leaves it {@code null}
 * rather than failing the whole test.
 */
public record ApiTestResponse(
        boolean success,
        Integer httpStatus,
        long latencyMs,
        String responseBody,
        String errorMessage,
        AiInsightsResponse insights) {
}
