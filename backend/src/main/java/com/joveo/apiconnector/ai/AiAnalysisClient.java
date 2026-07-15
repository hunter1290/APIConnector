package com.joveo.apiconnector.ai;

import com.joveo.apiconnector.ai.dto.AiInsightsResponse;
import java.time.Duration;
import java.util.HashMap;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

/**
 * Calls the stateless AI_analysis microservice to analyze a data payload. APIConnector
 * supplies the provider credentials — they live in AI_analysis's own environment, never in
 * this backend or its database, so no key is sent here. Never throws — a missing/unreachable
 * AI service degrades to "no insights" rather than failing the caller.
 */
@Component
public class AiAnalysisClient {

    private static final Logger log = LoggerFactory.getLogger(AiAnalysisClient.class);

    private final AiAnalysisProperties properties;
    private final RestTemplate restTemplate;

    public AiAnalysisClient(AiAnalysisProperties properties, RestTemplateBuilder restTemplateBuilder) {
        this.properties = properties;
        this.restTemplate = restTemplateBuilder
                .connectTimeout(Duration.ofSeconds(5))
                .readTimeout(Duration.ofSeconds(25))
                .build();
    }

    /** Returns the parsed insights, or {@code null} if analysis is unavailable. */
    public AiInsightsResponse analyze(AiProvider provider, String model, Object data) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("X-Internal-Secret", properties.sharedSecret());
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> body = new HashMap<>();
        body.put("provider", provider.name());
        body.put("model", model != null ? model : "");
        body.put("data", data);

        try {
            ResponseEntity<AnalyzeResponse> response = restTemplate.exchange(
                    properties.baseUrl() + "/analyze",
                    HttpMethod.POST,
                    new HttpEntity<>(body, headers),
                    AnalyzeResponse.class);
            AnalyzeResponse parsed = response.getBody();
            return parsed != null ? parsed.insights() : null;
        } catch (HttpStatusCodeException e) {
            log.warn("AI_analysis returned {}: {}", e.getStatusCode(), e.getResponseBodyAsString());
            return null;
        } catch (ResourceAccessException e) {
            log.warn("AI_analysis unreachable: {}", e.getMessage());
            return null;
        }
    }

    private record AnalyzeResponse(AiInsightsResponse insights) {
    }
}
