package com.joveo.apiconnector.planrequest;

import com.joveo.apiconnector.planrequest.dto.PlanUpgradeRequestResponse;
import com.joveo.apiconnector.user.User;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * The Request-Pro workflow: {@code /api/plan-requests/**} for any authenticated user (create/
 * check their own), {@code /api/admin/plan-requests/**} for admins (queue/approve/reject).
 * No class-level {@code @RequestMapping} since this controller serves both audiences.
 */
@RestController
@Tag(name = "Plan requests")
public class PlanRequestController {

    private final PlanUpgradeRequestService service;

    public PlanRequestController(PlanUpgradeRequestService service) {
        this.service = service;
    }

    /** Requests a plan upgrade (currently REGULAR -> PRO) for the caller. */
    @PostMapping("/api/plan-requests")
    public ResponseEntity<PlanUpgradeRequestResponse> request(@AuthenticationPrincipal User user) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.request(user));
    }

    /** The caller's latest plan-upgrade request (any status), or 204 if they've never requested. */
    @GetMapping("/api/plan-requests/me")
    public ResponseEntity<PlanUpgradeRequestResponse> myLatest(@AuthenticationPrincipal User user) {
        PlanUpgradeRequestResponse latest = service.myLatest(user);
        return latest != null ? ResponseEntity.ok(latest) : ResponseEntity.noContent().build();
    }

    /** The admin queue of pending plan-upgrade requests. */
    @GetMapping("/api/admin/plan-requests")
    @PreAuthorize("hasRole('ADMIN')")
    public List<PlanUpgradeRequestResponse> pending() {
        return service.listPending();
    }

    /** Approves a pending request: upgrades the requester to PRO. */
    @PostMapping("/api/admin/plan-requests/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public PlanUpgradeRequestResponse approve(@AuthenticationPrincipal User admin, @PathVariable Long id) {
        return service.approve(id, admin);
    }

    /** Rejects a pending request without changing the requester's plan. */
    @PostMapping("/api/admin/plan-requests/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public PlanUpgradeRequestResponse reject(@AuthenticationPrincipal User admin, @PathVariable Long id) {
        return service.reject(id, admin);
    }
}
