package com.hackathonos.backend.brief;

import com.hackathonos.backend.common.error.BadRequestException;
import org.junit.jupiter.api.Test;

import java.net.InetAddress;
import java.net.UnknownHostException;

import static org.junit.jupiter.api.Assertions.*;

class SsrfGuardTest {

    private final SsrfGuard guard = new SsrfGuard(new BriefPdfParser());

    @Test
    void testBlockedAddresses() throws UnknownHostException {
        // Loopback IPv4
        assertTrue(SsrfGuard.isBlockedAddress(InetAddress.getByName("127.0.0.1")));
        assertTrue(SsrfGuard.isBlockedAddress(InetAddress.getByName("127.0.1.1")));

        // Private 10.0.0.0/8
        assertTrue(SsrfGuard.isBlockedAddress(InetAddress.getByName("10.0.0.1")));
        assertTrue(SsrfGuard.isBlockedAddress(InetAddress.getByName("10.255.255.254")));

        // Private 172.16.0.0/12
        assertTrue(SsrfGuard.isBlockedAddress(InetAddress.getByName("172.16.0.1")));
        assertTrue(SsrfGuard.isBlockedAddress(InetAddress.getByName("172.31.255.255")));

        // Private 192.168.0.0/16
        assertTrue(SsrfGuard.isBlockedAddress(InetAddress.getByName("192.168.1.1")));

        // Link-local / AWS metadata 169.254.169.254
        assertTrue(SsrfGuard.isBlockedAddress(InetAddress.getByName("169.254.169.254")));

        // IPv6 Loopback
        assertTrue(SsrfGuard.isBlockedAddress(InetAddress.getByName("::1")));

        // Public IPs allowed
        assertFalse(SsrfGuard.isBlockedAddress(InetAddress.getByName("8.8.8.8")));
        assertFalse(SsrfGuard.isBlockedAddress(InetAddress.getByName("1.1.1.1")));
    }

    @Test
    void testRejectsNonHttpScheme() {
        assertThrows(BadRequestException.class, () -> guard.fetchReadableText("ftp://example.com/file"));
        assertThrows(BadRequestException.class, () -> guard.fetchReadableText("file:///etc/passwd"));
        assertThrows(BadRequestException.class, () -> guard.fetchReadableText("javascript:alert(1)"));
    }

    @Test
    void testBlocksPrivateIpHostResolution() {
        guard.setDnsResolver(host -> new InetAddress[]{InetAddress.getByName("127.0.0.1")});

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                guard.fetchReadableText("http://internal-service.local/brief"));
        assertEquals("FETCH_BLOCKED", ex.getCode());
    }

    @Test
    void testBlocksLinkLocalMetadataHostResolution() {
        guard.setDnsResolver(host -> new InetAddress[]{InetAddress.getByName("169.254.169.254")});

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                guard.fetchReadableText("http://instance-data/latest/meta-data/"));
        assertEquals("FETCH_BLOCKED", ex.getCode());
    }
}
