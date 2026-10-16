package com.hackathonos.backend.email;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hackathonos.backend.common.config.AppProperties;
import com.hackathonos.backend.users.User;
import com.hackathonos.backend.users.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class MailService {

    private static final Logger log = LoggerFactory.getLogger(MailService.class);
    private static final ZoneId IST_ZONE = ZoneId.of("Asia/Kolkata");
    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("hh:mm a").withZone(IST_ZONE);

    private final EmailOutboxRepository outboxRepository;
    private final MailTemplateRenderer templateRenderer;
    private final ObjectMapper objectMapper;
    private final UserRepository userRepository;
    private final UserEmailPreferenceRepository preferenceRepository;
    private final AppProperties appProperties;

    public MailService(EmailOutboxRepository outboxRepository,
                       MailTemplateRenderer templateRenderer,
                       ObjectMapper objectMapper,
                       UserRepository userRepository,
                       UserEmailPreferenceRepository preferenceRepository,
                       AppProperties appProperties) {
        this.outboxRepository = outboxRepository;
        this.templateRenderer = templateRenderer;
        this.objectMapper = objectMapper != null ? objectMapper : new ObjectMapper();
        this.userRepository = userRepository;
        this.preferenceRepository = preferenceRepository;
        this.appProperties = appProperties;
    }

    /**
     * Enqueues an email into email_outbox in the same transaction as the business event.
     * Non-transactional emails automatically check the user's master pause and category preference.
     */
    @Transactional(propagation = Propagation.REQUIRED)
    public void enqueue(String template, String toEmail, Map<String, Object> variables, String dedupeKey) {
        enqueue(template, null, toEmail, variables, dedupeKey);
    }

    @Transactional(propagation = Propagation.REQUIRED)
    public void enqueue(String template, String category, String toEmail, Map<String, Object> variables, String dedupeKey) {
        if (toEmail == null || toEmail.isBlank()) {
            log.debug("Skipping enqueue for empty recipient on template {}", template);
            return;
        }

        String normalizedEmail = toEmail.trim().toLowerCase();
        String resolvedCategory = resolveCategory(template, category, dedupeKey);

        // Check if category is non-transactional and obeys preferences
        if (resolvedCategory != null) {
            Optional<User> userOpt = userRepository.findByEmailIgnoreCase(normalizedEmail);
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                if (user.isEmailPaused()) {
                    log.debug("Skipping email for user {} - email notifications are paused", normalizedEmail);
                    return;
                }
                Optional<UserEmailPreference> pref = preferenceRepository.findByUserIdAndCategory(user.getId(), resolvedCategory);
                if (pref.isPresent() && !pref.get().isEnabled()) {
                    log.debug("Skipping email for user {} - category {} is disabled", normalizedEmail, resolvedCategory);
                    return;
                }
            }
        }

        enqueueDirect(template, normalizedEmail, variables, dedupeKey);
    }

    @Transactional(propagation = Propagation.REQUIRED)
    public void enqueueDirect(String template, String normalizedEmail, Map<String, Object> variables, String dedupeKey) {
        if (dedupeKey != null && !dedupeKey.isBlank()) {
            if (outboxRepository.existsByDedupeKey(dedupeKey)) {
                log.debug("Duplicate email with key '{}' already in outbox. Skipping.", dedupeKey);
                return;
            }
        }

        try {
            String payloadJson = objectMapper.writeValueAsString(variables);
            MailTemplateRenderer.RenderedEmail preview = templateRenderer.render(template, variables);
            int priority = 0;
            String t = template != null ? template.toLowerCase() : "";
            if (t.contains("invite") || t.contains("verify") || t.contains("verification") || t.contains("confirm")) {
                priority = 10;
            }

            EmailOutbox outboxItem = new EmailOutbox(
                    normalizedEmail,
                    template.toLowerCase(),
                    preview.subject(),
                    payloadJson,
                    dedupeKey,
                    priority
            );

            outboxRepository.save(outboxItem);
            log.info("Enqueued email '{}' [priority={}] for {} (key: {})", template, priority, normalizedEmail, dedupeKey);
        } catch (org.springframework.dao.DataIntegrityViolationException ex) {
            log.debug("Dedupe constraint hit when saving outbox item for key '{}'", dedupeKey);
        } catch (Exception e) {
            log.error("Failed to enqueue email '{}' for {}: {}", template, normalizedEmail, e.getMessage(), e);
        }
    }

    /**
     * Coalesced update email dispatcher:
     * Events for the same recipient and room within 10 minutes are merged into one pending update email.
     * Deduplicated by (category, entityId, recipient).
     * Never emails the person who caused the event.
     */
    @Transactional(propagation = Propagation.REQUIRED)
    public void enqueueEventUpdate(UUID recipientUserId,
                                   String toEmail,
                                   UUID actorUserId,
                                   UUID roomId,
                                   String roomName,
                                   String category,
                                   String entityId,
                                   String sentence,
                                   String link) {

        if (recipientUserId != null && actorUserId != null && recipientUserId.equals(actorUserId)) {
            log.debug("Skipping event email: recipient is the actor ({})", actorUserId);
            return;
        }

        if (toEmail == null || toEmail.isBlank()) {
            return;
        }

        String normalizedEmail = toEmail.trim().toLowerCase();

        // Check user preferences
        Optional<User> userOpt = recipientUserId != null
                ? userRepository.findById(recipientUserId)
                : userRepository.findByEmailIgnoreCase(normalizedEmail);

        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (user.isEmailPaused()) {
                log.debug("User {} has emails paused. Skipping update event.", normalizedEmail);
                return;
            }
            Optional<UserEmailPreference> pref = preferenceRepository.findByUserIdAndCategory(user.getId(), category);
            if (pref.isPresent() && !pref.get().isEnabled()) {
                log.debug("User {} has category {} disabled. Skipping update event.", normalizedEmail, category);
                return;
            }
        }

        Instant now = Instant.now();
        String roomUrl = appProperties.getFrontendUrl() + (roomId != null ? "/app/room/" + roomId : "/app");
        String notifUrl = appProperties.getFrontendUrl() + "/app/settings/notifications";
        String timeStr = TIME_FORMATTER.format(now);

        // Check existing pending coalesced entry for this recipient & room
        if (roomId != null) {
            List<EmailOutbox> pendingList = outboxRepository.findPendingCoalesced(
                    normalizedEmail, roomId, "update", EmailOutbox.Status.PENDING);

            for (EmailOutbox existing : pendingList) {
                // If created within the last 10 minutes, merge into it
                if (existing.getCreatedAt() != null && now.isBefore(existing.getCreatedAt().plus(Duration.ofMinutes(10)))) {
                    try {
                        Map<String, Object> payload = objectMapper.readValue(existing.getPayload(), new TypeReference<>() {});
                        List<Map<String, Object>> items = (List<Map<String, Object>>) payload.getOrDefault("items", new ArrayList<>());

                        // Dedupe by (category, entityId)
                        boolean alreadyExists = items.stream().anyMatch(it ->
                                Objects.equals(category, it.get("category")) &&
                                Objects.equals(entityId, it.get("entityId")));

                        if (alreadyExists) {
                            log.debug("Duplicate event update {} / {} for {}. Skipping.", category, entityId, normalizedEmail);
                            return;
                        }

                        // Append new item (up to 8 lines)
                        Map<String, Object> newItem = new LinkedHashMap<>();
                        newItem.put("time", timeStr);
                        newItem.put("category", category);
                        newItem.put("text", sentence);
                        newItem.put("link", link != null ? link : roomUrl);
                        newItem.put("entityId", entityId);

                        items.add(newItem);
                        if (items.size() > 8) {
                            items = items.subList(items.size() - 8, items.size());
                        }

                        String subject = items.size() + " updates in " + (roomName != null ? roomName : "Room");
                        payload.put("items", items);
                        payload.put("subject", subject);
                        payload.put("headline", subject);

                        existing.setSubject(subject);
                        existing.setPayload(objectMapper.writeValueAsString(payload));
                        outboxRepository.save(existing);
                        log.info("Coalesced update into pending email for {} in room {} (now {} items)",
                                normalizedEmail, roomId, items.size());
                        return;
                    } catch (Exception ex) {
                        log.warn("Failed to coalesce update into existing email: {}", ex.getMessage());
                    }
                }
            }
        }

        // Create new pending coalesced email with 10-minute send delay
        try {
            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("roomName", roomName != null ? roomName : "Room");
            payload.put("roomUrl", roomUrl);
            payload.put("notificationsSettingsUrl", notifUrl);
            payload.put("headline", sentence);
            payload.put("subject", sentence);

            Map<String, Object> firstItem = new LinkedHashMap<>();
            firstItem.put("time", timeStr);
            firstItem.put("category", category);
            firstItem.put("text", sentence);
            firstItem.put("link", link != null ? link : roomUrl);
            firstItem.put("entityId", entityId);

            payload.put("items", new ArrayList<>(List.of(firstItem)));

            String dedupeKey = "coalesce:" + normalizedEmail + ":" + (roomId != null ? roomId : UUID.randomUUID()) + ":" + now.toEpochMilli();
            String payloadJson = objectMapper.writeValueAsString(payload);

            EmailOutbox outboxItem = new EmailOutbox(
                    normalizedEmail,
                    "update",
                    sentence,
                    payloadJson,
                    dedupeKey
            );
            // Send after the 10 minute window from the first event
            outboxItem.setNextAttemptAt(now.plus(Duration.ofMinutes(10)));
            outboxRepository.save(outboxItem);
            log.info("Enqueued initial coalesced update email for {} in room {} (delayed 10m)", normalizedEmail, roomId);
        } catch (Exception e) {
            log.error("Failed to enqueue initial coalesced update for {}: {}", normalizedEmail, e.getMessage(), e);
        }
    }

    private String resolveCategory(String template, String explicitCategory, String dedupeKey) {
        if (explicitCategory != null && !explicitCategory.isBlank()) {
            return explicitCategory;
        }
        if ("reminder".equalsIgnoreCase(template)) {
            return EmailPreferenceService.CLOCK_REMINDERS;
        }
        if ("joined".equalsIgnoreCase(template)) {
            // joined-lead is a team change for the room leader
            if (dedupeKey != null && dedupeKey.startsWith("joined-lead")) {
                return EmailPreferenceService.TEAM_CHANGES;
            }
            // joined-self is transactional confirmation
            return null;
        }
        // welcome, invite, and joined-self are transactional
        return null;
    }
}
