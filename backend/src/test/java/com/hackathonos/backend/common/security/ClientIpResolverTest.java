package com.hackathonos.backend.common.security;

import com.hackathonos.backend.common.config.AppProperties;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;

import static org.assertj.core.api.Assertions.assertThat;

class ClientIpResolverTest {

    @Test
    @DisplayName("Behind Vercel without proxy secret: takes visitor IP from x-vercel-forwarded-for")
    void testRealisticVercelHeadersWithoutProxySecretTakesVercelForwardedFor() {
        AppProperties props = new AppProperties();
        props.setProxySharedSecret(""); // Unset

        ClientIpResolver resolver = new ClientIpResolver(props);
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("x-vercel-forwarded-for", "203.0.113.195");
        request.addHeader("X-Forwarded-For", "203.0.113.195, 76.76.21.21");
        request.setRemoteAddr("76.76.21.21");

        String resolved = resolver.resolveClientIp(request);
        assertThat(resolved).isEqualTo("203.0.113.195");
    }

    @Test
    @DisplayName("Behind Vercel when only X-Forwarded-For is present: takes leftmost client IP, never proxy egress IP")
    void testRealisticVercelHeadersWhenXffOnlyTakesLeftmostClientIp() {
        AppProperties props = new AppProperties();
        props.setProxySharedSecret("");

        ClientIpResolver resolver = new ClientIpResolver(props);
        MockHttpServletRequest request = new MockHttpServletRequest();
        // Client IP is 198.51.100.42, Vercel proxy egress IP is 76.76.21.21
        request.addHeader("X-Forwarded-For", "198.51.100.42, 76.76.21.21");
        request.setRemoteAddr("76.76.21.21");

        String resolved = resolver.resolveClientIp(request);
        // Confirms it extracts client IP, proving the previous rightmost-hop implementation was wrong
        assertThat(resolved).isEqualTo("198.51.100.42");
    }

    @Test
    @DisplayName("Rejects forged non-IP literal strings in headers")
    void testNonIpLiteralHeadersRejected() {
        AppProperties props = new AppProperties();
        props.setProxySharedSecret("");

        ClientIpResolver resolver = new ClientIpResolver(props);
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("x-vercel-forwarded-for", "malicious-host.example.com");
        request.addHeader("X-Forwarded-For", "evil.com, <script>alert(1)</script>");
        request.setRemoteAddr("192.0.2.1");

        String resolved = resolver.resolveClientIp(request);
        assertThat(resolved).isEqualTo("192.0.2.1");
    }

    @Test
    @DisplayName("Supports IPv6 literals")
    void testIPv6LiteralSupported() {
        AppProperties props = new AppProperties();
        props.setProxySharedSecret("");

        ClientIpResolver resolver = new ClientIpResolver(props);
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("x-vercel-forwarded-for", "2001:db8:85a3::8a2e:370:7334");
        request.setRemoteAddr("10.0.0.1");

        String resolved = resolver.resolveClientIp(request);
        assertThat(resolved).isEqualTo("2001:db8:85a3::8a2e:370:7334");
    }

    @Test
    @DisplayName("Proxy secret required when configured before trusting forwarded headers")
    void testProxySharedSecretEnforcedForCustomHeader() {
        AppProperties props = new AppProperties();
        props.setProxySharedSecret("super-secret-token");

        ClientIpResolver resolver = new ClientIpResolver(props);

        // Case 1: Attacker sends forged x-vercel-forwarded-for without valid secret
        MockHttpServletRequest untrustedRequest = new MockHttpServletRequest();
        untrustedRequest.addHeader("x-vercel-forwarded-for", "1.2.3.4");
        untrustedRequest.addHeader("X-Forwarded-For", "203.0.113.50");
        untrustedRequest.setRemoteAddr("10.0.0.1");

        String resolvedNoSecret = resolver.resolveClientIp(untrustedRequest);
        // Forwarded headers ignored; falls back to socket remoteAddr
        assertThat(resolvedNoSecret).isEqualTo("10.0.0.1");

        // Case 2: Legitimate request from proxy with valid secret
        MockHttpServletRequest trustedRequest = new MockHttpServletRequest();
        trustedRequest.addHeader("x-vercel-forwarded-for", "203.0.113.88");
        trustedRequest.addHeader("x-proxy-secret", "super-secret-token");

        String resolvedWithSecret = resolver.resolveClientIp(trustedRequest);
        assertThat(resolvedWithSecret).isEqualTo("203.0.113.88");
    }

    @Test
    @DisplayName("Fallback to remoteAddr when headers absent")
    void testFallbackToRemoteAddrWhenHeadersAbsent() {
        AppProperties props = new AppProperties();
        ClientIpResolver resolver = new ClientIpResolver(props);

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("192.0.2.1");

        assertThat(resolver.resolveClientIp(request)).isEqualTo("192.0.2.1");
    }
}
