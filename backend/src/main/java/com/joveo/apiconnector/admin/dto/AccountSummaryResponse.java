package com.joveo.apiconnector.admin.dto;

/** One row in the admin account-monitoring list: an account and its AI-token position. */
public record AccountSummaryResponse(
        Long accountId,
        String email,
        String fullName,
        String plan,
        long workspaceCount,
        long apiCount,
        long tokenAllotment,
        long tokensUsed,
        long tokensRemaining) {
}
