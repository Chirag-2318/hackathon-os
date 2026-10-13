package com.hackathonos.backend.common.config;

import com.hackathonos.backend.templates.EventTemplateRepository;
import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.MigrationInfo;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 * Startup checks, fail-fast secret verification, and configuration logging.
 */
@Component
public class StartupConfigLogger implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(StartupConfigLogger.class);

    private static final List<String> EXPECTED_TEMPLATES = List.of(
            "sih-36h", "online-48h", "weekend-mlh", "ai-sprint-4h", "corporate", "solo"
    );

    private final EventTemplateRepository templateRepository;
    private final AppProperties appProperties;
    private final Environment environment;
    private final Flyway flyway;

    public StartupConfigLogger(EventTemplateRepository templateRepository,
                               AppProperties appProperties,
                               Environment environment,
                               @Autowired(required = false) Flyway flyway) {
        this.templateRepository = templateRepository;
        this.appProperties = appProperties;
        this.environment = environment;
        this.flyway = flyway;
    }

    @Override
    public void run(ApplicationArguments args) {
        verifyExpectedTemplates();

        if (Arrays.asList(environment.getActiveProfiles()).contains("prod")) {
            verifyRequiredSecretsForProd();
        }

        if (Arrays.asList(environment.getActiveProfiles()).contains("dev")) {
            logDevStartupDiagnostics();
        }
    }

    private void verifyRequiredSecretsForProd() {
        List<String> missing = new ArrayList<>();

        if (appProperties.getEncryptionKey() == null || appProperties.getEncryptionKey().isBlank()) {
            missing.add("APP_ENCRYPTION_KEY");
        }

        String dbUrl = environment.getProperty("SPRING_DATASOURCE_URL");
        if (dbUrl == null || dbUrl.isBlank()) missing.add("SPRING_DATASOURCE_URL");

        String dbUser = environment.getProperty("SPRING_DATASOURCE_USERNAME");
        if (dbUser == null || dbUser.isBlank()) missing.add("SPRING_DATASOURCE_USERNAME");

        String dbPass = environment.getProperty("SPRING_DATASOURCE_PASSWORD");
        if (dbPass == null || dbPass.isBlank()) missing.add("SPRING_DATASOURCE_PASSWORD");

        String githubId = environment.getProperty("GITHUB_CLIENT_ID");
        String githubSecret = environment.getProperty("GITHUB_CLIENT_SECRET");
        if (githubId == null || githubId.isBlank() || githubId.contains("dummy")) missing.add("GITHUB_CLIENT_ID");
        if (githubSecret == null || githubSecret.isBlank() || githubSecret.contains("dummy")) missing.add("GITHUB_CLIENT_SECRET");

        String googleId = environment.getProperty("GOOGLE_CLIENT_ID");
        String googleSecret = environment.getProperty("GOOGLE_CLIENT_SECRET");
        if (googleId == null || googleId.isBlank() || googleId.contains("dummy")) missing.add("GOOGLE_CLIENT_ID");
        if (googleSecret == null || googleSecret.isBlank() || googleSecret.contains("dummy")) missing.add("GOOGLE_CLIENT_SECRET");

        String aiKey = environment.getProperty("AI_API_KEY");
        if (aiKey == null || aiKey.isBlank()) {
            aiKey = environment.getProperty("GROQ_API_KEY");
            if (aiKey == null || aiKey.isBlank()) {
                missing.add("AI_API_KEY (or GROQ_API_KEY)");
            }
        }

        if (!missing.isEmpty()) {
            String errorMsg = "FATAL STARTUP FAILURE: The following required environment variables are missing for 'prod' profile: "
                    + String.join(", ", missing);
            log.error(errorMsg);
            throw new IllegalStateException(errorMsg);
        }
    }

    private void verifyExpectedTemplates() {
        List<String> missing = EXPECTED_TEMPLATES.stream()
                .filter(id -> !templateRepository.existsById(id))
                .toList();

        if (!missing.isEmpty()) {
            log.error("Missing expected event template(s) in database: {}", missing);
        }
    }

    private void logDevStartupDiagnostics() {
        String flywayVersion = "N/A";
        if (flyway != null && flyway.info() != null) {
            MigrationInfo current = flyway.info().current();
            if (current != null && current.getVersion() != null) {
                flywayVersion = current.getVersion().getVersion();
            }
        }

        String activeProfiles = Arrays.toString(environment.getActiveProfiles());
        long templateCount = templateRepository.count();
        String frontendOrigin = appProperties.getFrontendUrl();

        log.info("Startup configuration: active profile={}, Flyway version={}, event templates={}, allowed frontend origin={}",
                activeProfiles, flywayVersion, templateCount, frontendOrigin);
    }
}
