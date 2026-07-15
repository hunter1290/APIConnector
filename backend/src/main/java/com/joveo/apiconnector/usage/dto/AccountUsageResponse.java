package com.joveo.apiconnector.usage.dto;

import java.util.List;

/**
 * An account's AI-token position: plan allotment, tokens used and remaining,
 * plus a per-workspace breakdown. Returned by GET /api/usage/me and by the
 * admin per-account endpoint.
 */
public record AccountUsageResponse(
        Long accountId,
        String email,
        String fullName,
        String plan,
        long tokenAllotment,
        long tokensUsed,
        long tokensRemaining,
        List<WorkspaceUsageResponse> workspaces) {
}
