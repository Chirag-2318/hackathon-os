package com.hackathonos.backend.common.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.session.jdbc.config.annotation.web.http.EnableJdbcHttpSession;
import org.springframework.session.web.http.CookieSerializer;
import org.springframework.session.web.http.DefaultCookieSerializer;

@Configuration
@EnableJdbcHttpSession
public class SessionConfig {

    private final AppProperties appProperties;

    public SessionConfig(AppProperties appProperties) {
        this.appProperties = appProperties;
    }

    @Bean
    public CookieSerializer cookieSerializer() {
        DefaultCookieSerializer serializer = new DefaultCookieSerializer();
        serializer.setCookieName("JSESSIONID");
        serializer.setUseHttpOnlyCookie(true);
        serializer.setUseSecureCookie(appProperties.getCookie().isSecure());
        serializer.setSameSite(appProperties.getCookie().getSameSite());
        // Leaving domain name null ensures host-only cookie behaviour on Vercel
        return serializer;
    }
}
