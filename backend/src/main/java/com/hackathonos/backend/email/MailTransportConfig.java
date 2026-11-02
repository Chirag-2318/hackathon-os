package com.hackathonos.backend.email;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import java.util.List;

@Configuration
public class MailTransportConfig {

    private static final Logger log = LoggerFactory.getLogger(MailTransportConfig.class);

    @Bean
    @Primary
    public MailTransport primaryMailTransport(
            MailProperties mailProperties,
            List<MailTransport> transports,
            SmtpMailTransport smtpTransport
    ) {
        String configuredProvider = mailProperties.getProvider();
        if (configuredProvider == null || configuredProvider.isBlank()) {
            configuredProvider = "smtp";
        }

        for (MailTransport transport : transports) {
            if (transport.getProviderName().equalsIgnoreCase(configuredProvider)) {
                log.info("Active MailTransport: {}", transport.getClass().getSimpleName());
                return transport;
            }
        }

        log.warn("Unknown mail provider '{}', falling back to SMTP", configuredProvider);
        return smtpTransport;
    }
}
