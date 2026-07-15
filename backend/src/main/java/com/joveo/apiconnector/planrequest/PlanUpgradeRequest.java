package com.joveo.apiconnector.planrequest;

import com.joveo.apiconnector.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * A normal user's request to upgrade their plan (currently REGULAR -> PRO), and its full
 * resolution history. Only an admin can approve/reject (see {@code AdminService.changePlan}
 * for the actual plan mutation on approve).
 */
@Entity
@Table(name = "plan_upgrade_requests", indexes = {
        @Index(name = "idx_plan_upgrade_requests_user", columnList = "user_id"),
        @Index(name = "idx_plan_upgrade_requests_status", columnList = "status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlanUpgradeRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = jakarta.persistence.FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_plan_upgrade_requests_user"))
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private PlanRequestStatus status = PlanRequestStatus.PENDING;

    @Column(name = "requested_at", nullable = false, updatable = false)
    private Instant requestedAt;

    @Column(name = "resolved_at")
    private Instant resolvedAt;

    /** Email of the admin who resolved this request — a string, not a FK, to keep this lightweight. */
    @Column(name = "resolved_by_email")
    private String resolvedByEmail;

    @PrePersist
    void onCreate() {
        this.requestedAt = Instant.now();
    }
}
