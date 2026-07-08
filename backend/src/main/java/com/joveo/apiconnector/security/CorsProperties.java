package com.joveo.apiconnector.security;

import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Binds {@code app.security.cors.*} from application.properties.
 *
 * @param allowedOrigins Frontend origins permitted to call the API.
 */
@ConfigurationProperties(prefix = "app.security.cors")
public record CorsProperties(List<String> allowedOrigins) {
}
