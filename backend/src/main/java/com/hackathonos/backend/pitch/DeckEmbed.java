package com.hackathonos.backend.pitch;

import com.hackathonos.backend.common.error.BadRequestException;

import java.net.URI;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Validates external presentation hosts and generates secure iframe embed URLs.
 */
public class DeckEmbed {

    private static final Pattern CANVA_DESIGN_PATTERN =
            Pattern.compile("https?://(?:www\\.)?canva\\.com/design/([A-Za-z0-9_-]+)/([A-Za-z0-9_-]+)(?:/[^?\\s]*)?");
    private static final Pattern GSLIDES_PATTERN =
            Pattern.compile("https?://docs\\.google\\.com/presentation/d/([A-Za-z0-9_-]+)");

    /**
     * Validates whether the URL host matches the permitted list for the specified provider.
     */
    public static void validateHost(String provider, String url) {
        if (url == null || url.isBlank()) {
            throw new BadRequestException("INVALID_DECK_LINK: URL is required");
        }
        try {
            URI uri = URI.create(url.trim());
            String host = uri.getHost();
            if (host == null) {
                throw new BadRequestException("INVALID_DECK_LINK: Malformed host");
            }
            host = host.toLowerCase();

            switch (provider.toLowerCase()) {
                case "canva" -> {
                    if (!host.equals("canva.com") && !host.equals("www.canva.com") && !host.equals("canva.link")) {
                        throw new BadRequestException("INVALID_DECK_LINK: Canva host must be canva.com, www.canva.com, or canva.link");
                    }
                }
                case "gslides" -> {
                    if (!host.equals("docs.google.com") || uri.getPath() == null || !uri.getPath().startsWith("/presentation")) {
                        throw new BadRequestException("INVALID_DECK_LINK: Google Slides URL must be docs.google.com/presentation");
                    }
                }
                case "pptx" -> {
                    boolean valid = host.equals("onedrive.live.com") || host.equals("1drv.ms")
                            || host.endsWith(".sharepoint.com") || host.equals("sharepoint.com")
                            || host.endsWith(".office.com") || host.equals("office.com")
                            || host.endsWith(".microsoft.com") || host.equals("microsoft.com");
                    if (!valid) {
                        throw new BadRequestException("INVALID_DECK_LINK: PowerPoint link must be OneDrive, SharePoint, or Microsoft host");
                    }
                }
                default -> throw new BadRequestException("INVALID_DECK_LINK: Unknown provider " + provider);
            }
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("INVALID_DECK_LINK: Invalid URL format");
        }
    }

    /**
     * Builds standard embed URL for Canva view/edit links and Google Slides presentation links.
     */
    public static String buildEmbedUrl(String provider, String url) {
        if (url == null || url.isBlank() || provider == null) return null;
        String clean = url.trim();

        if ("canva".equalsIgnoreCase(provider)) {
            Matcher m = CANVA_DESIGN_PATTERN.matcher(clean);
            if (m.find()) {
                String id = m.group(1);
                String token = m.group(2);
                return "https://www.canva.com/design/" + id + "/" + token + "/view?embed";
            }
            return null;
        }

        if ("gslides".equalsIgnoreCase(provider)) {
            Matcher m = GSLIDES_PATTERN.matcher(clean);
            if (m.find()) {
                String id = m.group(1);
                return "https://docs.google.com/presentation/d/" + id + "/embed?start=false&loop=false";
            }
            return null;
        }

        return null;
    }
}
