package com.joveo.apiconnector.transformer.dto;

import jakarta.validation.constraints.NotNull;

/** Pasted sample data to try a *saved* transformer's expression against — no config needed. */
public record TransformerSampleRequest(@NotNull Object sampleData) {
}
