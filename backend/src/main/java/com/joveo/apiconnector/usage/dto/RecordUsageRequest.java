package com.joveo.apiconnector.usage.dto;

import com.joveo.apiconnector.usage.UsageSource;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

/**
 * Payload for POST /api/usage — records an AI-token consumption event for the
 * authenticated account. {@code workspaceId} / {@code apiDetailId} are optional
 * attribution; when present they must be owned by the caller.
 */
public record RecordUsageRequest(
        Long workspaceId,
        Long apiDetailId,
        @NotNull @Positive Long tokens,
        UsageSource source,
        String description) {
}
