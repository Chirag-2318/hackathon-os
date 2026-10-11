package com.hackathonos.backend.common.security;

import com.hackathonos.backend.common.config.AppProperties;
import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;

import java.util.Base64;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class SecretCipherTest {

    @Test
    void testEncryptAndDecryptRoundTrip() {
        AppProperties props = new AppProperties();
        byte[] key32 = new byte[32];
        for (int i = 0; i < 32; i++) {
            key32[i] = (byte) (i + 1);
        }
        props.setEncryptionKey(Base64.getEncoder().encodeToString(key32));

        MockEnvironment env = new MockEnvironment();
        SecretCipher cipher = new SecretCipher(props, env);
        cipher.init();

        String original = "ghp_super_secret_github_token_12345";
        String encrypted = cipher.encrypt(original);

        assertThat(encrypted).isNotNull();
        assertThat(encrypted).isNotEqualTo(original);

        String decrypted = cipher.decrypt(encrypted);
        assertThat(decrypted).isEqualTo(original);
    }

    @Test
    void testDevEphemeralKeyGeneration() {
        AppProperties props = new AppProperties();
        props.setEncryptionKey("");

        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("dev");

        SecretCipher cipher = new SecretCipher(props, env);
        cipher.init();

        String secret = "test-secret-value";
        String encrypted = cipher.encrypt(secret);
        assertThat(cipher.decrypt(encrypted)).isEqualTo(secret);
    }

    @Test
    void testNonDevMissingKeyFails() {
        AppProperties props = new AppProperties();
        props.setEncryptionKey("");

        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("prod");

        SecretCipher cipher = new SecretCipher(props, env);
        assertThatThrownBy(cipher::init)
                .isInstanceOf(IllegalStateException.class);
    }
}
