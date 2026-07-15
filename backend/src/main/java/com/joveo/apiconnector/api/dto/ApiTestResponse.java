package com.joveo.apiconnector.api.dto;

/**
 * Result of a live upstream test call. {@code success} means a real HTTP response was
 * received (any status code, including 4xx/5xx) — it does NOT mean the upstream returned
 * 2xx. Only connection-level failures (DNS, timeout, refused, blocked host) are
 * {@code success = false}.
 */
public record ApiTestResponse(
        boolean success,
        Integer httpStatus,
        long latencyMs,
        String responseBody,
        String errorMessage) {
}
