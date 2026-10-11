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

import java.util.Arrays;
import java.util.List;

/**
 * Startup checks and configuration logging.
 * Verifies that the six required event templates exist in the database,
 * and prints runtime configuration diagnostics when running under the dev profile.
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

        if (Arrays.asList(environment.getActiveProfiles()).contains("dev")) {
            logDevStartupDiagnostics();
        }
    }

    /**
     * Verifies that all expected event templates are present in the database.
     */
    private void verifyExpectedTemplates() {
        List<String> missing = EXPECTED_TEMPLATES.stream()
                .filter(id -> !templateRepository.existsById(id))
                .toList();

        if (!missing.isEmpty()) {
            log.error("Missing expected event template(s) in database: {}", missing);
        }
    }

    /**
     * Prints startup diagnostics for the dev profile.
     */
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
