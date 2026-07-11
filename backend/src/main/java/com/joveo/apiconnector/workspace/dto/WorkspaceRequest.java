package com.joveo.apiconnector.workspace.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Create/update payload for a workspace. */
public record WorkspaceRequest(
        @NotBlank @Size(max = 120) String name,
        @Size(max = 1000) String description) {
}
