package com.hackathonos.backend.common.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.stereotype.Component;

/**
 * Startup safety guard: guarantees that the 'loadtest' profile can NEVER run
 * concurrently with the 'prod' profile. If both are active, startup is immediately aborted.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class LoadtestProfileGuard {

    private static final Logger log = LoggerFactory.getLogger(LoadtestProfileGuard.class);

    public LoadtestProfileGuard(Environment environment) {
        boolean isProd = environment.acceptsProfiles(Profiles.of("prod"));
        boolean isLoadtest = environment.acceptsProfiles(Profiles.of("loadtest"));

        if (isProd && isLoadtest) {
            String err = "FATAL: Both 'prod' and 'loadtest' profiles are active! "
                    + "'loadtest' profile contains synthetic seeding and mock endpoints and is strictly forbidden in production.";
            log.error(err);
            throw new IllegalStateException(err);
        }
    }
}

