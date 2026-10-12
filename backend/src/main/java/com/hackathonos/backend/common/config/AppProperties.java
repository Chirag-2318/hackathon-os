package com.hackathonos.backend.common.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "app")
public class AppProperties {
    private String frontendUrl = "http://localhost:5173";
    private String baseUrl = "http://localhost:8080";
    private String uploadDir = "./uploads";
    private String encryptionKey = "";

    public String getFrontendUrl() { return frontendUrl; }
    public void setFrontendUrl(String frontendUrl) { this.frontendUrl = frontendUrl; }

    public String getBaseUrl() { return baseUrl; }
    public void setBaseUrl(String baseUrl) { this.baseUrl = baseUrl; }

    public String getUploadDir() { return uploadDir; }
    public void setUploadDir(String uploadDir) { this.uploadDir = uploadDir; }

    public String getEncryptionKey() { return encryptionKey; }
    public void setEncryptionKey(String encryptionKey) { this.encryptionKey = encryptionKey; }

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
