package com.joveo.apiconnector.admin.dto;

/** Platform-wide rollup for the admin dashboard. */
public record PlatformUsageResponse(
        long totalAccounts,
        long totalWorkspaces,
        long totalApis,
        long totalTokenAllotment,
        long totalTokensUsed,
        long totalTokensRemaining) {
}
