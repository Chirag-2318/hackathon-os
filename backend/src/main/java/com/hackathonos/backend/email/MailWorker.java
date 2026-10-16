package com.hackathonos.backend.email;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.data.domain.PageRequest;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.io.File;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.regex.Pattern;

@Component
public class MailWorker {

    private static final Logger log = LoggerFactory.getLogger(MailWorker.class);
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");
    private static final Duration[] BACKOFF = new Duration[]{
            Duration.ofMinutes(1),
            Duration.ofMinutes(5),
            Duration.ofMinutes(20),
            Duration.ofHours(1),
            Duration.ofHours(3)
    };

    private final EmailOutboxRepository outboxRepository;
    private final MailProperties mailProperties;
    private final MailTemplateRenderer templateRenderer;
    private final ObjectProvider<JavaMailSender> mailSenderProvider;
    private final ObjectMapper objectMapper;
    private final AtomicBoolean credentialWarnLogged = new AtomicBoolean(false);
    private final com.hackathonos.backend.common.lock.DbAdvisoryLockService advisoryLockService;

    public MailWorker(EmailOutboxRepository outboxRepository,
                      MailProperties mailProperties,
                      MailTemplateRenderer templateRenderer,
                      ObjectProvider<JavaMailSender> mailSenderProvider,
                      ObjectMapper objectMapper,
                      com.hackathonos.backend.common.lock.DbAdvisoryLockService advisoryLockService) {
        this.outboxRepository = outboxRepository;
        this.mailProperties = mailProperties;
        this.templateRenderer = templateRenderer;
        this.mailSenderProvider = mailSenderProvider;
        this.objectMapper = objectMapper != null ? objectMapper : new ObjectMapper();
        this.advisoryLockService = advisoryLockService;
    }

    @Scheduled(fixedDelay = 5000)
    public void processOutbox() {
        advisoryLockService.tryLockAndRun(1004L, this::doProcessOutbox);
    }

    private void doProcessOutbox() {
        try {
            boolean enabled = mailProperties.isEnabled();
            boolean dryRun = mailProperties.isDryRun();

            if (!enabled && !dryRun) {
                return;
            }

            if (enabled && !dryRun) {
                String user = mailProperties.getUsername();
                String pwd = mailProperties.getAppPassword();
                if (user == null || user.isBlank() || pwd == null || pwd.isBlank()) {
                    if (credentialWarnLogged.compareAndSet(false, true)) {
                        log.warn("MAIL_ENABLED is true but MAIL_USERNAME or MAIL_APP_PASSWORD is missing. Mail sending is disabled.");
                    }
                    return;
                }
            }

            ZonedDateTime nowPacific = ZonedDateTime.now(ZoneId.of("America/Los_Angeles"));
            Instant midnightPacific = nowPacific.toLocalDate().atStartOfDay(ZoneId.of("America/Los_Angeles")).toInstant();
            long dailySent = outboxRepository.countByStatusAndSentAtGreaterThanEqual(EmailOutbox.Status.SENT, midnightPacific);

            if (mailProperties.getDailyLimit() > 0 && dailySent >= mailProperties.getDailyLimit()) {
                log.warn("Gmail daily limit ({}) reached for Pacific day {}. Leaving remaining emails pending.",
                        mailProperties.getDailyLimit(), nowPacific.toLocalDate());
                return;
            }

            // Reserve buffer for invites and verification emails when daily limit is near (< 50 sends remaining)
            boolean limitNear = mailProperties.getDailyLimit() > 0 &&
                    dailySent >= (mailProperties.getDailyLimit() - 50);

            List<EmailOutbox> pending = outboxRepository.findByStatusAndNextAttemptAtLessThanEqualOrderByPriorityDescNextAttemptAtAsc(
                    EmailOutbox.Status.PENDING,
                    Instant.now(),
                    PageRequest.of(0, 20)
            );

            if (pending.isEmpty()) {
                return;
            }

            for (EmailOutbox item : pending) {
                try {
                    if (mailProperties.getDailyLimit() > 0 && dailySent >= mailProperties.getDailyLimit()) {
                        break;
                    }

                    if (limitNear && item.getPriority() <= 0) {
                        log.debug("Daily limit is near. Deferring low-priority email {} to reserve capacity for invites.", item.getId());
                        continue;
                    }

                    String toEmail = item.getToEmail();
                    if (toEmail == null || toEmail.isBlank()) {
                        item.setStatus(EmailOutbox.Status.SKIPPED);
                        item.setLastError("Recipient address is null or blank");
                        outboxRepository.save(item);
                        continue;
                    }

                    if (!EMAIL_PATTERN.matcher(toEmail).matches()) {
                        item.setStatus(EmailOutbox.Status.FAILED);
                        item.setLastError("Invalid recipient email address format");
                        outboxRepository.save(item);
                        continue;
                    }

                    Instant oneHourAgo = Instant.now().minus(Duration.ofHours(1));
                    long sentLastHour = outboxRepository.countByToEmailIgnoreCaseAndStatusAndSentAtGreaterThanEqual(
                            toEmail,
                            EmailOutbox.Status.SENT,
                            oneHourAgo
                    );

                    if (sentLastHour >= 3) {
                        item.setNextAttemptAt(Instant.now().plus(Duration.ofMinutes(15)));
                        outboxRepository.save(item);
                        continue;
                    }

                    boolean success = sendItem(item, dryRun);
                    if (success) {
                        dailySent++;
                    }
                } catch (Exception ex) {
                    log.error("Error processing email outbox item {}: {}", item.getId(), ex.getMessage());
                    item.setStatus(EmailOutbox.Status.FAILED);
                    item.setLastError(truncate("Process error: " + ex.getMessage(), 300));
                    outboxRepository.save(item);
                }
            }
        } catch (Throwable t) {
            log.error("Unhandled exception in processOutbox loop: {}", t.getMessage(), t);
        }
    }

    private boolean sendItem(EmailOutbox item, boolean dryRun) {
        Map<String, Object> vars = parsePayload(item.getPayload());
        MailTemplateRenderer.RenderedEmail rendered;
        try {
            rendered = templateRenderer.render(item.getTemplate(), vars);
        } catch (Exception e) {
            log.error("Failed to render email template '{}': {}", item.getTemplate(), e.getMessage());
            item.setStatus(EmailOutbox.Status.FAILED);
            item.setLastError(truncate("Template render error: " + e.getMessage(), 300));
            outboxRepository.save(item);
            return false;
        }

        if (dryRun) {
            try {
                Path dir = Paths.get("./build/mail-preview");
                Files.createDirectories(dir);
                String prefix = System.currentTimeMillis() + "_" + item.getId() + "_" + item.getTemplate();
                Files.writeString(dir.resolve(prefix + ".html"), rendered.htmlBody(), StandardCharsets.UTF_8);
                Files.writeString(dir.resolve(prefix + ".txt"), rendered.textBody(), StandardCharsets.UTF_8);
                item.setStatus(EmailOutbox.Status.SENT);
                item.setSentAt(Instant.now());
                item.setLastError(null);
                outboxRepository.save(item);
                log.info("[DRY RUN] Mail '{}' to {} saved to ./build/mail-preview/", item.getTemplate(), item.getToEmail());
                return true;
            } catch (Exception e) {
                log.error("Failed to write dry-run email preview: {}", e.getMessage());
                item.setLastError(truncate("Dry run write error: " + e.getMessage(), 300));
                outboxRepository.save(item);
                return false;
            }
        }

        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        if (mailSender == null) {
            item.setStatus(EmailOutbox.Status.FAILED);
            item.setLastError("JavaMailSender bean is not available. Check mail configuration.");
            outboxRepository.save(item);
            return false;
        }

        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            helper.setFrom(mailProperties.getFromAddress(), mailProperties.getFromName());
            helper.setTo(item.getToEmail());
            helper.setSubject(rendered.subject());
            helper.setText(rendered.textBody(), rendered.htmlBody());
            if (mailProperties.getReplyTo() != null && !mailProperties.getReplyTo().isBlank()) {
                helper.setReplyTo(mailProperties.getReplyTo());
            }
            mimeMessage.setHeader("Auto-Submitted", "auto-generated");

            mailSender.send(mimeMessage);

            item.setStatus(EmailOutbox.Status.SENT);
            item.setSentAt(Instant.now());
            item.setLastError(null);
            outboxRepository.save(item);
            log.info("Email '{}' successfully sent to {}", item.getTemplate(), item.getToEmail());
            return true;
        } catch (Exception e) {
            String rawMessage = e.getMessage() != null ? e.getMessage() : "";
            String hint = getHumanHint(rawMessage);
            if (!hint.isEmpty()) {
                log.warn("[SMTP ERROR HINT] {}", hint);
            }

            int nextAttempt = item.getAttempts() + 1;
            item.setAttempts(nextAttempt);
            String fullError = hint.isEmpty() ? rawMessage : (rawMessage + " [" + hint + "]");
            item.setLastError(truncate(fullError, 300));

            if (nextAttempt >= 5) {
                item.setStatus(EmailOutbox.Status.FAILED);
            } else {
                Duration backoff = BACKOFF[Math.min(nextAttempt - 1, BACKOFF.length - 1)];
                item.setNextAttemptAt(Instant.now().plus(backoff));
            }
            outboxRepository.save(item);
            return false;
        }
    }

    public static String getHumanHint(String msg) {
        if (msg == null) return "";
        if (msg.contains("535") || msg.contains("534") || msg.contains("5.7.9")) {
            return "use a Google App Password with 2-Step Verification on, and check the address and password have no spaces";
        } else if (msg.contains("timeout") || msg.contains("timed out") || msg.contains("ConnectException")) {
            return "check port 587 and the network";
        } else if (msg.contains("550") || msg.contains("5.4.5")) {
            return "Gmail daily limit reached";
        }
        return "";
    }

    private Map<String, Object> parsePayload(String json) {
        if (json == null || json.isBlank() || "{}".equals(json)) {
            return Collections.emptyMap();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            return Collections.emptyMap();
        }
    }

    private static String truncate(String text, int max) {
        if (text == null) return null;
        return text.length() <= max ? text : text.substring(0, max);
    }
}
