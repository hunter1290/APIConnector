package com.joveo.apiconnector.transformer.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * Ad-hoc test of a JSONata expression against pasted sample data — lets a user validate a
 * transform before saving it (or before attaching it to a live API).
 */
public record TransformerTestRequest(
        @NotBlank String config,
        @NotNull Object sampleData) {
}
