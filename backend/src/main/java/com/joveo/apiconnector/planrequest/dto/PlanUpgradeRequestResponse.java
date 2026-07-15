package com.joveo.apiconnector.planrequest.dto;

import com.joveo.apiconnector.planrequest.PlanUpgradeRequest;
import java.time.Instant;

/** API representation of a plan-upgrade request, including the requester's identity. */
public record PlanUpgradeRequestResponse(
        Long id,
        Long accountId,
        String email,
        String fullName,
        String status,
        Instant requestedAt,
        Instant resolvedAt,
        String resolvedByEmail) {

    public static PlanUpgradeRequestResponse from(PlanUpgradeRequest r) {
        return new PlanUpgradeRequestResponse(
                r.getId(),
                r.getUser().getId(),
                r.getUser().getEmail(),
                r.getUser().getFullName(),
                r.getStatus().name(),
                r.getRequestedAt(),
                r.getResolvedAt(),
                r.getResolvedByEmail());
    }
}
