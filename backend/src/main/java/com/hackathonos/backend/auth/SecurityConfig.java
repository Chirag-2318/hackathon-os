package com.hackathonos.backend.auth;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;
import org.springframework.web.cors.CorsConfigurationSource;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final OAuth2LoginSuccessHandler oAuth2LoginSuccessHandler;
    private final CorsConfigurationSource corsConfigurationSource;

    public SecurityConfig(OAuth2LoginSuccessHandler oAuth2LoginSuccessHandler,
                          CorsConfigurationSource corsConfigurationSource) {
        this.oAuth2LoginSuccessHandler = oAuth2LoginSuccessHandler;
        this.corsConfigurationSource = corsConfigurationSource;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource))
            .csrf(csrf -> csrf
                .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
                // Use plain (non-XOR) handler so the JS client can read XSRF-TOKEN
                // directly from the cookie and send it back as X-XSRF-TOKEN.
                .csrfTokenRequestHandler(new CsrfTokenRequestAttributeHandler())
            )
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(
                        "/actuator/health",
                        "/login/**",
                        "/oauth2/**",
                        "/v3/api-docs/**",
                        "/swagger-ui/**"
                ).permitAll()
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/v1/invites/**").permitAll()
                .anyRequest().authenticated()
            )
            .oauth2Login(oauth2 -> oauth2
                .successHandler(oAuth2LoginSuccessHandler)
            )
            .logout(logout -> logout
                .logoutUrl("/api/v1/logout")
                .logoutSuccessHandler((request, response, authentication) -> {
                    response.setStatus(jakarta.servlet.http.HttpServletResponse.SC_NO_CONTENT);
                })
            );

        return http.build();
    }
}
