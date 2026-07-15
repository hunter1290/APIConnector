package com.joveo.apiconnector.api.dto;

import com.joveo.apiconnector.api.ApiDetail;
import java.time.Instant;

/** API representation of a third-party API. Deliberately omits {@code authConfig} (secrets). */
public record ApiDetailResponse(
        Long id,
        Long workspaceId,
        String name,
        String description,
        String baseUrl,
        String httpMethod,
        String requestFormat,
        String authType,
        String headers,
        String responseMode,
        String status,
        String uniformPath,
        String aiProvider,
        Instant createdAt,
        Instant updatedAt) {

    public static ApiDetailResponse from(ApiDetail a) {
        return new ApiDetailResponse(
                a.getId(),
                a.getWorkspace() != null ? a.getWorkspace().getId() : null,
                a.getName(),
                a.getDescription(),
                a.getBaseUrl(),
                a.getHttpMethod().name(),
                a.getRequestFormat().name(),
                a.getAuthType().name(),
                a.getHeaders(),
                a.getResponseMode().name(),
                a.getStatus().name(),
                a.getUniformPath(),
                a.getAiProvider() != null ? a.getAiProvider().name() : null,
                a.getCreatedAt(),
                a.getUpdatedAt());
    }
}
