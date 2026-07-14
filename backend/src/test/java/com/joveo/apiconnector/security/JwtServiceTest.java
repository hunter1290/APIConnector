package com.joveo.apiconnector.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.security.SignatureException;
import java.util.Base64;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;

/**
 * Pure unit tests for {@link JwtService}. Uses a real HMAC key so tokens are
 * genuinely signed and verified — no Spring context, no database.
 */
class JwtServiceTest {

    // 256-bit Base64 secret, as {@link JwtProperties#secret()} expects.
    private static final String SECRET =
            Base64.getEncoder().encodeToString("test-secret-key-that-is-long-enough-1234".getBytes());

    private JwtService jwtService;

    private final UserDetails user = new User(
            "alice@example.com", "irrelevant", List.of(new SimpleGrantedAuthority("ROLE_USER")));

    @BeforeEach
    void setUp() {
        jwtService = new JwtService(new JwtProperties(SECRET, 3_600_000L));
    }

    @Test
    @DisplayName("generated token round-trips the username through extractUsername")
    void generateAndExtractUsername() {
        String token = jwtService.generateToken(user);

        assertThat(token).isNotBlank();
        assertThat(jwtService.extractUsername(token)).isEqualTo("alice@example.com");
    }

    @Test
    @DisplayName("isTokenValid returns true for the same user and a live token")
    void tokenIsValidForMatchingUser() {
        String token = jwtService.generateToken(user);

        assertThat(jwtService.isTokenValid(token, user)).isTrue();
    }

    @Test
    @DisplayName("isTokenValid returns false when the token subject differs from the user")
    void tokenInvalidForDifferentUser() {
        String token = jwtService.generateToken(user);
        UserDetails other = new User("bob@example.com", "x", List.of());

        assertThat(jwtService.isTokenValid(token, other)).isFalse();
    }

    @Test
    @DisplayName("an expired token is rejected by parsing (ExpiredJwtException)")
    void expiredTokenIsRejected() {
        JwtService shortLived = new JwtService(new JwtProperties(SECRET, -1_000L));
        String expired = shortLived.generateToken(user);

        assertThatThrownBy(() -> shortLived.extractUsername(expired))
                .isInstanceOf(ExpiredJwtException.class);
    }

    @Test
    @DisplayName("a token signed with a different key fails signature verification")
    void tokenSignedWithOtherKeyIsRejected() {
        String otherSecret =
                Base64.getEncoder().encodeToString("a-totally-different-secret-key-abcdef".getBytes());
        JwtService otherService = new JwtService(new JwtProperties(otherSecret, 3_600_000L));
        String foreignToken = otherService.generateToken(user);

        assertThatThrownBy(() -> jwtService.extractUsername(foreignToken))
                .isInstanceOf(SignatureException.class);
    }

    @Test
    @DisplayName("extra claims are embedded and the token still validates")
    void generatesTokenWithExtraClaims() {
        String token = jwtService.generateToken(java.util.Map.of("role", "ADMIN"), user);

        assertThat(jwtService.isTokenValid(token, user)).isTrue();
        assertThat(jwtService.extractUsername(token)).isEqualTo("alice@example.com");
    }
}
