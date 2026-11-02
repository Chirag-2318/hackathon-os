package com.hackathonos.backend.common.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "app")
public class AppProperties {
    private String frontendUrl = "http://localhost:5173";
    private String publicUrl = "http://localhost:5173";
    private String baseUrl = "http://localhost:8080";
    private String uploadDir = "./uploads";
    private String encryptionKey = "";

    private String apiPublicUrl = "http://localhost:8080";
    private String cookieDomain = "";
    private String supportEmail = "";
    private String clientIpHeader = "x-vercel-forwarded-for";

    private CookieProperties cookie = new CookieProperties();

    private StorageProperties storage = new StorageProperties();
    private EventsProperties events = new EventsProperties();

    public EventsProperties getEvents() { return events; }
    public void setEvents(EventsProperties events) { this.events = events; }

    public static class EventsProperties {
        private int maxStreamsPerUser = 6;
        private String bus = "local";

        public int getMaxStreamsPerUser() { return maxStreamsPerUser; }
        public void setMaxStreamsPerUser(int maxStreamsPerUser) { this.maxStreamsPerUser = maxStreamsPerUser; }

        public String getBus() { return bus; }
        public void setBus(String bus) { this.bus = bus; }
    }

    public StorageProperties getStorage() { return storage; }
    public void setStorage(StorageProperties storage) { this.storage = storage; }

    public static class StorageProperties {
        private String provider = "local";
        private S3Properties s3 = new S3Properties();

        public String getProvider() { return provider; }
        public void setProvider(String provider) { this.provider = provider; }

        public S3Properties getS3() { return s3; }
        public void setS3(S3Properties s3) { this.s3 = s3; }

        public static class S3Properties {
            private String endpoint = "";
            private String region = "us-east-1";
            private String bucket = "";
            private String accessKey = "";
            private String secretKey = "";
            private boolean pathStyle = false;

            public String getEndpoint() { return endpoint; }
            public void setEndpoint(String endpoint) { this.endpoint = endpoint; }

            public String getRegion() { return region; }
            public void setRegion(String region) { this.region = region; }

            public String getBucket() { return bucket; }
            public void setBucket(String bucket) { this.bucket = bucket; }

            public String getAccessKey() { return accessKey; }
            public void setAccessKey(String accessKey) { this.accessKey = accessKey; }

            public String getSecretKey() { return secretKey; }
            public void setSecretKey(String secretKey) { this.secretKey = secretKey; }

            public boolean isPathStyle() { return pathStyle; }
            public void setPathStyle(boolean pathStyle) { this.pathStyle = pathStyle; }
        }
    }


    public CookieProperties getCookie() { return cookie; }
    public void setCookie(CookieProperties cookie) { this.cookie = cookie; }

    public static class CookieProperties {
        private boolean secure = false;
        private String sameSite = "Lax";

        public boolean isSecure() { return secure; }
        public void setSecure(boolean secure) { this.secure = secure; }
        public String getSameSite() { return sameSite; }
        public void setSameSite(String sameSite) { this.sameSite = sameSite; }
    }

    public String getFrontendUrl() { return getPublicUrl(); }
    public void setFrontendUrl(String frontendUrl) {
        this.frontendUrl = (frontendUrl != null) ? frontendUrl.replaceAll("/+$", "") : "";
        if (this.publicUrl == null || this.publicUrl.isBlank()) {
            this.publicUrl = this.frontendUrl;
        }
    }

    public String getPublicUrl() {
        String url = (publicUrl != null && !publicUrl.isBlank()) ? publicUrl : frontendUrl;
        if (url != null && !url.isBlank()) {
            return url.replaceAll("/+$", "");
        }
        return "http://localhost:5173";
    }
    public void setPublicUrl(String publicUrl) {
        this.publicUrl = (publicUrl != null) ? publicUrl.replaceAll("/+$", "") : "";
    }

    public String getApiPublicUrl() {
        return (apiPublicUrl != null && !apiPublicUrl.isBlank()) ? apiPublicUrl : baseUrl;
    }
    public void setApiPublicUrl(String apiPublicUrl) { this.apiPublicUrl = apiPublicUrl; }

    public String getCookieDomain() { return cookieDomain; }
    public void setCookieDomain(String cookieDomain) { this.cookieDomain = cookieDomain; }

    public String getSupportEmail() { return supportEmail; }
    public void setSupportEmail(String supportEmail) { this.supportEmail = supportEmail; }

    public String getClientIpHeader() { return clientIpHeader; }
    public void setClientIpHeader(String clientIpHeader) { this.clientIpHeader = clientIpHeader; }

    public String getBaseUrl() { return baseUrl; }
    public void setBaseUrl(String baseUrl) { this.baseUrl = baseUrl; }

    public String getUploadDir() { return uploadDir; }
    public void setUploadDir(String uploadDir) { this.uploadDir = uploadDir; }

    public String getEncryptionKey() { return encryptionKey; }
    public void setEncryptionKey(String encryptionKey) { this.encryptionKey = encryptionKey; }

    private int userCap = 1000;
    private String adminEmails = "";
    private int maxRoomsPerUser = 10;
    private int maxUploadMbPerUser = 50;

    public int getUserCap() { return userCap; }
    public void setUserCap(int userCap) { this.userCap = userCap; }

    public String getAdminEmails() { return adminEmails; }
    public void setAdminEmails(String adminEmails) { this.adminEmails = adminEmails; }

    public int getMaxRoomsPerUser() { return maxRoomsPerUser; }
    public void setMaxRoomsPerUser(int maxRoomsPerUser) { this.maxRoomsPerUser = maxRoomsPerUser; }

    public int getMaxUploadMbPerUser() { return maxUploadMbPerUser; }
    public void setMaxUploadMbPerUser(int maxUploadMbPerUser) { this.maxUploadMbPerUser = maxUploadMbPerUser; }

    private RetentionProperties retention = new RetentionProperties();

    public RetentionProperties getRetention() { return retention; }
    public void setRetention(RetentionProperties retention) { this.retention = retention; }

    public static class RetentionProperties {
        private int notificationsDays = 90;
        private int emailLogDays = 90;
        private int deletedRoomsDays = 30;

        public int getNotificationsDays() { return notificationsDays; }
        public void setNotificationsDays(int notificationsDays) { this.notificationsDays = notificationsDays; }

        public int getEmailLogDays() { return emailLogDays; }
        public void setEmailLogDays(int emailLogDays) { this.emailLogDays = emailLogDays; }

        public int getDeletedRoomsDays() { return deletedRoomsDays; }
        public void setDeletedRoomsDays(int deletedRoomsDays) { this.deletedRoomsDays = deletedRoomsDays; }
    }

    private GithubProperties github = new GithubProperties();

    public GithubProperties getGithub() { return github; }
    public void setGithub(GithubProperties github) { this.github = github; }

    public static class GithubProperties {
        private String token = "";
        private boolean useFake = false;
        private String linkClientId = "";
        private String linkClientSecret = "";

        public String getToken() { return token; }
        public void setToken(String token) { this.token = token; }

        public boolean isUseFake() { return useFake; }
        public void setUseFake(boolean useFake) { this.useFake = useFake; }

        public String getLinkClientId() { return linkClientId; }
        public void setLinkClientId(String linkClientId) { this.linkClientId = linkClientId; }

        public String getLinkClientSecret() { return linkClientSecret; }
        public void setLinkClientSecret(String linkClientSecret) { this.linkClientSecret = linkClientSecret; }

        public boolean isLinkConfigured() {
            return linkClientId != null && !linkClientId.isBlank() && linkClientSecret != null && !linkClientSecret.isBlank();
        }
    }

    private CanvaProperties canva = new CanvaProperties();

    public CanvaProperties getCanva() { return canva; }
    public void setCanva(CanvaProperties canva) { this.canva = canva; }

    public static class CanvaProperties {
        private String clientId = "";
        private String clientSecret = "";

        public String getClientId() { return clientId; }
        public void setClientId(String clientId) { this.clientId = clientId; }

        public String getClientSecret() { return clientSecret; }
        public void setClientSecret(String clientSecret) { this.clientSecret = clientSecret; }

        public boolean isConfigured() {
            return clientId != null && !clientId.isBlank() && clientSecret != null && !clientSecret.isBlank();
        }
    }

    private McpProperties mcp = new McpProperties();

    public McpProperties getMcp() { return mcp; }
    public void setMcp(McpProperties mcp) { this.mcp = mcp; }

    public static class McpProperties {
        private String allowedPlans = "PRO,MAX";
        private OAuthProperties oauth = new OAuthProperties();

        public String getAllowedPlans() { return allowedPlans; }
        public void setAllowedPlans(String allowedPlans) { this.allowedPlans = allowedPlans; }

        public OAuthProperties getOauth() { return oauth; }
        public void setOauth(OAuthProperties oauth) { this.oauth = oauth; }

        public static class OAuthProperties {
            private java.util.List<String> allowedRedirectUris = new java.util.ArrayList<>(java.util.List.of("https://claude.ai/api/mcp/auth_callback"));
            private boolean allowLoopbackRedirects = true;
            private java.time.Duration accessTokenTtl = java.time.Duration.ofHours(1);
            private java.time.Duration refreshTokenTtl = java.time.Duration.ofDays(30);
            private java.time.Duration authCodeTtl = java.time.Duration.ofMinutes(5);
            private java.util.List<String> resourceUris = new java.util.ArrayList<>();

            public java.util.List<String> getAllowedRedirectUris() { return allowedRedirectUris; }
            public void setAllowedRedirectUris(java.util.List<String> allowedRedirectUris) { this.allowedRedirectUris = allowedRedirectUris; }

            public boolean isAllowLoopbackRedirects() { return allowLoopbackRedirects; }
            public void setAllowLoopbackRedirects(boolean allowLoopbackRedirects) { this.allowLoopbackRedirects = allowLoopbackRedirects; }

            public java.time.Duration getAccessTokenTtl() { return accessTokenTtl; }
            public void setAccessTokenTtl(java.time.Duration accessTokenTtl) { this.accessTokenTtl = accessTokenTtl; }

            public java.time.Duration getRefreshTokenTtl() { return refreshTokenTtl; }
            public void setRefreshTokenTtl(java.time.Duration refreshTokenTtl) { this.refreshTokenTtl = refreshTokenTtl; }

            public java.time.Duration getAuthCodeTtl() { return authCodeTtl; }
            public void setAuthCodeTtl(java.time.Duration authCodeTtl) { this.authCodeTtl = authCodeTtl; }

            public java.util.List<String> getResourceUris() { return resourceUris; }
            public void setResourceUris(java.util.List<String> resourceUris) { this.resourceUris = resourceUris; }
        }
    }

    public String getOAuthIssuer() {
        String base = getApiPublicUrl();
        if (base == null || base.isBlank()) {
            base = getBaseUrl();
        }
        if (base == null || base.isBlank()) {
            base = "http://localhost:8080";
        }
        try {
            java.net.URI uri = java.net.URI.create(base);
            String scheme = uri.getScheme() != null ? uri.getScheme() : "http";
            String host = uri.getHost() != null ? uri.getHost() : "localhost";
            int port = uri.getPort();
            if (port != -1 && !((port == 80 && "http".equalsIgnoreCase(scheme)) || (port == 443 && "https".equalsIgnoreCase(scheme)))) {
                return scheme + "://" + host + ":" + port;
            }
            return scheme + "://" + host;
        } catch (Exception e) {
            return base.replaceAll("/+$", "");
        }
    }
}

