package com.joveo.apiconnector.admin;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Binds {@code app.admin.*} — the seed admin account created on startup.
 *
 * @param enabled  Whether to create the seed admin if it is missing.
 * @param email    Admin login email (unique).
 * @param password Raw password; BCrypt-hashed before persisting. Override in every real environment.
 * @param fullName Display name for the admin account.
 */
@ConfigurationProperties(prefix = "app.admin")
public record AdminProperties(boolean enabled, String email, String password, String fullName) {
}
