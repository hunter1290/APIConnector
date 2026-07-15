package com.joveo.apiconnector.usage.dto;

/** Per-workspace AI-token consumption, used in account usage breakdowns. */
public record WorkspaceUsageResponse(
        Long workspaceId,
        String name,
        long apiCount,
        long tokensUsed) {
}
