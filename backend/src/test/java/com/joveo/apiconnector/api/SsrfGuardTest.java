package com.joveo.apiconnector.api;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.net.URI;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

/** Pure unit tests for {@link SsrfGuard} — literal IPs need no DNS/network access. */
class SsrfGuardTest {

    @ParameterizedTest
    @ValueSource(strings = {
            "http://127.0.0.1/",       // loopback
            "http://169.254.1.1/",     // link-local
            "http://10.0.0.1/",        // private (site-local)
            "http://192.168.1.1/",     // private (site-local)
            "http://0.0.0.0/",         // any-local
    })
    @DisplayName("check rejects loopback/link-local/private/any-local hosts by default")
    void rejectsPrivateNetworkHosts(String url) {
        SsrfGuard guard = new SsrfGuard(new ConnectorTestProperties(false));

        assertThatThrownBy(() -> guard.check(URI.create(url)))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("check allows a public IP host")
    void allowsPublicHost() {
        SsrfGuard guard = new SsrfGuard(new ConnectorTestProperties(false));

        assertThatCode(() -> guard.check(URI.create("http://8.8.8.8/"))).doesNotThrowAnyException();
    }

    @Test
    @DisplayName("check is a no-op when private network hosts are explicitly allowed")
    void allowsPrivateHostsWhenConfigured() {
        SsrfGuard guard = new SsrfGuard(new ConnectorTestProperties(true));

        assertThatCode(() -> guard.check(URI.create("http://127.0.0.1/"))).doesNotThrowAnyException();
    }

    @Test
    @DisplayName("check rejects a URI with no host")
    void rejectsMissingHost() {
        SsrfGuard guard = new SsrfGuard(new ConnectorTestProperties(false));

        assertThatThrownBy(() -> guard.check(URI.create("mailto:foo@example.com")))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
