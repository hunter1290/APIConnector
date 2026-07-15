package com.joveo.apiconnector.user;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/** Unit tests for {@link UserPlan} token allotments (must mirror the frontend PLAN_TOKENS). */
class UserPlanTest {

    @Test
    @DisplayName("each plan exposes its free-token allotment")
    void planAllotments() {
        assertThat(UserPlan.REGULAR.freeTokens()).isEqualTo(10_000L);
        assertThat(UserPlan.PRO.freeTokens()).isEqualTo(100_000L);
    }

    @Test
    @DisplayName("freeTokensFor is null-safe: no plan (e.g. ADMIN) means 0")
    void freeTokensForIsNullSafe() {
        assertThat(UserPlan.freeTokensFor(null)).isZero();
        assertThat(UserPlan.freeTokensFor(UserPlan.REGULAR)).isEqualTo(10_000L);
        assertThat(UserPlan.freeTokensFor(UserPlan.PRO)).isEqualTo(100_000L);
    }
}
