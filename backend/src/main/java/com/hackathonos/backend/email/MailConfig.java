package com.hackathonos.backend.email;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.context.event.EventListener;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;

import java.util.Properties;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

@Configuration
public class MailConfig {

    private static final Logger log = LoggerFactory.getLogger(MailConfig.class);

    private final MailProperties mailProperties;

    public MailConfig(MailProperties mailProperties) {
        this.mailProperties = mailProperties;
    }

    @Bean
    @Primary
    public JavaMailSender javaMailSender() {
        JavaMailSenderImpl sender = new JavaMailSenderImpl();
        sender.setHost(mailProperties.getHost());
        sender.setPort(mailProperties.getPort());
        sender.setUsername(mailProperties.getUsername());
        sender.setPassword(mailProperties.getAppPassword());
        sender.setDefaultEncoding("UTF-8");

        Properties props = sender.getJavaMailProperties();
        props.put("mail.transport.protocol", "smtp");
        props.put("mail.smtp.auth", "true");
        props.put("mail.smtp.starttls.enable", "true");
        props.put("mail.smtp.starttls.required", "true");
        props.put("mail.smtp.ssl.protocols", "TLSv1.2");
        props.put("mail.smtp.ssl.trust", "smtp.gmail.com");
        props.put("mail.smtp.connectiontimeout", "10000");
        props.put("mail.smtp.timeout", "10000");
        props.put("mail.smtp.writetimeout", "10000");
        return sender;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void onStartup() {
        String status = mailProperties.isEnabled() ? "enabled" : "disabled";
        String maskedUser = maskEmail(mailProperties.getUsername());
        log.info("Mail: {} host={} user={} from={}",
                status,
                mailProperties.getHost(),
                maskedUser,
                mailProperties.getFromName());

        if (mailProperties.isEnabled() && !mailProperties.isDryRun()) {
            CompletableFuture.delayedExecutor(5, TimeUnit.SECONDS).execute(() -> {
                try {
                    JavaMailSender sender = javaMailSender();
                    if (sender instanceof JavaMailSenderImpl impl) {
                        impl.testConnection();
                        log.info("Mail connection OK");
                    }
                } catch (Exception e) {
                    String msg = e.getMessage() != null ? e.getMessage() : "";
                    String hint = "";
                    if (msg.contains("535") || msg.contains("534") || msg.contains("5.7.9")) {
                        hint = " (hint: use a Google App Password with 2-Step Verification on, and check the address and password have no spaces)";
                    } else if (msg.contains("timeout") || msg.contains("timed out") || msg.contains("ConnectException")) {
                        hint = " (hint: check port 587 and the network)";
                    }
                    log.warn("Mail connection failed: {}{}", msg, hint);
                }
            });
        }
    }

    public static String maskEmail(String email) {
        if (email == null || email.isBlank()) return "(none)";
        int at = email.indexOf('@');
        if (at <= 1) return "***" + (at >= 0 ? email.substring(at) : "");
        return email.charAt(0) + "***" + email.substring(at);
    }
}
