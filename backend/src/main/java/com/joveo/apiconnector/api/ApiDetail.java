package com.joveo.apiconnector.api;

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
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * A third-party (upstream) API that a user has registered with APIConnector.
 * Captures where to call it, in what format, and how to authenticate.
 */
@Entity
@Table(name = "api_details", indexes = {
        @Index(name = "idx_api_details_user", columnList = "user_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApiDetail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Owner of this API connection (many APIs per user). */
    @ManyToOne(fetch = jakarta.persistence.FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_api_details_user"))
    private User user;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "text")
    private String description;

    @Column(name = "base_url", nullable = false, length = 2048)
    private String baseUrl;

    @Enumerated(EnumType.STRING)
    @Column(name = "http_method", nullable = false, length = 10)
    @Builder.Default
    private HttpMethod httpMethod = HttpMethod.GET;

    /** Format the upstream returns; normalized downstream by a Transformer. */
    @Enumerated(EnumType.STRING)
    @Column(name = "request_format", nullable = false, length = 20)
    @Builder.Default
    private DataFormat requestFormat = DataFormat.JSON;

    @Enumerated(EnumType.STRING)
    @Column(name = "auth_type", nullable = false, length = 20)
    @Builder.Default
    private AuthType authType = AuthType.NONE;

    /** JSON blob of auth configuration/credentials. Encrypt at rest in production. */
    @Column(name = "auth_config", columnDefinition = "text")
    private String authConfig;

    /** JSON blob of default headers / query params sent to the upstream. */
    @Column(columnDefinition = "text")
    private String headers;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private ConnectionStatus status = ConnectionStatus.DRAFT;

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
