package com.joveo.apiconnector.workspace.dto;

import com.joveo.apiconnector.workspace.Workspace;
import java.time.Instant;

/** API representation of a workspace. */
public record WorkspaceResponse(
        Long id,
        String name,
        String description,
        long apiCount,
        Instant createdAt,
        Instant updatedAt) {

    public static WorkspaceResponse from(Workspace w, long apiCount) {
        return new WorkspaceResponse(
                w.getId(), w.getName(), w.getDescription(), apiCount, w.getCreatedAt(), w.getUpdatedAt());
    }
}
