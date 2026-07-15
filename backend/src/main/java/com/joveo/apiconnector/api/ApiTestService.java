package com.joveo.apiconnector.api;

import com.joveo.apiconnector.api.dto.ApiTestRequest;
import com.joveo.apiconnector.api.dto.ApiTestResponse;
import com.joveo.apiconnector.common.exception.ResourceNotFoundException;
import com.joveo.apiconnector.user.User;
import java.net.URI;
import java.time.Duration;
import java.time.Instant;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

/**
 * Executes a live, synchronous test call against a user-supplied or saved upstream API, so a
 * connection can be validated before (or independent of) saving it. Not part of the runtime
 * resolve/cache pipeline (see flow/data-flow.md) — purely for validation.
 */
@Service
public class ApiTestService {

    private static final int MAX_RESPONSE_CHARS = 20_000;

    private final SsrfGuard ssrfGuard;
    private final AuthConfigHeaderBuilder headerBuilder;
    private final ApiDetailRepository apiDetailRepository;
    private final RestTemplate restTemplate;

    public ApiTestService(SsrfGuard ssrfGuard,
                          AuthConfigHeaderBuilder headerBuilder,
                          ApiDetailRepository apiDetailRepository,
                          RestTemplateBuilder restTemplateBuilder) {
        this.ssrfGuard = ssrfGuard;
        this.headerBuilder = headerBuilder;
        this.apiDetailRepository = apiDetailRepository;
        this.restTemplate = restTemplateBuilder
                .connectTimeout(Duration.ofSeconds(5))
                .readTimeout(Duration.ofSeconds(10))
                .build();
    }

    /** Ad-hoc test of a not-yet-saved (or about-to-change) upstream configuration. */
    public ApiTestResponse test(ApiTestRequest request) {
        return execute(request.baseUrl(), request.httpMethod(), request.authType(), request.authConfig());
    }

    /** Tests an already-saved API using its persisted config; credentials never leave the server. */
    public ApiTestResponse testSaved(User user, Long apiDetailId) {
        ApiDetail api = apiDetailRepository.findByIdAndUserId(apiDetailId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("ApiDetail", apiDetailId));
        return execute(api.getBaseUrl(), api.getHttpMethod(), api.getAuthType(), api.getAuthConfig());
    }

    private ApiTestResponse execute(String baseUrl, HttpMethod httpMethod, AuthType authType, String authConfig) {
        URI uri;
        try {
            uri = URI.create(baseUrl);
        } catch (IllegalArgumentException e) {
            return failure("Invalid URL: " + baseUrl);
        }
        String scheme = uri.getScheme();
        if (scheme == null || !(scheme.equalsIgnoreCase("http") || scheme.equalsIgnoreCase("https"))) {
            return failure("URL must use http or https");
        }

        HttpHeaders headers;
        try {
            ssrfGuard.check(uri);
            headers = headerBuilder.build(authType, authConfig);
        } catch (UnsupportedAuthTypeException | IllegalArgumentException e) {
            return failure(e.getMessage());
        }

        HttpEntity<Void> entity = new HttpEntity<>(headers);
        Instant start = Instant.now();
        try {
            ResponseEntity<String> response = restTemplate.exchange(
                    uri, org.springframework.http.HttpMethod.valueOf(httpMethod.name()), entity, String.class);
            return success(response.getStatusCode().value(), response.getBody(), start);
        } catch (HttpStatusCodeException e) {
            // Upstream responded with an error status — still a valid, real test result.
            return success(e.getStatusCode().value(), e.getResponseBodyAsString(), start);
        } catch (ResourceAccessException e) {
            return failure("Could not reach the upstream: " + rootMessage(e));
        } catch (RuntimeException e) {
            return failure("Test call failed: " + rootMessage(e));
        }
    }

    private ApiTestResponse success(int status, String body, Instant start) {
        long latencyMs = Duration.between(start, Instant.now()).toMillis();
        return new ApiTestResponse(true, status, latencyMs, cap(body), null);
    }

    private ApiTestResponse failure(String message) {
        return new ApiTestResponse(false, null, 0, null, message);
    }

    private String cap(String body) {
        if (body == null) {
            return null;
        }
        return body.length() > MAX_RESPONSE_CHARS ? body.substring(0, MAX_RESPONSE_CHARS) : body;
    }

    private String rootMessage(Throwable t) {
        Throwable cause = t;
        while (cause.getCause() != null) {
            cause = cause.getCause();
        }
        return cause.getMessage() != null ? cause.getMessage() : t.getMessage();
    }
}
