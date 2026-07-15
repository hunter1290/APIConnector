package com.joveo.apiconnector.api;

import java.net.InetAddress;
import java.net.URI;
import java.net.UnknownHostException;
import org.springframework.stereotype.Component;

/**
 * Blocks live test calls to loopback/link-local/private-network addresses, so a user can't
 * use "test this upstream" to probe APIConnector's own internal network. Off by a single
 * property for local/dev setups that legitimately need to reach a private upstream.
 */
@Component
public class SsrfGuard {

    private final boolean allowPrivateNetworkHosts;

    public SsrfGuard(ConnectorTestProperties properties) {
        this.allowPrivateNetworkHosts = properties.allowPrivateNetworkHosts();
    }

    /** @throws IllegalArgumentException if the URI's host is missing, unresolvable, or private/internal. */
    public void check(URI uri) {
        if (allowPrivateNetworkHosts) {
            return;
        }
        String host = uri.getHost();
        if (host == null || host.isBlank()) {
            throw new IllegalArgumentException("URL has no host");
        }
        InetAddress[] addresses;
        try {
            addresses = InetAddress.getAllByName(host);
        } catch (UnknownHostException e) {
            throw new IllegalArgumentException("Could not resolve host: " + host);
        }
        for (InetAddress address : addresses) {
            if (address.isLoopbackAddress() || address.isLinkLocalAddress() || address.isSiteLocalAddress()
                    || address.isMulticastAddress() || address.isAnyLocalAddress()) {
                throw new IllegalArgumentException(
                        "Refusing to call a private/internal network address: " + host);
            }
        }
    }
}
