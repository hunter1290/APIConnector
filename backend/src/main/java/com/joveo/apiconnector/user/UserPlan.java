package com.joveo.apiconnector.user;

/**
 * Subscription tier for normal (non-admin) users.
 * Admin accounts leave this {@code null}.
 *
 * <p>Each tier carries a free AI-token allotment (mirrors the frontend's
 * {@code PLAN_TOKENS} in {@code AccountContext.tsx}).
 */
public enum UserPlan {
    REGULAR(10_000L),
    PRO(100_000L);

    private final long freeTokens;

    UserPlan(long freeTokens) {
        this.freeTokens = freeTokens;
    }

    /** Free AI-token allotment granted to accounts on this tier. */
    public long freeTokens() {
        return freeTokens;
    }

    /** Null-safe allotment lookup: accounts with no plan (e.g. ADMIN) get 0. */
    public static long freeTokensFor(UserPlan plan) {
        return plan == null ? 0L : plan.freeTokens();
    }
}
