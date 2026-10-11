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

        public String getToken() { return token; }
        public void setToken(String token) { this.token = token; }

        public boolean isUseFake() { return useFake; }
        public void setUseFake(boolean useFake) { this.useFake = useFake; }
    }
}
