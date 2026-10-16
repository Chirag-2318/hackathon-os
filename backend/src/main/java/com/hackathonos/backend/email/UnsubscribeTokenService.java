package com.hackathonos.backend.email;

import com.hackathonos.backend.common.config.AppProperties;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Base64;
import java.util.Optional;
import java.util.UUID;

@Service
public class UnsubscribeTokenService {

    private final byte[] secretKey;

    public UnsubscribeTokenService(AppProperties appProperties) {
        String key = appProperties.getEncryptionKey();
        if (key == null || key.isBlank()) {
            key = "hackathon-os-email-unsubscribe-fallback-secret-key-32b";
        }
        this.secretKey = key.getBytes(StandardCharsets.UTF_8);
    }

    public String generateToken(UUID userId) {
        long epoch = System.currentTimeMillis() / 1000L;
        String payload = userId.toString() + ":" + epoch;
        String signature = sign(payload);
        String tokenRaw = payload + ":" + signature;
        return Base64.getUrlEncoder().withoutPadding().encodeToString(tokenRaw.getBytes(StandardCharsets.UTF_8));
    }

    public Optional<UUID> verifyToken(String token) {
        if (token == null || token.isBlank()) {
            return Optional.empty();
        }
        try {
            byte[] bytes = Base64.getUrlDecoder().decode(token.trim());
            String tokenRaw = new String(bytes, StandardCharsets.UTF_8);
            String[] parts = tokenRaw.split(":");
            if (parts.length != 3) {
                return Optional.empty();
            }
            String userIdStr = parts[0];
            String epochStr = parts[1];
            String expectedSig = parts[2];

            String payload = userIdStr + ":" + epochStr;
            String calculatedSig = sign(payload);
            if (!MessageDigest.isEqual(calculatedSig.getBytes(StandardCharsets.UTF_8), expectedSig.getBytes(StandardCharsets.UTF_8))) {
                return Optional.empty();
            }
            return Optional.of(UUID.fromString(userIdStr));
        } catch (Exception e) {
            return Optional.empty();
        }
    }

    private String sign(String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secretKey, "HmacSHA256"));
            byte[] hash = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(hash);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to calculate HMAC signature", e);
        }
    }
}
