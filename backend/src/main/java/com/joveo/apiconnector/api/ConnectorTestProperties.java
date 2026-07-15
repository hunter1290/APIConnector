package com.joveo.apiconnector.api;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Binds {@code app.connector.*} from application.properties.
 *
 * @param allowPrivateNetworkHosts When false (default), {@link SsrfGuard} refuses to test
 *                                 upstreams that resolve to loopback/link-local/private
 *                                 addresses. Enable only in trusted local/dev setups.
 */
@ConfigurationProperties(prefix = "app.connector")
public record ConnectorTestProperties(boolean allowPrivateNetworkHosts) {
}
