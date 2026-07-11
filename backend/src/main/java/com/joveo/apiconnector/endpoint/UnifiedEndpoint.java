package com.joveo.apiconnector.endpoint;

import com.joveo.apiconnector.api.ApiDetail;
import com.joveo.apiconnector.transformer.Transformer;
import com.joveo.apiconnector.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * The single uniform, client-facing URL that APIConnector exposes. Binds an
 * upstream {@link ApiDetail} (and optional {@link Transformer}) to a stable path,
 * and stores the most recently synced/transformed payload served to clients.
 * This is the "uniform API URL + its data" entity.
 */
@Entity
@Table(name = "unified_endpoints",
        uniqueConstraints = @UniqueConstraint(name = "uk_unified_endpoints_path", columnNames = "url_path"),
        indexes = {@Index(name = "idx_unified_endpoints_user", columnList = "user_id")})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UnifiedEndpoint {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Owner of this endpoint. */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_unified_endpoints_user"))
    private User user;

    /** Upstream API that backs this endpoint. */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "api_detail_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_unified_endpoints_api_detail"))
    private ApiDetail apiDetail;

    /** Transformer applied to the upstream response before serving (optional). */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "transformer_id",
            foreignKey = @ForeignKey(name = "fk_unified_endpoints_transformer"))
    private Transformer transformer;

    /** Stable, client-facing URL path exposed by APIConnector (unique). */
    @Column(name = "url_path", nullable = false, length = 512)
    private String urlPath;

    @Column(columnDefinition = "text")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private EndpointStatus status = EndpointStatus.DRAFT;

    /** When the served data was last refreshed from upstream. */
    @Column(name = "last_synced_at")
    private Instant lastSyncedAt;

    /** Cached, transformed uniform payload most recently served to clients. */
    @Column(name = "cached_payload", columnDefinition = "text")
    private String cachedPayload;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        this.updatedAt = Instant.now();
    }
}
