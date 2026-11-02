package com.hackathonos.backend.email;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Component
public class LogMailTransport implements MailTransport {

    private static final Logger log = LoggerFactory.getLogger(LogMailTransport.class);

    @Override
    public void send(String to, String subject, String htmlBody, String textBody) {
        log.info("[LOG_MAIL] To: {} | Subject: '{}' | Text size: {} bytes | HTML size: {} bytes",
                to, subject,
                textBody != null ? textBody.length() : 0,
                htmlBody != null ? htmlBody.length() : 0);

        try {
            Path dir = Paths.get("./build/mail-preview");
            Files.createDirectories(dir);
            String prefix = System.currentTimeMillis() + "_" + to.replaceAll("[^a-zA-Z0-9]", "_");
            if (htmlBody != null) {
                Files.writeString(dir.resolve(prefix + ".html"), htmlBody, StandardCharsets.UTF_8);
            }
            if (textBody != null) {
                Files.writeString(dir.resolve(prefix + ".txt"), textBody, StandardCharsets.UTF_8);
            }
        } catch (Exception e) {
            log.debug("LogMailTransport could not write preview file: {}", e.getMessage());
        }
    }

    @Override
    public String getProviderName() {
        return "log";
    }
}
