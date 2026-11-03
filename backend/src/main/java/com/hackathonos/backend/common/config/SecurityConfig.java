package com.hackathonos.backend.common.config;

import com.hackathonos.backend.common.security.ExplicitRedirectUriOAuth2AuthorizationRequestResolver;
import com.hackathonos.backend.common.security.OAuth2LoginSuccessHandler;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.core.annotation.Order;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import com.hackathonos.backend.mcp.McpBearerAuthFilter;
import com.hackathonos.backend.common.error.ErrorResponse;
import com.hackathonos.backend.common.http.RequestIdFilter;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.MDC;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.UUID;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private static final Logger log = LoggerFactory.getLogger(SecurityConfig.class);

    private final OAuth2LoginSuccessHandler oAuth2LoginSuccessHandler;
    private final CorsConfigurationSource corsConfigurationSource;
    private final AppProperties appProperties;
    private final Environment environment;
    private final ClientRegistrationRepository clientRegistrationRepository;
    private final SecurityContextRepository securityContextRepository;

    public SecurityConfig(OAuth2LoginSuccessHandler oAuth2LoginSuccessHandler,
                          CorsConfigurationSource corsConfigurationSource,
                          AppProperties appProperties,
                          Environment environment,
                          @Autowired(required = false) ClientRegistrationRepository clientRegistrationRepository,
                          SecurityContextRepository securityContextRepository) {
        this.oAuth2LoginSuccessHandler = oAuth2LoginSuccessHandler;
        this.corsConfigurationSource = corsConfigurationSource;
        this.appProperties = appProperties;
        this.environment = environment;
        this.clientRegistrationRepository = clientRegistrationRepository;
        this.securityContextRepository = securityContextRepository;
    }

    @Bean
    @Order(1)
    public SecurityFilterChain mcpFilterChain(HttpSecurity http, McpBearerAuthFilter mcpBearerAuthFilter) throws Exception {
        http
            .securityMatcher("/api/v1/mcp/**")
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.disable())
            .authorizeHttpRequests(auth -> auth.anyRequest().authenticated())
            .addFilterBefore(mcpBearerAuthFilter, UsernamePasswordAuthenticationFilter.class)
            .exceptionHandling(exceptions -> exceptions
                .authenticationEntryPoint((request, response, authException) -> {
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.setContentType("application/json");
                    String reqId = MDC.get(RequestIdFilter.MDC_KEY);
                    if (reqId == null || reqId.isBlank()) reqId = UUID.randomUUID().toString();
                    ErrorResponse err = new ErrorResponse(Instant.now().toString(), 401, "UNAUTHORIZED", "Authentication required", reqId);
                    response.getWriter().write(new ObjectMapper().writeValueAsString(err));
                })
            );
        return http.build();
    }

    @Bean
    @Order(2)
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        boolean isProd = environment.acceptsProfiles(Profiles.of("prod"));

        CookieCsrfTokenRepository csrfTokenRepository = CookieCsrfTokenRepository.withHttpOnlyFalse();
        csrfTokenRepository.setCookieCustomizer(cookie -> {
            cookie.sameSite(appProperties.getCookie().getSameSite());
            cookie.secure(appProperties.getCookie().isSecure());
        });

        http
            .securityContext(sc -> sc.securityContextRepository(securityContextRepository))
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
                        "/api/v1/dev/**",
                        "/api/v1/loadtest/**",
                        "/api/v1/mentor/**",
                        "/api/v1/public/**",
                        "/api/v1/client-errors",
                        "/.well-known/**",
                        "/oauth/register",
                        "/oauth/token",
                        "/oauth/revoke"
                )
                .csrfTokenRepository(csrfTokenRepository)
                .csrfTokenRequestHandler(new CsrfTokenRequestAttributeHandler())
            )
            .requestCache(rc -> rc.requestCache(new org.springframework.security.web.savedrequest.HttpSessionRequestCache()))
            .exceptionHandling(exceptions -> exceptions
                .authenticationEntryPoint((request, response, authException) -> {
                    if (request.getRequestURI().startsWith("/oauth/authorize")) {
                        new org.springframework.security.web.savedrequest.HttpSessionRequestCache().saveRequest(request, response);
                        response.sendRedirect(appProperties.getPublicUrl() + "/login");
                    } else if (request.getRequestURI().startsWith("/api/") || request.getRequestURI().startsWith("/actuator/")) {
                        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                        response.setContentType("application/json");
                        response.getWriter().write("{\"timestamp\":\"" + Instant.now() + "\",\"status\":401,\"code\":\"UNAUTHORIZED\",\"message\":\"Authentication required\"}");
                    } else {
                        response.sendRedirect(appProperties.getPublicUrl() + "/login");
                    }
                })
                .accessDeniedHandler((request, response, accessDeniedException) -> {
                    if (request.getRequestURI().startsWith("/api/") || request.getRequestURI().startsWith("/actuator/")) {
                        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                        response.setContentType("application/json");
                        response.getWriter().write("{\"timestamp\":\"" + Instant.now() + "\",\"status\":403,\"code\":\"FORBIDDEN\",\"message\":\"Access denied\"}");
                    } else {
                        response.sendRedirect(appProperties.getPublicUrl() + "/login");
                    }
                })
            )
            .authorizeHttpRequests(auth -> {
                auth.dispatcherTypeMatchers(jakarta.servlet.DispatcherType.ASYNC).permitAll();

                // Actuator endpoints: strictly only health (liveness, readiness)
                auth.requestMatchers(
                        "/actuator/health",
                        "/actuator/health/liveness",
                        "/actuator/health/readiness"
                ).permitAll();

                auth.requestMatchers("/actuator/prometheus").access((authentication, context) -> {
                    String metricsToken = environment.getProperty("METRICS_TOKEN");
                    if (metricsToken == null || metricsToken.isBlank()) {
                        return new org.springframework.security.authorization.AuthorizationDecision(false);
                    }
                    String authHeader = context.getRequest().getHeader("Authorization");
                    boolean matches = authHeader != null && authHeader.equals("Bearer " + metricsToken.trim());
                    return new org.springframework.security.authorization.AuthorizationDecision(matches);
                });

                // Core public endpoints
                auth.requestMatchers(
                        "/error",
                        "/api/v1/health",
                        "/api/v1/health/ready",
                        "/login/**",
                        "/oauth2/**",
                        "/.well-known/**",
                        "/oauth/register",
                        "/oauth/token",
                        "/oauth/revoke",
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
                        "/uploads/**",
                        "/api/v1/dev/**",
                        "/api/v1/loadtest/**",
                        "/mock/**"
                ).permitAll();

                // Dev/Swagger endpoints permitted ONLY when not in production profile
                if (!isProd) {
                    auth.requestMatchers(
                            "/v3/api-docs/**",
                            "/swagger-ui/**",
                            "/swagger-ui.html"
                    ).permitAll();
                }

                auth.requestMatchers(HttpMethod.GET, "/api/v1/invites/**").permitAll();
                auth.anyRequest().authenticated();
            })
            .oauth2Login(oauth2 -> {
                oauth2.securityContextRepository(securityContextRepository);
                if (clientRegistrationRepository != null) {
                    oauth2.authorizationEndpoint(endpoint ->
                            endpoint.authorizationRequestResolver(
                                    new ExplicitRedirectUriOAuth2AuthorizationRequestResolver(clientRegistrationRepository, appProperties)
                            )
                    );
                }
                oauth2.successHandler(oAuth2LoginSuccessHandler);
                oauth2.failureHandler((request, response, exception) -> {
                    String shortCode = "oauth_failed";
                    if (exception instanceof org.springframework.security.oauth2.core.OAuth2AuthenticationException oauthEx) {
                        shortCode = oauthEx.getError() != null && oauthEx.getError().getErrorCode() != null
                                ? oauthEx.getError().getErrorCode()
                                : "oauth_error";
                    } else if (exception instanceof org.springframework.security.authentication.DisabledException) {
                        shortCode = "account_disabled";
                    } else if (exception instanceof org.springframework.security.authentication.LockedException) {
                        shortCode = "account_locked";
                    }
                    log.warn("OAuth2 login failure: exception={}, message={}, shortCode={}",
                            exception.getClass().getName(), exception.getMessage(), shortCode);
                    String target = appProperties.getPublicUrl() + "/login?error="
                            + URLEncoder.encode(shortCode, StandardCharsets.UTF_8);
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
        boolean isProd = environment.acceptsProfiles(Profiles.of("prod"));
        boolean secure = isProd || appProperties.getCookie().isSecure();
        return servletContext -> {
            servletContext.getSessionCookieConfig().setName("JSESSIONID");
            servletContext.getSessionCookieConfig().setHttpOnly(true);
            servletContext.getSessionCookieConfig().setSecure(secure);
            servletContext.getSessionCookieConfig().setPath("/");
            servletContext.getSessionCookieConfig().setDomain(null);
        };
    }
}
