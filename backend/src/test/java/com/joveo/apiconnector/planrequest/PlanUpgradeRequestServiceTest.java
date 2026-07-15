package com.joveo.apiconnector.planrequest;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.joveo.apiconnector.admin.AdminService;
import com.joveo.apiconnector.planrequest.dto.PlanUpgradeRequestResponse;
import com.joveo.apiconnector.user.Role;
import com.joveo.apiconnector.user.User;
import com.joveo.apiconnector.user.UserPlan;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/** Unit tests for {@link PlanUpgradeRequestService} with mocked collaborators (no Spring context, no DB). */
@ExtendWith(MockitoExtension.class)
class PlanUpgradeRequestServiceTest {

    @Mock
    private PlanUpgradeRequestRepository repository;
    @Mock
    private AdminService adminService;

    private PlanUpgradeRequestService service() {
        return new PlanUpgradeRequestService(repository, adminService);
    }

    private User user(long id, UserPlan plan) {
        return User.builder().id(id).email("u" + id + "@example.com").password("x")
                .fullName("User " + id).role(Role.USER).plan(plan).build();
    }

    private PlanUpgradeRequest pending(long id, User requester) {
        return PlanUpgradeRequest.builder().id(id).user(requester).status(PlanRequestStatus.PENDING).build();
    }

    @Test
    @DisplayName("request rejects an account already on PRO")
    void requestRejectsAlreadyPro() {
        User pro = user(1L, UserPlan.PRO);

        assertThatThrownBy(() -> service().request(pro)).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("request rejects a second request while one is already pending")
    void requestRejectsDuplicatePending() {
        User regular = user(1L, UserPlan.REGULAR);
        when(repository.findByUserIdAndStatus(1L, PlanRequestStatus.PENDING))
                .thenReturn(Optional.of(pending(9L, regular)));

        assertThatThrownBy(() -> service().request(regular)).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("request creates a PENDING row for an eligible caller")
    void requestCreatesPendingRow() {
        User regular = user(1L, UserPlan.REGULAR);
        when(repository.findByUserIdAndStatus(1L, PlanRequestStatus.PENDING)).thenReturn(Optional.empty());
        ArgumentCaptor<PlanUpgradeRequest> captor = ArgumentCaptor.forClass(PlanUpgradeRequest.class);
        when(repository.save(captor.capture())).thenAnswer(inv -> inv.getArgument(0));

        PlanUpgradeRequestResponse response = service().request(regular);

        assertThat(response.accountId()).isEqualTo(1L);
        assertThat(response.status()).isEqualTo("PENDING");
        assertThat(captor.getValue().getStatus()).isEqualTo(PlanRequestStatus.PENDING);
    }

    @Test
    @DisplayName("myLatest returns null when the user has never requested")
    void myLatestReturnsNullWhenNone() {
        when(repository.findTopByUserIdOrderByRequestedAtDesc(1L)).thenReturn(Optional.empty());

        assertThat(service().myLatest(user(1L, UserPlan.REGULAR))).isNull();
    }

    @Test
    @DisplayName("listPending returns all pending requests oldest first")
    void listPendingReturnsQueue() {
        User requester = user(1L, UserPlan.REGULAR);
        when(repository.findByStatusOrderByRequestedAtAsc(PlanRequestStatus.PENDING))
                .thenReturn(List.of(pending(9L, requester)));

        List<PlanUpgradeRequestResponse> result = service().listPending();

        assertThat(result).singleElement().satisfies(r -> assertThat(r.id()).isEqualTo(9L));
    }

    @Test
    @DisplayName("approve upgrades the requester to PRO and marks the request resolved")
    void approveUpgradesAndResolves() {
        User requester = user(1L, UserPlan.REGULAR);
        User admin = User.builder().id(2L).email("admin@example.com").password("x")
                .fullName("Admin").role(Role.ADMIN).build();
        PlanUpgradeRequest req = pending(9L, requester);
        when(repository.findById(9L)).thenReturn(Optional.of(req));
        when(repository.save(req)).thenReturn(req);

        PlanUpgradeRequestResponse response = service().approve(9L, admin);

        verify(adminService).changePlan(1L, UserPlan.PRO);
        assertThat(response.status()).isEqualTo("APPROVED");
        assertThat(req.getResolvedByEmail()).isEqualTo("admin@example.com");
        assertThat(req.getResolvedAt()).isNotNull();
    }

    @Test
    @DisplayName("reject marks the request resolved without changing the plan")
    void rejectResolvesWithoutPlanChange() {
        User requester = user(1L, UserPlan.REGULAR);
        User admin = User.builder().id(2L).email("admin@example.com").password("x")
                .fullName("Admin").role(Role.ADMIN).build();
        PlanUpgradeRequest req = pending(9L, requester);
        when(repository.findById(9L)).thenReturn(Optional.of(req));
        when(repository.save(req)).thenReturn(req);

        PlanUpgradeRequestResponse response = service().reject(9L, admin);

        verify(adminService, never()).changePlan(any(), any());
        assertThat(response.status()).isEqualTo("REJECTED");
    }

    @Test
    @DisplayName("approve throws when the request has already been resolved")
    void approveThrowsWhenAlreadyResolved() {
        User requester = user(1L, UserPlan.REGULAR);
        User admin = User.builder().id(2L).email("admin@example.com").password("x")
                .fullName("Admin").role(Role.ADMIN).build();
        PlanUpgradeRequest resolved = PlanUpgradeRequest.builder()
                .id(9L).user(requester).status(PlanRequestStatus.APPROVED).build();
        when(repository.findById(9L)).thenReturn(Optional.of(resolved));

        assertThatThrownBy(() -> service().approve(9L, admin)).isInstanceOf(IllegalArgumentException.class);
    }
}
