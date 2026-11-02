package com.hackathonos.backend.common.security;

import com.hackathonos.backend.common.config.AppProperties;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;

import static org.assertj.core.api.Assertions.assertThat;

class ClientIpResolverTest {

    @Test
    void testXForwardedForExtractsRightmostHop() {
        AppProperties props = new AppProperties();
        props.setClientIpHeader("x-vercel-forwarded-for");
        props.setProxySharedSecret(""); // No proxy secret required

        ClientIpResolver resolver = new ClientIpResolver(props);
        MockHttpServletRequest request = new MockHttpServletRequest();
        // Attacker prepends forged IP 1.2.3.4, proxy appends 198.51.100.2
        request.addHeader("X-Forwarded-For", "1.2.3.4, 198.51.100.2");

        String resolved = resolver.resolveClientIp(request);
        assertThat(resolved).isEqualTo("198.51.100.2");
    }

    @Test
    void testProxySharedSecretEnforcedForCustomHeader() {
        AppProperties props = new AppProperties();
        props.setClientIpHeader("x-vercel-forwarded-for");
        props.setProxySharedSecret("super-secret-token");

        ClientIpResolver resolver = new ClientIpResolver(props);

        // Case 1: Attacker sends forged x-vercel-forwarded-for without valid secret
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("x-vercel-forwarded-for", "1.2.3.4");
        request.addHeader("X-Forwarded-For", "203.0.113.50");
        request.setRemoteAddr("10.0.0.1");

        String resolvedNoSecret = resolver.resolveClientIp(request);
        // Custom header ignored; falls back to rightmost XFF
        assertThat(resolvedNoSecret).isEqualTo("203.0.113.50");

        // Case 2: Legitimate request from proxy with valid secret
        MockHttpServletRequest trustedRequest = new MockHttpServletRequest();
        trustedRequest.addHeader("x-vercel-forwarded-for", "203.0.113.88");
        trustedRequest.addHeader("x-proxy-secret", "super-secret-token");

        String resolvedWithSecret = resolver.resolveClientIp(trustedRequest);
        assertThat(resolvedWithSecret).isEqualTo("203.0.113.88");
    }

    @Test
    void testFallbackToRemoteAddrWhenHeadersAbsent() {
        AppProperties props = new AppProperties();
        ClientIpResolver resolver = new ClientIpResolver(props);

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("192.0.2.1");

        assertThat(resolver.resolveClientIp(request)).isEqualTo("192.0.2.1");
    }
}
