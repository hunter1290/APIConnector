package com.joveo.apiconnector.api;

/**
 * Security scheme an upstream API uses. APIConnector translates between these
 * so a client can consume any upstream through its own required scheme.
 */
public enum AuthType {
    NONE,
    API_KEY,
    BASIC,
    BEARER_TOKEN,
    OAUTH2,
    HMAC,
    JWT
}
