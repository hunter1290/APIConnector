package com.joveo.apiconnector.api;

import com.joveo.apiconnector.ai.AiProvider;
import com.joveo.apiconnector.user.User;
import com.joveo.apiconnector.workspace.Workspace;
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
        @Index(name = "idx_api_details_user", columnList = "user_id"),
        @Index(name = "idx_api_details_workspace", columnList = "workspace_id")
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

    /** Workspace this API belongs to (grouping). */
    @ManyToOne(fetch = jakarta.persistence.FetchType.LAZY)
    @JoinColumn(name = "workspace_id",
            foreignKey = @ForeignKey(name = "fk_api_details_workspace"))
    private Workspace workspace;

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

    /** How the uniform endpoint returns data to the client. */
    @Enumerated(EnumType.STRING)
    @Column(name = "response_mode", nullable = false, length = 20)
    @Builder.Default
    private ResponseMode responseMode = ResponseMode.DIRECT;

    /** Generated uniform, client-facing path (e.g. /v1/{workspace}/{api}). */
    @Column(name = "uniform_path", length = 512)
    private String uniformPath;

    /**
     * Platform AI provider used to analyze this API's responses when
     * {@code responseMode == AI_INSIGHT}. Pro plan only — APIConnector supplies the actual
     * credentials (AI_analysis/.env), so there's nothing else to store here.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "ai_provider", length = 20)
    private AiProvider aiProvider;

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
