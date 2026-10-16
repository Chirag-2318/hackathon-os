package com.hackathonos.backend.email;

import org.springframework.beans.factory.ObjectProvider;
import org.springframework.boot.health.contributor.Health;
import org.springframework.boot.health.contributor.HealthIndicator;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;

@Component("mailHealthIndicator")
public class MailHealthIndicator implements HealthIndicator {

    private final MailProperties mailProperties;
    private final ObjectProvider<JavaMailSender> mailSenderProvider;

    private Instant lastCheckAt = Instant.EPOCH;
    private Health lastHealth = null;

    public MailHealthIndicator(MailProperties mailProperties, ObjectProvider<JavaMailSender> mailSenderProvider) {
        this.mailProperties = mailProperties;
        this.mailSenderProvider = mailSenderProvider;
    }

    @Override
    public synchronized Health health() {
        if (!mailProperties.isEnabled()) {
            return Health.up().withDetail("status", "DISABLED").build();
        }

        Instant now = Instant.now();
        if (lastHealth != null && Duration.between(lastCheckAt, now).toMinutes() < 5) {
            return lastHealth;
        }

        JavaMailSender sender = mailSenderProvider.getIfAvailable();
        if (!(sender instanceof JavaMailSenderImpl impl)) {
            lastHealth = Health.unknown().withDetail("status", "DISABLED").build();
            lastCheckAt = now;
            return lastHealth;
        }

        try {
            impl.testConnection();
            lastHealth = Health.up().withDetail("status", "UP").build();
        } catch (Exception e) {
            lastHealth = Health.down().withDetail("status", "DOWN").build();
        }
        lastCheckAt = now;
        return lastHealth;
    }
}
