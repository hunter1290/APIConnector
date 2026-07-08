package com.joveo.apiconnector.security;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Binds {@code app.security.jwt.*} from application.properties.
 *
 * @param secret       Base64-encoded HMAC signing key (>= 256 bits).
 * @param expirationMs Access-token lifetime in milliseconds.
 */
@ConfigurationProperties(prefix = "app.security.jwt")
public record JwtProperties(String secret, long expirationMs) {
}
