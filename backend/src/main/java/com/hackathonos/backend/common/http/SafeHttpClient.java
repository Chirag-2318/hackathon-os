package com.hackathonos.backend.common.http;

import com.hackathonos.backend.common.error.BadRequestException;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.InetAddress;
import java.net.URI;
import java.net.URL;
import java.net.UnknownHostException;
import java.nio.charset.StandardCharsets;

/**
 * SSRF-safe HTTP client that blocks loopback, private, multicast and link-local IP addresses.
 * Provides safe HEAD and GET checks with configurable timeouts and redirect limits.
 */
@Component
public class SafeHttpClient {

    private static final int DEFAULT_TIMEOUT_MS = 5000;
    private static final int MAX_REDIRECTS = 3;
    private static final int MAX_BODY_BYTES = 1024 * 1024; // 1 MB

    private DnsResolver dnsResolver = InetAddress::getAllByName;

    public interface DnsResolver {
        InetAddress[] resolve(String host) throws UnknownHostException;
    }

    public void setDnsResolver(DnsResolver resolver) {
        this.dnsResolver = resolver;
    }

    public record SafeHttpResponse(boolean ok, int httpStatus, String body, long latencyMs) {}

    /**
     * Checks whether an IP address is blocked (private, loopback, link-local, multicast, etc.).
     */
    public static boolean isBlockedAddress(InetAddress address) {
        if (address == null) {
            return true;
        }
        if (address.isLoopbackAddress() || address.isAnyLocalAddress() || address.isLinkLocalAddress()
                || address.isMulticastAddress() || address.isSiteLocalAddress()) {
            return true;
        }
        byte[] bytes = address.getAddress();
        if (bytes.length == 4) {
            int b0 = bytes[0] & 0xFF;
            int b1 = bytes[1] & 0xFF;
            if (b0 == 0) return true; // 0.0.0.0/8
            if (b0 == 10) return true; // 10.0.0.0/8
            if (b0 == 127) return true; // 127.0.0.0/8
            if (b0 == 169 && b1 == 254) return true; // 169.254.0.0/16
            if (b0 == 172 && (b1 >= 16 && b1 <= 31)) return true; // 172.16.0.0/12
            if (b0 == 192 && b1 == 168) return true; // 192.168.0.0/16
            if (b0 == 100 && (b1 >= 64 && b1 <= 127)) return true; // Carrier-grade NAT
            if (b0 >= 224) return true; // Multicast / reserved
        } else if (bytes.length == 16) {
            // IPv6 checks
            if (address.isLoopbackAddress() || address.isLinkLocalAddress() || address.isSiteLocalAddress()) {
                return true;
            }
            int b0 = bytes[0] & 0xFF;
            int b1 = bytes[1] & 0xFF;
            if (b0 == 0xfe && (b1 & 0xc0) == 0xc0) return true; // Unique local fc00::/7
            if (b0 == 0xfc || b0 == 0xfd) return true;
        }
        return false;
    }

    /**
     * Validates that the URL uses http or https scheme and resolves to public addresses only.
     */
    public void validateUrl(String urlString) {
        if (urlString == null || urlString.isBlank()) {
            throw new BadRequestException("INVALID_URL", "URL cannot be blank");
        }
        URI uri;
        try {
            uri = URI.create(urlString.trim());
        } catch (Exception e) {
            throw new BadRequestException("INVALID_URL", "Malformed URL: " + urlString);
        }
        String scheme = uri.getScheme();
        if (scheme == null || (!scheme.equalsIgnoreCase("http") && !scheme.equalsIgnoreCase("https"))) {
            throw new BadRequestException("INVALID_URL_SCHEME", "URL scheme must be http or https");
        }
        String host = uri.getHost();
        if (host == null || host.isBlank()) {
            throw new BadRequestException("INVALID_URL_HOST", "URL host is missing");
        }
        try {
            InetAddress[] addresses = dnsResolver.resolve(host);
            for (InetAddress addr : addresses) {
                if (isBlockedAddress(addr)) {
                    throw new BadRequestException("SSRF_BLOCKED", "Requests to private/local hosts are prohibited");
                }
            }
        } catch (UnknownHostException e) {
            throw new BadRequestException("HOST_NOT_RESOLVED", "Could not resolve host: " + host);
        }
    }

    /**
     * Executes a safe HEAD request, falling back to GET if HEAD returns 405 or fails, with latency measurement.
     */
    public SafeHttpResponse headOrGet(String urlString, int timeoutMs) {
        long start = System.currentTimeMillis();
        try {
            validateUrl(urlString);
            SafeHttpResponse res = executeRequest(urlString, "HEAD", timeoutMs, 0);
            if (res.httpStatus() == 405 || res.httpStatus() == 501) {
                res = executeRequest(urlString, "GET", timeoutMs, 0);
            }
            long elapsed = System.currentTimeMillis() - start;
            return new SafeHttpResponse(res.ok(), res.httpStatus(), res.body(), elapsed);
        } catch (Exception e) {
            long elapsed = System.currentTimeMillis() - start;
            return new SafeHttpResponse(false, 0, null, elapsed);
        }
    }

    /**
     * Executes a safe GET request returning status and string body.
     */
    public SafeHttpResponse get(String urlString, int timeoutMs) {
        long start = System.currentTimeMillis();
        try {
            validateUrl(urlString);
            SafeHttpResponse res = executeRequest(urlString, "GET", timeoutMs, 0);
            long elapsed = System.currentTimeMillis() - start;
            return new SafeHttpResponse(res.ok(), res.httpStatus(), res.body(), elapsed);
        } catch (Exception e) {
            long elapsed = System.currentTimeMillis() - start;
            return new SafeHttpResponse(false, 0, null, elapsed);
        }
    }

    private SafeHttpResponse executeRequest(String urlString, String method, int timeoutMs, int redirectCount) throws Exception {
        if (redirectCount > MAX_REDIRECTS) {
            throw new BadRequestException("TOO_MANY_REDIRECTS", "Exceeded redirect limit");
        }

        validateUrl(urlString);
        URL url = URI.create(urlString).toURL();
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod(method);
        conn.setConnectTimeout(timeoutMs > 0 ? timeoutMs : DEFAULT_TIMEOUT_MS);
        conn.setReadTimeout(timeoutMs > 0 ? timeoutMs : DEFAULT_TIMEOUT_MS);
        conn.setInstanceFollowRedirects(false);
        conn.setRequestProperty("User-Agent", "HackathonOS-SafeFetcher/1.0");

        int code = conn.getResponseCode();

        if (code >= 300 && code < 400) {
            String location = conn.getHeaderField("Location");
            if (location != null && !location.isBlank()) {
                URI next = URI.create(urlString).resolve(location);
                return executeRequest(next.toString(), method, timeoutMs, redirectCount + 1);
            }
        }

        boolean ok = code >= 200 && code < 400;
        String body = null;
        if ("GET".equalsIgnoreCase(method)) {
            try (InputStream in = (code >= 400) ? conn.getErrorStream() : conn.getInputStream()) {
                if (in != null) {
                    ByteArrayOutputStream out = new ByteArrayOutputStream();
                    byte[] buf = new byte[4096];
                    int r;
                    int total = 0;
                    while ((r = in.read(buf)) != -1) {
                        total += r;
                        if (total > MAX_BODY_BYTES) break;
                        out.write(buf, 0, r);
                    }
                    body = out.toString(StandardCharsets.UTF_8);
                }
            } catch (Exception ignored) {}
        }
        return new SafeHttpResponse(ok, code, body, 0);
    }
}
