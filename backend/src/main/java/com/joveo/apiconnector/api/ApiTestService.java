package com.joveo.apiconnector.api;

import com.joveo.apiconnector.ai.AiAccessGuard;
import com.joveo.apiconnector.ai.AiAnalysisClient;
import com.joveo.apiconnector.ai.AiProvider;
import com.joveo.apiconnector.ai.dto.AiInsightsResponse;
import com.joveo.apiconnector.api.dto.ApiTestRequest;
import com.joveo.apiconnector.api.dto.ApiTestResponse;
import com.joveo.apiconnector.common.exception.ResourceNotFoundException;
import com.joveo.apiconnector.user.User;
import com.joveo.apiconnector.user.UserPlan;
import java.net.URI;
import java.time.Duration;
import java.time.Instant;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

/**
 * Executes a live, synchronous test call against a user-supplied or saved upstream API, so a
 * connection can be validated before (or independent of) saving it. Not part of the runtime
 * resolve/cache pipeline (see flow/data-flow.md) — purely for validation. Optionally analyzes
 * a successful response with a platform AI provider (Pro plan only; see flow/ai-analysis-flow.md).
 */
@Service
public class ApiTestService {

    private static final int MAX_RESPONSE_CHARS = 20_000;

    private final SsrfGuard ssrfGuard;
    private final AuthConfigHeaderBuilder headerBuilder;
    private final ApiDetailRepository apiDetailRepository;
    private final AiAccessGuard aiAccessGuard;
    private final AiAnalysisClient aiAnalysisClient;
    private final RestTemplate restTemplate;

    public ApiTestService(SsrfGuard ssrfGuard,
                          AuthConfigHeaderBuilder headerBuilder,
                          ApiDetailRepository apiDetailRepository,
                          AiAccessGuard aiAccessGuard,
                          AiAnalysisClient aiAnalysisClient,
                          RestTemplateBuilder restTemplateBuilder) {
        this.ssrfGuard = ssrfGuard;
        this.headerBuilder = headerBuilder;
        this.apiDetailRepository = apiDetailRepository;
        this.aiAccessGuard = aiAccessGuard;
        this.aiAnalysisClient = aiAnalysisClient;
        this.restTemplate = restTemplateBuilder
                .connectTimeout(Duration.ofSeconds(5))
                .readTimeout(Duration.ofSeconds(10))
                .build();
    }

    /** Ad-hoc test of a not-yet-saved (or about-to-change) upstream configuration. */
    public ApiTestResponse test(User user, ApiTestRequest request) {
        if (request.aiProvider() != null) {
            aiAccessGuard.requirePro(user);
        }
        return execute(request.baseUrl(), request.httpMethod(), request.authType(), request.authConfig(),
                request.body(), request.aiProvider());
    }

    /** Tests an already-saved API using its persisted config; credentials never leave the server. */
    public ApiTestResponse testSaved(User user, Long apiDetailId) {
        ApiDetail api = apiDetailRepository.findByIdAndUserId(apiDetailId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("ApiDetail", apiDetailId));
        // A saved AI provider silently doesn't analyze if the account is no longer Pro (e.g.
        // downgraded after attaching one) — the test itself must still succeed either way.
        AiProvider aiProvider = api.getAiProvider() != null && user.getPlan() == UserPlan.PRO
                ? api.getAiProvider()
                : null;
        return execute(api.getBaseUrl(), api.getHttpMethod(), api.getAuthType(), api.getAuthConfig(),
                null, aiProvider);
    }

    private ApiTestResponse execute(String baseUrl, HttpMethod httpMethod, AuthType authType, String authConfig,
                                    String requestBody, AiProvider aiProvider) {
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

        boolean hasBody = httpMethod != HttpMethod.GET && requestBody != null && !requestBody.isBlank();
        if (hasBody && headers.getContentType() == null) {
            headers.setContentType(MediaType.APPLICATION_JSON);
        }
        HttpEntity<String> entity = new HttpEntity<>(hasBody ? requestBody : null, headers);

        Instant start = Instant.now();
        try {
            ResponseEntity<String> response = restTemplate.exchange(
                    uri, org.springframework.http.HttpMethod.valueOf(httpMethod.name()), entity, String.class);
            return success(response.getStatusCode().value(), response.getBody(), start, aiProvider);
        } catch (HttpStatusCodeException e) {
            // Upstream responded with an error status — still a valid, real test result.
            return success(e.getStatusCode().value(), e.getResponseBodyAsString(), start, aiProvider);
        } catch (ResourceAccessException e) {
            return failure("Could not reach the upstream: " + rootMessage(e));
        } catch (RuntimeException e) {
            return failure("Test call failed: " + rootMessage(e));
        }
    }

    private ApiTestResponse success(int status, String body, Instant start, AiProvider aiProvider) {
        long latencyMs = Duration.between(start, Instant.now()).toMillis();
        String capped = cap(body);
        AiInsightsResponse insights = aiProvider != null && capped != null
                ? aiAnalysisClient.analyze(aiProvider, null, capped)
                : null;
        return new ApiTestResponse(true, status, latencyMs, capped, null, insights);
    }

    private ApiTestResponse failure(String message) {
        return new ApiTestResponse(false, null, 0, null, message, null);
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
