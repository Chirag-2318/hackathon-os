package com.hackathonos.backend.common.config;

import com.hackathonos.backend.common.security.ExplicitRedirectUriOAuth2AuthorizationRequestResolver;
import com.hackathonos.backend.common.security.OAuth2LoginSuccessHandler;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.web.servlet.ServletContextInitializer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.filter.OncePerRequestFilter;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final OAuth2LoginSuccessHandler oAuth2LoginSuccessHandler;
    private final CorsConfigurationSource corsConfigurationSource;
    private final AppProperties appProperties;
    private final Environment environment;
    private final ClientRegistrationRepository clientRegistrationRepository;

    public SecurityConfig(OAuth2LoginSuccessHandler oAuth2LoginSuccessHandler,
                          CorsConfigurationSource corsConfigurationSource,
                          AppProperties appProperties,
                          Environment environment,
                          @Autowired(required = false) ClientRegistrationRepository clientRegistrationRepository) {
        this.oAuth2LoginSuccessHandler = oAuth2LoginSuccessHandler;
        this.corsConfigurationSource = corsConfigurationSource;
        this.appProperties = appProperties;
        this.environment = environment;
        this.clientRegistrationRepository = clientRegistrationRepository;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        boolean isProd = environment.acceptsProfiles(Profiles.of("prod"));

        CookieCsrfTokenRepository csrfTokenRepository = CookieCsrfTokenRepository.withHttpOnlyFalse();
        String cookieDomain = appProperties.getCookieDomain();
        if (cookieDomain != null && !cookieDomain.isBlank()) {
            csrfTokenRepository.setCookieCustomizer(cookie -> {
                cookie.domain(cookieDomain.trim());
                cookie.sameSite("Lax");
                cookie.secure(true);
            });
        } else {
            csrfTokenRepository.setCookieCustomizer(cookie -> {
                cookie.sameSite("Lax");
                cookie.secure(isProd);
            });
        }

        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource))
            .headers(headers -> headers
                .contentTypeOptions(org.springframework.security.config.Customizer.withDefaults())
                .frameOptions(frame -> frame.deny())
                .referrerPolicy(referrer -> referrer.policy(
                        org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN))
                .contentSecurityPolicy(csp -> csp.policyDirectives("default-src 'none'; frame-ancestors 'none'"))
            )
            .csrf(csrf -> csrf
                .ignoringRequestMatchers(
                        "/mock/**",
                        "/api/v1/mentor/**",
                        "/api/v1/public/**",
                        "/api/v1/client-errors"
                )
                .csrfTokenRepository(csrfTokenRepository)
                .csrfTokenRequestHandler(new CsrfTokenRequestAttributeHandler())
            )
            .exceptionHandling(exceptions -> exceptions
                .authenticationEntryPoint((request, response, authException) -> {
                    if (request.getRequestURI().startsWith("/api/")) {
                        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                        response.setContentType("application/json");
                        response.getWriter().write("{\"timestamp\":\"" + Instant.now() + "\",\"status\":401,\"code\":\"UNAUTHORIZED\",\"message\":\"Authentication required\"}");
                    } else {
                        response.sendRedirect(appProperties.getPublicUrl() + "/login");
                    }
                })
            )
            .authorizeHttpRequests(auth -> {
                // Actuator endpoints: strictly only health (liveness, readiness)
                auth.requestMatchers(
                        "/actuator/health",
                        "/actuator/health/liveness",
                        "/actuator/health/readiness"
                ).permitAll();

                // Core public endpoints
                auth.requestMatchers(
                        "/error",
                        "/api/v1/health",
                        "/login/**",
                        "/oauth2/**",
                        "/api/v1/mentor/**",
                        "/api/v1/public/**",
                        "/api/v1/client-errors",
                        "/api/v1/portfolio/u/**",
                        "/api/v1/playbooks/**",
                        "/api/v1/tools/**",
                        "/api/v1/meta",
                        "/api/v1/github/link/callback",
                        "/api/v1/integrations/canva/callback",
                        "/api/v1/users/username-available",
                        "/uploads/**"
                ).permitAll();

                // Dev/Swagger endpoints permitted ONLY when not in production profile
                if (!isProd) {
                    auth.requestMatchers(
                            "/v3/api-docs/**",
                            "/swagger-ui/**",
                            "/swagger-ui.html",
                            "/mock/**",
                            "/api/v1/dev/**"
                    ).permitAll();
                }

                auth.requestMatchers(HttpMethod.GET, "/api/v1/invites/*").permitAll();
                auth.anyRequest().authenticated();
            })
            .oauth2Login(oauth2 -> {
                if (clientRegistrationRepository != null) {
                    oauth2.authorizationEndpoint(endpoint ->
                            endpoint.authorizationRequestResolver(
                                    new ExplicitRedirectUriOAuth2AuthorizationRequestResolver(clientRegistrationRepository, appProperties)
                            )
                    );
                }
                oauth2.successHandler(oAuth2LoginSuccessHandler);
                oauth2.failureHandler((request, response, exception) -> {
                    String target = appProperties.getPublicUrl() + "/login?error="
                            + URLEncoder.encode(exception.getMessage() != null ? exception.getMessage() : "OAuth authentication failed", StandardCharsets.UTF_8);
                    response.sendRedirect(target);
                });
            })
            .logout(logout -> logout
                .logoutUrl("/api/v1/logout")
                .logoutSuccessHandler((request, response, authentication) -> {
                    response.setStatus(HttpServletResponse.SC_NO_CONTENT);
                })
            )
            .addFilterAfter(new OncePerRequestFilter() {
                @Override
                protected void doFilterInternal(jakarta.servlet.http.HttpServletRequest request,
                                                jakarta.servlet.http.HttpServletResponse response,
                                                jakarta.servlet.FilterChain filterChain)
                        throws jakarta.servlet.ServletException, java.io.IOException {
                    org.springframework.security.web.csrf.CsrfToken csrfToken =
                            (org.springframework.security.web.csrf.CsrfToken) request.getAttribute(org.springframework.security.web.csrf.CsrfToken.class.getName());
                    if (csrfToken != null) {
                        csrfToken.getToken();
                    }
                    filterChain.doFilter(request, response);
                }
            }, org.springframework.security.web.authentication.www.BasicAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public ServletContextInitializer sessionCookieInitializer() {
        return servletContext -> {
            String domain = appProperties.getCookieDomain();
            if (domain != null && !domain.trim().isEmpty()) {
                servletContext.getSessionCookieConfig().setDomain(domain.trim());
            }
            servletContext.getSessionCookieConfig().setHttpOnly(true);
            if (environment.acceptsProfiles(Profiles.of("prod"))) {
                servletContext.getSessionCookieConfig().setSecure(true);
            }
        };
    }
}
