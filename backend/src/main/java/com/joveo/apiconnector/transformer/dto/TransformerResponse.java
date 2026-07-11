package com.joveo.apiconnector.transformer.dto;

import com.joveo.apiconnector.transformer.Transformer;
import java.time.Instant;

/** API representation of a transformer. */
public record TransformerResponse(
        Long id,
        Long apiDetailId,
        String name,
        String description,
        String sourceFormat,
        String targetFormat,
        String config,
        Instant createdAt,
        Instant updatedAt) {

    public static TransformerResponse from(Transformer t) {
        return new TransformerResponse(
                t.getId(),
                t.getApiDetail() != null ? t.getApiDetail().getId() : null,
                t.getName(),
                t.getDescription(),
                t.getSourceFormat().name(),
                t.getTargetFormat().name(),
                t.getConfig(),
                t.getCreatedAt(),
                t.getUpdatedAt());
    }
}
