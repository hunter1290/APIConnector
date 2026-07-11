package com.joveo.apiconnector.api.dto;

import com.joveo.apiconnector.api.AuthType;
import com.joveo.apiconnector.api.ConnectionStatus;
import com.joveo.apiconnector.api.DataFormat;
import com.joveo.apiconnector.api.HttpMethod;
import com.joveo.apiconnector.api.ResponseMode;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** Create/update payload for a third-party API. */
public record ApiDetailRequest(
        @NotNull Long workspaceId,
        @NotBlank @Size(max = 255) String name,
        @Size(max = 1000) String description,
        @NotBlank @Size(max = 2048) String baseUrl,
        @NotNull HttpMethod httpMethod,
        @NotNull DataFormat requestFormat,
        @NotNull AuthType authType,
        /** JSON blob of credentials/config; stored server-side. */
        String authConfig,
        /** JSON blob of default headers/query params. */
        String headers,
        @NotNull ResponseMode responseMode,
        ConnectionStatus status) {
}
