package com.joveo.apiconnector.ai;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.joveo.apiconnector.user.Role;
import com.joveo.apiconnector.user.User;
import com.joveo.apiconnector.user.UserPlan;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/** Pure unit tests for {@link AiAccessGuard} — no Spring context, no DB. */
class AiAccessGuardTest {

    private final AiAccessGuard guard = new AiAccessGuard();

    private User user(UserPlan plan) {
        return User.builder().id(1L).email("u@example.com").password("x")
                .fullName("User").role(Role.USER).plan(plan).build();
    }

    @Test
    @DisplayName("requirePro allows a PRO account")
    void allowsPro() {
        assertThatCode(() -> guard.requirePro(user(UserPlan.PRO))).doesNotThrowAnyException();
    }

    @Test
    @DisplayName("requirePro rejects a REGULAR account")
    void rejectsRegular() {
        assertThatThrownBy(() -> guard.requirePro(user(UserPlan.REGULAR)))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("requirePro rejects an account with no plan (e.g. ADMIN)")
    void rejectsNoPlan() {
        User admin = User.builder().id(2L).email("admin@example.com").password("x")
                .fullName("Admin").role(Role.ADMIN).plan(null).build();

        assertThatThrownBy(() -> guard.requirePro(admin)).isInstanceOf(IllegalArgumentException.class);
    }
}
