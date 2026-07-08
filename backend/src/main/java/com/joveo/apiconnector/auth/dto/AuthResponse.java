package com.joveo.apiconnector.auth.dto;

/** Response for successful register/login: the access token plus a lightweight user summary. */
public record AuthResponse(
        String token,
        String tokenType,
        long expiresInMs,
        UserSummary user) {

    public record UserSummary(Long id, String email, String fullName, String role) {
    }
}
