package com.hackathonos.backend.common.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.security.web.context.DelegatingSecurityContextRepository;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.RequestAttributeSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.session.jdbc.config.annotation.web.http.EnableJdbcHttpSession;
import org.springframework.session.web.http.CookieSerializer;
import org.springframework.session.web.http.DefaultCookieSerializer;

@Configuration
@EnableJdbcHttpSession
public class SessionConfig {

    private final AppProperties appProperties;
    private final Environment environment;

    public SessionConfig(AppProperties appProperties, Environment environment) {
        this.appProperties = appProperties;
        this.environment = environment;
    }

    @Bean
    public CookieSerializer cookieSerializer() {
        boolean isProd = environment.acceptsProfiles(Profiles.of("prod"));
        boolean secure = isProd || appProperties.getCookie().isSecure();

        DefaultCookieSerializer serializer = new DefaultCookieSerializer();
        serializer.setCookieName("JSESSIONID");
        serializer.setUseHttpOnlyCookie(true);
        serializer.setUseSecureCookie(secure);
        serializer.setSameSite(appProperties.getCookie().getSameSite() != null ? appProperties.getCookie().getSameSite() : "Lax");
        serializer.setCookiePath("/");
        // Explicitly ensuring null domain enforces host-only cookie behavior matching Vercel reverse proxy domain
        serializer.setDomainName(null);
        serializer.setUseBase64Encoding(false);
        return serializer;
    }

    @Bean
    public SecurityContextRepository securityContextRepository() {
        return new DelegatingSecurityContextRepository(
                new RequestAttributeSecurityContextRepository(),
                new HttpSessionSecurityContextRepository()
        );
    }
}
