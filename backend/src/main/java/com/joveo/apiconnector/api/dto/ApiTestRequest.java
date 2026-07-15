package com.joveo.apiconnector.api.dto;

import com.joveo.apiconnector.api.AuthType;
import com.joveo.apiconnector.api.DataFormat;
import com.joveo.apiconnector.api.HttpMethod;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** Ad-hoc live test of an upstream, before (or without) saving it as an {@code ApiDetail}. */
public record ApiTestRequest(
        @NotBlank @Size(max = 2048) String baseUrl,
        @NotNull HttpMethod httpMethod,
        @NotNull DataFormat requestFormat,
        @NotNull AuthType authType,
        /** JSON blob of credentials/config; used only for this call, never persisted. */
        String authConfig,
        /** JSON blob of default headers/query params. */
        String headers) {
}
