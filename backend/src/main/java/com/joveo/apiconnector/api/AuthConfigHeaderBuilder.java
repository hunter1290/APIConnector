package com.joveo.apiconnector.api;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Map;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;

/**
 * Builds the upstream {@link HttpHeaders} for a live test call from an {@link AuthType} and its
 * JSON {@code authConfig}. Mirrors the credential fields the frontend collects per scheme
 * (see {@code SecurityFields} in {@code apis/new/page.tsx}).
 */
@Component
public class AuthConfigHeaderBuilder {

    private final ObjectMapper objectMapper;

    public AuthConfigHeaderBuilder(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    /** @throws UnsupportedAuthTypeException for schemes not yet supported for live calls (OAUTH2/HMAC/JWT). */
    public HttpHeaders build(AuthType authType, String authConfigJson) {
        HttpHeaders headers = new HttpHeaders();
        Map<String, String> config = parse(authConfigJson);
        switch (authType) {
            case NONE -> {
                // no credentials to attach
            }
            case API_KEY -> {
                String headerName = config.getOrDefault("headerName", "X-API-Key");
                String apiKey = config.get("apiKey");
                if (apiKey != null) {
                    headers.set(headerName, apiKey);
                }
            }
            case BEARER_TOKEN -> {
                String token = config.get("token");
                if (token != null) {
                    headers.setBearerAuth(token);
                }
            }
            case BASIC -> headers.setBasicAuth(
                    config.getOrDefault("username", ""), config.getOrDefault("password", ""));
            case OAUTH2, HMAC, JWT -> throw new UnsupportedAuthTypeException(authType);
        }
        return headers;
    }

    private Map<String, String> parse(String json) {
        if (json == null || json.isBlank()) {
            return Map.of();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<Map<String, String>>() {
            });
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException("authConfig must be a flat JSON object of strings");
        }
    }
}
