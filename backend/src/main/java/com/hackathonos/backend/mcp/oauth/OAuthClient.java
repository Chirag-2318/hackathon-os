package com.hackathonos.backend.mcp.oauth;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Entity
@Table(name = "oauth_clients")
public class OAuthClient {

    @Id
    @Column(name = "client_id", length = 200)
    private String clientId;

    @Column(name = "client_name", nullable = false, length = 255)
    private String clientName;

    @Column(name = "redirect_uris", nullable = false, columnDefinition = "TEXT")
    private String redirectUris;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "last_used_at")
    private Instant lastUsedAt;

    protected OAuthClient() {}

    public OAuthClient(String clientId, String clientName, List<String> redirectUris) {
        this.clientId = clientId;
        this.clientName = clientName;
        this.redirectUris = redirectUris != null ? String.join("\n", redirectUris) : "";
        this.createdAt = Instant.now();
    }

    public String getClientId() {
        return clientId;
    }

    public void setClientId(String clientId) {
        this.clientId = clientId;
    }

    public String getClientName() {
        return clientName;
    }

    public void setClientName(String clientName) {
        this.clientName = clientName;
    }

    public String getRedirectUris() {
        return redirectUris;
    }

    public void setRedirectUris(String redirectUris) {
        this.redirectUris = redirectUris;
    }

    public List<String> getRedirectUrisList() {
        if (redirectUris == null || redirectUris.isBlank()) {
            return List.of();
        }
        return Arrays.stream(redirectUris.split("\n"))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();
    }

    public void setRedirectUrisList(List<String> uris) {
        this.redirectUris = uris != null ? String.join("\n", uris) : "";
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getLastUsedAt() {
        return lastUsedAt;
    }

    public void setLastUsedAt(Instant lastUsedAt) {
        this.lastUsedAt = lastUsedAt;
    }
}
