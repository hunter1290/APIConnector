package com.joveo.apiconnector.admin;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.joveo.apiconnector.admin.dto.AccountSummaryResponse;
import com.joveo.apiconnector.admin.dto.PlatformUsageResponse;
import com.joveo.apiconnector.api.ApiDetailRepository;
import com.joveo.apiconnector.common.exception.ResourceNotFoundException;
import com.joveo.apiconnector.usage.UsageService;
import com.joveo.apiconnector.user.Role;
import com.joveo.apiconnector.user.User;
import com.joveo.apiconnector.user.UserPlan;
import com.joveo.apiconnector.user.UserRepository;
import com.joveo.apiconnector.workspace.WorkspaceRepository;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/** Unit tests for {@link AdminService} with mocked repositories/usage (no Spring context, no DB). */
@ExtendWith(MockitoExtension.class)
class AdminServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private WorkspaceRepository workspaceRepository;
    @Mock
    private ApiDetailRepository apiDetailRepository;
    @Mock
    private UsageService usageService;

    private AdminService service() {
        return new AdminService(userRepository, workspaceRepository, apiDetailRepository, usageService);
    }

    private User account(long id, UserPlan plan) {
        return User.builder()
                .id(id).email("u" + id + "@example.com").password("x").fullName("User " + id)
                .role(Role.USER).plan(plan).build();
    }

    @Test
    @DisplayName("listAccounts maps each USER account to its token position and counts")
    void listAccountsMapsSummaries() {
        User regular = account(1L, UserPlan.REGULAR);
        when(userRepository.findByRoleOrderByIdAsc(Role.USER)).thenReturn(List.of(regular));
        when(usageService.tokensUsedByAccount(1L)).thenReturn(4_000L);
        when(workspaceRepository.countByUserId(1L)).thenReturn(3L);
        when(apiDetailRepository.countByUserId(1L)).thenReturn(7L);

        List<AccountSummaryResponse> accounts = service().listAccounts();

        assertThat(accounts).singleElement().satisfies(a -> {
            assertThat(a.accountId()).isEqualTo(1L);
            assertThat(a.plan()).isEqualTo("REGULAR");
            assertThat(a.tokenAllotment()).isEqualTo(10_000L);
            assertThat(a.tokensUsed()).isEqualTo(4_000L);
            assertThat(a.tokensRemaining()).isEqualTo(6_000L);
            assertThat(a.workspaceCount()).isEqualTo(3L);
            assertThat(a.apiCount()).isEqualTo(7L);
        });
    }

    @Test
    @DisplayName("platformSummary sums allotments across accounts and clamps remaining at zero")
    void platformSummaryAggregates() {
        when(userRepository.findByRoleOrderByIdAsc(Role.USER))
                .thenReturn(List.of(account(1L, UserPlan.REGULAR), account(2L, UserPlan.PRO)));
        when(workspaceRepository.count()).thenReturn(4L);
        when(apiDetailRepository.count()).thenReturn(9L);
        when(usageService.totalTokensUsed()).thenReturn(200_000L); // exceeds 110k allotment

        PlatformUsageResponse summary = service().platformSummary();

        assertThat(summary.totalAccounts()).isEqualTo(2L);
        assertThat(summary.totalWorkspaces()).isEqualTo(4L);
        assertThat(summary.totalApis()).isEqualTo(9L);
        assertThat(summary.totalTokenAllotment()).isEqualTo(110_000L); // 10k + 100k
        assertThat(summary.totalTokensUsed()).isEqualTo(200_000L);
        assertThat(summary.totalTokensRemaining()).isZero();
    }

    @Test
    @DisplayName("accountDetail throws when the account id is unknown")
    void accountDetailNotFound() {
        when(userRepository.findById(404L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service().accountDetail(404L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("changePlan updates and persists a normal account's plan")
    void changePlanUpdatesAccount() {
        User regular = account(1L, UserPlan.REGULAR);
        when(userRepository.findById(1L)).thenReturn(Optional.of(regular));
        when(usageService.tokensUsedByAccount(1L)).thenReturn(500L);
        when(workspaceRepository.countByUserId(1L)).thenReturn(1L);
        when(apiDetailRepository.countByUserId(1L)).thenReturn(2L);

        AccountSummaryResponse result = service().changePlan(1L, UserPlan.PRO);

        assertThat(result.plan()).isEqualTo("PRO");
        assertThat(regular.getPlan()).isEqualTo(UserPlan.PRO);
        verify(userRepository).save(regular);
    }

    @Test
    @DisplayName("changePlan throws when the account id is unknown")
    void changePlanNotFound() {
        when(userRepository.findById(404L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service().changePlan(404L, UserPlan.PRO))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("changePlan rejects targeting an ADMIN account (admins carry no plan)")
    void changePlanRejectsAdminTarget() {
        User admin = User.builder()
                .id(2L).email("admin@example.com").password("x").fullName("Admin")
                .role(Role.ADMIN).plan(null).build();
        when(userRepository.findById(2L)).thenReturn(Optional.of(admin));

        assertThatThrownBy(() -> service().changePlan(2L, UserPlan.PRO))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("setEnabled disables a normal account and persists it")
    void setEnabledDisablesAccount() {
        User regular = account(1L, UserPlan.REGULAR);
        when(userRepository.findById(1L)).thenReturn(Optional.of(regular));
        when(usageService.tokensUsedByAccount(1L)).thenReturn(0L);
        when(workspaceRepository.countByUserId(1L)).thenReturn(0L);
        when(apiDetailRepository.countByUserId(1L)).thenReturn(0L);

        AccountSummaryResponse result = service().setEnabled(1L, false);

        assertThat(result.enabled()).isFalse();
        assertThat(regular.isEnabled()).isFalse();
        verify(userRepository).save(regular);
    }

    @Test
    @DisplayName("setEnabled throws when the account id is unknown")
    void setEnabledNotFound() {
        when(userRepository.findById(404L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service().setEnabled(404L, false))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("setEnabled rejects targeting an ADMIN account")
    void setEnabledRejectsAdminTarget() {
        User admin = User.builder()
                .id(2L).email("admin@example.com").password("x").fullName("Admin")
                .role(Role.ADMIN).plan(null).build();
        when(userRepository.findById(2L)).thenReturn(Optional.of(admin));

        assertThatThrownBy(() -> service().setEnabled(2L, false))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
