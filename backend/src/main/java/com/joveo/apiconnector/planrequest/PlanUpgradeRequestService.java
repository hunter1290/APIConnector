package com.joveo.apiconnector.planrequest;

import com.joveo.apiconnector.admin.AdminService;
import com.joveo.apiconnector.common.exception.ResourceNotFoundException;
import com.joveo.apiconnector.planrequest.dto.PlanUpgradeRequestResponse;
import com.joveo.apiconnector.user.User;
import com.joveo.apiconnector.user.UserPlan;
import java.time.Instant;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * The Request-Pro workflow: a normal user asks to upgrade, an admin approves or rejects.
 * Approval delegates the actual plan mutation to {@link AdminService#changePlan} — a single
 * source of truth for how a plan changes, rather than duplicating that logic here.
 */
@Service
@Transactional
public class PlanUpgradeRequestService {

    private final PlanUpgradeRequestRepository repository;
    private final AdminService adminService;

    public PlanUpgradeRequestService(PlanUpgradeRequestRepository repository, AdminService adminService) {
        this.repository = repository;
        this.adminService = adminService;
    }

    /** Creates a PENDING request for the caller. Rejects if already PRO or already pending. */
    public PlanUpgradeRequestResponse request(User user) {
        if (user.getPlan() == UserPlan.PRO) {
            throw new IllegalArgumentException("Already on the Pro plan");
        }
        if (repository.findByUserIdAndStatus(user.getId(), PlanRequestStatus.PENDING).isPresent()) {
            throw new IllegalArgumentException("A plan-upgrade request is already pending");
        }
        PlanUpgradeRequest saved = repository.save(PlanUpgradeRequest.builder().user(user).build());
        return PlanUpgradeRequestResponse.from(saved);
    }

    /** The caller's latest request (any status), or {@code null} if they've never requested. */
    @Transactional(readOnly = true)
    public PlanUpgradeRequestResponse myLatest(User user) {
        return repository.findTopByUserIdOrderByRequestedAtDesc(user.getId())
                .map(PlanUpgradeRequestResponse::from)
                .orElse(null);
    }

    /** Every PENDING request, oldest first — the admin queue. */
    @Transactional(readOnly = true)
    public List<PlanUpgradeRequestResponse> listPending() {
        return repository.findByStatusOrderByRequestedAtAsc(PlanRequestStatus.PENDING).stream()
                .map(PlanUpgradeRequestResponse::from)
                .toList();
    }

    /** Approves a pending request: upgrades the requester to PRO and marks it resolved. */
    public PlanUpgradeRequestResponse approve(Long requestId, User admin) {
        PlanUpgradeRequest req = requirePending(requestId);
        adminService.changePlan(req.getUser().getId(), UserPlan.PRO);
        req.setStatus(PlanRequestStatus.APPROVED);
        resolve(req, admin);
        return PlanUpgradeRequestResponse.from(req);
    }

    /** Rejects a pending request without changing the requester's plan. */
    public PlanUpgradeRequestResponse reject(Long requestId, User admin) {
        PlanUpgradeRequest req = requirePending(requestId);
        req.setStatus(PlanRequestStatus.REJECTED);
        resolve(req, admin);
        return PlanUpgradeRequestResponse.from(req);
    }

    private void resolve(PlanUpgradeRequest req, User admin) {
        req.setResolvedAt(Instant.now());
        req.setResolvedByEmail(admin.getEmail());
        repository.save(req);
    }

    private PlanUpgradeRequest requirePending(Long requestId) {
        PlanUpgradeRequest req = repository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("PlanUpgradeRequest", requestId));
        if (req.getStatus() != PlanRequestStatus.PENDING) {
            throw new IllegalArgumentException("This request has already been resolved");
        }
        return req;
    }
}
