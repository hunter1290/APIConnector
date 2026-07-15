package com.joveo.apiconnector.transformer.dto;

/** Result of evaluating a JSONata expression against sample data. */
public record TransformerTestResponse(
        boolean success,
        Object result,
        String errorMessage) {
}
