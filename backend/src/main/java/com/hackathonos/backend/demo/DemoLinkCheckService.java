package com.hackathonos.backend.demo;

import com.hackathonos.backend.brief.SsrfGuard;
import com.hackathonos.backend.common.error.BadRequestException;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.InetAddress;
import java.net.URI;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.Locale;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class DemoLinkCheckService {

    private static final Logger log = LoggerFactory.getLogger(DemoLinkCheckService.class);
    private static final int TIMEOUT_MS = 5000;
    private static final int MAX_READ_BYTES = 100 * 1024; // 100 KB
    private static final int MAX_REDIRECTS = 3;

    // Rate limiting manual checks: assetId -> timestamp
    private final ConcurrentHashMap<String, Long> lastManualCheckTimes = new ConcurrentHashMap<>();

    public record LinkCheckResult(
            String status, // REACHABLE, NEEDS_LOGIN, NOT_FOUND, UNREACHABLE
            String title,
            String provider
    ) {}

    public String detectProvider(String rawUrl) {
        if (rawUrl == null || rawUrl.isBlank()) return "Other";
        String lower = rawUrl.toLowerCase(Locale.ROOT);
        try {
            URI uri = URI.create(rawUrl.trim());
            String host = uri.getHost();
            if (host != null) {
                host = host.toLowerCase(Locale.ROOT);
                if (host.contains("youtube.com") || host.contains("youtu.be")) return "YouTube";
                if (host.contains("vimeo.com")) return "Vimeo";
                if (host.contains("loom.com")) return "Loom";
                if (host.contains("drive.google.com") || host.contains("docs.google.com")) return "Google Drive";
                if (host.contains("dropbox.com")) return "Dropbox";
                if (host.contains("canva.com")) return "Canva";
                if (host.contains("github.com")) return "GitHub";
                if (host.endsWith("vercel.app") || host.contains("vercel.app")) return "Vercel";
                if (host.endsWith("netlify.app") || host.contains("netlify.app")) return "Netlify";
            }
        } catch (Exception ignored) {}

        if (lower.contains("youtube.com") || lower.contains("youtu.be")) return "YouTube";
        if (lower.contains("vimeo.com")) return "Vimeo";
        if (lower.contains("loom.com")) return "Loom";
        if (lower.contains("drive.google.com") || lower.contains("docs.google.com")) return "Google Drive";
        if (lower.contains("dropbox.com")) return "Dropbox";
        if (lower.contains("canva.com")) return "Canva";
        if (lower.contains("github.com")) return "GitHub";
        if (lower.contains("vercel.app")) return "Vercel";
        if (lower.contains("netlify.app")) return "Netlify";
        return "Other";
    }

    public void checkRateLimit(String assetId) {
        if (assetId == null) return;
        long now = System.currentTimeMillis();
        Long last = lastManualCheckTimes.get(assetId);
        if (last != null && (now - last) < 5000) { // 5-second cooldown
            throw new BadRequestException("RATE_LIMITED", "Please wait a few seconds before re-checking this link.");
        }
        lastManualCheckTimes.put(assetId, now);
    }

    public LinkCheckResult checkLink(String rawUrl, boolean isLiveLink) {
        String provider = detectProvider(rawUrl);
        if (rawUrl == null || rawUrl.isBlank()) {
            return new LinkCheckResult("NOT_ADDED", null, provider);
        }

        String currentUrl = rawUrl.trim();
        validateScheme(currentUrl);

        URI uri;
        try {
            uri = URI.create(currentUrl);
        } catch (Exception e) {
            return new LinkCheckResult("UNREACHABLE", null, provider);
        }

        String host = uri.getHost();
        if (host == null || host.isBlank()) {
            return new LinkCheckResult("UNREACHABLE", null, provider);
        }

        // Validate SSRF and private ranges
        boolean isLocalOrPrivate = isLocalhostOrPrivate(host);
        if (isLocalOrPrivate) {
            if (isLiveLink) {
                throw new BadRequestException("LOCALHOST_LINK", "A localhost link will not work on stage.");
            } else {
                throw new BadRequestException("FETCH_BLOCKED", "Host resolves to blocked address: " + host);
            }
        }

        int redirectCount = 0;
        String pageTitle = null;

        while (true) {
            validateScheme(currentUrl);
            try {
                uri = URI.create(currentUrl);
                host = uri.getHost();
                if (host == null || isLocalhostOrPrivate(host)) {
                    if (isLiveLink && isLocalhostOrPrivate(host)) {
                        throw new BadRequestException("LOCALHOST_LINK", "A localhost link will not work on stage.");
                    }
                    return new LinkCheckResult("UNREACHABLE", null, provider);
                }

                URL target = uri.toURL();
                HttpURLConnection conn = (HttpURLConnection) target.openConnection();
                conn.setConnectTimeout(TIMEOUT_MS);
                conn.setReadTimeout(TIMEOUT_MS);
                conn.setInstanceFollowRedirects(false);
                conn.setRequestProperty("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) HackathonOS/1.0");
                conn.setRequestProperty("Accept", "text/html,application/xhtml+xml,text/plain,*/*");

                int statusCode = conn.getResponseCode();

                // Redirects
                if (statusCode == HttpURLConnection.HTTP_MOVED_PERM
                        || statusCode == HttpURLConnection.HTTP_MOVED_TEMP
                        || statusCode == HttpURLConnection.HTTP_SEE_OTHER
                        || statusCode == 307
                        || statusCode == 308) {
                    redirectCount++;
                    if (redirectCount > MAX_REDIRECTS) {
                        return new LinkCheckResult("UNREACHABLE", null, provider);
                    }
                    String location = conn.getHeaderField("Location");
                    if (location == null || location.isBlank()) {
                        return new LinkCheckResult("UNREACHABLE", null, provider);
                    }
                    String locLower = location.toLowerCase(Locale.ROOT);
                    if (locLower.contains("accounts.google.com") || locLower.contains("/login") || locLower.contains("/signin") || locLower.contains("login.") || locLower.contains("signin.")) {
                        conn.disconnect();
                        return new LinkCheckResult("NEEDS_LOGIN", null, provider);
                    }
                    currentUrl = uri.resolve(location).toString();
                    conn.disconnect();
                    continue;
                }

                if (statusCode == 401 || statusCode == 403) {
                    conn.disconnect();
                    return new LinkCheckResult("NEEDS_LOGIN", null, provider);
                }

                if (statusCode == 404) {
                    conn.disconnect();
                    return new LinkCheckResult("NOT_FOUND", null, provider);
                }

                if (statusCode < 200 || statusCode >= 300) {
                    conn.disconnect();
                    return new LinkCheckResult("UNREACHABLE", null, provider);
                }

                // 2xx Reachable
                InputStream in = conn.getInputStream();
                byte[] body = readBodyLimited(in, MAX_READ_BYTES);
                conn.disconnect();

                if (body.length > 0) {
                    try {
                        Document doc = Jsoup.parse(new ByteArrayInputStream(body), StandardCharsets.UTF_8.name(), currentUrl);
                        String t = doc.title();
                        if (t != null && !t.isBlank()) {
                            pageTitle = t.trim();
                        } else {
                            Element ogTitle = doc.selectFirst("meta[property=og:title], meta[name=og:title]");
                            if (ogTitle != null && ogTitle.hasAttr("content") && !ogTitle.attr("content").isBlank()) {
                                pageTitle = ogTitle.attr("content").trim();
                            }
                        }
                    } catch (Exception ignored) {}
                }

                return new LinkCheckResult("REACHABLE", pageTitle, provider);

            } catch (BadRequestException e) {
                throw e;
            } catch (Exception e) {
                log.warn("Link check error for {}: {}", currentUrl, e.getMessage());
                return new LinkCheckResult("UNREACHABLE", null, provider);
            }
        }
    }

    private boolean isLocalhostOrPrivate(String host) {
        String h = host.toLowerCase(Locale.ROOT).trim();
        if (h.equals("localhost") || h.equals("127.0.0.1") || h.equals("::1") || h.endsWith(".local") || h.endsWith(".internal")) {
            return true;
        }
        try {
            InetAddress[] addrs = InetAddress.getAllByName(host);
            if (addrs == null || addrs.length == 0) return true;
            for (InetAddress a : addrs) {
                if (SsrfGuard.isBlockedAddress(a)) {
                    return true;
                }
            }
        } catch (Exception e) {
            return true;
        }
        return false;
    }

    private void validateScheme(String url) {
        if (!url.startsWith("http://") && !url.startsWith("https://")) {
            throw new BadRequestException("FETCH_BLOCKED", "Only http and https protocols are allowed");
        }
    }

    private byte[] readBodyLimited(InputStream in, int limitBytes) throws Exception {
        ByteArrayOutputStream buffer = new ByteArrayOutputStream();
        byte[] chunk = new byte[4096];
        int totalRead = 0;
        int n;
        while ((n = in.read(chunk)) != -1) {
            totalRead += n;
            if (totalRead > limitBytes) {
                int allowed = limitBytes - buffer.size();
                if (allowed > 0) {
                    buffer.write(chunk, 0, allowed);
                }
                break;
            }
            buffer.write(chunk, 0, n);
        }
        return buffer.toByteArray();
    }
}
