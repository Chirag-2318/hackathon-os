package com.hackathonos.backend.email;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "app.mail")
public class MailProperties {

    private boolean enabled = false;
    private String provider = "smtp"; // smtp, resend, log
    private String resendApiKey = "";
    private String host = "smtp.gmail.com";
    private int port = 587;
    private String username = "";
    private String appPassword = "";
    private String fromAddress = "";
    private String fromName = "Bracket";
    private String replyTo = "";
    private int dailyLimit = 400;
    private boolean dryRun = false;
    private boolean testEndpointEnabled = false;

    private static String clean(String val) {
        if (val == null) return "";
        String s = val.trim();
        if ((s.startsWith("\"") && s.endsWith("\"")) || (s.startsWith("'") && s.endsWith("'"))) {
            if (s.length() >= 2) {
                s = s.substring(1, s.length() - 1).trim();
            }
        }
        return s.replace("\r", "").replace("\n", "").trim();
    }

    private static String cleanPassword(String val) {
        if (val == null) return "";
        String s = clean(val);
        // Strip all spaces from app password
        return s.replaceAll("\\s+", "");
    }

    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }

    public String getProvider() { return provider; }
    public void setProvider(String provider) { this.provider = clean(provider).toLowerCase(); }

    public String getResendApiKey() { return resendApiKey; }
    public void setResendApiKey(String resendApiKey) { this.resendApiKey = clean(resendApiKey); }

    public String getHost() { return host; }
    public void setHost(String host) { this.host = clean(host); }

    public int getPort() { return port; }
    public void setPort(int port) { this.port = port; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = clean(username); }

    public String getAppPassword() { return appPassword; }
    public void setAppPassword(String appPassword) { this.appPassword = cleanPassword(appPassword); }

    public String getFromAddress() {
        if ("resend".equalsIgnoreCase(provider)) {
            if (fromAddress != null && !fromAddress.isBlank()) {
                return fromAddress;
            }
        }
        if (username != null && !username.isBlank()) {
            return username;
        }
        if (fromAddress != null && !fromAddress.isBlank()) {
            return fromAddress;
        }
        return "";
    }
    public void setFromAddress(String fromAddress) { this.fromAddress = clean(fromAddress); }

    public String getFromName() { return fromName; }
    public void setFromName(String fromName) { this.fromName = clean(fromName); }

    public String getReplyTo() { return replyTo; }
    public void setReplyTo(String replyTo) { this.replyTo = clean(replyTo); }

    public int getDailyLimit() { return dailyLimit; }
    public void setDailyLimit(int dailyLimit) { this.dailyLimit = dailyLimit; }

    public boolean isDryRun() { return dryRun; }
    public void setDryRun(boolean dryRun) { this.dryRun = dryRun; }

    public boolean isTestEndpointEnabled() { return testEndpointEnabled; }
    public void setTestEndpointEnabled(boolean testEndpointEnabled) { this.testEndpointEnabled = testEndpointEnabled; }
}
