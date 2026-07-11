package com.joveo.apiconnector.transformer.dto;

import com.joveo.apiconnector.api.DataFormat;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Create/update payload for a transformer — the config that normalizes an
 * upstream API's response into the uniform form.
 */
public record TransformerRequest(
        @NotNull Long apiDetailId,
        @NotBlank @Size(max = 255) String name,
        @Size(max = 1000) String description,
        @NotNull DataFormat sourceFormat,
        @NotNull DataFormat targetFormat,
        /** JSON mapping/transformation rules that produce the uniform schema. */
        @NotBlank String config) {
}
