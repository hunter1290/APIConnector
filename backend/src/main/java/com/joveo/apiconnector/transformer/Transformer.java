package com.joveo.apiconnector.transformer;

import com.joveo.apiconnector.api.ApiDetail;
import com.joveo.apiconnector.api.DataFormat;
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
import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Transformation config that normalizes an upstream API's response into the
 * uniform schema/format served to clients — the core of "one format for all users".
 */
@Entity
@Table(name = "transformers", indexes = {
        @Index(name = "idx_transformers_api_detail", columnList = "api_detail_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Transformer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** API whose response this transformer normalizes. Null = reusable/global transformer. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "api_detail_id",
            foreignKey = @ForeignKey(name = "fk_transformers_api_detail"))
    private ApiDetail apiDetail;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "text")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "source_format", nullable = false, length = 20)
    @Builder.Default
    private DataFormat sourceFormat = DataFormat.JSON;

    /** The uniform output format (defaults to JSON). */
    @Enumerated(EnumType.STRING)
    @Column(name = "target_format", nullable = false, length = 20)
    @Builder.Default
    private DataFormat targetFormat = DataFormat.JSON;

    /** JSON mapping/transformation rules that produce the uniform schema. */
    @Column(name = "config", columnDefinition = "text", nullable = false)
    private String config;

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
