package com.hackathonos.backend.common.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

/**
 * Validates critical environment variables when running under the 'prod' profile.
 * Fails startup with a single comprehensive message listing every missing or placeholder variable.
 */
@Component
@Profile("prod")
public class ProductionStartupValidator implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(ProductionStartupValidator.class);

    private final Environment env;
    private final AppProperties appProperties;

    public ProductionStartupValidator(Environment env, AppProperties appProperties) {
        this.env = env;
        this.appProperties = appProperties;
    }

    @Override
    public void run(ApplicationArguments args) {
        log.info("Executing production environment configuration validation...");
        List<String> errors = new ArrayList<>();

        // 1. Database Configuration
        checkRequired(errors, "SPRING_DATASOURCE_URL",
                env.getProperty("spring.datasource.url"),
                "jdbc:postgresql://", "localhost:5433");
        checkRequired(errors, "SPRING_DATASOURCE_USERNAME",
                env.getProperty("spring.datasource.username"),
                null, "hackathon");
        checkRequired(errors, "SPRING_DATASOURCE_PASSWORD",
                env.getProperty("spring.datasource.password"),
                null, "hackathon");

        // 2. Encryption Key
        String encKey = appProperties.getEncryptionKey();
        if (encKey == null || encKey.isBlank()) {
            errors.add("APP_ENCRYPTION_KEY is required and missing");
        } else if (isPlaceholder(encKey) || encKey.length() < 16) {
            errors.add("APP_ENCRYPTION_KEY is insecure or placeholder (must be at least 16 characters)");
        }

        // 3. OAuth Providers (GitHub and Google)
        checkRequired(errors, "GITHUB_CLIENT_ID",
                env.getProperty("spring.security.oauth2.client.registration.github.client-id"),
                null, "dummy-github-client-id");
        checkRequired(errors, "GITHUB_CLIENT_SECRET",
                env.getProperty("spring.security.oauth2.client.registration.github.client-secret"),
                null, "dummy-github-client-secret");
        checkRequired(errors, "GOOGLE_CLIENT_ID",
                env.getProperty("spring.security.oauth2.client.registration.google.client-id"),
                null, "dummy-google-client-id");
        checkRequired(errors, "GOOGLE_CLIENT_SECRET",
                env.getProperty("spring.security.oauth2.client.registration.google.client-secret"),
                null, "dummy-google-client-secret");

        // 4. Public URLs
        checkRequired(errors, "APP_PUBLIC_URL",
                env.getProperty("app.public-url"),
                "http", "localhost");
        checkRequired(errors, "API_PUBLIC_URL",
                env.getProperty("app.api-public-url"),
                "http", "localhost");

        // 5. Mail Configuration
        checkRequired(errors, "MAIL_HOST",
                env.getProperty("app.mail.host", env.getProperty("spring.mail.host")),
                null, null);
        checkRequired(errors, "MAIL_USERNAME",
                env.getProperty("app.mail.username", env.getProperty("spring.mail.username")),
                "@", null);
        checkRequired(errors, "MAIL_APP_PASSWORD",
                env.getProperty("app.mail.app-password", env.getProperty("spring.mail.password")),
                null, null);

        // 6. Administrative Contacts
        checkRequired(errors, "ADMIN_EMAILS",
                appProperties.getAdminEmails(),
                "@", null);
        checkRequired(errors, "SUPPORT_EMAIL",
                appProperties.getSupportEmail(),
                "@", null);

        // 7. AI Platform Fallback Check
        String fallbackStr = env.getProperty("AI_PLATFORM_FALLBACK",
                env.getProperty("app.ai.platform-fallback", "false"));
        if (Boolean.parseBoolean(fallbackStr)) {
            errors.add("AI_PLATFORM_FALLBACK must be false in prod (platform pays for NO AI usage in production)");
        }

        if (!errors.isEmpty()) {
            StringBuilder sb = new StringBuilder();
            sb.append("\n================================================================================\n");
            sb.append("FATAL: Production Startup Validation Failed!\n");
            sb.append("The following ").append(errors.size()).append(" configuration requirement(s) are missing or placeholder:\n");
            for (String err : errors) {
                sb.append("  - ").append(err).append("\n");
            }
            sb.append("Please set valid production environment variables before starting the server.\n");
            sb.append("================================================================================\n");
            log.error(sb.toString());
            throw new IllegalStateException("Production startup validation failed: " + errors);
        }

        log.info("Production configuration validation passed successfully.");
    }

    private void checkRequired(List<String> errors, String varName, String value, String mustContain, String forbiddenPlaceholder) {
        if (value == null || value.trim().isBlank()) {
            errors.add(varName + " is missing or empty");
            return;
        }
        String clean = value.trim();
        if (isPlaceholder(clean)) {
            errors.add(varName + " is set to a placeholder value: '" + clean + "'");
            return;
        }
        if (forbiddenPlaceholder != null && clean.contains(forbiddenPlaceholder)) {
            errors.add(varName + " contains forbidden placeholder/local value: '" + forbiddenPlaceholder + "'");
            return;
        }
        if (mustContain != null && !clean.contains(mustContain)) {
            errors.add(varName + " must contain '" + mustContain + "'");
        }
    }

    private boolean isPlaceholder(String val) {
        String lower = val.toLowerCase();
        return lower.contains("placeholder") ||
                lower.contains("changeme") ||
                lower.contains("dummy") ||
                lower.contains("todo") ||
                lower.startsWith("your_") ||
                lower.startsWith("your-") ||
                lower.startsWith("<your") ||
                lower.equals("secret") ||
                lower.equals("changeit");
    }
}
