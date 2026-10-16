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

    public String getFrontendUrl() { return frontendUrl; }
    public void setFrontendUrl(String frontendUrl) { this.frontendUrl = frontendUrl; }

    public String getPublicUrl() {
        return (publicUrl != null && !publicUrl.isBlank()) ? publicUrl : frontendUrl;
    }
    public void setPublicUrl(String publicUrl) { this.publicUrl = publicUrl; }

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
}
