package com.joveo.apiconnector.admin.dto;

/** A workspace as seen by an admin: its owner and AI-token consumption. */
public record AdminWorkspaceResponse(
        Long workspaceId,
        String name,
        Long ownerId,
        String ownerEmail,
        long apiCount,
        long tokensUsed) {
}
