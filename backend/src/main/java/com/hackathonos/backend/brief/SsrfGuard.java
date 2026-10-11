package com.hackathonos.backend.brief;

import com.hackathonos.backend.common.error.BadGatewayException;
import com.hackathonos.backend.common.error.BadRequestException;
import com.hackathonos.backend.common.error.UnprocessableEntityException;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
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
 * SSRF-protected safe HTTP fetcher with loopback, private and link-local IP blocking.
 */
@Component
public class SsrfGuard {

    private static final int TIMEOUT_MS = 8000;
    private static final int MAX_BODY_BYTES = 2 * 1024 * 1024; // 2 MB
    private static final int MAX_REDIRECTS = 3;

    private final BriefPdfParser pdfParser;
    private DnsResolver dnsResolver;

    public interface DnsResolver {
        InetAddress[] resolve(String host) throws UnknownHostException;
    }

    public SsrfGuard(BriefPdfParser pdfParser) {
        this.pdfParser = pdfParser;
        this.dnsResolver = InetAddress::getAllByName;
    }

    public void setDnsResolver(DnsResolver resolver) {
        this.dnsResolver = resolver;
    }

    /**
     * Checks whether an IP address is private, loopback, link-local, multicast, or unspecified.
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
            if (b0 == 0 || b0 == 127 || b0 == 10) {
                return true;
            }
            if (b0 == 172 && (b1 >= 16 && b1 <= 31)) {
                return true;
            }
            if (b0 == 192 && b1 == 168) {
                return true;
            }
            if (b0 == 169 && b1 == 254) {
                return true;
            }
        } else if (bytes.length == 16) {
            // ::1
            boolean isV6Loopback = true;
            for (int i = 0; i < 15; i++) {
                if (bytes[i] != 0) {
                    isV6Loopback = false;
                    break;
                }
            }
            if (isV6Loopback && bytes[15] == 1) {
                return true;
            }
            // fc00::/7
            int b0 = bytes[0] & 0xFF;
            if ((b0 & 0xFE) == 0xFC) {
                return true;
            }
        }
        return false;
    }

    /**
     * Fetches public web page or PDF and returns extracted plain text.
     */
    public String fetchReadableText(String rawUrl) {
        String currentUrl = rawUrl != null ? rawUrl.trim() : "";
        int redirectCount = 0;

        while (true) {
            validateScheme(currentUrl);
            URI uri;
            try {
                uri = URI.create(currentUrl);
            } catch (Exception e) {
                throw new BadRequestException("FETCH_BLOCKED", "Invalid URL: " + currentUrl);
            }

            String host = uri.getHost();
            if (host == null || host.isBlank()) {
                throw new BadRequestException("FETCH_BLOCKED", "URL must specify a host");
            }

            validateHost(host);

            try {
                URL target = uri.toURL();
                HttpURLConnection conn = (HttpURLConnection) target.openConnection();
                conn.setConnectTimeout(TIMEOUT_MS);
                conn.setReadTimeout(TIMEOUT_MS);
                conn.setInstanceFollowRedirects(false);
                conn.setRequestProperty("User-Agent", "HackathonOS-Bot/1.0");
                conn.setRequestProperty("Accept", "text/html, text/plain, application/pdf");

                int statusCode = conn.getResponseCode();

                // Redirect handling (up to 3 redirects)
                if (statusCode == HttpURLConnection.HTTP_MOVED_PERM
                        || statusCode == HttpURLConnection.HTTP_MOVED_TEMP
                        || statusCode == HttpURLConnection.HTTP_SEE_OTHER
                        || statusCode == 307
                        || statusCode == 308) {
                    redirectCount++;
                    if (redirectCount > MAX_REDIRECTS) {
                        throw new BadRequestException("FETCH_BLOCKED", "Too many redirects");
                    }
                    String location = conn.getHeaderField("Location");
                    if (location == null || location.isBlank()) {
                        throw new BadGatewayException("FETCH_FAILED", "Redirect missing Location header");
                    }
                    currentUrl = uri.resolve(location).toString();
                    conn.disconnect();
                    continue;
                }

                if (statusCode < 200 || statusCode >= 300) {
                    throw new BadGatewayException("FETCH_FAILED", "Fetch failed with HTTP " + statusCode);
                }

                String contentType = conn.getContentType();
                byte[] bodyBytes = readBodyLimited(conn.getInputStream(), MAX_BODY_BYTES);
                conn.disconnect();

                if (bodyBytes.length == 0) {
                    throw new UnprocessableEntityException("EMPTY_PAGE", "Page returned empty response");
                }

                // If PDF content-type or starts with %PDF
                if ((contentType != null && contentType.toLowerCase().contains("application/pdf"))
                        || (bodyBytes.length >= 4 && bodyBytes[0] == '%' && bodyBytes[1] == 'P' && bodyBytes[2] == 'D' && bodyBytes[3] == 'F')) {
                    return pdfParser.extractText(bodyBytes);
                }

                if (contentType != null && contentType.toLowerCase().contains("text/plain")) {
                    String plainText = new String(bodyBytes, StandardCharsets.UTF_8).trim();
                    if (plainText.isEmpty()) {
                        throw new UnprocessableEntityException("EMPTY_PAGE", "Plain text page is empty");
                    }
                    return plainText;
                }

                // Default HTML parsing with Jsoup
                return extractTextFromHtml(bodyBytes, currentUrl);

            } catch (BadRequestException | BadGatewayException | UnprocessableEntityException e) {
                throw e;
            } catch (Exception e) {
                throw new BadGatewayException("FETCH_FAILED", "Network error: " + e.getMessage());
            }
        }
    }

    private void validateScheme(String url) {
        if (!url.startsWith("http://") && !url.startsWith("https://")) {
            throw new BadRequestException("FETCH_BLOCKED", "Only http and https protocols are allowed");
        }
    }

    private void validateHost(String host) {
        try {
            InetAddress[] addresses = dnsResolver.resolve(host);
            if (addresses == null || addresses.length == 0) {
                throw new BadRequestException("FETCH_BLOCKED", "Could not resolve host: " + host);
            }
            for (InetAddress address : addresses) {
                if (isBlockedAddress(address)) {
                    throw new BadRequestException("FETCH_BLOCKED", "Host resolves to blocked address: " + address.getHostAddress());
                }
            }
        } catch (UnknownHostException e) {
            throw new BadRequestException("FETCH_BLOCKED", "Unknown host: " + host);
        }
    }

    private byte[] readBodyLimited(InputStream in, int limitBytes) throws Exception {
        ByteArrayOutputStream buffer = new ByteArrayOutputStream();
        byte[] chunk = new byte[8192];
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

    private String extractTextFromHtml(byte[] bytes, String baseUri) {
        String html = new String(bytes, StandardCharsets.UTF_8);
        Document doc = Jsoup.parse(html, baseUri);
        doc.select("script, style, nav, footer, noscript, svg, header, form, iframe").remove();

        StringBuilder sb = new StringBuilder();
        Elements elements = doc.select("h1, h2, h3, h4, h5, h6, p, li");
        for (Element el : elements) {
            String text = el.text().trim();
            if (!text.isEmpty()) {
                sb.append(text).append("\n\n");
            }
        }

        String result = sb.toString().trim();
        if (result.isEmpty()) {
            result = doc.body() != null ? doc.body().text().trim() : "";
        }

        if (result.isEmpty()) {
            throw new UnprocessableEntityException("EMPTY_PAGE", "Page contains no readable text");
        }
        return result;
    }
}
