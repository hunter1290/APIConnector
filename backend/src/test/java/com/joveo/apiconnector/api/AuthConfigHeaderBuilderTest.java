package com.joveo.apiconnector.api;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Base64;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;

/** Pure unit tests for {@link AuthConfigHeaderBuilder} — no Spring context, no DB. */
class AuthConfigHeaderBuilderTest {

    private final AuthConfigHeaderBuilder builder = new AuthConfigHeaderBuilder(new ObjectMapper());

    @Test
    @DisplayName("NONE attaches no headers")
    void noneAttachesNothing() {
        HttpHeaders headers = builder.build(AuthType.NONE, null);

        assertThat(headers).isEmpty();
    }

    @Test
    @DisplayName("API_KEY attaches the configured header name and value")
    void apiKeyAttachesConfiguredHeader() {
        HttpHeaders headers = builder.build(AuthType.API_KEY, "{\"headerName\":\"X-Custom-Key\",\"apiKey\":\"secret123\"}");

        assertThat(headers.getFirst("X-Custom-Key")).isEqualTo("secret123");
    }

    @Test
    @DisplayName("API_KEY defaults the header name to X-API-Key when not provided")
    void apiKeyDefaultsHeaderName() {
        HttpHeaders headers = builder.build(AuthType.API_KEY, "{\"apiKey\":\"secret123\"}");

        assertThat(headers.getFirst("X-API-Key")).isEqualTo("secret123");
    }

    @Test
    @DisplayName("BEARER_TOKEN sets a Bearer Authorization header")
    void bearerTokenSetsAuthorizationHeader() {
        HttpHeaders headers = builder.build(AuthType.BEARER_TOKEN, "{\"token\":\"abc.def.ghi\"}");

        assertThat(headers.getFirst(HttpHeaders.AUTHORIZATION)).isEqualTo("Bearer abc.def.ghi");
    }

    @Test
    @DisplayName("BASIC sets a Basic Authorization header from username/password")
    void basicSetsAuthorizationHeader() {
        HttpHeaders headers = builder.build(AuthType.BASIC, "{\"username\":\"alice\",\"password\":\"s3cret\"}");

        String expected = "Basic " + Base64.getEncoder().encodeToString("alice:s3cret".getBytes());
        assertThat(headers.getFirst(HttpHeaders.AUTHORIZATION)).isEqualTo(expected);
    }

    @Test
    @DisplayName("OAUTH2/HMAC/JWT throw UnsupportedAuthTypeException")
    void unsupportedSchemesThrow() {
        assertThatThrownBy(() -> builder.build(AuthType.OAUTH2, "{}"))
                .isInstanceOf(UnsupportedAuthTypeException.class);
        assertThatThrownBy(() -> builder.build(AuthType.HMAC, "{}"))
                .isInstanceOf(UnsupportedAuthTypeException.class);
        assertThatThrownBy(() -> builder.build(AuthType.JWT, "{}"))
                .isInstanceOf(UnsupportedAuthTypeException.class);
    }

    @Test
    @DisplayName("malformed authConfig JSON throws IllegalArgumentException")
    void malformedJsonThrows() {
        assertThatThrownBy(() -> builder.build(AuthType.API_KEY, "not json"))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
