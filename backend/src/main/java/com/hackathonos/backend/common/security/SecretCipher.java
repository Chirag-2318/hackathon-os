package com.hackathonos.backend.common.security;

import com.hackathonos.backend.common.config.AppProperties;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Arrays;
import java.util.Base64;
import java.util.HexFormat;

@Component
public class SecretCipher {

    private static final Logger log = LoggerFactory.getLogger(SecretCipher.class);
    private static final String ALGORITHM = "AES/GCM/NoPadding";
    private static final int IV_LENGTH_BYTES = 12;
    private static final int TAG_LENGTH_BITS = 128;

    private final AppProperties appProperties;
    private final Environment environment;
    private SecretKey secretKey;

    public SecretCipher(AppProperties appProperties, Environment environment) {
        this.appProperties = appProperties;
        this.environment = environment;
    }

    @PostConstruct
    public void init() {
        String keyBase64 = appProperties.getEncryptionKey();
        if (keyBase64 == null || keyBase64.isBlank()) {
            boolean isDev = Arrays.asList(environment.getActiveProfiles()).contains("dev");
            if (isDev) {
                byte[] generatedKey = new byte[32];
                new SecureRandom().nextBytes(generatedKey);
                this.secretKey = new SecretKeySpec(generatedKey, "AES");
                log.warn("WARNING: app.encryption-key is missing in dev profile. Generated ephemeral AES key.");
            } else {
                throw new IllegalStateException("app.encryption-key must be set in non-dev profile");
            }
        } else {
            byte[] decoded = null;
            try {
                byte[] b64 = Base64.getDecoder().decode(keyBase64.trim());
                if (b64.length == 32) decoded = b64;
            } catch (Exception ignored) {}

            if (decoded == null && keyBase64.trim().length() == 64) {
                try {
                    decoded = HexFormat.of().parseHex(keyBase64.trim());
                } catch (Exception ignored) {}
            }

            if (decoded == null || decoded.length != 32) {
                throw new IllegalStateException("app.encryption-key must be a Base64-encoded or 64-hex 32-byte key");
            }
            this.secretKey = new SecretKeySpec(decoded, "AES");
        }
    }

    public String encrypt(String plaintext) {
        if (plaintext == null) {
            return null;
        }
        try {
            byte[] iv = new byte[IV_LENGTH_BYTES];
            new SecureRandom().nextBytes(iv);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            GCMParameterSpec parameterSpec = new GCMParameterSpec(TAG_LENGTH_BITS, iv);
            cipher.init(Cipher.ENCRYPT_MODE, secretKey, parameterSpec);

            byte[] cipherText = cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));
            byte[] combined = ByteBuffer.allocate(iv.length + cipherText.length)
                    .put(iv)
                    .put(cipherText)
                    .array();

            return Base64.getEncoder().encodeToString(combined);
        } catch (Exception e) {
            throw new RuntimeException("Encryption failed", e);
        }
    }

    public String decrypt(String ciphertextBase64) {
        if (ciphertextBase64 == null) {
            return null;
        }
        try {
            byte[] combined = Base64.getDecoder().decode(ciphertextBase64);
            if (combined.length < IV_LENGTH_BYTES) {
                throw new IllegalArgumentException("Invalid ciphertext length");
            }

            byte[] iv = Arrays.copyOfRange(combined, 0, IV_LENGTH_BYTES);
            byte[] cipherText = Arrays.copyOfRange(combined, IV_LENGTH_BYTES, combined.length);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            GCMParameterSpec parameterSpec = new GCMParameterSpec(TAG_LENGTH_BITS, iv);
            cipher.init(Cipher.DECRYPT_MODE, secretKey, parameterSpec);

            byte[] plainTextBytes = cipher.doFinal(cipherText);
            return new String(plainTextBytes, StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new RuntimeException("Decryption failed", e);
        }
    }

    public record EncryptedSecret(String ciphertext, String iv) {}


    public EncryptedSecret encryptWithIv(String plaintext) {
        if (plaintext == null) {
            return null;
        }
        try {
            byte[] iv = new byte[IV_LENGTH_BYTES];
            new SecureRandom().nextBytes(iv);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            GCMParameterSpec parameterSpec = new GCMParameterSpec(TAG_LENGTH_BITS, iv);
            cipher.init(Cipher.ENCRYPT_MODE, secretKey, parameterSpec);

            byte[] cipherText = cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));
            return new EncryptedSecret(
                    Base64.getEncoder().encodeToString(cipherText),
                    Base64.getEncoder().encodeToString(iv)
            );
        } catch (Exception e) {
            throw new RuntimeException("Encryption failed", e);
        }
    }

    public String decryptWithIv(String ciphertextBase64, String ivBase64) {
        if (ciphertextBase64 == null || ivBase64 == null) {
            return null;
        }
        try {
            byte[] iv = Base64.getDecoder().decode(ivBase64);
            byte[] cipherText = Base64.getDecoder().decode(ciphertextBase64);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            GCMParameterSpec parameterSpec = new GCMParameterSpec(TAG_LENGTH_BITS, iv);
            cipher.init(Cipher.DECRYPT_MODE, secretKey, parameterSpec);

            byte[] plainTextBytes = cipher.doFinal(cipherText);
            return new String(plainTextBytes, StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new RuntimeException("Decryption failed", e);
        }
    }
}

