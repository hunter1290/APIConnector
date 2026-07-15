package com.joveo.apiconnector.ai;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Binds {@code app.ai.analysis.*} from application.properties.
 *
 * @param baseUrl      Base URL of the AI_analysis Node microservice.
 * @param sharedSecret Sent as {@code X-Internal-Secret}; must match AI_analysis's
 *                     {@code INTERNAL_SHARED_SECRET} env var.
 */
@ConfigurationProperties(prefix = "app.ai.analysis")
public record AiAnalysisProperties(String baseUrl, String sharedSecret) {
}
