package com.hackathonos.backend.common.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.ArrayList;
import java.util.List;

@Configuration
public class CorsConfig {

    private final AppProperties appProperties;
    private final Environment environment;

    public CorsConfig(AppProperties appProperties, Environment environment) {
        this.appProperties = appProperties;
        this.environment = environment;
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        List<String> origins = new ArrayList<>();

        String publicUrl = appProperties.getPublicUrl();
        if (publicUrl != null && !publicUrl.isBlank()) {
            origins.add(publicUrl);
        }

        // When the active profile is not prod, keep the existing local origins as well
        boolean isProd = environment.acceptsProfiles(Profiles.of("prod"));
        if (!isProd) {
            if (!origins.contains("http://localhost:5173")) origins.add("http://localhost:5173");
            if (!origins.contains("http://127.0.0.1:5173")) origins.add("http://127.0.0.1:5173");
            if (!origins.contains("http://localhost:3000")) origins.add("http://localhost:3000");
            if (!origins.contains("http://127.0.0.1:3000")) origins.add("http://127.0.0.1:3000");
        }

        config.setAllowedOrigins(origins);
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of(
                "Authorization",
                "Content-Type",
                "Accept",
                "X-Requested-With",
                "X-XSRF-TOKEN",
                "X-Request-Id",
                "Idempotency-Key",
                "If-None-Match",
                "Last-Event-ID",
                "Cache-Control",
                "*"
        ));
        config.setExposedHeaders(List.of("X-Request-Id", "Retry-After", "Idempotency-Key", "ETag"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
