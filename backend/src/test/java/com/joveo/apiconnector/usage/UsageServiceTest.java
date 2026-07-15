package com.joveo.apiconnector.usage;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.joveo.apiconnector.api.ApiDetailRepository;
import com.joveo.apiconnector.common.exception.ResourceNotFoundException;
import com.joveo.apiconnector.usage.dto.AccountUsageResponse;
import com.joveo.apiconnector.usage.dto.RecordUsageRequest;
import com.joveo.apiconnector.user.Role;
import com.joveo.apiconnector.user.User;
import com.joveo.apiconnector.user.UserPlan;
import com.joveo.apiconnector.workspace.Workspace;
import com.joveo.apiconnector.workspace.WorkspaceRepository;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/** Unit tests for {@link UsageService} with mocked repositories (no Spring context, no DB). */
@ExtendWith(MockitoExtension.class)
class UsageServiceTest {

    @Mock
    private TokenUsageRepository tokenUsageRepository;
    @Mock
    private WorkspaceRepository workspaceRepository;
    @Mock
    private ApiDetailRepository apiDetailRepository;

    private UsageService service() {
        return new UsageService(tokenUsageRepository, workspaceRepository, apiDetailRepository);
    }

    private User account(long id, UserPlan plan) {
        return User.builder()
                .id(id).email("u" + id + "@example.com").password("x").fullName("User " + id)
                .role(Role.USER).plan(plan).build();
    }

    @Test
    @DisplayName("record persists a usage event attributed to an owned workspace")
    void recordPersistsUsageForOwnedWorkspace() {
        User user = account(1L, UserPlan.REGULAR);
        Workspace ws = Workspace.builder().id(5L).user(user).name("Sales").build();
        RecordUsageRequest req = new RecordUsageRequest(5L, null, 250L, UsageSource.AI_INSIGHT, "insight call");
        when(workspaceRepository.findByIdAndUserId(5L, 1L)).thenReturn(Optional.of(ws));
        when(workspaceRepository.findByUserIdOrderByCreatedAtAsc(1L)).thenReturn(List.of(ws));
        when(tokenUsageRepository.sumTokensByUserId(1L)).thenReturn(250L);
        when(tokenUsageRepository.sumTokensByWorkspaceId(5L)).thenReturn(250L);
        when(apiDetailRepository.countByWorkspaceId(5L)).thenReturn(2L);

        AccountUsageResponse response = service().record(user, req);

        ArgumentCaptor<TokenUsage> saved = ArgumentCaptor.forClass(TokenUsage.class);
        verify(tokenUsageRepository).save(saved.capture());
        assertThat(saved.getValue().getTokens()).isEqualTo(250L);
        assertThat(saved.getValue().getWorkspace()).isEqualTo(ws);
        assertThat(saved.getValue().getSource()).isEqualTo(UsageSource.AI_INSIGHT);

        assertThat(response.tokenAllotment()).isEqualTo(10_000L);
        assertThat(response.tokensUsed()).isEqualTo(250L);
        assertThat(response.tokensRemaining()).isEqualTo(9_750L);
        assertThat(response.workspaces()).singleElement()
                .satisfies(w -> {
                    assertThat(w.workspaceId()).isEqualTo(5L);
                    assertThat(w.tokensUsed()).isEqualTo(250L);
                    assertThat(w.apiCount()).isEqualTo(2L);
                });
    }

    @Test
    @DisplayName("record rejects a workspace the caller does not own, without saving")
    void recordRejectsUnownedWorkspace() {
        User user = account(1L, UserPlan.REGULAR);
        RecordUsageRequest req = new RecordUsageRequest(99L, null, 10L, null, null);
        when(workspaceRepository.findByIdAndUserId(99L, 1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service().record(user, req))
                .isInstanceOf(ResourceNotFoundException.class);

        verify(tokenUsageRepository, never()).save(any());
    }

    @Test
    @DisplayName("accountUsage reports remaining as never negative even when over allotment")
    void accountUsageClampsRemainingAtZero() {
        User user = account(2L, UserPlan.REGULAR);
        when(tokenUsageRepository.sumTokensByUserId(2L)).thenReturn(12_000L); // over 10k
        when(workspaceRepository.findByUserIdOrderByCreatedAtAsc(2L)).thenReturn(List.of());

        AccountUsageResponse response = service().accountUsage(user);

        assertThat(response.tokenAllotment()).isEqualTo(10_000L);
        assertThat(response.tokensUsed()).isEqualTo(12_000L);
        assertThat(response.tokensRemaining()).isZero();
        assertThat(response.plan()).isEqualTo("REGULAR");
        assertThat(response.workspaces()).isEmpty();
    }
}
