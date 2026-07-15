package com.joveo.apiconnector.usage;

import com.joveo.apiconnector.api.ApiDetail;
import com.joveo.apiconnector.user.User;
import com.joveo.apiconnector.workspace.Workspace;
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
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * A single AI-token consumption event, attributed to an account (user) and
 * optionally to a workspace / upstream API. Append-only: rows are never updated,
 * so aggregate sums per account or workspace give current consumption.
 */
@Entity
@Table(name = "token_usage", indexes = {
        @Index(name = "idx_token_usage_user", columnList = "user_id"),
        @Index(name = "idx_token_usage_workspace", columnList = "workspace_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TokenUsage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Account charged for this consumption (many events per user). */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_token_usage_user"))
    private User user;

    /** Workspace the usage is attributed to (optional). */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workspace_id",
            foreignKey = @ForeignKey(name = "fk_token_usage_workspace"))
    private Workspace workspace;

    /** Upstream API that triggered the usage (optional). */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "api_detail_id",
            foreignKey = @ForeignKey(name = "fk_token_usage_api_detail"))
    private ApiDetail apiDetail;

    /** Number of AI tokens consumed by this event (> 0). */
    @Column(nullable = false)
    private long tokens;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private UsageSource source = UsageSource.AI_INSIGHT;

    @Column(columnDefinition = "text")
    private String description;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        this.createdAt = Instant.now();
    }
}
