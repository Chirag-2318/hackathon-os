package com.hackathonos.backend.common.config;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.mock.env.MockEnvironment;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class LoadtestProfileStartupGuardTest {

    @Test
    @DisplayName("LoadtestProfileGuard throws IllegalStateException when both prod and loadtest profiles are active")
    void testRefusesToStartWithProdAndLoadtest() {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("prod", "loadtest");

        assertThatThrownBy(() -> new LoadtestProfileGuard(env))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Both 'prod' and 'loadtest' profiles are active");
    }

    @Test
    @DisplayName("LoadtestProfileGuard starts successfully with only prod profile")
    void testPermitsProdOnly() {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("prod");

        LoadtestProfileGuard guard = new LoadtestProfileGuard(env);
        assertThat(guard).isNotNull();
    }

    @Test
    @DisplayName("LoadtestProfileGuard starts successfully with only loadtest profile")
    void testPermitsLoadtestOnly() {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("loadtest");

        LoadtestProfileGuard guard = new LoadtestProfileGuard(env);
        assertThat(guard).isNotNull();
    }

    @Test
    @DisplayName("ApplicationContext fails to start when both prod and loadtest profiles are active")
    void testContextFailsToStartWithBothProfiles() {
        new ApplicationContextRunner()
                .withUserConfiguration(LoadtestProfileGuard.class)
                .withPropertyValues("spring.profiles.active=prod,loadtest")
                .run(context -> {
                    assertThat(context).hasFailed();
                    assertThat(context.getStartupFailure())
                            .hasRootCauseInstanceOf(IllegalStateException.class)
                            .hasRootCauseMessage("FATAL: Both 'prod' and 'loadtest' profiles are active! 'loadtest' profile contains synthetic seeding and mock endpoints and is strictly forbidden in production.");
                });
    }
}

